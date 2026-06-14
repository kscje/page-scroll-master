const MAX_REQUEST_BYTES = 16384;
const MAX_EVENTS = 21;
const MAX_COUNTER = 1000000;
const BATCH_RETENTION_DAYS = 30;
const AGGREGATE_RETENTION_MONTHS = 13;

const EVENT_NAMES = new Set([
  'settings_snapshot',
  'daily_action_counts',
  'daily_toggle_counts'
]);

const ACTION_KEYS = new Set([
  'floatingTopClicks',
  'floatingBottomClicks',
  'keyboardTopCommands',
  'keyboardBottomCommands',
  'progressJumpClicks',
  'bookmarkSaveClicks',
  'bookmarkRestoreClicks',
  'outlineOpenClicks',
  'outlineJumpClicks'
]);

const TOGGLE_FEATURES = new Set([
  'extension',
  'progressBar',
  'scrollBookmarks',
  'outlineNavigation'
]);

const TOGGLE_SOURCES = new Set(['popup', 'domainManager']);

const SETTINGS_KEYS = [
  'locale',
  'extensionVersion',
  'buttonHorizontalPosition',
  'buttonVerticalAlignment',
  'buttonShape',
  'buttonSizeBucket',
  'buttonSpacingBucket',
  'edgeDistanceBucket',
  'opacityBucket',
  'buttonColorMode',
  'hoverHideEnabled',
  'iconSet',
  'iconColorCustomized',
  'progressBarMode',
  'progressBarHorizontalPosition',
  'progressBarColorMode',
  'progressBarClickToJump',
  'progressBarShowPercentage',
  'progressBarShowRemainingTime',
  'bookmarkButtonPosition',
  'bookmarkButtonColorMode',
  'bookmarkRestoreMode',
  'bookmarkRetentionLimit',
  'outlineButtonPosition',
  'outlineButtonColorMode',
  'outlineSources',
  'outlineItemsBucket',
  'outlineFilterShortHeadings',
  'outlineHighlightCurrentSection'
];

const STRING_ENUMS = {
  locale: ['zh-CN', 'zh-TW', 'en-US', 'es-ES', 'ja-JP', 'de-DE', 'fr-FR', 'pt-BR', 'ko-KR', 'it-IT'],
  buttonHorizontalPosition: ['left', 'right'],
  buttonVerticalAlignment: ['top', 'center', 'bottom'],
  buttonShape: ['round', 'square'],
  buttonSizeBucket: ['small', 'medium', 'large', 'extraLarge'],
  buttonSpacingBucket: ['compact', 'normal', 'loose'],
  edgeDistanceBucket: ['near', 'standard', 'far'],
  opacityBucket: ['low', 'medium', 'high', 'solid'],
  buttonColorMode: ['default', 'custom', 'mixed'],
  iconSet: ['defaultArrow', 'triangle', 'chevron', 'doubleArrow'],
  progressBarMode: ['verticalButton', 'horizontalBar'],
  progressBarHorizontalPosition: ['top', 'bottom'],
  progressBarColorMode: ['followTopButton', 'followBottomButton', 'custom'],
  bookmarkButtonPosition: ['pageTop', 'pageBottom', 'betweenScrollButtons'],
  bookmarkButtonColorMode: ['followTopButton', 'followBottomButton', 'custom'],
  bookmarkRestoreMode: ['auto', 'prompt', 'manual'],
  outlineButtonPosition: ['pageTop', 'pageBottom', 'betweenScrollButtons'],
  outlineButtonColorMode: ['followTopButton', 'followBottomButton', 'custom'],
  outlineSources: [
    'none',
    'h1',
    'h2',
    'h3',
    'idBlocks',
    'h1+h2',
    'h1+h3',
    'h1+idBlocks',
    'h2+h3',
    'h2+idBlocks',
    'h3+idBlocks',
    'h1+h2+h3',
    'h1+h2+idBlocks',
    'h1+h3+idBlocks',
    'h2+h3+idBlocks',
    'h1+h2+h3+idBlocks'
  ],
  outlineItemsBucket: ['small', 'medium', 'large']
};

const BOOLEAN_KEYS = new Set([
  'hoverHideEnabled',
  'iconColorCustomized',
  'progressBarClickToJump',
  'progressBarShowPercentage',
  'progressBarShowRemainingTime',
  'outlineFilterShortHeadings',
  'outlineHighlightCurrentSection'
]);

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff'
    }
  });
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function hasExactKeys(value, allowedKeys) {
  const keys = Object.keys(value);
  return keys.length === allowedKeys.length && keys.every((key) => allowedKeys.includes(key));
}

function isDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return false;
  return new Date(`${value}T00:00:00.000Z`).toISOString().slice(0, 10) === value;
}

function isCount(value) {
  return Number.isInteger(value) && value >= 0 && value <= MAX_COUNTER;
}

function validateSettings(payload) {
  if (!isPlainObject(payload) || !hasExactKeys(payload, SETTINGS_KEYS)) return false;
  if (!/^(?:\d{1,6}\.){2}\d{1,6}$|^unknown$/.test(payload.extensionVersion)) return false;
  if (!Number.isInteger(payload.bookmarkRetentionLimit) ||
      ![1, 2, 3].includes(payload.bookmarkRetentionLimit)) {
    return false;
  }
  for (const [key, values] of Object.entries(STRING_ENUMS)) {
    if (!values.includes(payload[key])) return false;
  }
  for (const key of BOOLEAN_KEYS) {
    if (typeof payload[key] !== 'boolean') return false;
  }
  return true;
}

function validateActions(payload) {
  if (!isPlainObject(payload)) return false;
  const keys = Object.keys(payload);
  return keys.length > 0 &&
    keys.every((key) => ACTION_KEYS.has(key) && isCount(payload[key]) && payload[key] > 0);
}

function validateToggles(payload) {
  if (!isPlainObject(payload) || !hasExactKeys(payload, ['changes']) ||
      !Array.isArray(payload.changes) || payload.changes.length < 1 ||
      payload.changes.length > TOGGLE_FEATURES.size * TOGGLE_SOURCES.size) {
    return false;
  }
  const combinations = new Set();
  return payload.changes.every((change) => {
    if (!isPlainObject(change) ||
        !hasExactKeys(change, ['feature', 'source', 'enabledCount', 'disabledCount']) ||
        !TOGGLE_FEATURES.has(change.feature) ||
        !TOGGLE_SOURCES.has(change.source) ||
        !isCount(change.enabledCount) ||
        !isCount(change.disabledCount) ||
        (!change.enabledCount && !change.disabledCount)) {
      return false;
    }
    const key = `${change.feature}:${change.source}`;
    if (combinations.has(key)) return false;
    combinations.add(key);
    return true;
  });
}

function validateEvent(event) {
  if (!isPlainObject(event) ||
      !hasExactKeys(event, ['eventName', 'eventDate', 'payload']) ||
      !EVENT_NAMES.has(event.eventName) ||
      !isDate(event.eventDate)) {
    return false;
  }
  if (event.eventName === 'settings_snapshot') return validateSettings(event.payload);
  if (event.eventName === 'daily_action_counts') return validateActions(event.payload);
  return validateToggles(event.payload);
}

function validateBatch(batch) {
  if (!isPlainObject(batch) ||
      !hasExactKeys(batch, ['schemaVersion', 'batchId', 'events']) ||
      batch.schemaVersion !== 1 ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(batch.batchId) ||
      !Array.isArray(batch.events) ||
      batch.events.length < 1 ||
      batch.events.length > MAX_EVENTS) {
    return false;
  }
  return batch.events.every(validateEvent);
}

function addDays(isoDate, days) {
  const date = new Date(isoDate);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString();
}

function subtractMonths(date, months) {
  const result = new Date(date);
  result.setUTCMonth(result.getUTCMonth() - months);
  return result.toISOString().slice(0, 10);
}

function stableJson(value) {
  const sorted = {};
  SETTINGS_KEYS.forEach((key) => {
    sorted[key] = value[key];
  });
  return JSON.stringify(sorted);
}

function buildStatements(env, batch, now) {
  const statements = [
    env.DB.prepare(
      'INSERT INTO upload_batches (batch_id, received_at, event_count, expires_at) VALUES (?, ?, ?, ?)'
    ).bind(batch.batchId, now, batch.events.length, addDays(now, BATCH_RETENTION_DAYS))
  ];

  batch.events.forEach((event) => {
    if (event.eventName === 'daily_action_counts') {
      Object.entries(event.payload).forEach(([key, count]) => {
        statements.push(env.DB.prepare(`
          INSERT INTO daily_action_counts (event_date, action_key, action_count, updated_at)
          VALUES (?, ?, ?, ?)
          ON CONFLICT(event_date, action_key) DO UPDATE SET
            action_count = action_count + excluded.action_count,
            updated_at = excluded.updated_at
        `).bind(event.eventDate, key, count, now));
      });
      return;
    }

    if (event.eventName === 'daily_toggle_counts') {
      event.payload.changes.forEach((change) => {
        statements.push(env.DB.prepare(`
          INSERT INTO daily_toggle_counts (
            event_date, feature, source, enabled_count, disabled_count, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?)
          ON CONFLICT(event_date, feature, source) DO UPDATE SET
            enabled_count = enabled_count + excluded.enabled_count,
            disabled_count = disabled_count + excluded.disabled_count,
            updated_at = excluded.updated_at
        `).bind(
          event.eventDate,
          change.feature,
          change.source,
          change.enabledCount,
          change.disabledCount,
          now
        ));
      });
      return;
    }

    statements.push(env.DB.prepare(`
      INSERT INTO settings_snapshot_counts (
        event_date, snapshot_json, snapshot_count, updated_at
      ) VALUES (?, ?, 1, ?)
      ON CONFLICT(event_date, snapshot_json) DO UPDATE SET
        snapshot_count = snapshot_count + 1,
        updated_at = excluded.updated_at
    `).bind(event.eventDate, stableJson(event.payload), now));
  });

  return statements;
}

async function cleanup(env, now = new Date()) {
  const aggregateCutoff = subtractMonths(now, AGGREGATE_RETENTION_MONTHS);
  await env.DB.batch([
    env.DB.prepare('DELETE FROM upload_batches WHERE expires_at < ?').bind(now.toISOString()),
    env.DB.prepare('DELETE FROM daily_action_counts WHERE event_date < ?').bind(aggregateCutoff),
    env.DB.prepare('DELETE FROM daily_toggle_counts WHERE event_date < ?').bind(aggregateCutoff),
    env.DB.prepare('DELETE FROM settings_snapshot_counts WHERE event_date < ?').bind(aggregateCutoff)
  ]);
}

async function handleEvents(request, env) {
  const contentType = request.headers.get('content-type') || '';
  if (!contentType.toLowerCase().startsWith('application/json')) {
    return jsonResponse({ error: 'unsupported_media_type' }, 415);
  }

  const declaredSize = Number(request.headers.get('content-length'));
  if (Number.isFinite(declaredSize) && declaredSize > MAX_REQUEST_BYTES) {
    return jsonResponse({ error: 'payload_too_large' }, 413);
  }

  const bytes = await request.arrayBuffer();
  if (bytes.byteLength > MAX_REQUEST_BYTES) {
    return jsonResponse({ error: 'payload_too_large' }, 413);
  }

  let batch;
  try {
    batch = JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    return jsonResponse({ error: 'invalid_json' }, 400);
  }

  if (!validateBatch(batch)) {
    return jsonResponse({ error: 'invalid_payload' }, 400);
  }

  const existing = await env.DB.prepare(
    'SELECT batch_id FROM upload_batches WHERE batch_id = ?'
  ).bind(batch.batchId).first();
  if (existing) {
    return jsonResponse({ accepted: true, duplicate: true });
  }

  const now = new Date().toISOString();
  try {
    await env.DB.batch(buildStatements(env, batch, now));
  } catch (error) {
    if (String(error && error.message).includes('UNIQUE constraint failed')) {
      return jsonResponse({ accepted: true, duplicate: true });
    }
    throw error;
  }

  return jsonResponse({ accepted: true, duplicate: false }, 202);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname !== '/v1/events') {
      return jsonResponse({ error: 'not_found' }, 404);
    }
    if (request.method !== 'POST') {
      return jsonResponse({ error: 'method_not_allowed' }, 405);
    }
    try {
      return await handleEvents(request, env);
    } catch {
      return jsonResponse({ error: 'internal_error' }, 500);
    }
  },

  async scheduled(controller, env, ctx) {
    ctx.waitUntil(cleanup(env, new Date(controller.scheduledTime)));
  }
};

