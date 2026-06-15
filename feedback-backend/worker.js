const MAX_REQUEST_BYTES = 16 * 1024 * 1024;
const MAX_IMAGES = 3;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MIN_MESSAGE_LENGTH = 10;
const MAX_MESSAGE_LENGTH = 5000;
const MAX_CONTACT_LENGTH = 200;
const RATE_LIMIT_PER_HOUR = 5;
const LOG_RETENTION_DAYS = 30;

const FEEDBACK_TYPES = new Set([
  'feature',
  'bug',
  'compatibility',
  'translation',
  'other'
]);

const LANGUAGE_CODES = new Set([
  'zh-CN',
  'zh-TW',
  'en-US',
  'es-ES',
  'ja-JP',
  'de-DE',
  'fr-FR',
  'pt-BR',
  'ko-KR',
  'it-IT'
]);

const IMAGE_SIGNATURES = {
  'image/jpeg': [[0xff, 0xd8, 0xff]],
  'image/png': [[0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]],
  'image/webp': [
    [0x52, 0x49, 0x46, 0x46],
    [0x57, 0x45, 0x42, 0x50]
  ]
};

function responseHeaders(origin) {
  const headers = {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff'
  };
  if (origin && origin.startsWith('chrome-extension://')) {
    headers['access-control-allow-origin'] = origin;
    headers.vary = 'Origin';
  }
  return headers;
}

function jsonResponse(body, status = 200, origin = '') {
  return new Response(JSON.stringify(body), {
    status,
    headers: responseHeaders(origin)
  });
}

function normalizeText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function matchesBytes(bytes, expected, offset = 0) {
  return expected.every((value, index) => bytes[offset + index] === value);
}

async function validateImage(file) {
  if (!(file instanceof File) || !Object.hasOwn(IMAGE_SIGNATURES, file.type) ||
      file.size <= 0 || file.size > MAX_IMAGE_BYTES) {
    return false;
  }
  const bytes = new Uint8Array(await file.slice(0, 16).arrayBuffer());
  if (file.type === 'image/webp') {
    return matchesBytes(bytes, IMAGE_SIGNATURES[file.type][0], 0) &&
      matchesBytes(bytes, IMAGE_SIGNATURES[file.type][1], 8);
  }
  return matchesBytes(bytes, IMAGE_SIGNATURES[file.type][0]);
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[character]);
}

function toBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunkSize = 0x8000;
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize));
  }
  return btoa(binary);
}

async function hashIp(ip, salt) {
  const bytes = new TextEncoder().encode(`${salt}:${ip}`);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest))
    .map((value) => value.toString(16).padStart(2, '0'))
    .join('');
}

async function enforceRateLimit(request, env, now) {
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  const ipHash = await hashIp(ip, env.IP_HASH_SALT);
  const hourBucket = now.toISOString().slice(0, 13);
  const result = await env.DB.prepare(`
    INSERT INTO feedback_rate_limits (ip_hash, hour_bucket, request_count, expires_at)
    VALUES (?, ?, 1, ?)
    ON CONFLICT(ip_hash, hour_bucket) DO UPDATE SET
      request_count = request_count + 1
    RETURNING request_count
  `).bind(
    ipHash,
    hourBucket,
    new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString()
  ).first();
  return Number(result && result.request_count) <= RATE_LIMIT_PER_HOUR;
}

async function writeLog(env, values) {
  await env.DB.prepare(`
    INSERT INTO feedback_logs (
      request_id, feedback_type, image_count, included_page_url, delivery_status,
      created_at, expires_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `).bind(
    values.requestId,
    values.type,
    values.imageCount,
    values.includedPageUrl ? 1 : 0,
    values.status,
    values.createdAt,
    values.expiresAt
  ).run();
}

async function sendEmail(env, feedback) {
  const attachments = [];
  for (let index = 0; index < feedback.images.length; index++) {
    const image = feedback.images[index];
    const extension = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp'
    }[image.type];
    attachments.push({
      filename: `feedback-${index + 1}.${extension}`,
      content: toBase64(await image.arrayBuffer())
    });
  }

  const lines = [
    `Type: ${feedback.type}`,
    `Extension version: ${feedback.extensionVersion}`,
    `Language: ${feedback.language}`,
    `Contact: ${feedback.contact || 'not provided'}`,
    '',
    feedback.message
  ];
  const html = `
    <h2>Page Scroll Master feedback</h2>
    <p><strong>Type:</strong> ${escapeHtml(feedback.type)}</p>
    <p><strong>Extension version:</strong> ${escapeHtml(feedback.extensionVersion)}</p>
    <p><strong>Language:</strong> ${escapeHtml(feedback.language)}</p>
    <p><strong>Contact:</strong> ${escapeHtml(feedback.contact || 'not provided')}</p>
    <hr>
    <pre style="white-space:pre-wrap;font-family:system-ui,sans-serif">${escapeHtml(feedback.message)}</pre>
  `;
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${env.RESEND_API_KEY}`,
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      from: env.FEEDBACK_FROM_EMAIL,
      to: [env.FEEDBACK_TO_EMAIL],
      subject: `[Page Scroll Master] ${feedback.type} feedback`,
      text: lines.join('\n'),
      html,
      attachments
    })
  });
  return response.ok;
}

async function parseFeedback(request) {
  const form = await request.formData();
  const feedback = {
    type: normalizeText(form.get('type')),
    message: normalizeText(form.get('message')),
    contact: normalizeText(form.get('contact')),
    extensionVersion: normalizeText(form.get('extensionVersion')),
    language: normalizeText(form.get('language')),
    website: normalizeText(form.get('website')),
    images: form.getAll('images[]')
  };

  if (feedback.website) return { spam: true };
  if (!FEEDBACK_TYPES.has(feedback.type) ||
      feedback.message.length < MIN_MESSAGE_LENGTH ||
      feedback.message.length > MAX_MESSAGE_LENGTH ||
      feedback.contact.length > MAX_CONTACT_LENGTH ||
      /[\r\n]/.test(feedback.contact) ||
      !/^(?:\d{1,6}\.){2}\d{1,6}$/.test(feedback.extensionVersion) ||
      !LANGUAGE_CODES.has(feedback.language) ||
      feedback.images.length > MAX_IMAGES) {
    return { error: 'invalid_payload' };
  }
  for (const image of feedback.images) {
    if (!await validateImage(image)) return { error: 'invalid_image' };
  }
  return { feedback };
}

async function handleFeedback(request, env, origin) {
  const contentType = request.headers.get('content-type') || '';
  if (!contentType.toLowerCase().startsWith('multipart/form-data')) {
    return jsonResponse({ error: 'unsupported_media_type' }, 415, origin);
  }
  const declaredSize = Number(request.headers.get('content-length'));
  if (Number.isFinite(declaredSize) && declaredSize > MAX_REQUEST_BYTES) {
    return jsonResponse({ error: 'payload_too_large' }, 413, origin);
  }

  const now = new Date();
  if (!await enforceRateLimit(request, env, now)) {
    return jsonResponse({ error: 'rate_limited' }, 429, origin);
  }

  const parsed = await parseFeedback(request);
  if (parsed.spam) {
    return jsonResponse({ accepted: true }, 202, origin);
  }
  if (parsed.error) {
    return jsonResponse({ error: parsed.error }, 400, origin);
  }

  const requestId = crypto.randomUUID();
  const delivered = await sendEmail(env, parsed.feedback);
  const createdAt = now.toISOString();
  try {
    await writeLog(env, {
      requestId,
      type: parsed.feedback.type,
      imageCount: parsed.feedback.images.length,
      includedPageUrl: false,
      status: delivered ? 'sent' : 'failed',
      createdAt,
      expiresAt: new Date(now.getTime() + LOG_RETENTION_DAYS * 86400000).toISOString()
    });
  } catch {
    // A metadata logging failure must not cause a successfully delivered email to be resent.
  }
  if (!delivered) {
    return jsonResponse({ error: 'delivery_failed', requestId }, 502, origin);
  }
  return jsonResponse({ accepted: true, requestId }, 202, origin);
}

async function cleanup(env, now) {
  await env.DB.batch([
    env.DB.prepare('DELETE FROM feedback_rate_limits WHERE expires_at < ?').bind(now.toISOString()),
    env.DB.prepare('DELETE FROM feedback_logs WHERE expires_at < ?').bind(now.toISOString())
  ]);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get('origin') || '';
    if (url.pathname !== '/v1/feedback') {
      return jsonResponse({ error: 'not_found' }, 404, origin);
    }
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          ...responseHeaders(origin),
          'access-control-allow-methods': 'POST, OPTIONS',
          'access-control-allow-headers': 'content-type',
          'access-control-max-age': '86400'
        }
      });
    }
    if (request.method !== 'POST') {
      return jsonResponse({ error: 'method_not_allowed' }, 405, origin);
    }
    try {
      return await handleFeedback(request, env, origin);
    } catch {
      return jsonResponse({ error: 'internal_error' }, 500, origin);
    }
  },

  async scheduled(controller, env, ctx) {
    ctx.waitUntil(cleanup(env, new Date(controller.scheduledTime)));
  }
};
