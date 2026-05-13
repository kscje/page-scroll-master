/**
 * Options page regression tests for Page Scroll Master.
 *
 * These tests execute options.js against a small mocked extension page so the
 * same settings controls used by users are covered before Chrome Web Store
 * packaging. Pass OPTIONS_SOURCE=dist/build/options.js to test the packaged
 * build output.
 */

const fs = require('fs');
const vm = require('vm');

const OPTIONS_SOURCE_PATH = process.env.OPTIONS_SOURCE || 'options.js';
const OPTIONS_SOURCE = fs.readFileSync(OPTIONS_SOURCE_PATH, 'utf8');

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

function createElement(id, options = {}) {
  const element = {
    id,
    value: options.value || '',
    checked: Boolean(options.checked),
    textContent: options.textContent || '',
    style: {},
    attributes: options.attributes || {},
    listeners: {},
    children: options.children || [],
    addEventListener(type, callback) {
      this.listeners[type] = this.listeners[type] || [];
      this.listeners[type].push(callback);
    },
    dispatch(type, event = {}) {
      (this.listeners[type] || []).forEach((callback) => {
        callback({
          target: this,
          ...event
        });
      });
    },
    getAttribute(name) {
      return this.attributes[name];
    },
    setAttribute(name, value) {
      this.attributes[name] = value;
    },
    querySelector(selector) {
      if (selector === 'svg') {
        return this.children.find((child) => child.tagName === 'svg') || null;
      }
      return null;
    },
    querySelectorAll(selector) {
      if (selector === 'option') {
        return this.children;
      }
      return [];
    },
    remove() {
      this.removed = true;
    }
  };

  return element;
}

function createOption(value, textContent) {
  return createElement(`option-${value}`, {
    value,
    textContent
  });
}

function createOptionsPage(initialSyncData = {}) {
  const appendedHeadElements = [];
  const elements = {
    scrollSpeed: createElement('scrollSpeed', { value: '1000' }),
    speedValue: createElement('speedValue', { textContent: '1000ms' }),
    horizontalPosition: createElement('horizontalPosition', { value: 'right' }),
    verticalAlignment: createElement('verticalAlignment', { value: 'center' }),
    buttonSize: createElement('buttonSize', { value: '48' }),
    sizeError: createElement('sizeError'),
    topButtonColor: createElement('topButtonColor', { value: '#4A9EDD' }),
    topButtonColorHex: createElement('topButtonColorHex', { value: '#4A9EDD' }),
    bottomButtonColor: createElement('bottomButtonColor', { value: '#4A9EDD' }),
    bottomButtonColorHex: createElement('bottomButtonColorHex', { value: '#4A9EDD' }),
    opacity: createElement('opacity', { value: '100' }),
    opacityValue: createElement('opacityValue', { textContent: '100%' }),
    enableHoverHide: createElement('enableHoverHide', { checked: true }),
    hoverHideKey: createElement('hoverHideKey', {
      value: 'Ctrl',
      children: [
        createOption('Alt', 'Alt'),
        createOption('Ctrl', 'Ctrl'),
        createOption('Shift', 'Shift')
      ]
    }),
    languageSelector: createElement('languageSelector', { value: 'auto' }),
    saveButton: createElement('saveButton', { textContent: 'Save' }),
    previewTopButton: createElement('previewTopButton', {
      children: [createElement('topSvg', { attributes: { tagName: 'svg' } })]
    }),
    previewBottomButton: createElement('previewBottomButton', {
      children: [createElement('bottomSvg', { attributes: { tagName: 'svg' } })]
    })
  };

  elements.previewTopButton.children[0].tagName = 'svg';
  elements.previewBottomButton.children[0].tagName = 'svg';

  const syncData = JSON.parse(JSON.stringify(initialSyncData));
  const sentMessages = [];
  const runtime = { lastError: null };

  const context = {
    console,
    navigator: {
      language: 'en-US',
      platform: 'MacIntel',
      userAgent: 'Chrome Mac'
    },
    performance: {
      now: () => 0
    },
    setTimeout(callback) {
      callback();
      return 1;
    },
    clearTimeout() {},
    requestAnimationFrame(callback) {
      callback();
      return 1;
    },
    window: {
      scrollTo() {},
      addEventListener() {},
      document: null
    },
    document: {
      addEventListener(type, callback) {
        if (type === 'DOMContentLoaded') {
          callback();
        }
      },
      getElementById(id) {
        return elements[id] || null;
      },
      querySelectorAll(selector) {
        if (selector === '[data-i18n]') {
          return [];
        }
        return [];
      },
      createElement(tagName) {
        return createElement(tagName, { attributes: { tagName } });
      },
      head: {
        appendChild(element) {
          appendedHeadElements.push(element);
        }
      },
      documentElement: {
        scrollHeight: 2000
      }
    },
    chrome: {
      storage: {
        sync: {
          get(keys, callback) {
            if (Array.isArray(keys)) {
              const result = {};
              keys.forEach((key) => {
                if (Object.prototype.hasOwnProperty.call(syncData, key)) {
                  result[key] = syncData[key];
                }
              });
              callback(result);
              return;
            }

            callback(Object.prototype.hasOwnProperty.call(syncData, keys) ? { [keys]: syncData[keys] } : {});
          },
          set(data, callback) {
            Object.assign(syncData, JSON.parse(JSON.stringify(data)));
            if (callback) callback();
          }
        }
      },
      tabs: {
        query(queryInfo, callback) {
          callback([{ id: 123 }]);
        },
        sendMessage(tabId, message, callback) {
          sentMessages.push({ tabId, message });
          runtime.lastError = null;
          if (callback) callback();
        }
      },
      runtime
    }
  };

  context.window.document = context.document;

  vm.runInNewContext(OPTIONS_SOURCE, context, { filename: OPTIONS_SOURCE_PATH });

  return {
    context,
    elements,
    syncData,
    sentMessages,
    appendedHeadElements
  };
}

console.log(`=== Page Scroll Master options page tests (${OPTIONS_SOURCE_PATH}) ===\n`);

console.log('Test 1: Saved settings initialize preview controls');
let page = createOptionsPage({
  scrollSpeed: 750,
  buttonSettings: {
    horizontalPosition: 'left',
    verticalAlignment: 'bottom',
    buttonSize: 64,
    topButtonColor: '#112233',
    bottomButtonColor: '#445566',
    opacity: 35,
    enableHoverHide: false,
    hoverHideKey: 'Alt'
  },
  language: 'en-US'
});

assert(page.elements.scrollSpeed.value === 750, 'scroll speed input is loaded from storage');
assert(page.elements.speedValue.textContent === '750ms', 'scroll speed label is loaded from storage');
assert(page.elements.previewTopButton.style.width === '64px', 'preview top button size is applied');
assert(page.elements.previewBottomButton.style.backgroundColor === '#445566', 'preview bottom button color is applied');
assert(page.elements.previewTopButton.style.opacity === 0.35, 'preview opacity is applied');
assert(page.elements.previewTopButton.style.left === '10px', 'preview horizontal position is applied');
assert(page.elements.previewBottomButton.style.bottom === '10px', 'preview vertical position is applied');

console.log('\nTest 2: Live opacity and speed inputs update the page');
page.elements.opacity.value = '42';
page.elements.opacity.dispatch('input');
assert(page.elements.opacityValue.textContent === '42%', 'opacity label updates on input');
assert(page.elements.previewTopButton.style.opacity === 0.42, 'preview opacity updates on input');

page.elements.scrollSpeed.value = '250';
page.elements.scrollSpeed.dispatch('input');
assert(page.elements.speedValue.textContent === '250ms', 'speed label updates on input');

console.log('\nTest 3: Save stores settings and notifies the active tab');
page.elements.saveButton.dispatch('click');
assert(page.syncData.scrollSpeed === 250, 'save persists scroll speed');
assert(page.syncData.buttonSettings.opacity === 42, 'save persists opacity');
assert(page.sentMessages.some((entry) => entry.message.action === 'updateSpeed' && entry.message.speed === 250), 'save sends updateSpeed message');
assert(page.sentMessages.some((entry) => entry.message.action === 'updateButtonSettings' && entry.message.settings.opacity === 42), 'save sends updateButtonSettings message');

console.log('\nTest 4: Preview controls survive packaged output execution');
assert(typeof page.elements.previewTopButton.listeners.click?.[0] === 'function', 'preview top click listener is registered');
assert(typeof page.elements.previewBottomButton.listeners.click?.[0] === 'function', 'preview bottom click listener is registered');
assert(page.appendedHeadElements.some((element) => element.id === 'preview-button-styles'), 'dynamic preview hover styles are injected');

console.log('\n=== Test summary ===');
console.log(`Passed: ${passCount}`);
console.log(`Failed: ${failCount}`);
console.log(`Total: ${passCount + failCount}`);

if (failCount > 0) {
  process.exit(1);
}
