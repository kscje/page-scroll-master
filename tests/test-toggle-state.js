const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { getSharedRuntimeSource } = require('./runtime-loader');

const ROOT = path.join(__dirname, '..');
const POPUP_PATH = path.join(ROOT, 'popup.js');
const POPUP_HTML = fs.readFileSync(path.join(ROOT, 'popup.html'), 'utf8');
const POPUP_SOURCE = getSharedRuntimeSource(ROOT, POPUP_PATH) + '\n' +
  fs.readFileSync(POPUP_PATH, 'utf8');
const MANIFEST = JSON.parse(fs.readFileSync(path.join(ROOT, 'manifest.json'), 'utf8'));
const STATES_KEY = 'domainFeatureStates';
const RATING_REVIEW_URL = 'https://chromewebstore.google.com/detail/smart-scroll-navigator-%E2%80%93/ikdlbildhneobjlinadkkhnbeonkjbfm/reviews';
const RATING_MIN_INSTALL_AGE_MS = 7 * 24 * 60 * 60 * 1000;

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
  const classNames = new Set();
  const element = {
    id,
    checked: false,
    disabled: false,
    textContent: '',
    style: {},
    dataset: {},
    listeners: {},
    classList: {
      add(className) {
        classNames.add(className);
      },
      remove(className) {
        classNames.delete(className);
      },
      contains(className) {
        return classNames.has(className);
      }
    },
    addEventListener(type, callback) {
      this.listeners[type] = this.listeners[type] || [];
      this.listeners[type].push(callback);
    },
    dispatch(type) {
      (this.listeners[type] || []).forEach((callback) => callback({ target: this }));
    }
  };
  return element;
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
  const createdTabs = [];
  let openOptionsPageCount = 0;
  const elements = {
    extensionToggle: createElement('extensionToggle'),
    autoScrollToggle: createElement('autoScrollToggle'),
    progressBarToggle: createElement('progressBarToggle'),
    screenNavigationToggle: createElement('screenNavigationToggle'),
    scrollBookmarksToggle: createElement('scrollBookmarksToggle'),
    outlineNavigationToggle: createElement('outlineNavigationToggle'),
    currentSite: createElement('currentSite'),
    unavailableMessage: createElement('unavailableMessage'),
    openSettings: createElement('openSettings'),
    ratingPrompt: createElement('ratingPrompt'),
    ratingPromptRate: createElement('ratingPromptRate'),
    ratingPromptLater: createElement('ratingPromptLater'),
    ratingPromptNever: createElement('ratingPromptNever')
  };
  const runtime = {
    lastError: null,
    openOptionsPage() {
      openOptionsPageCount++;
    },
    getURL(pathname) {
      return `chrome-extension://test-extension/${pathname}`;
    },
    getManifest() {
      return MANIFEST;
    },
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
      },
      create(properties) {
        createdTabs.push(clone(properties));
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
  return {
    chrome,
    elements,
    sentMessages,
    runtimeMessages,
    createdTabs,
    get openOptionsPageCount() {
      return openOptionsPageCount;
    }
  };
}

function toggle(popup, key, checked) {
  popup.elements[key].checked = checked;
  popup.elements[key].dispatch('change');
}

console.log('=== Page Scroll Master domain popup tests ===\n');

console.log('Test 0: Popup has permission to inspect the active tab');
assert(MANIFEST.permissions.includes('activeTab'), 'manifest includes activeTab');
assert(
  POPUP_HTML.indexOf('id="screenNavigationToggle"') < POPUP_HTML.indexOf('id="progressBarToggle"'),
  'screen navigation is the first advanced feature in the popup'
);
assert(POPUP_HTML.includes('id="ratingPrompt"'), 'popup includes the rating prompt at the bottom');
assert(POPUP_HTML.includes('rating.js'), 'popup loads the shared rating helper');

console.log('\nTest 1: New domains default to extension on and advanced features off');
let popup = openPopup('https://docs.example.co.uk/page');
assert(popup.elements.currentSite.textContent === 'example.co.uk', 'public suffix parsing resolves example.co.uk');
assert(popup.elements.extensionToggle.checked === true, 'extension defaults to enabled');
assert(popup.elements.autoScrollToggle.checked === false, 'auto scroll defaults to disabled');
assert(popup.elements.progressBarToggle.checked === false, 'progress bar defaults to disabled');
assert(popup.elements.screenNavigationToggle.checked === false, 'screen navigation defaults to disabled');
assert(popup.elements.scrollBookmarksToggle.checked === false, 'bookmarks default to disabled');
assert(popup.elements.outlineNavigationToggle.checked === false, 'outline navigation defaults to disabled');
assert(popup.elements.progressBarToggle.disabled === false, 'feature switches are interactive while extension is enabled');
popup.elements.openSettings.dispatch('click');
assert(popup.openOptionsPageCount === 1, 'opening settings uses the standard options page');
assert(popup.createdTabs.length === 0, 'opening settings does not carry a source tab id');

console.log('\nTest 2: Feature changes persist by registrable domain and notify the active tab');
toggle(popup, 'progressBarToggle', true);
assert(popup.chrome.storage.local.data[STATES_KEY]['example.co.uk'].features.progressBar === true, 'progress state is stored under the main domain');
assert(popup.sentMessages.some((entry) => entry.message.action === 'updateDomainFeatureState'), 'current tab receives an immediate state update');
toggle(popup, 'screenNavigationToggle', true);
assert(
  popup.chrome.storage.local.data[STATES_KEY]['example.co.uk'].features.screenNavigation === true,
  'screen navigation state is stored under the main domain'
);
toggle(popup, 'autoScrollToggle', true);
assert(
  popup.chrome.storage.local.data[STATES_KEY]['example.co.uk'].features.autoScroll === true,
  'auto scroll state is stored under the main domain'
);
console.log('\nTest 3: Disabling the extension retains feature choices and disables their controls');
toggle(popup, 'extensionToggle', false);
const disabledState = popup.chrome.storage.local.data[STATES_KEY]['example.co.uk'];
assert(disabledState.extensionEnabled === false, 'extension state is stored separately');
assert(disabledState.features.progressBar === true, 'saved progress choice is retained');
assert(disabledState.features.screenNavigation === true, 'saved screen navigation choice is retained');
assert(disabledState.features.autoScroll === true, 'saved auto scroll choice is retained');
assert(popup.elements.progressBarToggle.disabled === true, 'feature switches become unavailable');

console.log('\nTest 4: Another subdomain reads the same main-domain state');
popup = openPopup(
  'https://app.example.co.uk/other',
  popup.chrome.storage.local.data
);
assert(popup.elements.currentSite.textContent === 'example.co.uk', 'subdomains share one domain key');
assert(popup.elements.extensionToggle.checked === false, 'subdomain restores extension off state');
assert(popup.elements.progressBarToggle.checked === true, 'subdomain restores retained feature state');

console.log('\nTest 5: Legacy hostname migrates while advanced features stay off by default');
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
assert(migrated.features.progressBar === false, 'legacy progress setting does not become a local migration default');
assert(migrated.features.outlineNavigation === false, 'legacy outline setting does not become a local migration default');

console.log('\nTest 6: Unsupported pages expose no editable state');
popup = openPopup('chrome://extensions');
assert(popup.elements.extensionToggle.disabled === true, 'extension switch is disabled');
assert(popup.elements.progressBarToggle.disabled === true, 'feature switches are disabled');
assert(popup.elements.unavailableMessage.style.display === 'block', 'unsupported-page notice is visible');

console.log('\nTest 7: Rating prompt respects local frequency controls');
const eligibleState = {
  ratingPromptState: {
    installedAt: Date.now() - RATING_MIN_INSTALL_AGE_MS - 1000,
    popupOpenCount: 10,
    totalShownCount: 0,
    shownVersions: {},
    dismissedUntil: 0,
    neverAsk: false,
    ratedClicked: false
  }
};
popup = openPopup('https://rating.example/page', eligibleState);
assert(popup.elements.ratingPrompt.classList.contains('is-visible'), 'eligible users see the rating prompt');
assert(
  popup.chrome.storage.local.data.ratingPromptState.popupOpenCount === 11 &&
    popup.chrome.storage.local.data.ratingPromptState.totalShownCount === 1 &&
    popup.chrome.storage.local.data.ratingPromptState.shownVersions[MANIFEST.version] === true,
  'rendering the prompt records the popup open and current version display'
);
popup = openPopup('https://rating.example/page', popup.chrome.storage.local.data);
assert(
  !popup.elements.ratingPrompt.classList.contains('is-visible'),
  'the same version is not prompted twice'
);
popup = openPopup('https://disabled.example/page', {
  ...eligibleState,
  domainFeatureStates: {
    'disabled.example': {
      extensionEnabled: false,
      features: {}
    }
  }
});
assert(
  !popup.elements.ratingPrompt.classList.contains('is-visible') &&
    popup.chrome.storage.local.data.ratingPromptState.totalShownCount === 0,
  'disabled domains do not show or consume rating prompt display count'
);
popup = openPopup('https://rating.example/page', eligibleState);
popup.elements.ratingPromptLater.dispatch('click');
assert(
  !popup.elements.ratingPrompt.classList.contains('is-visible') &&
    popup.chrome.storage.local.data.ratingPromptState.dismissedUntil > Date.now(),
  'later hides the prompt and stores a cooldown'
);
popup = openPopup('https://rating.example/page', eligibleState);
popup.elements.ratingPromptNever.dispatch('click');
assert(
  popup.chrome.storage.local.data.ratingPromptState.neverAsk === true &&
    !popup.elements.ratingPrompt.classList.contains('is-visible'),
  'never ask hides the prompt permanently'
);
popup = openPopup('https://rating.example/page', eligibleState);
popup.elements.ratingPromptRate.dispatch('click');
assert(
  popup.chrome.storage.local.data.ratingPromptState.ratedClicked === true &&
    popup.createdTabs[0].url === RATING_REVIEW_URL &&
    !popup.elements.ratingPrompt.classList.contains('is-visible'),
  'rating click stores ratedClicked and opens the Chrome Web Store review page'
);

console.log('\n=== Test summary ===');
console.log(`Passed: ${passCount}`);
console.log(`Failed: ${failCount}`);
console.log(`Total: ${passCount + failCount}`);

if (failCount > 0) {
  process.exit(1);
}
