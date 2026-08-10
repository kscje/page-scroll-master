const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const BACKGROUND_SOURCE = fs.readFileSync(path.join(ROOT, 'background.js'), 'utf8');
const WORKER_SOURCE = fs.readFileSync(path.join(ROOT, 'feedback-backend', 'worker.js'), 'utf8')
  .replace('export default {', 'this.feedbackWorker = {');
const MANIFEST = JSON.parse(fs.readFileSync(path.join(ROOT, 'manifest.json'), 'utf8'));

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function nextTick() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

function createBackground(options = {}) {
  let installedListener = null;
  const uninstallUrls = [];
  const syncData = {};
  if (Object.prototype.hasOwnProperty.call(options, 'language')) {
    syncData.language = options.language;
  }
  const runtime = {
    lastError: null,
    getManifest() {
      return { version: MANIFEST.version };
    },
    onInstalled: {
      addListener(listener) {
        installedListener = listener;
      }
    },
    openOptionsPage(callback) {
      if (callback) callback();
    }
  };
  if (!options.missingSetUninstallURL) {
    runtime.setUninstallURL = (url, callback) => {
      uninstallUrls.push(url);
      runtime.lastError = options.failSetUninstallURL ? { message: 'unavailable' } : null;
      if (callback) callback();
      runtime.lastError = null;
    };
  }

  const sandbox = {
    chrome: {
      runtime,
      storage: {
        sync: {
          get(keys, callback) {
            const requestedKeys = Array.isArray(keys) ? keys : [keys];
            const result = {};
            requestedKeys.forEach((key) => {
              if (Object.prototype.hasOwnProperty.call(syncData, key)) {
                result[key] = syncData[key];
              }
            });
            callback(result);
          },
          set(data, callback) {
            Object.assign(syncData, data);
            if (callback) callback();
          }
        },
        local: {
          get(keys, callback) {
            callback({});
          },
          set(data, callback) {
            if (callback) callback();
          },
          remove(keys, callback) {
            if (callback) callback();
          }
        }
      },
      commands: {
        onCommand: {
          addListener() {}
        }
      },
      tabs: {
        query() {},
        sendMessage() {}
      }
    },
    console,
    Promise,
    URL,
    URLSearchParams,
    encodeURIComponent,
    Set
  };
  vm.runInNewContext(BACKGROUND_SOURCE, sandbox, { filename: 'background.js' });
  assert(typeof installedListener === 'function', 'background registers install lifecycle listener');
  return {
    trigger(reason) {
      installedListener({ reason });
    },
    uninstallUrls
  };
}

function createDatabase(rateCount = 1) {
  const feedbackLogs = [];
  const uninstallLogs = [];
  return {
    feedbackLogs,
    uninstallLogs,
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
            feedbackLogs.push(this.values);
          }
          if (sql.includes('INSERT INTO uninstall_feedback_logs')) {
            uninstallLogs.push(this.values);
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
  vm.runInNewContext(WORKER_SOURCE, sandbox, { filename: 'feedback-backend/worker.js' });
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

function uninstallRequest(overrides = {}) {
  const payload = Object.assign({
    type: 'uninstall',
    reasons: ['too_complex', 'site_incompatible'],
    message: 'I could not make it work on my usual documentation pages.',
    contact: 'reader@example.com',
    extensionVersion: MANIFEST.version,
    language: 'en-US',
    source: 'uninstall-survey',
    schemaVersion: 1
  }, overrides);
  return new Request(
    'https://page-scroll-master-feedback.kscje-apps.workers.dev/v1/uninstall-feedback',
    {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'CF-Connecting-IP': '203.0.113.15'
      },
      body: JSON.stringify(payload)
    }
  );
}

(async () => {
  console.log('=== Page Scroll Master uninstall survey tests ===');

  const background = createBackground({ language: 'zh-CN' });
  await nextTick();
  assert(background.uninstallUrls.length === 1, 'startup registers the uninstall survey URL');
  let registered = new URL(background.uninstallUrls[0]);
  assert(registered.origin === 'https://page-scroll-master-feedback.kscje-apps.workers.dev', 'uninstall URL uses the feedback Worker origin');
  assert(registered.pathname === '/uninstall', 'uninstall URL points to the survey page');
  assert(registered.searchParams.get('version') === MANIFEST.version, 'uninstall URL includes the manifest version');
  assert(registered.searchParams.get('lang') === 'zh-CN', 'uninstall URL includes the saved language');
  assert(background.uninstallUrls[0].length < 1023, 'uninstall URL stays under Chrome length limit');

  background.trigger('update');
  await nextTick();
  assert(background.uninstallUrls.length === 2, 'updates refresh the uninstall survey URL');

  const fallbackBackground = createBackground({ language: 'auto' });
  await nextTick();
  registered = new URL(fallbackBackground.uninstallUrls[0]);
  assert(registered.searchParams.get('lang') === 'en-US', 'auto language falls back to en-US');

  const missingApiBackground = createBackground({ missingSetUninstallURL: true });
  await nextTick();
  missingApiBackground.trigger('update');
  await nextTick();
  assert(missingApiBackground.uninstallUrls.length === 0, 'missing setUninstallURL is a safe no-op');

  const workerPage = createWorker();
  let response = await workerPage.worker.fetch(new Request(
    'https://page-scroll-master-feedback.kscje-apps.workers.dev/uninstall?version=2.5.4&lang=zh-CN'
  ), workerPage.env);
  assert(response.status === 200, 'survey page is served');
  const html = await response.text();
  assert(html.includes('/v1/uninstall-feedback'), 'survey page posts to the uninstall endpoint');
  assert(!html.includes('https://cdn.') && !html.includes('googletagmanager'), 'survey page avoids remote scripts and trackers');

  const successful = createWorker();
  response = await successful.worker.fetch(uninstallRequest(), successful.env);
  assert(response.status === 202, 'valid uninstall feedback is accepted');
  const responseBody = await response.json();
  assert(responseBody.accepted === true && responseBody.requestId, 'accepted uninstall feedback returns a request id');
  assert(successful.resendRequests.length === 1, 'accepted uninstall feedback sends one Resend email');
  const email = JSON.parse(successful.resendRequests[0].options.body);
  assert(email.subject === '[Page Scroll Master] uninstall feedback', 'uninstall email uses a dedicated subject');
  assert(email.text.includes('too_complex'), 'uninstall email includes selected reasons');
  assert(email.text.includes('reader@example.com'), 'uninstall email includes the optional contact');
  assert(successful.database.uninstallLogs.length === 1, 'uninstall delivery metadata is recorded');
  const logText = JSON.stringify(successful.database.uninstallLogs);
  assert(!logText.includes('reader@example.com'), 'uninstall logs exclude contact details');
  assert(!logText.includes('usual documentation pages'), 'uninstall logs exclude the message body');
  assert(!logText.includes('203.0.113.15'), 'uninstall logs exclude plain IP addresses');

  const unknownLanguage = createWorker();
  response = await unknownLanguage.worker.fetch(uninstallRequest({
    language: 'xx-YY',
    contact: ''
  }), unknownLanguage.env);
  assert(response.status === 202, 'unknown uninstall survey language falls back instead of rejecting feedback');
  const fallbackEmail = JSON.parse(unknownLanguage.resendRequests[0].options.body);
  assert(fallbackEmail.text.includes('Language: en-US'), 'unknown uninstall survey language is normalized to en-US');

  const noReasonShortMessage = createWorker();
  response = await noReasonShortMessage.worker.fetch(uninstallRequest({
    reasons: [],
    message: 'short',
    contact: ''
  }), noReasonShortMessage.env);
  assert(response.status === 400, 'feedback without a reason and without enough message text is rejected');
  assert(noReasonShortMessage.resendRequests.length === 0, 'invalid uninstall feedback is not emailed');

  const unknownReason = createWorker();
  response = await unknownReason.worker.fetch(uninstallRequest({
    reasons: ['too_complex', 'unknown_reason']
  }), unknownReason.env);
  assert(response.status === 400, 'unknown uninstall reasons are rejected');

  const longMessage = createWorker();
  response = await longMessage.worker.fetch(uninstallRequest({
    message: 'x'.repeat(2001)
  }), longMessage.env);
  assert(response.status === 400, 'overlong uninstall message is rejected');

  const multilineContact = createWorker();
  response = await multilineContact.worker.fetch(uninstallRequest({
    contact: 'reader@example.com\nsecond line'
  }), multilineContact.env);
  assert(response.status === 400, 'multi-line uninstall contact is rejected');

  const invalidVersion = createWorker();
  response = await invalidVersion.worker.fetch(uninstallRequest({
    extensionVersion: '2.5'
  }), invalidVersion.env);
  assert(response.status === 400, 'invalid extension version is rejected');

  const limited = createWorker(true, 6);
  response = await limited.worker.fetch(uninstallRequest(), limited.env);
  assert(response.status === 429, 'uninstall feedback uses hourly rate limiting');
  assert(limited.resendRequests.length === 0, 'rate-limited uninstall feedback is not emailed');

  console.log('uninstall survey tests passed');
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
