/**
 * Options page regression tests for Page Scroll Master.
 *
 * These tests execute options.js against a small mocked extension page so the
 * same settings controls used by users are covered before Chrome Web Store
 * packaging. Pass OPTIONS_SOURCE=dist/build/options.js to test the packaged
 * build output.
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { getSharedRuntimeSource } = require('./runtime-loader');

const ROOT = path.join(__dirname, '..');
const OPTIONS_SOURCE_PATH = process.env.OPTIONS_SOURCE || path.join(ROOT, 'options.js');
const OPTIONS_SOURCE = fs.readFileSync(OPTIONS_SOURCE_PATH, 'utf8');
const OPTIONS_HTML = fs.readFileSync(path.join(ROOT, 'options.html'), 'utf8');
const MANIFEST = JSON.parse(fs.readFileSync(path.join(ROOT, 'manifest.json'), 'utf8'));

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
    min: options.min || '',
    max: options.max || '',
    checked: Boolean(options.checked),
    textContent: options.textContent || '',
    style: {
      setProperty(name, value) {
        this[name] = value;
      }
    },
    attributes: options.attributes || {},
    listeners: {},
    children: options.children || [],
    className: options.className || '',
    _innerHTML: '',
    set innerHTML(value) {
      this._innerHTML = value;
      if (value === '') {
        this.children = [];
      }
    },
    get innerHTML() {
      return this._innerHTML;
    },
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

function createOptionsPage(initialSyncData = {}, initialLocalData = {}, initialCommandShortcuts = {}) {
  const appendedHeadElements = [];
  const windowListeners = {};
  const elements = {
    scrollSpeed: createElement('scrollSpeed', { value: '1000', min: '10', max: '2000' }),
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
    opacity: createElement('opacity', { value: '100', min: '0', max: '100' }),
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
    globalShortcutTop: createElement('globalShortcutTop', { textContent: 'Loading...' }),
    globalShortcutBottom: createElement('globalShortcutBottom', { textContent: 'Loading...' }),
    manageGlobalShortcuts: createElement('manageGlobalShortcuts'),
    languageSelector: createElement('languageSelector', { value: 'auto' }),
    progressBarEnabled: createElement('progressBarEnabled'),
    autoScrollSettings: createElement('autoScrollSettings'),
    autoScrollSpeedPreset: createElement('autoScrollSpeedPreset', { value: 'standard' }),
    autoScrollCustomSpeedContainer: createElement('autoScrollCustomSpeedContainer'),
    autoScrollCustomSpeed: createElement('autoScrollCustomSpeed', { value: '40' }),
    autoScrollButtonPosition: createElement('autoScrollButtonPosition', { value: 'pageBottom' }),
    autoScrollButtonColor: createElement('autoScrollButtonColor', { value: '#4A9EDD' }),
    autoScrollButtonColorHex: createElement('autoScrollButtonColorHex', { value: '#4A9EDD' }),
    autoScrollPauseOnUserScroll: createElement('autoScrollPauseOnUserScroll', { checked: true }),
    autoScrollPauseOnTextSelection: createElement('autoScrollPauseOnTextSelection', { checked: true }),
    autoScrollPauseOnEditableFocus: createElement('autoScrollPauseOnEditableFocus', { checked: true }),
    autoScrollPauseWhenPageHidden: createElement('autoScrollPauseWhenPageHidden', { checked: true }),
    autoScrollPauseOnFullscreen: createElement('autoScrollPauseOnFullscreen', { checked: true }),
    autoScrollPauseOnVideo: createElement('autoScrollPauseOnVideo', { checked: true }),
    screenNavigationSettings: createElement('screenNavigationSettings'),
    screenStepRatio: createElement('screenStepRatio', { value: '90' }),
    previousScreenButtonColor: createElement('previousScreenButtonColor', { value: '#4A9EDD' }),
    previousScreenButtonColorHex: createElement('previousScreenButtonColorHex', { value: '#4A9EDD' }),
    nextScreenButtonColor: createElement('nextScreenButtonColor', { value: '#4A9EDD' }),
    nextScreenButtonColorHex: createElement('nextScreenButtonColorHex', { value: '#4A9EDD' }),
    progressBarSettings: createElement('progressBarSettings'),
    progressBarMode: createElement('progressBarMode', { value: 'verticalButton' }),
    verticalProgressSettings: createElement('verticalProgressSettings'),
    horizontalProgressSettings: createElement('horizontalProgressSettings'),
    progressHorizontalPosition: createElement('progressHorizontalPosition', { value: 'top' }),
    progressColorMode: createElement('progressColorMode', { value: 'followTopButton' }),
    progressCustomColorContainer: createElement('progressCustomColorContainer'),
    progressCustomColor: createElement('progressCustomColor', { value: '#4a9edd' }),
    progressCustomColorHex: createElement('progressCustomColorHex', { value: '#4a9edd' }),
    progressThickness: createElement('progressThickness', { value: '4' }),
    progressVerticalHeight: createElement('progressVerticalHeight', { value: '120' }),
    progressClickToJump: createElement('progressClickToJump', { checked: true }),
    progressShowPercentage: createElement('progressShowPercentage', { checked: true }),
    progressShowRemainingTime: createElement('progressShowRemainingTime'),
    scrollBookmarksEnabled: createElement('scrollBookmarksEnabled'),
    scrollBookmarksSettings: createElement('scrollBookmarksSettings'),
    scrollBookmarkButtonPosition: createElement('scrollBookmarkButtonPosition', { value: 'pageBottom' }),
    scrollBookmarkButtonColorMode: createElement('scrollBookmarkButtonColorMode', { value: 'followTopButton' }),
    scrollBookmarkButtonCustomColorContainer: createElement('scrollBookmarkButtonCustomColorContainer'),
    scrollBookmarkButtonCustomColor: createElement('scrollBookmarkButtonCustomColor', { value: '#4a9edd' }),
    scrollBookmarkButtonCustomColorHex: createElement('scrollBookmarkButtonCustomColorHex', { value: '#4a9edd' }),
    outlineNavigationEnabled: createElement('outlineNavigationEnabled'),
    outlineNavigationSettings: createElement('outlineNavigationSettings'),
    outlineButtonPosition: createElement('outlineButtonPosition', { value: 'pageBottom' }),
    outlineButtonColorMode: createElement('outlineButtonColorMode', { value: 'followTopButton' }),
    outlineButtonCustomColorContainer: createElement('outlineButtonCustomColorContainer'),
    outlineButtonCustomColor: createElement('outlineButtonCustomColor', { value: '#4a9edd' }),
    outlineButtonCustomColorHex: createElement('outlineButtonCustomColorHex', { value: '#4a9edd' }),
    outlineSourceH1: createElement('outlineSourceH1', { checked: true }),
    outlineSourceH2: createElement('outlineSourceH2', { checked: true }),
    outlineSourceH3: createElement('outlineSourceH3'),
    outlineSourceIdBlocks: createElement('outlineSourceIdBlocks'),
    outlineSourcesResetNotice: createElement('outlineSourcesResetNotice'),
    outlineMaxItems: createElement('outlineMaxItems', { value: '30' }),
    outlineMaxItemsError: createElement('outlineMaxItemsError'),
    outlineFilterShortHeadings: createElement('outlineFilterShortHeadings', { checked: true }),
    outlineHighlightCurrentSection: createElement('outlineHighlightCurrentSection', { checked: true }),
    scrollBookmarkPerDomainLimit: createElement('scrollBookmarkPerDomainLimit', { value: '1' }),
    scrollBookmarkRestoreMode: createElement('scrollBookmarkRestoreMode', { value: 'prompt' }),
    savedBookmarksList: createElement('savedBookmarksList'),
    savedBookmarksEmpty: createElement('savedBookmarksEmpty'),
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
    analyticsEnabled: createElement('analyticsEnabled'),
    analyticsStatus: createElement('analyticsStatus'),
    analyticsPreviewData: createElement('analyticsPreviewData', { textContent: '[]' }),
    feedbackForm: createElement('feedbackForm'),
    feedbackType: createElement('feedbackType', { value: 'feature' }),
    feedbackMessage: createElement('feedbackMessage'),
    feedbackContact: createElement('feedbackContact'),
    feedbackImages: createElement('feedbackImages'),
    feedbackImageStatus: createElement('feedbackImageStatus'),
    feedbackImageSummary: createElement('feedbackImageSummary'),
    feedbackWebsite: createElement('feedbackWebsite'),
    feedbackSubmitButton: createElement('feedbackSubmitButton'),
    feedbackSubmitStatus: createElement('feedbackSubmitStatus'),
    onboardingGuide: createElement('onboardingGuide'),
    dismissOnboardingButton: createElement('dismissOnboardingButton'),
    reopenOnboardingButton: createElement('reopenOnboardingButton'),
    saveButton: createElement('saveButton', { textContent: 'Save' }),
    releaseNotesList: createElement('releaseNotesList'),
    previewTopButton: createElement('previewTopButton', {
      children: [createElement('topSvg', { attributes: { tagName: 'svg' } })]
    }),
    previewPreviousScreenButton: createElement('previewPreviousScreenButton'),
    previewAutoScrollButton: createElement('previewAutoScrollButton'),
    previewProgressButton: createElement('previewProgressButton', {
      className: 'preview-scroll-button preview-progress-button hidden',
      children: [
        createElement('previewProgressFill', { className: 'preview-progress-fill' }),
        createElement('previewProgressLabel', { className: 'preview-progress-label' })
      ]
    }),
    previewBookmarkButton: createElement('previewBookmarkButton', {
      className: 'preview-scroll-button hidden'
    }),
    previewOutlineButton: createElement('previewOutlineButton', {
      className: 'preview-scroll-button hidden'
    }),
    previewBottomButton: createElement('previewBottomButton', {
      children: [createElement('bottomSvg', { attributes: { tagName: 'svg' } })]
    }),
    previewNextScreenButton: createElement('previewNextScreenButton'),
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
  elements.feedbackImages.files = [];
  elements.feedbackForm.reset = function () {
    elements.feedbackType.value = 'feature';
    elements.feedbackMessage.value = '';
    elements.feedbackContact.value = '';
    elements.feedbackImages.files = [];
    elements.feedbackWebsite.value = '';
  };
  elements.onboardingGuide.scrollIntoView = function (options) {
    this.scrollIntoViewOptions = options;
  };

  const syncData = JSON.parse(JSON.stringify(initialSyncData));
  const localData = JSON.parse(JSON.stringify(initialLocalData));
  const sentMessages = [];
  const analyticsMessages = [];
  const createdTabs = [];
  const commandShortcuts = {
    'scroll-to-top': 'Command+Shift+Up',
    'scroll-to-bottom': 'Command+Shift+Down',
    ...initialCommandShortcuts
  };
  let analyticsPermissionRequestCount = 0;
  const analyticsState = {
    configured: true,
    permissionOrigin: 'https://page-scroll-master-analytics.kscje-apps.workers.dev/*',
    consent: {
      enabled: initialLocalData.analyticsConsent?.enabled === true,
      policyVersion: 2
    },
    events: []
  };
  const runtime = {
    lastError: null,
    getManifest() {
      return MANIFEST;
    },
    sendMessage(message, callback) {
      analyticsMessages.push(JSON.parse(JSON.stringify(message)));
      if (message.action === 'analytics:getState') {
        callback({
          ok: true,
          state: JSON.parse(JSON.stringify(analyticsState))
        });
        return;
      }
      if (message.action === 'analytics:setConsent') {
        analyticsState.consent.enabled = message.enabled === true;
        if (!analyticsState.consent.enabled) analyticsState.events = [];
        callback({ ok: true });
        return;
      }
      if (message.action === 'analytics:recordSettingsSnapshot' &&
          analyticsState.consent.enabled) {
        analyticsState.events = [{
          eventName: 'settings_snapshot',
          eventDate: '2026-06-13',
          payload: message.payload
        }];
        callback({ ok: true });
        return;
      }
      callback({ ok: false, reason: 'consent_disabled' });
    }
  };

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
      addEventListener(type, callback) {
        windowListeners[type] = windowListeners[type] || [];
        windowListeners[type].push(callback);
      },
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
        },
        create(createProperties) {
          createdTabs.push(createProperties);
        }
      },
      commands: {
        getAll(callback) {
          callback(Object.entries(commandShortcuts).map(([name, shortcut]) => ({
            name,
            shortcut
          })));
        }
      },
      runtime,
      permissions: {
        request(options, callback) {
          analyticsPermissionRequestCount += 1;
          callback(true);
        },
        remove(options, callback) {
          callback(true);
        }
      }
    }
  };

  context.window.document = context.document;

  vm.runInNewContext(
    getSharedRuntimeSource(ROOT, OPTIONS_SOURCE_PATH) + '\n' + OPTIONS_SOURCE,
    context,
    { filename: OPTIONS_SOURCE_PATH }
  );

  return {
    context,
    elements,
    syncData,
    localData,
    sentMessages,
    analyticsMessages,
    analyticsState,
    get analyticsPermissionRequestCount() {
      return analyticsPermissionRequestCount;
    },
    createdTabs,
    commandShortcuts,
    dispatchWindowEvent(type) {
      (windowListeners[type] || []).forEach((callback) => callback());
    },
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
const basicPanelIndex = OPTIONS_HTML.indexOf('data-tab-panel="basic"');
const onboardingGuideIndex = OPTIONS_HTML.indexOf('class="onboarding-guide"');
const settingGridIndex = OPTIONS_HTML.indexOf('class="setting-grid"', basicPanelIndex);
assert(
  basicPanelIndex >= 0 &&
  onboardingGuideIndex > basicPanelIndex &&
  onboardingGuideIndex < settingGridIndex,
  'new-user guidance appears on the default basic tab before detailed settings'
);
assert(
  (OPTIONS_HTML.match(/class="onboarding-step"/g) || []).length === 4,
  'new-user guidance covers four onboarding topics'
);
assert(
  OPTIONS_HTML.includes('data-i18n="settings.onboardingCoreDescription"') &&
  OPTIONS_HTML.includes('data-i18n="settings.onboardingPopupDescription"') &&
  OPTIONS_HTML.includes('data-i18n="settings.onboardingSiteControlsDescription"') &&
  OPTIONS_HTML.includes('data-i18n="settings.onboardingPrivacyDescription"'),
  'onboarding explains scroll buttons, toolbar Popup, site controls, and analytics consent'
);
assert(
  OPTIONS_HTML.includes('data-i18n="settings.onboardingFeatureAutoScroll"') &&
  OPTIONS_HTML.includes('data-i18n="settings.screenNavigation"') &&
  OPTIONS_HTML.includes('data-i18n="settings.onboardingFeatureProgress"') &&
  OPTIONS_HTML.includes('data-i18n="settings.onboardingFeatureBookmarks"') &&
  OPTIONS_HTML.includes('data-i18n="settings.onboardingFeatureOutline"'),
  'onboarding names the advanced features controlled from the Popup'
);
assert(
  OPTIONS_HTML.includes('data-i18n="settings.onboardingPrivacyOff"'),
  'onboarding visibly states that anonymous analytics is off by default'
);
assert(page.elements.onboardingGuide.style.display === 'none', 'existing users do not see onboarding without the install marker');
const newUserPage = createOptionsPage({}, { showOnboarding: true });
assert(newUserPage.elements.onboardingGuide.style.display === 'block', 'new installations see onboarding while the marker is active');
newUserPage.elements.dismissOnboardingButton.dispatch('click');
assert(
  newUserPage.localData.showOnboarding === false &&
    newUserPage.elements.onboardingGuide.style.display === 'none',
  'dismissing onboarding hides it for later settings visits'
);
page.elements.reopenOnboardingButton.dispatch('click');
assert(
  page.localData.showOnboarding === true &&
    page.elements.onboardingGuide.style.display === 'block',
  'the about section can reopen onboarding on demand'
);
assert(!OPTIONS_HTML.includes('id="progressBarEnabled"'), 'settings page no longer exposes the progress enable switch');
assert(!OPTIONS_HTML.includes('id="scrollBookmarksEnabled"'), 'settings page no longer exposes the bookmark enable switch');
assert(!OPTIONS_HTML.includes('id="outlineNavigationEnabled"'), 'settings page no longer exposes the outline enable switch');
assert(
  OPTIONS_HTML.includes('<span class="input-suffix" aria-hidden="true">%</span>'),
  'screen navigation distance input displays an in-field percent suffix'
);
assert(
  !OPTIONS_HTML.includes('screenNavigationOpacity'),
  'screen navigation omits an independent opacity control'
);
assert(
  OPTIONS_HTML.includes('id="autoScrollButtonColor"') &&
    !OPTIONS_HTML.includes('id="autoScrollButtonColorMode"'),
  'auto scroll uses one directly configurable button color'
);
assert(
  !OPTIONS_HTML.includes('data-i18n="settings.advancedEnableHint">是否启用由工具栏 Popup') &&
    OPTIONS_HTML.includes('data-i18n="settings.screenNavigationIntro"') &&
    OPTIONS_HTML.includes('data-i18n="settings.progressBarIntro"') &&
    OPTIONS_HTML.includes('data-i18n="settings.scrollBookmarksIntro"') &&
    OPTIONS_HTML.includes('data-i18n="settings.outlineNavigationIntro"'),
  'advanced modules use feature introductions instead of the shared popup enable hint'
);
assert(
  OPTIONS_HTML.includes('.tab-panel[data-tab-panel="advanced"] .sub-setting {') &&
    OPTIONS_HTML.includes('padding-left: 0;'),
  'advanced feature detail sections align with their module headings without indentation'
);
assert(
  page.elements.progressCustomColor.value === '#4a9edd' &&
    page.elements.scrollBookmarkButtonCustomColor.value === '#4a9edd' &&
    page.elements.outlineButtonCustomColor.value === '#4a9edd',
  'all three advanced feature custom colors default to #4a9edd'
);
assert(
  OPTIONS_HTML.includes('data-i18n="settings.progressColorMode">按钮颜色</label>'),
  'progress color mode uses the button color label'
);
assert(page.elements.scrollBookmarkButtonColorMode.value === 'followTopButton', 'scroll bookmark color defaults to the top button');
assert(page.elements.outlineButtonColorMode.value === 'followTopButton', 'outline color defaults to the top button');
assert(page.elements.outlineSourceH1.checked === true && page.elements.outlineSourceH2.checked === true, 'old settings receive default H1 and H2 sources');
assert(page.elements.outlineMaxItems.value === 30, 'old settings receive the default outline batch size');
assert(page.elements.scrollBookmarkRestoreMode.value === 'prompt', 'scroll bookmark restore mode defaults to prompt');
assert(page.elements.analyticsEnabled.checked === false, 'anonymous analytics defaults to disabled');
assert(page.elements.analyticsEnabled.disabled === false, 'analytics local consent remains available before upload is configured');
assert(page.elements.analyticsPreviewData.textContent === '[]', 'analytics preview starts empty');
assert(OPTIONS_HTML.includes('id="analyticsEnabled"'), 'settings page exposes the anonymous analytics control');
assert(
  OPTIONS_HTML.includes('data-i18n="settings.tab.feedback">建议&关于插件</'),
  'suggestions tab uses the suggestions and about title'
);
assert(
  OPTIONS_HTML.includes('id="globalShortcutTop"') &&
    OPTIONS_HTML.includes('id="globalShortcutBottom"') &&
    OPTIONS_HTML.includes('id="manageGlobalShortcuts"'),
  'shortcut settings expose current top and bottom bindings plus the Chrome management entry'
);
assert(
  page.elements.globalShortcutTop.textContent === 'Command+Shift+Up' &&
    page.elements.globalShortcutBottom.textContent === 'Command+Shift+Down',
  'current Chrome command bindings are displayed on initialization'
);
const shortcutPage = createOptionsPage({}, {}, {
  'scroll-to-top': '',
  'scroll-to-bottom': 'Alt+Shift+Down'
});
assert(shortcutPage.elements.globalShortcutTop.textContent === 'Not set', 'unbound commands show an explicit status');
assert(shortcutPage.elements.globalShortcutBottom.textContent === 'Alt+Shift+Down', 'custom Chrome command bindings are displayed');
shortcutPage.elements.manageGlobalShortcuts.dispatch('click');
assert(
  shortcutPage.createdTabs[0].url === 'chrome://extensions/shortcuts',
  'customize shortcuts opens the Chrome shortcut management page'
);
shortcutPage.commandShortcuts['scroll-to-top'] = 'Alt+Shift+Up';
shortcutPage.dispatchWindowEvent('focus');
assert(
  shortcutPage.elements.globalShortcutTop.textContent === 'Alt+Shift+Up',
  'returning focus to the settings page refreshes command bindings'
);
assert(
  (OPTIONS_HTML.match(/class="setting-group feedback-card/g) || []).length === 4,
  'feedback page uses one card style for submission, privacy, about, and release notes'
);
assert(
  OPTIONS_HTML.includes('class="analytics-preview feedback-disclosure"'),
  'analytics preview uses the shared disclosure interaction style'
);
assert(
  OPTIONS_HTML.includes('id="feedbackForm"') &&
    OPTIONS_HTML.includes('id="feedbackType"') &&
    OPTIONS_HTML.includes('id="feedbackMessage"') &&
    OPTIONS_HTML.includes('id="feedbackImages"') &&
    !OPTIONS_HTML.includes('id="feedbackIncludeContext"'),
  'feedback page exposes the planned form fields without page context collection'
);
assert(
  OPTIONS_HTML.includes('class="feedback-file-input"') &&
    OPTIONS_HTML.includes('class="feedback-file-button"') &&
    OPTIONS_HTML.includes('id="feedbackImageStatus"') &&
    OPTIONS_HTML.includes('data-i18n="settings.feedbackChooseImages"'),
  'feedback image picker uses a styled accessible upload control with selection status'
);
const feedbackFilePage = createOptionsPage({}, {}, {});
feedbackFilePage.elements.feedbackImages.dispatch('change');
assert(
  feedbackFilePage.elements.feedbackImageStatus.textContent === 'No images selected',
  'feedback image picker shows the localized empty state'
);
feedbackFilePage.elements.feedbackImages.files = [
  { name: 'layout.png' },
  { name: 'scroll.webp' }
];
feedbackFilePage.elements.feedbackImages.dispatch('change');
assert(
  feedbackFilePage.elements.feedbackImageStatus.textContent ===
    '2 image(s) selected: layout.png, scroll.webp',
  'feedback image picker shows selected file names'
);
assert(
  feedbackFilePage.elements.feedbackImageSummary.textContent ===
    'Up to 3 JPEG, PNG, or WebP images, no more than 5MB each.',
  'feedback image picker keeps the format and size guidance visible after selection'
);
assert(
  OPTIONS_HTML.includes('input[type="text"],\n    textarea,\n    select') &&
    OPTIONS_HTML.includes('textarea:focus'),
  'feedback textarea uses the shared full-width form control styles'
);
assert(
  OPTIONS_HTML.includes('input[type="range"]::-webkit-slider-runnable-track') &&
    OPTIONS_HTML.includes('var(--range-progress, 0%)') &&
    OPTIONS_HTML.includes('input[type="checkbox"]:checked::after') &&
    OPTIONS_HTML.includes('border: solid #ffffff;'),
  'range tracks preserve blue progress over white surfaces and checked checkbox marks are white'
);
assert(
  MANIFEST.optional_host_permissions.includes(
    'https://page-scroll-master-feedback.kscje-apps.workers.dev/*'
  ),
  'feedback uses one fixed optional host permission'
);

const domainTablePage = createOptionsPage({}, {
  domainFeatureMigrationVersion: 1,
  domainFeatureDefaults: {
    extensionEnabled: true,
    features: {
      progressBar: false,
      screenNavigation: false,
      scrollBookmarks: false,
      outlineNavigation: false
    }
  },
  domainFeatureStates: {
    'example.com': {
      extensionEnabled: true,
      features: {
        progressBar: true,
        screenNavigation: true,
        scrollBookmarks: false,
        outlineNavigation: true
      }
    }
  }
});
const domainHeader = domainTablePage.elements.domainList.children[0];
const domainRow = domainTablePage.elements.domainList.children[1];
assert(domainHeader.className === 'domain-header', 'domain feature names render once in a table header');
assert(
  OPTIONS_HTML.includes('grid-template-columns: minmax(140px, 1fr) 72px 112px 112px 112px 132px 132px 44px;') &&
    OPTIONS_HTML.includes('min-width: 944px;'),
  'domain header and rows use identical explicit column tracks'
);
assert(
  JSON.stringify(domainHeader.children.map((child) => child.textContent)) ===
    JSON.stringify(['Domain', 'Extension', 'Auto scroll', 'Progress bar', 'Screen navigation', 'Scroll bookmarks', 'Section navigation', 'Actions']),
  'domain table header labels every column'
);
assert(domainRow.children.length === 8, 'domain rows contain one domain, six controls, and one action');
assert(
  domainRow.children.slice(1, 7).every((label) =>
    label.children.length === 1 &&
    Boolean(label.children[0].getAttribute('aria-label'))
  ),
  'domain rows omit repeated feature text while retaining accessible checkbox labels'
);
const domainDeleteButton = domainRow.children[7];
assert(
  domainDeleteButton.className === 'domain-delete-button' &&
    domainDeleteButton.innerHTML.includes('<svg') &&
    domainDeleteButton.textContent === '',
  'domain deletion uses a compact icon button instead of repeated text'
);
assert(
  domainDeleteButton.getAttribute('aria-label') === 'Delete' &&
    domainDeleteButton.getAttribute('title') === 'Delete',
  'domain delete icon retains an accessible label and tooltip'
);

const analyticsConsentPage = createOptionsPage();
analyticsConsentPage.elements.analyticsEnabled.checked = true;
analyticsConsentPage.elements.analyticsEnabled.dispatch('change');
assert(
  analyticsConsentPage.analyticsState.consent.enabled === true,
  'the analytics switch records explicit local consent'
);
assert(
  analyticsConsentPage.analyticsPermissionRequestCount === 1,
  'analytics consent requests the fixed host and scheduling permissions'
);
assert(
  analyticsConsentPage.analyticsMessages.some((message) =>
    message.action === 'analytics:recordSettingsSnapshot'
  ),
  'first consent records one allowlisted settings snapshot'
);
assert(
  analyticsConsentPage.elements.analyticsPreviewData.textContent.includes('settings_snapshot'),
  'consented pending data is visible in the preview'
);
analyticsConsentPage.elements.analyticsEnabled.checked = false;
analyticsConsentPage.elements.analyticsEnabled.dispatch('change');
assert(
  analyticsConsentPage.analyticsState.consent.enabled === false &&
  analyticsConsentPage.elements.analyticsPreviewData.textContent === '[]',
  'opting out clears the pending preview'
);

const aboutCardIndex = OPTIONS_HTML.indexOf('class="setting-group feedback-card about-card"');
const releaseNotesCardIndex = OPTIONS_HTML.indexOf('class="setting-group feedback-card release-notes-card"');
assert(aboutCardIndex >= 0 && releaseNotesCardIndex > aboutCardIndex, 'release notes appear after the about card');

const renderedReleases = page.elements.releaseNotesList.children;
const plannedReleaseVersions = ['2.2.0', '2.1.0', '2.0.0', '1.9.0', '1.8.0'];
const compareTestVersions = (left, right) => {
  const leftParts = left.split('.').map(Number);
  const rightParts = right.split('.').map(Number);
  for (let index = 0; index < Math.max(leftParts.length, rightParts.length); index++) {
    const difference = (leftParts[index] || 0) - (rightParts[index] || 0);
    if (difference !== 0) return difference;
  }
  return 0;
};
const expectedVisibleVersions = plannedReleaseVersions.filter(
  (version) => compareTestVersions(version, MANIFEST.version) <= 0
);
assert(renderedReleases.length === expectedVisibleVersions.length, 'release notes start at v1.8 and hide unreleased content');
assert(renderedReleases[0].getAttribute('data-release-version') === MANIFEST.version, 'current manifest version appears first');
assert(renderedReleases[0].open === true, 'current version is expanded by default');
assert(renderedReleases.slice(1).every((release) => release.open !== true), 'historical versions are collapsed by default');
assert(
  renderedReleases[renderedReleases.length - 1].getAttribute('data-release-version') === '1.8.0',
  'v1.8 is the earliest displayed release'
);
const currentReleaseSummary = renderedReleases[0].children[0];
assert(currentReleaseSummary.children[1].textContent === 'Current version', 'current release includes a localized current-version badge');
const v19Release = renderedReleases.find(
  (release) => release.getAttribute('data-release-version') === '1.9.0'
);
const v19CategoryHeadings = v19Release.children[1].children.map(
  (category) => category.children[0].textContent
);
assert(
  JSON.stringify(v19CategoryHeadings) === JSON.stringify(['New features', 'Feature improvements']),
  'empty release-note categories are omitted'
);

const legacyManualPage = createOptionsPage({
  advancedSettings: {
    scrollBookmarks: {
      restorePromptEnabled: false
    }
  }
});
assert(legacyManualPage.elements.scrollBookmarkRestoreMode.value === 'manual', 'disabled legacy restore prompts load as manual mode');
const legacyProgressColorPage = createOptionsPage({
  advancedSettings: {
    scrollBookmarks: { buttonColorMode: 'followProgressBar' },
    outlineNavigation: { buttonColorMode: 'followProgressBar' }
  }
});
assert(legacyProgressColorPage.elements.scrollBookmarkButtonColorMode.value === 'followTopButton', 'legacy bookmark progress color loads as top button color');
assert(legacyProgressColorPage.elements.outlineButtonColorMode.value === 'followTopButton', 'legacy outline progress color loads as top button color');
assert(!OPTIONS_HTML.includes('settings.featureButtonColorMode.followProgressBar'), 'feature color selects omit the progress bar option');
assert(!OPTIONS_HTML.includes('value="betweenScrollButtons"'), 'feature position selects omit the legacy between-buttons option');
assert(
  OPTIONS_HTML.includes('value="pageMiddle"') &&
    OPTIONS_HTML.includes('data-i18n="settings.featureButtonPosition.pageMiddleNote"'),
  'feature position selects expose page middle with an ordering note'
);
const legacyPositionPage = createOptionsPage({
  advancedSettings: {
    scrollBookmarks: { buttonPosition: 'betweenScrollButtons' },
    outlineNavigation: { buttonPosition: 'betweenScrollButtons' }
  }
});
assert(legacyPositionPage.elements.scrollBookmarkButtonPosition.value === 'pageMiddle', 'legacy bookmark position loads as page middle');
assert(legacyPositionPage.elements.outlineButtonPosition.value === 'pageMiddle', 'legacy outline position loads as page middle');

console.log('\nTest 2: Live opacity and speed inputs update the page');
page.elements.opacity.value = '42';
page.elements.opacity.dispatch('input');
assert(page.elements.opacityValue.textContent === '42%', 'opacity label updates on input');
assert(page.elements.previewTopButton.style.opacity === 0.42, 'preview opacity updates on input');
assert(
  page.elements.opacity.style['--range-progress'] === '42%',
  'range fill boundary updates when the slider value changes'
);

page.elements.scrollSpeed.value = '250';
page.elements.scrollSpeed.dispatch('input');
assert(page.elements.speedValue.textContent === '250ms', 'speed label updates on input');

console.log('\nTest 3: Save stores settings and notifies the active tab');
page.elements.autoScrollSpeedPreset.value = 'custom';
page.elements.autoScrollCustomSpeed.value = '125';
page.elements.autoScrollButtonPosition.value = 'pageMiddle';
page.elements.autoScrollButtonColor.value = '#336699';
page.elements.autoScrollPauseOnVideo.checked = false;
page.elements.progressBarMode.value = 'horizontalBar';
page.elements.screenStepRatio.value = '50';
page.elements.previousScreenButtonColor.value = '#112233';
page.elements.nextScreenButtonColor.value = '#445566';
page.elements.progressThickness.value = '12';
page.elements.scrollBookmarkButtonPosition.value = 'pageMiddle';
page.elements.scrollBookmarkButtonColorMode.value = 'custom';
page.elements.scrollBookmarkButtonCustomColor.value = '#778899';
page.elements.outlineButtonPosition.value = 'pageTop';
page.elements.outlineButtonColorMode.value = 'followBottomButton';
page.elements.outlineSourceH1.checked = false;
page.elements.outlineSourceH2.checked = true;
page.elements.outlineSourceH3.checked = true;
page.elements.outlineSourceIdBlocks.checked = true;
page.elements.outlineMaxItems.value = '42';
page.elements.outlineFilterShortHeadings.checked = false;
page.elements.outlineHighlightCurrentSection.checked = false;
page.elements.scrollBookmarkPerDomainLimit.value = '2';
page.elements.scrollBookmarkRestoreMode.value = 'auto';
page.elements.iconSet.value = 'doubleArrow';
page.elements.iconColor.value = '#123456';
page.elements.saveButton.dispatch('click');
assert(page.syncData.scrollSpeed === 250, 'save persists scroll speed');
assert(page.syncData.buttonSettings.opacity === 42, 'save persists opacity');
assert(page.syncData.buttonSettings.edgeDistance === 24, 'save persists edge distance');
assert(!Object.prototype.hasOwnProperty.call(page.syncData.advancedSettings.autoScroll, 'enabled'), 'save omits auto scroll enabled state');
assert(page.syncData.advancedSettings.autoScroll.speedPreset === 'custom', 'save persists the auto scroll speed preset');
assert(page.syncData.advancedSettings.autoScroll.customSpeed === 125, 'save persists the custom auto scroll speed');
assert(page.syncData.advancedSettings.autoScroll.buttonPosition === 'pageMiddle', 'save persists the auto scroll button position');
assert(page.syncData.advancedSettings.autoScroll.buttonColor === '#336699', 'save persists the direct auto scroll button color');
assert(page.syncData.advancedSettings.autoScroll.pauseOnVideo === false, 'save persists auto scroll pause rules');
assert(page.syncData.advancedSettings.screenNavigation.screenStepRatio === 0.5, 'save persists the screen step ratio');
assert(
  !Object.prototype.hasOwnProperty.call(page.syncData.advancedSettings.screenNavigation, 'opacity'),
  'save omits legacy screen navigation opacity'
);
assert(page.syncData.advancedSettings.screenNavigation.previousScreenButtonColor === '#112233', 'save persists the previous screen color');
assert(page.syncData.advancedSettings.screenNavigation.nextScreenButtonColor === '#445566', 'save persists the next screen color independently');
assert(!Object.prototype.hasOwnProperty.call(page.syncData.advancedSettings.screenNavigation, 'enabled'), 'save omits screen navigation enabled state');
assert(!Object.prototype.hasOwnProperty.call(page.syncData.advancedSettings.progressBar, 'enabled'), 'save omits progress bar enabled state');
assert(page.syncData.advancedSettings.progressBar.mode === 'horizontalBar', 'save persists progress bar mode');
assert(page.syncData.advancedSettings.progressBar.thickness === 12, 'save persists progress bar thickness');
assert(!Object.prototype.hasOwnProperty.call(page.syncData.advancedSettings.scrollBookmarks, 'enabled'), 'save omits bookmark enabled state');
assert(page.syncData.advancedSettings.scrollBookmarks.buttonPosition === 'pageMiddle', 'save persists scroll bookmark page-middle position');
assert(page.syncData.advancedSettings.scrollBookmarks.buttonColorMode === 'custom', 'save persists scroll bookmark button color mode');
assert(page.syncData.advancedSettings.scrollBookmarks.buttonCustomColor === '#778899', 'save persists scroll bookmark custom color');
assert(!Object.prototype.hasOwnProperty.call(page.syncData.advancedSettings.outlineNavigation, 'enabled'), 'save omits outline enabled state');
assert(page.syncData.advancedSettings.outlineNavigation.buttonPosition === 'pageTop', 'save persists outline button position');
assert(page.syncData.advancedSettings.outlineNavigation.buttonColorMode === 'followBottomButton', 'save persists outline button color mode');
assert(page.syncData.advancedSettings.outlineNavigation.sources.h1 === false, 'save persists the H1 outline source');
assert(page.syncData.advancedSettings.outlineNavigation.sources.h3 === true, 'save persists the H3 outline source');
assert(page.syncData.advancedSettings.outlineNavigation.sources.idBlocks === true, 'save persists the id block outline source');
assert(page.syncData.advancedSettings.outlineNavigation.maxItems === 42, 'save persists the outline batch size');
assert(page.syncData.advancedSettings.outlineNavigation.filterShortHeadings === false, 'save persists short heading filtering');
assert(page.syncData.advancedSettings.outlineNavigation.highlightCurrentSection === false, 'save persists current section highlighting');
assert(page.syncData.advancedSettings.scrollBookmarks.perDomainLimit === 2, 'save persists scroll bookmark per-domain limit');
assert(page.syncData.advancedSettings.scrollBookmarks.restoreMode === 'auto', 'save persists scroll bookmark restore mode');
assert(page.syncData.advancedSettings.iconCustomization.iconSet === 'doubleArrow', 'save persists icon set');
assert(page.syncData.advancedSettings.iconCustomization.iconColor === '#123456', 'save persists icon color');
assert(page.sentMessages.some((entry) => entry.message.action === 'updateSpeed' && entry.message.speed === 250), 'save sends updateSpeed message');
assert(page.sentMessages.some((entry) => entry.message.action === 'updateButtonSettings' && entry.message.settings.opacity === 42), 'save sends updateButtonSettings message');
assert(
  page.sentMessages.some((entry) =>
    entry.message.action === 'updateAdvancedSettings' &&
    !Object.prototype.hasOwnProperty.call(entry.message.settings.progressBar, 'enabled')
  ),
  'save sends detailed advanced settings without enable state'
);
assert(
  page.analyticsMessages.some((message) =>
    message.action === 'analytics:recordSettingsSnapshot' &&
    message.payload.buttonSizeBucket === 'large' &&
    !Object.prototype.hasOwnProperty.call(message.payload, 'topButtonColor')
  ),
  'save submits a bucketed settings snapshot without exact colors'
);

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
assert(page3.elements.previewPreviousScreenButton.innerHTML.includes('<rect'), 'previous screen keeps its viewport icon');
assert(page3.elements.previewNextScreenButton.innerHTML.includes('<rect'), 'next screen keeps its viewport icon');
page3.elements.iconColor.value = '#FF0000';
page3.elements.iconColor.dispatch('input');
assert(page3.elements.previewTopButton.style.color === '#FF0000', 'top preview button renders selected icon color');
assert(page3.elements.previewBottomButton.style.color === '#FF0000', 'bottom preview button renders selected icon color');
assert(page3.elements.previewPreviousScreenButton.style.color === '#FFFFFF', 'previous screen icon ignores the main icon color');
assert(page3.elements.previewNextScreenButton.style.color === '#FFFFFF', 'next screen icon ignores the main icon color');
page3.elements.saveButton.dispatch('click');
assert(page3.syncData.advancedSettings.iconCustomization.enabled === true, 'icon customization is always saved as enabled');

console.log('\nTest 7: Progress settings update the real preview surface');
let page4 = createOptionsPage();
assert(page4.elements.previewProgressButton.style.display === 'flex', 'vertical progress preview is always available for configuration');
assert(
  page4.elements.previewPreviousScreenButton.style.top.includes('48') &&
    page4.elements.previewProgressButton.style.top.includes('96') &&
    page4.elements.previewNextScreenButton.style.top.includes('224') &&
    page4.elements.previewBottomButton.style.top.includes('272'),
  'screen navigation preview follows top, previous, progress, next, bottom order'
);
page4.elements.previousScreenButtonColor.value = '#123456';
page4.elements.previousScreenButtonColor.dispatch('input');
assert(page4.elements.previewPreviousScreenButton.style.backgroundColor === '#123456', 'previous screen preview uses its own color');
assert(page4.elements.previewNextScreenButton.style.backgroundColor === '#4A9EDD', 'changing previous screen color does not overwrite next screen color');
page4.elements.opacity.value = '20';
page4.elements.opacity.dispatch('input');
assert(page4.elements.previewTopButton.style.opacity === 0.2, 'main button opacity still follows the global setting');
assert(page4.elements.previewPreviousScreenButton.style.opacity === 0.2, 'previous screen uses the main button opacity');
assert(page4.elements.previewNextScreenButton.style.opacity === 0.2, 'next screen uses the main button opacity');
assert(
  page4.elements.previewBottomButton.style.top.includes('272'),
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

console.log('\nTest 8: Advanced feature previews remain available and follow button geometry');
let page5 = createOptionsPage();
assert(page5.elements.previewBookmarkButton.style.display === 'flex', 'scroll bookmark preview remains visible for configuration');
assert(page5.elements.previewOutlineButton.style.display === 'flex', 'outline preview remains visible for configuration');
page5.elements.scrollBookmarkButtonPosition.value = 'pageBottom';
page5.elements.scrollBookmarkButtonColorMode.value = 'followTopButton';
assert(page5.elements.previewBookmarkButton.style.display === 'flex', 'scroll bookmark preview is shown when enabled');
assert(page5.elements.previewBookmarkButton.style.backgroundColor === '#4A9EDD', 'scroll bookmark preview falls back to top button color');
assert(page5.elements.previewBookmarkButton.style.bottom === '56px', 'page-bottom bookmark stacks before outline when scroll buttons are centered');
assert(page5.elements.previewOutlineButton.style.bottom === '8px', 'page-bottom outline follows bookmark toward the page edge');
page5.elements.verticalAlignment.value = 'bottom';
page5.elements.verticalAlignment.dispatch('change');
assert(page5.elements.previewBookmarkButton.style.bottom !== page5.elements.previewOutlineButton.style.bottom, 'page-bottom feature previews do not overlap');
page5.elements.verticalAlignment.value = 'center';
page5.elements.verticalAlignment.dispatch('change');
page5.elements.scrollBookmarkButtonPosition.value = 'pageMiddle';
page5.elements.outlineButtonPosition.value = 'pageMiddle';
page5.elements.scrollBookmarkButtonPosition.dispatch('change');
page5.elements.outlineButtonPosition.dispatch('change');
assert(page5.elements.previewBookmarkButton.style.top.includes('calc(50%'), 'page-middle scroll bookmark preview joins centered button group');
assert(page5.elements.previewOutlineButton.style.top.includes('calc(50%'), 'page-middle outline preview joins centered button group');
assert(page5.elements.previewBottomButton.style.top !== page5.elements.previewBookmarkButton.style.top, 'page-middle bookmark appears after the bottom button');
assert(page5.elements.previewBookmarkButton.style.top !== page5.elements.previewOutlineButton.style.top, 'page-middle feature previews do not overlap');

console.log('\nTest 9: Saved scroll bookmarks render and can be deleted');
const savedBookmarksDetailsTag = OPTIONS_HTML.match(/<details\b[^>]*saved-bookmarks-details[^>]*>/)?.[0] || '';
assert(Boolean(savedBookmarksDetailsTag), 'saved bookmarks use a collapsible details section');
assert(!/\sopen(?:\s|=|>)/.test(savedBookmarksDetailsTag), 'saved bookmarks section is collapsed by default');
let page6 = createOptionsPage(
  { language: 'en-US' },
  {
    bookmarks: {
      'exact:https://example.test/a': {
        title: 'Article A',
        domain: 'example.test',
        normalizedUrl: 'https://example.test/a',
        url: 'https://example.test/a',
        scrollPct: 0.62,
        savedAt: 1000
      },
      'exact:https://example.test/b': {
        title: 'Article B',
        domain: 'example.test',
        normalizedUrl: 'https://example.test/b',
        url: 'https://example.test/b',
        scrollPct: 0.34,
        savedAt: 2000
      }
    }
  }
);
assert(page6.elements.savedBookmarksEmpty.style.display === 'none', 'saved bookmarks empty state hides when bookmarks exist');
assert(page6.elements.savedBookmarksList.children.length === 2, 'saved bookmarks list renders stored entries');
const firstBookmarkInfo = page6.elements.savedBookmarksList.children[0].children[0];
const firstBookmarkTitle = firstBookmarkInfo.children[0];
assert(firstBookmarkTitle.children[0].textContent === 'Article B', 'saved bookmarks list sorts newest first');
assert(/^34% · .+/.test(firstBookmarkTitle.children[1].textContent), 'bookmark percentage and time appear after the title');
assert(!firstBookmarkTitle.children[1].textContent.includes('example.test'), 'bookmark metadata does not repeat the domain');
assert(firstBookmarkInfo.children[1].textContent === 'https://example.test/b', 'bookmark row keeps the detailed address');
const openButton = page6.elements.savedBookmarksList.children[0].children[1].children[0];
openButton.dispatch('click');
assert(page6.localData.pendingScrollBookmarkRestore.key === 'exact:https://example.test/b', 'open stores a one-time restore request for the selected bookmark');
assert(page6.createdTabs[0].url === 'https://example.test/b', 'open creates the bookmark tab after storing the restore request');
const deleteButton = page6.elements.savedBookmarksList.children[0].children[1].children[1];
deleteButton.dispatch('click');
assert(!page6.localData.bookmarks['exact:https://example.test/b'], 'delete removes the selected saved bookmark from storage');
assert(page6.elements.savedBookmarksList.children.length === 1, 'saved bookmarks list rerenders after deletion');

console.log('\nTest 10: Outline controls restore valid sources and validate item limits');
let page7 = createOptionsPage({
  advancedSettings: {
    readingTools: {
      enabled: true,
      features: {
        scrollBookmarks: true,
        outlineNavigation: true
      }
    },
    outlineNavigation: {
      enabled: true,
      sources: {
        h1: false,
        h2: false,
        h3: true,
        idBlocks: false
      },
      maxItems: 50,
      filterShortHeadings: false,
      highlightCurrentSection: false
    }
  }
});
assert(page7.elements.outlineNavigationSettings.style.display === 'block', 'enabled outline navigation shows its child settings');
assert(page7.elements.outlineSourceH3.checked === true, 'saved H3 source loads into the settings page');
assert(page7.elements.outlineMaxItems.value === 50, 'saved outline batch size loads into the settings page');
assert(page7.elements.outlineFilterShortHeadings.checked === false, 'saved short heading filter loads into the settings page');
assert(page7.elements.outlineNavigationSettings.style.display === 'block', 'outline details remain visible without an enable switch');
page7.elements.outlineSourceH3.checked = false;
page7.elements.outlineSourceH3.dispatch('change');
assert(page7.elements.outlineSourceH1.checked === true && page7.elements.outlineSourceH2.checked === true, 'clearing all outline sources restores H1 and H2');
assert(page7.elements.outlineSourcesResetNotice.style.display === 'block', 'restoring outline sources shows a short notice');
page7.elements.outlineMaxItems.value = '9';
page7.elements.outlineMaxItems.dispatch('input');
assert(page7.elements.outlineMaxItemsError.style.display === 'block', 'out-of-range outline batch sizes show validation feedback');
page7.elements.outlineMaxItems.value = '30';
page7.elements.outlineMaxItems.dispatch('input');
assert(page7.elements.outlineMaxItemsError.style.display === 'none', 'valid outline batch sizes clear validation feedback');

console.log('\n=== Test summary ===');
console.log(`Passed: ${passCount}`);
console.log(`Failed: ${failCount}`);
console.log(`Total: ${passCount + failCount}`);

if (failCount > 0) {
  process.exit(1);
}
