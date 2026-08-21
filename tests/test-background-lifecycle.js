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

function createBackground(initialSyncData = {}) {
  let installedListener = null;
  let runtimeMessageListener = null;
  let optionsOpenCount = 0;
  let failNextOpen = false;
  let storageWriteCount = 0;
  const localData = {};
  const syncData = JSON.parse(JSON.stringify(initialSyncData));
  let syncWriteCount = 0;
  const removedKeys = [];
  const tabMessages = [];

  const runtime = {
    lastError: null,
    onInstalled: {
      addListener(listener) {
        installedListener = listener;
      }
    },
    onMessage: {
      addListener(listener) {
        runtimeMessageListener = listener;
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
            syncWriteCount += 1;
            Object.assign(syncData, JSON.parse(JSON.stringify(data)));
            if (callback) callback();
          }
        },
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
        sendMessage(tabId, message, callback) {
          tabMessages.push({ tabId, message });
          if (callback) callback();
        }
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
    triggerRuntimeMessage(message, sender) {
      assert(typeof runtimeMessageListener === 'function', 'background registers the runtime message listener');
      runtimeMessageListener(message, sender);
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
    get syncData() {
      return syncData;
    },
    get syncWriteCount() {
      return syncWriteCount;
    },
    get removedKeys() {
      return removedKeys;
    },
    get tabMessages() {
      return tabMessages;
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
assert(background.syncData.scrollMode === 'instant', 'a new installation defaults to instant scrolling');
assert(background.syncData.scrollSpeed === 100, 'a new installation stores the default custom duration');

background.triggerRuntimeMessage({
  action: 'forwardEmbeddedFrameScroll',
  frameName: 'docComponent-test',
  scrollAction: 'scrollToBottom',
  scrollMode: 'instant',
  scrollSpeed: 100
}, { tab: { id: 42 } });
assert(background.tabMessages.length === 1, 'embedded frame command is forwarded once within the sender tab');
assert(background.tabMessages[0].tabId === 42, 'embedded frame command stays in the sender tab');
assert(
  background.tabMessages[0].message.frameName === 'docComponent-test' &&
    background.tabMessages[0].message.scrollAction === 'scrollToBottom',
  'forwarded command preserves the target frame and direction'
);

background.trigger('update');
background.trigger('chrome_update');
background.trigger('shared_module_update');
background.triggerWithoutDetails();
assert(background.optionsOpenCount === 1, 'updates and unrelated lifecycle events do not open options');
assert(background.storageWriteCount === 1, 'updates do not change the onboarding display state');

background.failNextOpen();
background.trigger('install');
assert(background.optionsOpenCount === 2, 'an options-page failure is consumed without breaking the listener');

const legacyInstall = createBackground({ scrollSpeed: 750, buttonSettings: { buttonSize: 48 } });
legacyInstall.trigger('install');
assert(legacyInstall.syncData.scrollMode === 'custom', 'restored legacy sync settings migrate to custom mode on install');
assert(legacyInstall.syncData.scrollSpeed === 750, 'legacy custom duration is preserved during install migration');

const legacyUpdate = createBackground();
legacyUpdate.trigger('update');
assert(legacyUpdate.syncData.scrollMode === 'custom', 'an existing user without a stored mode migrates to custom mode');
assert(legacyUpdate.syncData.scrollSpeed === 100, 'legacy users without a saved duration receive the compatibility duration');

const configuredUpdate = createBackground({ scrollMode: 'instant', scrollSpeed: 420 });
configuredUpdate.trigger('update');
assert(configuredUpdate.syncData.scrollMode === 'instant', 'an existing valid mode is not overwritten on update');
assert(configuredUpdate.syncWriteCount === 0, 'an existing valid mode does not trigger another migration write');

const invalidLegacyUpdate = createBackground({ scrollMode: 'unknown', scrollSpeed: 5000 });
invalidLegacyUpdate.trigger('update');
assert(invalidLegacyUpdate.syncData.scrollMode === 'custom', 'an invalid historical mode falls back to custom');
assert(invalidLegacyUpdate.syncData.scrollSpeed === 2000, 'an invalid historical duration is clamped during migration');

assert(!MANIFEST.permissions.includes('management'), 'the implementation does not request management permission');

console.log('background lifecycle tests passed');
