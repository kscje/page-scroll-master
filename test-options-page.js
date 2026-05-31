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
  const classNames = new Set((options.className || '').split(/\s+/).filter(Boolean));
  const element = {
    id,
    value: options.value || '',
    checked: Boolean(options.checked),
    textContent: options.textContent || '',
    style: {},
    attributes: options.attributes || {},
    listeners: {},
    children: options.children || [],
    className: options.className || '',
    classList: {
      contains(className) {
        return classNames.has(className);
      },
      toggle(className, force) {
        const shouldAdd = force === undefined ? !classNames.has(className) : Boolean(force);
        if (shouldAdd) {
          classNames.add(className);
        } else {
          classNames.delete(className);
        }
        element.className = Array.from(classNames).join(' ');
        return shouldAdd;
      }
    },
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
      if (selector.startsWith('.')) {
        const className = selector.slice(1);
        return this.children.find((child) => child.classList?.contains(className)) || null;
      }
      return null;
    },
    querySelectorAll(selector) {
      if (selector === 'option') {
        return this.children;
      }
      return [];
    },
    appendChild(child) {
      this.children.push(child);
      return child;
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
    buttonSize: createElement('buttonSize', { value: '40' }),
    sizeError: createElement('sizeError'),
    buttonShape: createElement('buttonShape', {
      value: 'round',
      children: [
        createOption('round', 'Round'),
        createOption('square', 'Square')
      ]
    }),
    buttonSpacing: createElement('buttonSpacing', { value: '8' }),
    edgeDistance: createElement('edgeDistance', { value: '8' }),
    edgeDistanceError: createElement('edgeDistanceError'),
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
    progressBarEnabled: createElement('progressBarEnabled'),
    progressBarSettings: createElement('progressBarSettings'),
    progressBarMode: createElement('progressBarMode', { value: 'verticalButton' }),
    verticalProgressSettings: createElement('verticalProgressSettings'),
    horizontalProgressSettings: createElement('horizontalProgressSettings'),
    progressHorizontalPosition: createElement('progressHorizontalPosition', { value: 'top' }),
    progressColorMode: createElement('progressColorMode', { value: 'followTopButton' }),
    progressCustomColorContainer: createElement('progressCustomColorContainer'),
    progressCustomColor: createElement('progressCustomColor', { value: '#4A9EDD' }),
    progressCustomColorHex: createElement('progressCustomColorHex', { value: '#4A9EDD' }),
    progressThickness: createElement('progressThickness', { value: '4' }),
    progressVerticalHeight: createElement('progressVerticalHeight', { value: '120' }),
    progressClickToJump: createElement('progressClickToJump', { checked: true }),
    progressShowPercentage: createElement('progressShowPercentage', { checked: true }),
    progressShowRemainingTime: createElement('progressShowRemainingTime'),
    iconCustomizationSettings: createElement('iconCustomizationSettings'),
    iconSet: createElement('iconSet', { value: 'defaultArrow' }),
    iconColor: createElement('iconColor', { value: '#FFFFFF' }),
    iconColorHex: createElement('iconColorHex', { value: '#FFFFFF' }),
    domainSearch: createElement('domainSearch'),
    domainInput: createElement('domainInput'),
    domainInitialState: createElement('domainInitialState', { value: 'true' }),
    domainError: createElement('domainError'),
    domainList: createElement('domainList'),
    domainEmpty: createElement('domainEmpty'),
    addDomainButton: createElement('addDomainButton'),
    clearDisabledSitesButton: createElement('clearDisabledSitesButton'),
    restoreAllSitesButton: createElement('restoreAllSitesButton'),
    saveButton: createElement('saveButton', { textContent: 'Save' }),
    previewTopButton: createElement('previewTopButton', {
      children: [createElement('topSvg', { attributes: { tagName: 'svg' } })]
    }),
    previewProgressButton: createElement('previewProgressButton', {
      className: 'preview-scroll-button preview-progress-button hidden',
      children: [
        createElement('previewProgressFill', { className: 'preview-progress-fill' }),
        createElement('previewProgressLabel', { className: 'preview-progress-label' })
      ]
    }),
    previewBottomButton: createElement('previewBottomButton', {
      children: [createElement('bottomSvg', { attributes: { tagName: 'svg' } })]
    }),
    previewHorizontalProgress: createElement('previewHorizontalProgress', {
      className: 'preview-horizontal-progress hidden',
      children: [
        createElement('previewHorizontalProgressFill', { className: 'preview-horizontal-progress-fill' }),
        createElement('previewHorizontalProgressLabel', { className: 'preview-horizontal-progress-label' })
      ]
    })
  };

  elements.previewTopButton.children[0].tagName = 'svg';
  elements.previewBottomButton.children[0].tagName = 'svg';

  const syncData = JSON.parse(JSON.stringify(initialSyncData));
  const localData = {};
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
        },
        local: {
          get(keys, callback) {
            const result = {};
            keys.forEach((key) => {
              if (Object.prototype.hasOwnProperty.call(localData, key)) {
                result[key] = localData[key];
              }
            });
            callback(result);
          },
          set(data, callback) {
            Object.assign(localData, JSON.parse(JSON.stringify(data)));
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
    localData,
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
    edgeDistance: 24,
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
assert(page.elements.previewTopButton.style.left === '24px', 'preview horizontal edge distance is applied');
assert(page.elements.previewBottomButton.style.bottom === '24px', 'preview vertical edge distance is applied');
assert(page.elements.buttonShape.value === 'round', 'button shape defaults to round when not in storage');

console.log('\nTest 2: Live opacity and speed inputs update the page');
page.elements.opacity.value = '42';
page.elements.opacity.dispatch('input');
assert(page.elements.opacityValue.textContent === '42%', 'opacity label updates on input');
assert(page.elements.previewTopButton.style.opacity === 0.42, 'preview opacity updates on input');

page.elements.scrollSpeed.value = '250';
page.elements.scrollSpeed.dispatch('input');
assert(page.elements.speedValue.textContent === '250ms', 'speed label updates on input');

console.log('\nTest 3: Save stores settings and notifies the active tab');
page.elements.progressBarEnabled.checked = true;
page.elements.progressBarMode.value = 'horizontalBar';
page.elements.progressThickness.value = '12';
page.elements.iconSet.value = 'doubleArrow';
page.elements.iconColor.value = '#123456';
page.elements.saveButton.dispatch('click');
assert(page.syncData.scrollSpeed === 250, 'save persists scroll speed');
assert(page.syncData.buttonSettings.opacity === 42, 'save persists opacity');
assert(page.syncData.buttonSettings.edgeDistance === 24, 'save persists edge distance');
assert(page.syncData.advancedSettings.progressBar.enabled === true, 'save persists progress bar enabled state');
assert(page.syncData.advancedSettings.progressBar.mode === 'horizontalBar', 'save persists progress bar mode');
assert(page.syncData.advancedSettings.progressBar.thickness === 12, 'save persists progress bar thickness');
assert(page.syncData.advancedSettings.iconCustomization.iconSet === 'doubleArrow', 'save persists icon set');
assert(page.syncData.advancedSettings.iconCustomization.iconColor === '#123456', 'save persists icon color');
assert(page.sentMessages.some((entry) => entry.message.action === 'updateSpeed' && entry.message.speed === 250), 'save sends updateSpeed message');
assert(page.sentMessages.some((entry) => entry.message.action === 'updateButtonSettings' && entry.message.settings.opacity === 42), 'save sends updateButtonSettings message');
assert(page.sentMessages.some((entry) => entry.message.action === 'updateAdvancedSettings' && entry.message.settings.progressBar.enabled === true), 'save sends updateAdvancedSettings message');

console.log('\nTest 4: Preview controls survive packaged output execution');
assert(typeof page.elements.previewTopButton.listeners.click?.[0] === 'function', 'preview top click listener is registered');
assert(typeof page.elements.previewBottomButton.listeners.click?.[0] === 'function', 'preview bottom click listener is registered');
assert(page.appendedHeadElements.some((element) => element.id === 'preview-button-styles'), 'dynamic preview hover styles are injected');

console.log('\nTest 5: Button shape change updates preview button border-radius');
let page2 = createOptionsPage({
  buttonSettings: {
    buttonSize: 48,
    buttonShape: 'round',
    buttonSpacing: 8,
    topButtonColor: '#4A9EDD',
    bottomButtonColor: '#4A9EDD',
    opacity: 100
  }
});
assert(page2.elements.previewTopButton.style.borderRadius === '50%', 'preview buttons use round border-radius when shape is round');
page2.elements.buttonShape.value = 'square';
page2.elements.buttonShape.dispatch('change');
assert(page2.elements.previewTopButton.style.borderRadius === '4px', 'preview buttons use square border-radius after shape change');
assert(page2.elements.previewBottomButton.style.borderRadius === '4px', 'preview bottom button border-radius updates to square');

console.log('\nTest 6: Icon style changes update the real preview buttons');
let page3 = createOptionsPage();
page3.elements.iconSet.value = 'triangle';
page3.elements.iconSet.dispatch('change');
assert(page3.elements.previewTopButton.innerHTML.includes('M12 5l8 12H4z'), 'top preview button renders selected icon style');
assert(page3.elements.previewBottomButton.innerHTML.includes('M12 19L4 7h16z'), 'bottom preview button renders selected icon style');
page3.elements.iconColor.value = '#FF0000';
page3.elements.iconColor.dispatch('input');
assert(page3.elements.previewTopButton.style.color === '#FF0000', 'top preview button renders selected icon color');
assert(page3.elements.previewBottomButton.style.color === '#FF0000', 'bottom preview button renders selected icon color');
page3.elements.saveButton.dispatch('click');
assert(page3.syncData.advancedSettings.iconCustomization.enabled === true, 'icon customization is always saved as enabled');

console.log('\nTest 7: Progress settings update the real preview surface');
let page4 = createOptionsPage();
page4.elements.progressBarEnabled.checked = true;
page4.elements.progressBarEnabled.dispatch('change');
assert(page4.elements.previewProgressButton.style.display === 'flex', 'vertical progress preview is shown when page progress is enabled');
assert(
  page4.elements.previewBottomButton.style.top.includes('176'),
  `bottom preview button is offset below vertical progress preview (${page4.elements.previewBottomButton.style.top})`
);
page4.elements.progressShowPercentage.checked = true;
page4.elements.progressShowPercentage.dispatch('change');
assert(page4.elements.previewProgressButton.querySelector('.preview-progress-label').textContent === '46%', 'vertical progress preview shows percentage');
page4.elements.progressBarMode.value = 'horizontalBar';
page4.elements.progressBarMode.dispatch('change');
assert(page4.elements.previewProgressButton.style.display === 'none', 'vertical progress preview is hidden in horizontal mode');
assert(page4.elements.previewHorizontalProgress.style.display === 'block', 'horizontal progress preview is shown in horizontal mode');
page4.elements.progressHorizontalPosition.value = 'bottom';
page4.elements.progressHorizontalPosition.dispatch('change');
assert(page4.elements.previewHorizontalProgress.style.bottom === '0', 'horizontal progress preview follows bottom position');

console.log('\n=== Test summary ===');
console.log(`Passed: ${passCount}`);
console.log(`Failed: ${failCount}`);
console.log(`Total: ${passCount + failCount}`);

if (failCount > 0) {
  process.exit(1);
}
