var domainUtils = PageScrollMasterDomain;
var STORAGE_KEYS = domainUtils.STORAGE_KEYS;

var extensionToggleEl = document.getElementById('extensionToggle');
var featureToggleEls = {
  progressBar: document.getElementById('progressBarToggle'),
  scrollBookmarks: document.getElementById('scrollBookmarksToggle'),
  outlineNavigation: document.getElementById('outlineNavigationToggle')
};
var currentSiteEl = document.getElementById('currentSite');
var unavailableEl = document.getElementById('unavailableMessage');
var settingsBtn = document.getElementById('openSettings');
var currentDomainKey = '';
var currentTabId = null;
var domainFeatureStates = {};
var domainFeatureDefaults = domainUtils.normalizeDefaults();
var ignoreChanges = false;
var pendingLocalChange = false;

var popupTranslations = {
  'zh-CN': {
    'popupSettings': '打开设置',
    'popupEnableToggle': '在此主域名启用插件',
    'popupCurrentSite': '当前网站：',
    'popupAdvancedFeatures': '高级功能',
    'popupProgressBar': '页面进度条',
    'popupScrollBookmarks': '滚动位置书签',
    'popupOutlineNavigation': '智能段落跳转',
    'popupUnavailable': '当前页面不支持扩展功能控制'
  },
  'en-US': {
    'popupSettings': 'Open settings',
    'popupEnableToggle': 'Enable extension on this domain',
    'popupCurrentSite': 'Current site: ',
    'popupAdvancedFeatures': 'Advanced features',
    'popupProgressBar': 'Page progress bar',
    'popupScrollBookmarks': 'Scroll position bookmarks',
    'popupOutlineNavigation': 'Smart section navigation',
    'popupUnavailable': 'Extension controls are unavailable on this page'
  },
  'es-ES': {
    'popupSettings': 'Abrir configuración',
    'popupEnableToggle': 'Activar extensión en este dominio',
    'popupCurrentSite': 'Sitio actual: ',
    'popupAdvancedFeatures': 'Funciones avanzadas',
    'popupProgressBar': 'Barra de progreso',
    'popupScrollBookmarks': 'Marcadores de posición',
    'popupOutlineNavigation': 'Navegación por secciones',
    'popupUnavailable': 'Los controles no están disponibles en esta página'
  },
  'ja-JP': {
    'popupSettings': '設定を開く',
    'popupEnableToggle': 'このドメインで拡張機能を有効化',
    'popupCurrentSite': '現在のサイト：',
    'popupAdvancedFeatures': '高度な機能',
    'popupProgressBar': 'ページ進捗バー',
    'popupScrollBookmarks': 'スクロール位置ブックマーク',
    'popupOutlineNavigation': 'スマートセクション移動',
    'popupUnavailable': 'このページでは拡張機能を制御できません'
  },
  'de-DE': {
    'popupSettings': 'Einstellungen öffnen',
    'popupEnableToggle': 'Erweiterung für diese Domain aktivieren',
    'popupCurrentSite': 'Aktuelle Website: ',
    'popupAdvancedFeatures': 'Erweiterte Funktionen',
    'popupProgressBar': 'Seitenfortschritt',
    'popupScrollBookmarks': 'Scrollpositions-Lesezeichen',
    'popupOutlineNavigation': 'Abschnittsnavigation',
    'popupUnavailable': 'Steuerung auf dieser Seite nicht verfügbar'
  },
  'fr-FR': {
    'popupSettings': 'Ouvrir les paramètres',
    'popupEnableToggle': 'Activer l’extension sur ce domaine',
    'popupCurrentSite': 'Site actuel : ',
    'popupAdvancedFeatures': 'Fonctions avancées',
    'popupProgressBar': 'Progression de page',
    'popupScrollBookmarks': 'Marque-pages de position',
    'popupOutlineNavigation': 'Navigation par sections',
    'popupUnavailable': 'Commandes indisponibles sur cette page'
  },
  'pt-BR': {
    'popupSettings': 'Abrir configurações',
    'popupEnableToggle': 'Ativar extensão neste domínio',
    'popupCurrentSite': 'Site atual: ',
    'popupAdvancedFeatures': 'Recursos avançados',
    'popupProgressBar': 'Progresso da página',
    'popupScrollBookmarks': 'Favoritos de posição',
    'popupOutlineNavigation': 'Navegação por seções',
    'popupUnavailable': 'Controles indisponíveis nesta página'
  },
  'zh-TW': {
    'popupSettings': '開啟設定',
    'popupEnableToggle': '在此主網域啟用外掛',
    'popupCurrentSite': '目前網站：',
    'popupAdvancedFeatures': '進階功能',
    'popupProgressBar': '頁面進度條',
    'popupScrollBookmarks': '捲動位置書籤',
    'popupOutlineNavigation': '智慧段落跳轉',
    'popupUnavailable': '目前頁面不支援外掛功能控制'
  },
  'ko-KR': {
    'popupSettings': '설정 열기',
    'popupEnableToggle': '이 도메인에서 확장 프로그램 사용',
    'popupCurrentSite': '현재 사이트: ',
    'popupAdvancedFeatures': '고급 기능',
    'popupProgressBar': '페이지 진행률 표시줄',
    'popupScrollBookmarks': '스크롤 위치 북마크',
    'popupOutlineNavigation': '스마트 구간 이동',
    'popupUnavailable': '이 페이지에서는 확장 기능을 제어할 수 없습니다'
  },
  'it-IT': {
    'popupSettings': 'Apri impostazioni',
    'popupEnableToggle': 'Attiva l’estensione su questo dominio',
    'popupCurrentSite': 'Sito corrente: ',
    'popupAdvancedFeatures': 'Funzioni avanzate',
    'popupProgressBar': 'Progresso pagina',
    'popupScrollBookmarks': 'Segnalibri posizione',
    'popupOutlineNavigation': 'Navigazione sezioni',
    'popupUnavailable': 'Controlli non disponibili in questa pagina'
  }
};

function normalizeLanguage(browserLang) {
  var lang = (browserLang || '').toLowerCase();
  if (lang === 'zh-tw' || lang === 'zh-hk' || lang.indexOf('zh-hant') === 0) return 'zh-TW';
  if (lang.indexOf('zh') === 0) return 'zh-CN';
  if (lang.indexOf('en') === 0) return 'en-US';
  if (lang.indexOf('es') === 0) return 'es-ES';
  if (lang.indexOf('ja') === 0) return 'ja-JP';
  if (lang.indexOf('de') === 0) return 'de-DE';
  if (lang.indexOf('fr') === 0) return 'fr-FR';
  if (lang.indexOf('pt') === 0) return 'pt-BR';
  if (lang.indexOf('ko') === 0) return 'ko-KR';
  if (lang.indexOf('it') === 0) return 'it-IT';
  return 'en-US';
}

function getCurrentLanguage(callback) {
  function resolveFromBrowser() {
    callback(normalizeLanguage(navigator.language || navigator.userLanguage || 'en-US'));
  }
  if (!chrome.storage || !chrome.storage.sync || !chrome.storage.sync.get) {
    resolveFromBrowser();
    return;
  }
  chrome.storage.sync.get('language', function (result) {
    if (chrome.runtime.lastError || !result.language || result.language === 'auto') {
      resolveFromBrowser();
      return;
    }
    callback(result.language);
  });
}

function applyI18n() {
  getCurrentLanguage(function (lang) {
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var key = el.dataset.i18n;
      var message = popupTranslations[lang] && popupTranslations[lang][key];
      if (!message && chrome.i18n && chrome.i18n.getMessage) {
        message = chrome.i18n.getMessage(key);
      }
      if (message) el.textContent = message;
    });
  });
}

function setControlsDisabled(disabled) {
  extensionToggleEl.disabled = disabled;
  Object.keys(featureToggleEls).forEach(function (key) {
    featureToggleEls[key].disabled = disabled || !extensionToggleEl.checked;
  });
}

function renderState(state, canEdit) {
  ignoreChanges = true;
  extensionToggleEl.checked = state.extensionEnabled;
  Object.keys(featureToggleEls).forEach(function (key) {
    featureToggleEls[key].checked = state.features[key];
  });
  ignoreChanges = false;
  setControlsDisabled(!canEdit);
}

function showUnavailable() {
  currentSiteEl.style.display = 'none';
  unavailableEl.style.display = 'block';
  renderState(domainUtils.normalizeState(null, domainFeatureDefaults), false);
}

function notifyCurrentTab(state) {
  if (!currentTabId || !chrome.tabs || !chrome.tabs.sendMessage) return;
  chrome.tabs.sendMessage(currentTabId, {
    action: 'updateDomainFeatureState',
    domainKey: currentDomainKey,
    state: state
  }, function () {
    if (chrome.runtime.lastError) return;
  });
}

function recordAnalyticsToggle(feature, enabled) {
  if (!chrome.runtime || typeof chrome.runtime.sendMessage !== 'function') return;
  chrome.runtime.sendMessage({
    action: 'analytics:recordToggle',
    feature: feature,
    enabled: enabled === true,
    source: 'popup'
  }, function () {
    if (chrome.runtime.lastError) return;
  });
}

function persistCurrentState(nextState, analyticsChange) {
  if (!currentDomainKey) return;
  pendingLocalChange = true;
  chrome.storage.local.get([STORAGE_KEYS.states], function (result) {
    var latestStates = domainUtils.normalizeStates(result[STORAGE_KEYS.states], domainFeatureDefaults);
    domainFeatureStates = domainUtils.updateState(
      latestStates,
      currentDomainKey,
      nextState,
      domainFeatureDefaults
    );
    var data = {};
    data[STORAGE_KEYS.states] = domainFeatureStates;
    chrome.storage.local.set(data, function () {
      pendingLocalChange = false;
      if (chrome.runtime.lastError) return;
      if (analyticsChange) {
        recordAnalyticsToggle(analyticsChange.feature, analyticsChange.enabled);
      }
      notifyCurrentTab(domainUtils.getState(domainFeatureStates, currentDomainKey, domainFeatureDefaults));
    });
  });
}

function readStateFromControls() {
  return domainUtils.normalizeState({
    extensionEnabled: extensionToggleEl.checked,
    features: {
      progressBar: featureToggleEls.progressBar.checked,
      scrollBookmarks: featureToggleEls.scrollBookmarks.checked,
      outlineNavigation: featureToggleEls.outlineNavigation.checked
    }
  }, domainFeatureDefaults);
}

function handleControlChange(feature) {
  if (ignoreChanges || !currentDomainKey) return;
  setControlsDisabled(false);
  var state = readStateFromControls();
  persistCurrentState(state, {
    feature: feature,
    enabled: feature === 'extension'
      ? state.extensionEnabled
      : state.features[feature]
  });
}

function loadStorageAndRender() {
  var localKeys = [
    STORAGE_KEYS.states,
    STORAGE_KEYS.defaults,
    STORAGE_KEYS.migrationVersion,
    STORAGE_KEYS.legacyStates
  ];
  chrome.storage.sync.get(['advancedSettings'], function (syncResult) {
    chrome.storage.local.get(localKeys, function (localResult) {
      var migration = domainUtils.migrateStorage(localResult, syncResult.advancedSettings);
      domainFeatureStates = migration.states;
      domainFeatureDefaults = migration.defaults;
      var finish = function () {
        renderState(
          domainUtils.getState(domainFeatureStates, currentDomainKey, domainFeatureDefaults),
          true
        );
      };
      if (!migration.needsWrite) {
        finish();
        return;
      }
      pendingLocalChange = true;
      chrome.storage.local.set(domainUtils.toStorageData(migration), function () {
        pendingLocalChange = false;
        finish();
      });
    });
  });
}

function loadPopup() {
  setControlsDisabled(true);
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    var tab = tabs[0];
    currentDomainKey = tab && tab.url ? domainUtils.getDomainKey(tab.url) : '';
    currentTabId = tab && tab.id ? tab.id : null;
    if (!currentDomainKey) {
      showUnavailable();
      return;
    }
    currentSiteEl.textContent = currentDomainKey;
    currentSiteEl.style.display = 'block';
    unavailableEl.style.display = 'none';
    loadStorageAndRender();
  });
}

extensionToggleEl.addEventListener('change', function () {
  handleControlChange('extension');
});
Object.keys(featureToggleEls).forEach(function (key) {
  featureToggleEls[key].addEventListener('change', function () {
    handleControlChange(key);
  });
});
settingsBtn.addEventListener('click', function () {
  chrome.runtime.openOptionsPage();
});

chrome.storage.onChanged.addListener(function (changes, namespace) {
  if (namespace !== 'local' || pendingLocalChange || !currentDomainKey) return;
  if (changes[STORAGE_KEYS.defaults]) {
    domainFeatureDefaults = domainUtils.normalizeDefaults(changes[STORAGE_KEYS.defaults].newValue);
  }
  if (changes[STORAGE_KEYS.states]) {
    domainFeatureStates = domainUtils.normalizeStates(
      changes[STORAGE_KEYS.states].newValue,
      domainFeatureDefaults
    );
  }
  if (changes[STORAGE_KEYS.defaults] || changes[STORAGE_KEYS.states]) {
    renderState(
      domainUtils.getState(domainFeatureStates, currentDomainKey, domainFeatureDefaults),
      true
    );
  }
});

applyI18n();
loadPopup();
