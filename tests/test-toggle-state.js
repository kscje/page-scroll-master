const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { getSharedRuntimeSource } = require('./runtime-loader');

const ROOT = path.join(__dirname, '..');
const POPUP_PATH = path.join(ROOT, 'popup.js');
const POPUP_SOURCE = getSharedRuntimeSource(ROOT, POPUP_PATH) + '\n' +
  fs.readFileSync(POPUP_PATH, 'utf8');
const MANIFEST = JSON.parse(fs.readFileSync(path.join(ROOT, 'manifest.json'), 'utf8'));
const STATES_KEY = 'domainFeatureStates';

let passCount = 0;
let failCount = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  PASS: ${message}`);
    passCount++;
  } else {
    console.log(`  FAIL: ${message}`);
    failCount++;
  }
}

function clone(value) {
  return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
}

function createElement(id) {
  return {
    id,
    checked: false,
    disabled: false,
    textContent: '',
    style: {},
    dataset: {},
    listeners: {},
    addEventListener(type, callback) {
      this.listeners[type] = this.listeners[type] || [];
      this.listeners[type].push(callback);
    },
    dispatch(type) {
      (this.listeners[type] || []).forEach((callback) => callback({ target: this }));
    }
  };
}

function createStorageArea(data, namespace, listeners) {
  return {
    data: clone(data) || {},
    get(keys, callback) {
      const list = Array.isArray(keys) ? keys : [keys];
      const result = {};
      list.forEach((key) => {
        if (this.data[key] !== undefined) result[key] = clone(this.data[key]);
      });
      callback(result);
    },
    set(nextData, callback) {
      const changes = {};
      Object.keys(nextData).forEach((key) => {
        changes[key] = {
          oldValue: clone(this.data[key]),
          newValue: clone(nextData[key])
        };
        this.data[key] = clone(nextData[key]);
      });
      listeners.forEach((listener) => listener(changes, namespace));
      if (callback) callback();
    }
  };
}

function openPopup(activeUrl, initialLocalData = {}, initialSyncData = {}) {
  const listeners = [];
  const sentMessages = [];
  const runtimeMessages = [];
  const elements = {
    extensionToggle: createElement('extensionToggle'),
    progressBarToggle: createElement('progressBarToggle'),
    scrollBookmarksToggle: createElement('scrollBookmarksToggle'),
    outlineNavigationToggle: createElement('outlineNavigationToggle'),
    currentSite: createElement('currentSite'),
    unavailableMessage: createElement('unavailableMessage'),
    openSettings: createElement('openSettings')
  };
  const runtime = {
    lastError: null,
    openOptionsPage() {},
    sendMessage(message, callback) {
      runtimeMessages.push(clone(message));
      if (callback) callback({ ok: false, reason: 'consent_disabled' });
    }
  };
  const chrome = {
    storage: {
      local: createStorageArea(initialLocalData, 'local', listeners),
      sync: createStorageArea(initialSyncData, 'sync', listeners),
      onChanged: {
        addListener(callback) {
          listeners.push(callback);
        },
        trigger(changes, namespace) {
          listeners.forEach((listener) => listener(changes, namespace));
        }
      }
    },
    runtime,
    tabs: {
      query(queryInfo, callback) {
        callback(activeUrl ? [{ url: activeUrl, id: 7 }] : []);
      },
      sendMessage(tabId, message, callback) {
        sentMessages.push({ tabId, message: clone(message) });
        runtime.lastError = null;
        if (callback) callback();
      }
    },
    i18n: { getMessage() { return ''; } }
  };
  const context = {
    chrome,
    console,
    URL,
    Boolean,
    Object,
    Array,
    navigator: { language: 'en-US' },
    document: {
      getElementById(id) {
        return elements[id];
      },
      querySelectorAll() {
        return [];
      }
    }
  };

  vm.runInNewContext(POPUP_SOURCE, context, { filename: 'popup.js' });
  return { chrome, elements, sentMessages, runtimeMessages };
}

function toggle(popup, key, checked) {
  popup.elements[key].checked = checked;
  popup.elements[key].dispatch('change');
}

console.log('=== Page Scroll Master domain popup tests ===\n');

console.log('Test 0: Popup has permission to inspect the active tab');
assert(MANIFEST.permissions.includes('activeTab'), 'manifest includes activeTab');

console.log('\nTest 1: New domains default to extension on and advanced features off');
let popup = openPopup('https://docs.example.co.uk/page');
assert(popup.elements.currentSite.textContent === 'example.co.uk', 'public suffix parsing resolves example.co.uk');
assert(popup.elements.extensionToggle.checked === true, 'extension defaults to enabled');
assert(popup.elements.progressBarToggle.checked === false, 'progress bar defaults to disabled');
assert(popup.elements.scrollBookmarksToggle.checked === false, 'bookmarks default to disabled');
assert(popup.elements.outlineNavigationToggle.checked === false, 'outline navigation defaults to disabled');
assert(popup.elements.progressBarToggle.disabled === false, 'feature switches are interactive while extension is enabled');

console.log('\nTest 2: Feature changes persist by registrable domain and notify the active tab');
toggle(popup, 'progressBarToggle', true);
assert(popup.chrome.storage.local.data[STATES_KEY]['example.co.uk'].features.progressBar === true, 'progress state is stored under the main domain');
assert(popup.sentMessages.some((entry) => entry.message.action === 'updateDomainFeatureState'), 'current tab receives an immediate state update');
const analyticsToggle = popup.runtimeMessages.find((message) => message.action === 'analytics:recordToggle');
assert(analyticsToggle.feature === 'progressBar' && analyticsToggle.enabled === true, 'popup records only the changed feature state');
assert(!Object.prototype.hasOwnProperty.call(analyticsToggle, 'domain'), 'popup analytics message excludes the current domain');

console.log('\nTest 3: Disabling the extension retains feature choices and disables their controls');
toggle(popup, 'extensionToggle', false);
const disabledState = popup.chrome.storage.local.data[STATES_KEY]['example.co.uk'];
assert(disabledState.extensionEnabled === false, 'extension state is stored separately');
assert(disabledState.features.progressBar === true, 'saved progress choice is retained');
assert(popup.elements.progressBarToggle.disabled === true, 'feature switches become unavailable');

console.log('\nTest 4: Another subdomain reads the same main-domain state');
popup = openPopup(
  'https://app.example.co.uk/other',
  popup.chrome.storage.local.data
);
assert(popup.elements.currentSite.textContent === 'example.co.uk', 'subdomains share one domain key');
assert(popup.elements.extensionToggle.checked === false, 'subdomain restores extension off state');
assert(popup.elements.progressBarToggle.checked === true, 'subdomain restores retained feature state');

console.log('\nTest 5: Legacy hostname and advanced settings migrate without losing behavior');
popup = openPopup(
  'https://www.legacy.co.uk/page',
  {
    enableStates: {
      'docs.legacy.co.uk': false
    }
  },
  {
    advancedSettings: {
      progressBar: { enabled: true },
      scrollBookmarks: { enabled: false },
      outlineNavigation: { enabled: true }
    }
  }
);
const migrated = popup.chrome.storage.local.data[STATES_KEY]['legacy.co.uk'];
assert(migrated.extensionEnabled === false, 'legacy disabled hostname migrates to its main domain');
assert(migrated.features.progressBar === true, 'legacy progress setting becomes a local migration default');
assert(migrated.features.outlineNavigation === true, 'legacy outline setting is preserved');

console.log('\nTest 6: Unsupported pages expose no editable state');
popup = openPopup('chrome://extensions');
assert(popup.elements.extensionToggle.disabled === true, 'extension switch is disabled');
assert(popup.elements.progressBarToggle.disabled === true, 'feature switches are disabled');
assert(popup.elements.unavailableMessage.style.display === 'block', 'unsupported-page notice is visible');

console.log('\n=== Test summary ===');
console.log(`Passed: ${passCount}`);
console.log(`Failed: ${failCount}`);
console.log(`Total: ${passCount + failCount}`);

if (failCount > 0) {
  process.exit(1);
}
