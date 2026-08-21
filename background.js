const ONBOARDING_VISIBLE_KEY = 'showOnboarding';
const DEFAULT_SCROLL_MODE = 'instant';
const LEGACY_SCROLL_MODE = 'custom';
const DEFAULT_SCROLL_SPEED = 100;
const MIN_SCROLL_SPEED = 10;
const MAX_SCROLL_SPEED = 2000;
const SCROLL_MODES = new Set(['instant', 'smooth', 'custom']);
const LEGACY_USAGE_STORAGE_KEYS = [
  'analyticsConsent',
  'analyticsDailyAggregates',
  'analyticsPendingBatch'
];
const LEGACY_USAGE_PERMISSION_ORIGIN = 'https://page-scroll-master-analytics.kscje-apps.workers.dev/*';
const LEGACY_USAGE_ALARM_NAMES = ['analytics-upload', 'analytics-retry'];
const UNINSTALL_SURVEY_BASE_URL = 'https://page-scroll-master-feedback.kscje-apps.workers.dev/uninstall';
const SURVEY_LANGUAGE_CODES = new Set([
  'zh-CN',
  'zh-TW',
  'en-US',
  'es-ES',
  'ja-JP',
  'de-DE',
  'fr-FR',
  'pt-BR',
  'ko-KR',
  'it-IT',
  'ru-RU',
  'tr-TR',
  'id-ID'
]);

function normalizeSurveyLanguage(language) {
  return SURVEY_LANGUAGE_CODES.has(language) ? language : 'en-US';
}

function readSyncStorage(keys) {
  return new Promise((resolve) => {
    if (!chrome.storage || !chrome.storage.sync || typeof chrome.storage.sync.get !== 'function') {
      resolve({});
      return;
    }
    chrome.storage.sync.get(keys, (result) => {
      if (chrome.runtime.lastError) {
        resolve({});
        return;
      }
      resolve(result || {});
    });
  });
}

function normalizeScrollSpeed(value) {
  const speed = Number.parseInt(value, 10);
  if (!Number.isFinite(speed)) return DEFAULT_SCROLL_SPEED;
  return Math.max(MIN_SCROLL_SPEED, Math.min(MAX_SCROLL_SPEED, speed));
}

function initializeScrollBehavior(details, callback) {
  const finish = typeof callback === 'function' ? callback : () => {};
  if (!chrome.storage || !chrome.storage.sync || typeof chrome.storage.sync.get !== 'function') {
    finish();
    return;
  }

  const keys = ['scrollMode', 'scrollSpeed', 'buttonSettings', 'advancedSettings', 'language'];
  chrome.storage.sync.get(keys, (result) => {
    result = chrome.runtime.lastError || !result ? {} : result;
    const hasValidMode = SCROLL_MODES.has(result.scrollMode);
    const scrollSpeed = normalizeScrollSpeed(result.scrollSpeed);
    const hasValidSpeed = Number(result.scrollSpeed) === scrollSpeed;
    if (hasValidMode && hasValidSpeed) {
      finish();
      return;
    }

    const isUpdate = details && details.reason === 'update';
    const hasLegacySyncSettings = keys.some((key) => Object.prototype.hasOwnProperty.call(result, key));
    const scrollMode = hasValidMode
      ? result.scrollMode
      : (isUpdate || hasLegacySyncSettings ? LEGACY_SCROLL_MODE : DEFAULT_SCROLL_MODE);

    if (typeof chrome.storage.sync.set !== 'function') {
      finish();
      return;
    }
    chrome.storage.sync.set({ scrollMode, scrollSpeed }, () => finish());
  });
}

async function readPreferredLanguageForSurvey() {
  const stored = await readSyncStorage('language');
  if (!stored.language || stored.language === 'auto') {
    return 'en-US';
  }
  return normalizeSurveyLanguage(stored.language);
}

function setUninstallUrl(url) {
  return new Promise((resolve) => {
    if (!chrome.runtime || typeof chrome.runtime.setUninstallURL !== 'function') {
      resolve();
      return;
    }
    chrome.runtime.setUninstallURL(url, () => {
      // Registration failures should not block extension startup or onboarding.
      if (chrome.runtime.lastError) {
        resolve();
        return;
      }
      resolve();
    });
  });
}

async function registerUninstallSurveyUrl() {
  if (!chrome.runtime || typeof chrome.runtime.setUninstallURL !== 'function') return;
  try {
    const manifest = typeof chrome.runtime.getManifest === 'function'
      ? chrome.runtime.getManifest()
      : {};
    const version = manifest.version || '0.0.0';
    const language = await readPreferredLanguageForSurvey();
    const url = `${UNINSTALL_SURVEY_BASE_URL}?version=${encodeURIComponent(version)}&lang=${encodeURIComponent(language)}`;
    await setUninstallUrl(url);
  } catch {
    // Ignore registration errors so uninstall survey setup cannot affect core scrolling.
  }
}

function clearLegacyUsageData() {
  if (chrome.storage && chrome.storage.local && typeof chrome.storage.local.remove === 'function') {
    chrome.storage.local.remove(LEGACY_USAGE_STORAGE_KEYS, () => {});
  }
  if (chrome.alarms && typeof chrome.alarms.clear === 'function') {
    LEGACY_USAGE_ALARM_NAMES.forEach((name) => chrome.alarms.clear(name, () => {}));
  }
  if (chrome.permissions && typeof chrome.permissions.remove === 'function') {
    chrome.permissions.remove({
      permissions: ['alarms'],
      origins: [LEGACY_USAGE_PERMISSION_ORIGIN]
    }, () => {});
  }
}

clearLegacyUsageData();
registerUninstallSurveyUrl();

chrome.runtime.onInstalled.addListener((details) => {
  if (details && (details.reason === 'install' || details.reason === 'update')) {
    clearLegacyUsageData();
    registerUninstallSurveyUrl();
  }

  if (!details || (details.reason !== 'install' && details.reason !== 'update')) {
    return;
  }

  initializeScrollBehavior(details, () => {
    if (details.reason !== 'install') return;
    chrome.storage.local.set({ [ONBOARDING_VISIBLE_KEY]: true }, () => {
      chrome.runtime.openOptionsPage(() => {
        // Ignore failures so onboarding cannot block extension initialization.
        if (chrome.runtime.lastError) {
          return;
        }
      });
    });
  });
});

// 监听快捷键命令
chrome.commands.onCommand.addListener((command) => {
  const actionMap = {
    'scroll-to-top': 'scrollToTop',
    'scroll-to-bottom': 'scrollToBottom'
  };
  const action = actionMap[command];
  if (!action) {
    return;
  }

  chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
    const tab = tabs[0];
    if (!tab || !tab.id) {
      return;
    }

    chrome.tabs.sendMessage(tab.id, {action}, () => {
      // Ignore pages where content scripts cannot run, such as chrome:// pages.
      if (chrome.runtime.lastError) {
        return;
      }
    });
  });
});

if (chrome.runtime.onMessage && typeof chrome.runtime.onMessage.addListener === 'function') {
  chrome.runtime.onMessage.addListener((message, sender) => {
    if (!message || message.action !== 'forwardEmbeddedFrameScroll') return;
    if (!sender || !sender.tab || !sender.tab.id || !message.frameName) return;
    if (!['scrollToTop', 'scrollToBottom'].includes(message.scrollAction)) return;

    chrome.tabs.sendMessage(sender.tab.id, {
      action: 'embeddedFrameScroll',
      frameName: message.frameName,
      scrollAction: message.scrollAction,
      scrollMode: message.scrollMode,
      scrollSpeed: message.scrollSpeed
    }, () => {
      // Ignore tabs or frames that were removed while forwarding the command.
      if (chrome.runtime.lastError) return;
    });
  });
}
