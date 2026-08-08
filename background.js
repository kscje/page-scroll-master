const ONBOARDING_VISIBLE_KEY = 'showOnboarding';
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

  if (!details || details.reason !== 'install') {
    return;
  }

  chrome.storage.local.set({ [ONBOARDING_VISIBLE_KEY]: true }, () => {
    chrome.runtime.openOptionsPage(() => {
      // Ignore failures so onboarding cannot block extension initialization.
      if (chrome.runtime.lastError) {
        return;
      }
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
