const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const source = fs.readFileSync(path.join(ROOT, 'feedback-backend', 'worker.js'), 'utf8')
  .replace('export default {', 'this.feedbackWorker = {');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function createDatabase(rateCount = 1) {
  const logs = [];
  return {
    logs,
    prepare(sql) {
      return {
        values: [],
        bind(...values) {
          this.values = values;
          return this;
        },
        async first() {
          if (sql.includes('RETURNING request_count')) {
            return { request_count: rateCount };
          }
          return null;
        },
        async run() {
          if (sql.includes('INSERT INTO feedback_logs')) {
            logs.push(this.values);
          }
          return { success: true };
        }
      };
    },
    async batch() {
      return [];
    }
  };
}

function createWorker(resendOk = true, rateCount = 1) {
  const resendRequests = [];
  const database = createDatabase(rateCount);
  const sandbox = {
    URL,
    Request,
    Response,
    Headers,
    FormData,
    File,
    Blob,
    TextEncoder,
    Uint8Array,
    Object,
    Date,
    Set,
    Array,
    Number,
    String,
    Boolean,
    JSON,
    crypto,
    btoa,
    console,
    async fetch(url, options) {
      resendRequests.push({ url, options });
      return { ok: resendOk, status: resendOk ? 200 : 503 };
    }
  };
  vm.runInNewContext(source, sandbox, { filename: 'feedback-backend/worker.js' });
  return {
    worker: sandbox.feedbackWorker,
    resendRequests,
    database,
    env: {
      DB: database,
      IP_HASH_SALT: 'test-salt',
      RESEND_API_KEY: 'test-key',
      FEEDBACK_FROM_EMAIL: 'Page Scroll Master <feedback@example.com>',
      FEEDBACK_TO_EMAIL: 'developer@example.com'
    }
  };
}

function pngFile(name = 'screen.png') {
  return new File([
    new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0])
  ], name, { type: 'image/png' });
}

function createRequest(overrides = {}) {
  const form = new FormData();
  form.append('type', overrides.type || 'bug');
  form.append('message', overrides.message || 'The buttons overlap on this test page.');
  form.append('contact', overrides.contact || '');
  form.append('extensionVersion', '2.2.0');
  form.append('language', 'en-US');
  form.append('website', overrides.website || '');
  (overrides.images || []).forEach((file) => form.append('images[]', file, file.name));
  return new Request(
    'https://page-scroll-master-feedback.kscje-apps.workers.dev/v1/feedback',
    {
      method: 'POST',
      headers: {
        Origin: 'chrome-extension://test-extension-id',
        'CF-Connecting-IP': '203.0.113.10'
      },
      body: form
    }
  );
}

(async () => {
  console.log('=== Page Scroll Master feedback Worker tests ===');

  const successful = createWorker();
  let response = await successful.worker.fetch(createRequest({
    images: [pngFile()]
  }), successful.env);
  assert(response.status === 202, 'valid multipart feedback is accepted');
  const responseBody = await response.json();
  assert(responseBody.accepted === true && responseBody.requestId, 'accepted response returns a request id');
  assert(successful.resendRequests.length === 1, 'accepted feedback sends one Resend request');
  const email = JSON.parse(successful.resendRequests[0].options.body);
  assert(email.attachments.length === 1, 'selected image is forwarded as an attachment');
  assert(!email.text.includes('Page URL:'), 'feedback email does not include a page URL field');
  assert(!email.text.includes('Browser language:'), 'feedback email does not include browser language');
  assert(successful.database.logs.length === 1, 'delivery metadata is recorded');
  assert(
    !JSON.stringify(successful.database.logs).includes('buttons overlap'),
    'logs exclude feedback content'
  );

  const invalid = createWorker();
  response = await invalid.worker.fetch(createRequest({
    images: [new File(['not a png'], 'fake.png', { type: 'image/png' })]
  }), invalid.env);
  assert(response.status === 400, 'mismatched image signatures are rejected');
  assert(invalid.resendRequests.length === 0, 'invalid images are not sent to the mail service');

  const limited = createWorker(true, 6);
  response = await limited.worker.fetch(createRequest(), limited.env);
  assert(response.status === 429, 'hourly rate limit rejects excessive submissions');
  assert(limited.resendRequests.length === 0, 'rate-limited feedback is not forwarded');

  const honeypot = createWorker();
  response = await honeypot.worker.fetch(createRequest({ website: 'spam.example' }), honeypot.env);
  assert(response.status === 202, 'honeypot submissions receive a non-revealing accepted response');
  assert(honeypot.resendRequests.length === 0, 'honeypot submissions are discarded');

  const deliveryFailure = createWorker(false);
  response = await deliveryFailure.worker.fetch(createRequest(), deliveryFailure.env);
  assert(response.status === 502, 'mail delivery failures return a retryable error');
  assert(
    deliveryFailure.database.logs[0][4] === 'failed',
    'mail delivery failures retain only content-free failure metadata'
  );

  console.log('feedback Worker tests passed');
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
