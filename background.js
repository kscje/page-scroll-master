if (typeof importScripts === 'function') {
  importScripts('analytics.js');
}

const analytics = typeof PageScrollMasterAnalytics !== 'undefined'
  ? PageScrollMasterAnalytics
  : null;
let analyticsOperationQueue = Promise.resolve();
const ANALYTICS_UPLOAD_ALARM = 'analytics-upload';
const ANALYTICS_RETRY_ALARM = 'analytics-retry';
const ANALYTICS_UPLOAD_PERIOD_MINUTES = 360;
const ANALYTICS_RETRY_DELAYS_MINUTES = [1, 5, 30];
const ANALYTICS_REQUEST_TIMEOUT_MS = 10000;
const ONBOARDING_VISIBLE_KEY = 'showOnboarding';
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

function readLocalStorage(keys) {
  return new Promise((resolve) => {
    chrome.storage.local.get(keys, (result) => resolve(result || {}));
  });
}

function writeLocalStorage(data) {
  return new Promise((resolve) => {
    chrome.storage.local.set(data, resolve);
  });
}

function removeLocalStorage(keys) {
  return new Promise((resolve) => {
    chrome.storage.local.remove(keys, resolve);
  });
}

function containsAnalyticsPermission() {
  if (!analytics.isUploadConfigured() ||
      !chrome.permissions ||
      typeof chrome.permissions.contains !== 'function') {
    return Promise.resolve(false);
  }
  return new Promise((resolve) => {
    chrome.permissions.contains({
      permissions: ['alarms'],
      origins: [analytics.CONFIG.permissionOrigin]
    }, resolve);
  });
}

function removeAnalyticsPermission() {
  if (!analytics.CONFIG.permissionOrigin ||
      !chrome.permissions ||
      typeof chrome.permissions.remove !== 'function') {
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    chrome.permissions.remove({
      permissions: ['alarms'],
      origins: [analytics.CONFIG.permissionOrigin]
    }, resolve);
  });
}

function createAlarm(name, alarmInfo) {
  if (!chrome.alarms || typeof chrome.alarms.create !== 'function') return;
  chrome.alarms.create(name, alarmInfo);
}

function clearAlarm(name) {
  if (!chrome.alarms || typeof chrome.alarms.clear !== 'function') {
    return Promise.resolve();
  }
  return new Promise((resolve) => chrome.alarms.clear(name, resolve));
}

function getAlarm(name) {
  if (!chrome.alarms || typeof chrome.alarms.get !== 'function') {
    return Promise.resolve(null);
  }
  return new Promise((resolve) => chrome.alarms.get(name, resolve));
}

async function ensureAnalyticsUploadAlarm() {
  if (!analytics.isUploadConfigured() || !await containsAnalyticsPermission()) return;
  if (!await getAlarm(ANALYTICS_UPLOAD_ALARM)) {
    createAlarm(ANALYTICS_UPLOAD_ALARM, {
      periodInMinutes: ANALYTICS_UPLOAD_PERIOD_MINUTES
    });
  }
}

async function stopAnalyticsScheduling() {
  await Promise.all([
    clearAlarm(ANALYTICS_UPLOAD_ALARM),
    clearAlarm(ANALYTICS_RETRY_ALARM)
  ]);
}

function createBatchId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (character) => {
    const random = Math.floor(Math.random() * 16);
    const value = character === 'x' ? random : ((random & 3) | 8);
    return value.toString(16);
  });
}

function fetchWithTimeout(url, options, timeoutMs) {
  if (typeof AbortController === 'undefined') {
    return fetch(url, options);
  }
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { ...options, signal: controller.signal })
    .finally(() => clearTimeout(timeout));
}

function isRetryableStatus(status) {
  return status === 408 || status === 429 || status >= 500;
}

function scheduleAnalyticsRetry(attempt) {
  const delay = ANALYTICS_RETRY_DELAYS_MINUTES[attempt - 1];
  if (!delay) return;
  createAlarm(ANALYTICS_RETRY_ALARM, {
    delayInMinutes: delay
  });
}

async function persistAggregates(aggregates) {
  const key = analytics.STORAGE_KEYS.aggregates;
  if (Object.keys(aggregates).length) {
    await writeLocalStorage({ [key]: aggregates });
  } else {
    await removeLocalStorage(key);
  }
}

async function getOrCreatePendingBatch(stored) {
  const keys = analytics.STORAGE_KEYS;
  const existing = stored[keys.pendingBatch];
  if (existing && Array.isArray(existing.events) && existing.events.length &&
      typeof existing.batchId === 'string') {
    return existing;
  }
  const events = analytics.buildEvents(stored[keys.aggregates]);
  if (!events.length) return null;
  const batch = analytics.createUploadBatch(events, createBatchId());
  if (!batch) return null;
  const pending = {
    batchId: batch.batchId,
    events: batch.events,
    attempt: 0
  };
  await writeLocalStorage({ [keys.pendingBatch]: pending });
  return pending;
}

async function flushAnalytics() {
  const keys = analytics.STORAGE_KEYS;
  if (!analytics.isUploadConfigured() || !await containsAnalyticsPermission()) {
    return { ok: false, reason: 'permission_missing' };
  }

  const stored = await readLocalStorage([keys.consent, keys.aggregates, keys.pendingBatch]);
  if (!analytics.normalizeConsent(stored[keys.consent]).enabled) {
    await removeLocalStorage([keys.aggregates, keys.pendingBatch]);
    await stopAnalyticsScheduling();
    return { ok: false, reason: 'consent_disabled' };
  }

  const pending = await getOrCreatePendingBatch(stored);
  if (!pending) return { ok: true, empty: true };
  const requestBody = {
    schemaVersion: 1,
    batchId: pending.batchId,
    events: pending.events
  };
  if (analytics.getUtf8Size(requestBody) > analytics.MAX_REQUEST_BYTES) {
    await removeLocalStorage(keys.pendingBatch);
    return { ok: false, reason: 'payload_too_large' };
  }

  try {
    const response = await fetchWithTimeout(analytics.CONFIG.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
      credentials: 'omit',
      referrerPolicy: 'no-referrer'
    }, ANALYTICS_REQUEST_TIMEOUT_MS);
    if (response.ok) {
      const current = await readLocalStorage([keys.aggregates]);
      await persistAggregates(analytics.subtractEvents(
        current[keys.aggregates],
        pending.events
      ));
      await removeLocalStorage(keys.pendingBatch);
      await clearAlarm(ANALYTICS_RETRY_ALARM);
      return flushAnalytics();
    }
    if (!isRetryableStatus(response.status)) {
      await removeLocalStorage(keys.pendingBatch);
      return { ok: false, reason: 'rejected', status: response.status };
    }
  } catch (error) {
    // Network failures use the same bounded retry path as retryable HTTP responses.
  }

  const previousAttempt = Number(pending.attempt || 0);
  if (previousAttempt >= ANALYTICS_RETRY_DELAYS_MINUTES.length) {
    return { ok: false, reason: 'retry_deferred' };
  }
  const attempt = previousAttempt + 1;
  await writeLocalStorage({
    [keys.pendingBatch]: {
      batchId: pending.batchId,
      events: pending.events,
      attempt
    }
  });
  scheduleAnalyticsRetry(attempt);
  return { ok: false, reason: 'retry_scheduled', attempt };
}

function enqueueAnalyticsOperation(operation) {
  analyticsOperationQueue = analyticsOperationQueue.then(operation, operation);
  return analyticsOperationQueue;
}

async function getAnalyticsState() {
  const keys = analytics.STORAGE_KEYS;
  const stored = await readLocalStorage([keys.consent, keys.aggregates, keys.pendingBatch]);
  const consent = analytics.normalizeConsent(stored[keys.consent]);
  const consentWasInvalidated = stored[keys.consent] &&
    stored[keys.consent].enabled === true &&
    consent.enabled !== true;
  if (consentWasInvalidated) {
    await writeLocalStorage({
      [keys.consent]: {
        enabled: false,
        policyVersion: analytics.POLICY_VERSION
      }
    });
    await removeAnalyticsPermission();
    await stopAnalyticsScheduling();
    await removeLocalStorage(keys.pendingBatch);
  }
  if (!consent.enabled) {
    if (stored[keys.aggregates]) {
      await removeLocalStorage(keys.aggregates);
    }
    return {
      consent,
      configured: analytics.isUploadConfigured(),
      permissionOrigin: analytics.CONFIG.permissionOrigin,
      events: []
    };
  }

  const aggregates = analytics.pruneAggregates(stored[keys.aggregates]);
  if (JSON.stringify(aggregates) !== JSON.stringify(stored[keys.aggregates] || {})) {
    if (Object.keys(aggregates).length) {
      await writeLocalStorage({ [keys.aggregates]: aggregates });
    } else {
      await removeLocalStorage(keys.aggregates);
    }
  }
  return {
    consent,
    configured: analytics.isUploadConfigured(),
    permissionOrigin: analytics.CONFIG.permissionOrigin,
    events: consent.enabled ? analytics.buildEvents(aggregates) : []
  };
}

async function setAnalyticsConsent(enabled) {
  const keys = analytics.STORAGE_KEYS;
  if (enabled === true) {
    if (analytics.isUploadConfigured() && !await containsAnalyticsPermission()) {
      return { ok: false, reason: 'permission_missing' };
    }
    await writeLocalStorage({
      [keys.consent]: {
        enabled: true,
        policyVersion: analytics.POLICY_VERSION
      }
    });
    await ensureAnalyticsUploadAlarm();
    return { ok: true };
  }

  await writeLocalStorage({
    [keys.consent]: {
      enabled: false,
      policyVersion: analytics.POLICY_VERSION
    }
  });
  await removeLocalStorage([keys.aggregates, keys.pendingBatch]);
  await stopAnalyticsScheduling();
  await removeAnalyticsPermission();
  return { ok: true };
}

async function updateAnalyticsAggregates(updater) {
  const keys = analytics.STORAGE_KEYS;
  const stored = await readLocalStorage([keys.consent, keys.aggregates]);
  if (!analytics.normalizeConsent(stored[keys.consent]).enabled) {
    if (stored[keys.aggregates]) {
      await removeLocalStorage(keys.aggregates);
    }
    return { ok: false, reason: 'consent_disabled' };
  }
  const aggregates = updater(stored[keys.aggregates]);
  await writeLocalStorage({ [keys.aggregates]: aggregates });
  return { ok: true };
}

if (analytics && chrome.runtime.onMessage && chrome.runtime.onMessage.addListener) {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (!message || !Object.values(analytics.MESSAGE_ACTIONS).includes(message.action)) {
      return false;
    }

    enqueueAnalyticsOperation(async () => {
      if (message.action === analytics.MESSAGE_ACTIONS.getState) {
        return { ok: true, state: await getAnalyticsState() };
      }
      if (message.action === analytics.MESSAGE_ACTIONS.setConsent) {
        return setAnalyticsConsent(message.enabled === true);
      }
      if (message.action === analytics.MESSAGE_ACTIONS.recordAction) {
        return updateAnalyticsAggregates((aggregates) =>
          analytics.incrementAction(aggregates, message.actionKey)
        );
      }
      if (message.action === analytics.MESSAGE_ACTIONS.recordToggle) {
        return updateAnalyticsAggregates((aggregates) =>
          analytics.incrementToggle(
            aggregates,
            message.feature,
            message.enabled === true,
            message.source
          )
        );
      }
      return updateAnalyticsAggregates((aggregates) =>
        analytics.setSettingsSnapshot(aggregates, message.payload)
      );
    }).then(sendResponse, () => sendResponse({ ok: false, reason: 'internal_error' }));
    return true;
  });
}

if (analytics && chrome.alarms && chrome.alarms.onAlarm &&
    typeof chrome.alarms.onAlarm.addListener === 'function') {
  chrome.alarms.onAlarm.addListener((alarm) => {
    if (!alarm || ![ANALYTICS_UPLOAD_ALARM, ANALYTICS_RETRY_ALARM].includes(alarm.name)) {
      return;
    }
    enqueueAnalyticsOperation(flushAnalytics);
  });
}

if (analytics) {
  enqueueAnalyticsOperation(async () => {
    const stored = await readLocalStorage([analytics.STORAGE_KEYS.consent]);
    if (analytics.normalizeConsent(stored[analytics.STORAGE_KEYS.consent]).enabled) {
      await ensureAnalyticsUploadAlarm();
    }
  });
}

registerUninstallSurveyUrl();

chrome.runtime.onInstalled.addListener((details) => {
  if (details && (details.reason === 'install' || details.reason === 'update')) {
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
      if (analytics) {
        const actionKey = command === 'scroll-to-top'
          ? 'keyboardTopCommands'
          : 'keyboardBottomCommands';
        enqueueAnalyticsOperation(() =>
          updateAnalyticsAggregates((aggregates) =>
            analytics.incrementAction(aggregates, actionKey)
          )
        );
      }
    });
  });
});
