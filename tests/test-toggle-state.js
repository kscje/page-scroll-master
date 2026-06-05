/**
 * Popup toggle persistence tests for Page Scroll Master.
 *
 * The tests execute popup.js in a small mocked Chrome extension environment so
 * they cover the same load, click, save, and reopen path that users exercise.
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const POPUP_SOURCE = fs.readFileSync(path.join(ROOT, 'popup.js'), 'utf8');
const MANIFEST = JSON.parse(fs.readFileSync(path.join(ROOT, 'manifest.json'), 'utf8'));
const STATES_KEY = 'enableStates';

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

function createElement(id) {
  return {
    id,
    checked: false,
    disabled: false,
    textContent: '',
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

function clone(value) {
  return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
}

function createMockChrome(activeUrl, initialLocalData) {
  const listeners = [];
  const local = {
    data: clone(initialLocalData) || {},
    get(keys, callback) {
      const result = {};
      keys.forEach((key) => {
        if (this.data[key] !== undefined) {
          result[key] = clone(this.data[key]);
        }
      });
      callback(result);
    },
    set(data, callback) {
      const changes = {};
      Object.keys(data).forEach((key) => {
        changes[key] = {
          oldValue: clone(this.data[key]),
          newValue: clone(data[key])
        };
        this.data[key] = clone(data[key]);
      });
      listeners.forEach((listener) => listener(changes, 'local'));
      if (callback) callback();
    }
  };

  return {
    storage: {
      local,
      onChanged: {
        addListener(callback) {
          listeners.push(callback);
        },
        trigger(changes, namespace) {
          listeners.forEach((listener) => listener(changes, namespace));
        }
      }
    },
    runtime: {
      lastError: null,
      openOptionsPage() {}
    },
    tabs: {
      query(queryInfo, callback) {
        callback(activeUrl ? [{ url: activeUrl, id: 1 }] : []);
      }
    },
    i18n: {
      getMessage(key) {
        return key === 'popupEnableToggle' ? 'Enable on this site' : '';
      }
    }
  };
}

function openPopup(activeUrl, initialLocalData) {
  const elements = {
    enableToggle: createElement('enableToggle'),
    toggleLabel: createElement('toggleLabel'),
    openSettings: createElement('openSettings')
  };
  const chrome = createMockChrome(activeUrl, initialLocalData);
  const context = {
    chrome,
    console,
    URL,
    Boolean,
    Object,
    Array,
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

  return { chrome, elements };
}

function togglePopupSwitch(popup, checked) {
  popup.elements.enableToggle.checked = checked;
  popup.elements.enableToggle.dispatch('change');
}

console.log('=== Page Scroll Master popup toggle persistence tests ===\n');

console.log('Test 0: Popup has permission to read the active tab URL');
assert(MANIFEST.permissions.includes('activeTab'), 'manifest includes activeTab permission for popup hostname detection');

console.log('Test 1: New supported site defaults to enabled after popup load');
let popup = openPopup('https://example.com/page', {});
assert(popup.elements.enableToggle.checked === true, 'new site switch is enabled by default');
assert(popup.elements.enableToggle.disabled === false, 'switch is interactive after hostname is resolved');

console.log('\nTest 2: Turning the switch off stores an explicit false value');
togglePopupSwitch(popup, false);
assert(popup.chrome.storage.local.data[STATES_KEY]['example.com'] === false, 'storage keeps example.com=false');
assert(popup.elements.enableToggle.checked === false, 'current popup remains visually off');

console.log('\nTest 3: Reopening the popup restores the stored off state');
popup = openPopup('https://example.com/again', popup.chrome.storage.local.data);
assert(popup.elements.enableToggle.checked === false, 'reopened popup shows the switch off');
assert(popup.elements.enableToggle.disabled === false, 'reopened popup can still be toggled');

console.log('\nTest 4: Saving one site merges with existing site states');
popup = openPopup('https://example.com/page', {
  [STATES_KEY]: {
    'another.example': false,
    'enabled.example': true
  }
});
togglePopupSwitch(popup, false);
const mergedStates = popup.chrome.storage.local.data[STATES_KEY];
assert(mergedStates['example.com'] === false, 'current site off state is saved');
assert(mergedStates['another.example'] === false, 'existing off state for another site is preserved');
assert(mergedStates['enabled.example'] === true, 'existing enabled state for another site is preserved');

console.log('\nTest 5: External local storage changes refresh the visible switch');
popup.chrome.storage.onChanged.trigger({
  [STATES_KEY]: {
    oldValue: { 'example.com': false },
    newValue: { 'example.com': true }
  }
}, 'local');
assert(popup.elements.enableToggle.checked === true, 'local storage change updates popup to on');

console.log('\nTest 6: Non-local storage changes do not affect the popup switch');
popup.chrome.storage.onChanged.trigger({
  [STATES_KEY]: {
    oldValue: { 'example.com': true },
    newValue: { 'example.com': false }
  }
}, 'sync');
assert(popup.elements.enableToggle.checked === true, 'sync namespace change is ignored');

console.log('\nTest 7: Unsupported pages keep the switch disabled');
popup = openPopup('chrome://extensions', {});
assert(popup.elements.enableToggle.checked === true, 'unsupported page falls back to enabled display');
assert(popup.elements.enableToggle.disabled === true, 'unsupported page switch is not interactive');

console.log('\nTest 8: Invalid stored state falls back safely');
popup = openPopup('https://invalid-state.example', { [STATES_KEY]: [] });
assert(popup.elements.enableToggle.checked === true, 'invalid state object defaults to enabled');
assert(popup.elements.enableToggle.disabled === false, 'valid hostname can still be toggled');

console.log('\n=== Test summary ===');
console.log(`Passed: ${passCount}`);
console.log(`Failed: ${failCount}`);
console.log(`Total: ${passCount + failCount}`);

if (failCount > 0) {
  process.exit(1);
}
