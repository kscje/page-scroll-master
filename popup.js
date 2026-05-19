var STATES_KEY = 'enableStates';

var toggleEl = document.getElementById('enableToggle');
var toggleLabelEl = document.getElementById('toggleLabel');
var settingsBtn = document.getElementById('openSettings');
var currentHostname = '';
var allStates = {};
var _ignoreChange = false;
var _pendingLocalChange = false;

// 弹窗页面翻译数据（与设置页面保持一致）
var popupTranslations = {
  'zh-CN': {
    'popupSettings': '设置',
    'popupEnableToggle': '在该网站启用'
  },
  'en-US': {
    'popupSettings': 'Settings',
    'popupEnableToggle': 'Enable on this site'
  }
};

// 获取当前语言设置
function getCurrentLanguage(callback) {
  function resolveFromBrowser() {
    var browserLang = (typeof navigator !== 'undefined' && (navigator.language || navigator.userLanguage)) || 'en-US';
    callback(browserLang.indexOf('zh') === 0 ? 'zh-CN' : 'en-US');
  }

  if (!chrome.storage || !chrome.storage.sync || !chrome.storage.sync.get) {
    resolveFromBrowser();
    return;
  }

  chrome.storage.sync.get('language', function (result) {
    if (chrome.runtime.lastError) {
      resolveFromBrowser();
      return;
    }
    if (result.language && result.language !== 'auto') {
      callback(result.language);
    } else {
      resolveFromBrowser();
    }
  });
}

function applyI18n() {
  getCurrentLanguage(function (lang) {
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var key = el.dataset.i18n;
      var message;
      if (popupTranslations[lang] && popupTranslations[lang][key]) {
        message = popupTranslations[lang][key];
      } else {
        message = chrome.i18n.getMessage(key);
      }
      if (message) {
        el.textContent = message;
      }
    });
  });
}

function extractHostname(url) {
  try {
    var parsedUrl = new URL(url);
    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
      return '';
    }
    return parsedUrl.hostname;
  } catch (e) {
    return '';
  }
}

function setCheckboxSilently(checked) {
  _ignoreChange = true;
  try {
    toggleEl.checked = Boolean(checked);
  } finally {
    _ignoreChange = false;
  }
}

function normalizeStates(states) {
  return states && typeof states === 'object' && !Array.isArray(states) ? states : {};
}

function isHostEnabled(states, hostname) {
  if (!hostname) return true;
  return normalizeStates(states)[hostname] !== false;
}

function updateUI(enabled, canToggle) {
  setCheckboxSilently(enabled);
  toggleEl.disabled = canToggle === false;

  getCurrentLanguage(function (lang) {
    var label = (popupTranslations[lang] && popupTranslations[lang]['popupEnableToggle']) || chrome.i18n.getMessage('popupEnableToggle') || 'Enable on this site';
    toggleLabelEl.textContent = label;
  });
}

function persistState(enabled) {
  if (!currentHostname) return;
  var hostname = currentHostname;
  allStates[hostname] = enabled;
  _pendingLocalChange = true;

  chrome.storage.local.get([STATES_KEY], function (result) {
    var latestStates = allStates;
    if (chrome.runtime.lastError) {
      console.error('Page Scroll Master: Failed to reload toggle state before save:', chrome.runtime.lastError.message);
    } else {
      latestStates = normalizeStates(result[STATES_KEY]);
    }

    allStates = Object.assign({}, latestStates);
    allStates[hostname] = enabled;

    var data = {};
    data[STATES_KEY] = allStates;
    chrome.storage.local.set(data, function () {
      if (chrome.runtime.lastError) {
        console.error('Page Scroll Master: Failed to save toggle state:', chrome.runtime.lastError.message);
      }
      _pendingLocalChange = false;
    });
  });
}

function loadAndUpdateUI() {
  toggleEl.disabled = true;
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    var tab = tabs[0];
    if (!tab || !tab.url) {
      updateUI(true, false);
      return;
    }
    currentHostname = extractHostname(tab.url);
    if (!currentHostname) {
      updateUI(true, false);
      return;
    }
    chrome.storage.local.get([STATES_KEY], function (result) {
      if (chrome.runtime.lastError) {
        console.error('Page Scroll Master: Failed to load toggle state:', chrome.runtime.lastError.message);
        updateUI(true, false);
        return;
      }
      allStates = normalizeStates(result[STATES_KEY]);
      updateUI(isHostEnabled(allStates, currentHostname), true);
    });
  });
}

applyI18n();

toggleEl.addEventListener('change', function () {
  if (_ignoreChange) return;
  if (!currentHostname) return;
  var enabled = toggleEl.checked;
  allStates[currentHostname] = enabled;
  persistState(enabled);
});

settingsBtn.addEventListener('click', function () {
  chrome.runtime.openOptionsPage();
});

chrome.storage.onChanged.addListener(function (changes, namespace) {
  if (namespace !== 'local') return;
  if (!changes[STATES_KEY]) return;
  if (!currentHostname) return;
  if (_pendingLocalChange) return;

  var newStates = normalizeStates(changes[STATES_KEY].newValue);
  allStates = newStates;
  updateUI(isHostEnabled(allStates, currentHostname), true);
});

loadAndUpdateUI();
