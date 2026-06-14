const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const BACKGROUND_PATH = process.env.BACKGROUND_SOURCE || path.join(ROOT, 'background.js');
const ANALYTICS_PATH = process.env.ANALYTICS_SOURCE || path.join(ROOT, 'analytics.js');

function clone(value) {
  return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function createBackground(fetchResponses = []) {
  const localData = {};
  const alarms = new Map();
  const requests = [];
  let messageListener = null;
  let alarmListener = null;
  let context;

  const sandbox = {
    console,
    Promise,
    Object,
    Date,
    Math,
    TextEncoder,
    AbortController,
    setTimeout,
    clearTimeout,
    crypto: {
      randomUUID() {
        return '00000000-0000-4000-8000-000000000123';
      }
    },
    async fetch(url, options) {
      requests.push({
        url,
        options: {
          ...options,
          body: options.body
        }
      });
      const response = fetchResponses.length ? fetchResponses.shift() : { ok: true, status: 202 };
      if (response instanceof Error) throw response;
      return response;
    },
    chrome: {
      storage: {
        local: {
          get(keys, callback) {
            const result = {};
            keys.forEach((key) => {
              if (Object.prototype.hasOwnProperty.call(localData, key)) {
                result[key] = clone(localData[key]);
              }
            });
            callback(result);
          },
          set(data, callback) {
            Object.assign(localData, clone(data));
            if (callback) callback();
          },
          remove(keys, callback) {
            (Array.isArray(keys) ? keys : [keys]).forEach((key) => delete localData[key]);
            if (callback) callback();
          }
        }
      },
      runtime: {
        lastError: null,
        onInstalled: {
          addListener() {}
        },
        onMessage: {
          addListener(listener) {
            messageListener = listener;
          }
        },
        openOptionsPage(callback) {
          if (callback) callback();
        }
      },
      permissions: {
        contains(options, callback) {
          callback(true);
        },
        remove(options, callback) {
          callback(true);
        }
      },
      alarms: {
        create(name, info) {
          alarms.set(name, clone(info));
        },
        get(name, callback) {
          callback(alarms.has(name) ? { name, ...alarms.get(name) } : null);
        },
        clear(name, callback) {
          const removed = alarms.delete(name);
          if (callback) callback(removed);
        },
        onAlarm: {
          addListener(listener) {
            alarmListener = listener;
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
    }
  };

  context = vm.createContext(sandbox);
  sandbox.importScripts = (...files) => {
    files.forEach((file) => {
      const sourcePath = file === 'analytics.js' ? ANALYTICS_PATH : path.join(ROOT, file);
      vm.runInContext(
        fs.readFileSync(sourcePath, 'utf8'),
        context,
        { filename: file }
      );
    });
  };
  vm.runInContext(
    fs.readFileSync(BACKGROUND_PATH, 'utf8'),
    context,
    { filename: path.basename(BACKGROUND_PATH) }
  );

  function send(message) {
    return new Promise((resolve) => {
      messageListener(message, {}, resolve);
    });
  }

  async function triggerAlarm(name) {
    alarmListener({ name });
    await send({ action: 'analytics:getState' });
  }

  return {
    alarms,
    localData,
    requests,
    send,
    triggerAlarm
  };
}

(async () => {
  console.log('=== Page Scroll Master analytics upload tests ===');

  const successful = createBackground();
  let response = await successful.send({ action: 'analytics:setConsent', enabled: true });
  assert(response.ok === true, 'consent succeeds when optional permissions are present');
  assert(
    successful.alarms.get('analytics-upload').periodInMinutes === 360,
    'consent creates the six-hour upload alarm'
  );
  await successful.send({
    action: 'analytics:recordAction',
    actionKey: 'floatingTopClicks'
  });
  await successful.triggerAlarm('analytics-upload');
  assert(successful.requests.length === 1, 'the periodic alarm sends one request');
  const requestBody = JSON.parse(successful.requests[0].options.body);
  assert(requestBody.schemaVersion === 1, 'the upload uses schema version one');
  assert(
    requestBody.batchId === '00000000-0000-4000-8000-000000000123',
    'the upload uses a transient UUID batch id'
  );
  assert(
    successful.requests[0].options.credentials === 'omit' &&
      successful.requests[0].options.referrerPolicy === 'no-referrer',
    'the request omits credentials and referrer information'
  );
  assert(!successful.localData.analyticsDailyAggregates, 'successful upload removes the sent aggregate');
  assert(!successful.localData.analyticsPendingBatch, 'successful upload clears the pending batch');

  const retrying = createBackground([
    new Error('offline'),
    { ok: false, status: 503 },
    { ok: true, status: 202 }
  ]);
  await retrying.send({ action: 'analytics:setConsent', enabled: true });
  await retrying.send({
    action: 'analytics:recordAction',
    actionKey: 'floatingBottomClicks'
  });
  await retrying.triggerAlarm('analytics-upload');
  assert(
    retrying.localData.analyticsPendingBatch.attempt === 1 &&
      retrying.alarms.get('analytics-retry').delayInMinutes === 1,
    'network failure preserves the batch and schedules the first retry'
  );
  const firstBatchId = retrying.localData.analyticsPendingBatch.batchId;
  await retrying.triggerAlarm('analytics-retry');
  assert(
    retrying.localData.analyticsPendingBatch.attempt === 2 &&
      retrying.alarms.get('analytics-retry').delayInMinutes === 5,
    'retryable server failure schedules the second bounded retry'
  );
  assert(
    JSON.parse(retrying.requests[1].options.body).batchId === firstBatchId,
    'retries keep the same batch id for server-side deduplication'
  );
  await retrying.triggerAlarm('analytics-retry');
  assert(!retrying.localData.analyticsPendingBatch, 'a later success clears retry state');

  await retrying.send({ action: 'analytics:setConsent', enabled: false });
  assert(!retrying.alarms.has('analytics-upload'), 'opting out removes the upload alarm');
  assert(!retrying.alarms.has('analytics-retry'), 'opting out removes the retry alarm');
  assert(!retrying.localData.analyticsDailyAggregates, 'opting out clears pending aggregates');

  console.log('analytics upload tests passed');
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
