const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const BACKGROUND_PATH = process.env.BACKGROUND_SOURCE || path.join(ROOT, 'background.js');
const MANIFEST = JSON.parse(fs.readFileSync(path.join(ROOT, 'manifest.json'), 'utf8'));

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function createBackground() {
  let installedListener = null;
  let optionsOpenCount = 0;
  let failNextOpen = false;
  let storageWriteCount = 0;
  const localData = {};
  const removedKeys = [];

  const runtime = {
    lastError: null,
    onInstalled: {
      addListener(listener) {
        installedListener = listener;
      }
    },
    openOptionsPage(callback) {
      optionsOpenCount += 1;
      runtime.lastError = failNextOpen ? { message: 'Options page unavailable' } : null;
      failNextOpen = false;
      if (callback) {
        callback();
      }
      runtime.lastError = null;
    }
  };

  const sandbox = {
    chrome: {
      runtime,
      storage: {
        local: {
          get(keys, callback) {
            callback({});
          },
          set(data, callback) {
            storageWriteCount += 1;
            Object.assign(localData, data);
            if (callback) callback();
          },
          remove(keys, callback) {
            removedKeys.push(Array.isArray(keys) ? keys.slice() : [keys]);
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
    console
  };

  vm.runInNewContext(fs.readFileSync(BACKGROUND_PATH, 'utf8'), sandbox, {
    filename: path.basename(BACKGROUND_PATH)
  });

  assert(typeof installedListener === 'function', 'background registers the install listener');

  return {
    trigger(reason) {
      installedListener({ reason });
    },
    triggerWithoutDetails() {
      installedListener();
    },
    failNextOpen() {
      failNextOpen = true;
    },
    get optionsOpenCount() {
      return optionsOpenCount;
    },
    get storageWriteCount() {
      return storageWriteCount;
    },
    get localData() {
      return localData;
    },
    get removedKeys() {
      return removedKeys;
    }
  };
}

console.log('=== Page Scroll Master background lifecycle tests ===');

const background = createBackground();

assert(background.optionsOpenCount === 0, 'service worker startup does not open the options page');
assert(
  JSON.stringify(background.removedKeys[0]) === JSON.stringify([
    'analyticsConsent',
    'analyticsDailyAggregates',
    'analyticsPendingBatch'
  ]),
  'service worker startup clears legacy anonymous-usage data'
);

background.trigger('install');
assert(background.optionsOpenCount === 1, 'a new installation opens the options page');
assert(background.storageWriteCount === 1, 'a new installation records the onboarding display state');
assert(background.localData.showOnboarding === true, 'a new installation marks onboarding as visible');

background.trigger('update');
background.trigger('chrome_update');
background.trigger('shared_module_update');
background.triggerWithoutDetails();
assert(background.optionsOpenCount === 1, 'updates and unrelated lifecycle events do not open options');
assert(background.storageWriteCount === 1, 'updates do not change the onboarding display state');

background.failNextOpen();
background.trigger('install');
assert(background.optionsOpenCount === 2, 'an options-page failure is consumed without breaking the listener');

assert(!MANIFEST.permissions.includes('management'), 'the implementation does not request management permission');

console.log('background lifecycle tests passed');
