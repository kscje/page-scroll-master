var domainUtils = PageScrollMasterDomain;
var STORAGE_KEYS = domainUtils.STORAGE_KEYS;
var ratingUtils = PageScrollMasterRating;

var extensionToggleEl = document.getElementById('extensionToggle');
var featureToggleEls = {
  autoScroll: document.getElementById('autoScrollToggle'),
  progressBar: document.getElementById('progressBarToggle'),
  screenNavigation: document.getElementById('screenNavigationToggle'),
  scrollBookmarks: document.getElementById('scrollBookmarksToggle'),
  outlineNavigation: document.getElementById('outlineNavigationToggle')
};
var currentSiteEl = document.getElementById('currentSite');
var unavailableEl = document.getElementById('unavailableMessage');
var settingsBtn = document.getElementById('openSettings');
var ratingPromptEl = document.getElementById('ratingPrompt');
var ratingRateBtn = document.getElementById('ratingPromptRate');
var ratingLaterBtn = document.getElementById('ratingPromptLater');
var ratingNeverBtn = document.getElementById('ratingPromptNever');
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
    'popupAutoScroll': '自动滚屏',
    'popupProgressBar': '页面进度条',
    'popupScreenNavigation': '按屏跳转',
    'popupScrollBookmarks': '滚动位置书签',
    'popupOutlineNavigation': '智能段落跳转',
    'popupUnavailable': '当前页面不支持扩展功能控制',
    'popupRatingPromptText': '如果这个插件帮到了你，欢迎在 Chrome Web Store 给我们评分。',
    'popupRatingPromptRate': '去评分',
    'popupRatingPromptLater': '稍后再说',
    'popupRatingPromptNever': '不再提示'
  },
  'en-US': {
    'popupSettings': 'Open settings',
    'popupEnableToggle': 'Enable extension on this domain',
    'popupCurrentSite': 'Current site: ',
    'popupAdvancedFeatures': 'Advanced features',
    'popupAutoScroll': 'Auto scroll',
    'popupProgressBar': 'Page progress bar',
    'popupScreenNavigation': 'Previous/next screen',
    'popupScrollBookmarks': 'Scroll position bookmarks',
    'popupOutlineNavigation': 'Smart section navigation',
    'popupUnavailable': 'Extension controls are unavailable on this page',
    'popupRatingPromptText': 'If this extension has helped you, you are welcome to rate it on the Chrome Web Store.',
    'popupRatingPromptRate': 'Rate',
    'popupRatingPromptLater': 'Later',
    'popupRatingPromptNever': 'Do not show again'
  },
  'es-ES': {
    'popupSettings': 'Abrir configuración',
    'popupEnableToggle': 'Activar extensión en este dominio',
    'popupCurrentSite': 'Sitio actual: ',
    'popupAdvancedFeatures': 'Funciones avanzadas',
    'popupAutoScroll': 'Desplazamiento automático',
    'popupProgressBar': 'Barra de progreso',
    'popupScreenNavigation': 'Pantalla anterior/siguiente',
    'popupScrollBookmarks': 'Marcadores de posición',
    'popupOutlineNavigation': 'Navegación por secciones',
    'popupUnavailable': 'Los controles no están disponibles en esta página',
    'popupRatingPromptText': 'Si esta extensión te ha ayudado, puedes valorarla en Chrome Web Store.',
    'popupRatingPromptRate': 'Valorar',
    'popupRatingPromptLater': 'Más tarde',
    'popupRatingPromptNever': 'No mostrar más'
  },
  'ja-JP': {
    'popupSettings': '設定を開く',
    'popupEnableToggle': 'このドメインで拡張機能を有効化',
    'popupCurrentSite': '現在のサイト：',
    'popupAdvancedFeatures': '高度な機能',
    'popupAutoScroll': '自動スクロール',
    'popupProgressBar': 'ページ進捗バー',
    'popupScreenNavigation': '前後の画面へ移動',
    'popupScrollBookmarks': 'スクロール位置ブックマーク',
    'popupOutlineNavigation': 'スマートセクション移動',
    'popupUnavailable': 'このページでは拡張機能を制御できません',
    'popupRatingPromptText': 'この拡張機能がお役に立った場合は、Chrome ウェブストアで評価できます。',
    'popupRatingPromptRate': '評価する',
    'popupRatingPromptLater': '後で',
    'popupRatingPromptNever': '今後表示しない'
  },
  'de-DE': {
    'popupSettings': 'Einstellungen öffnen',
    'popupEnableToggle': 'Erweiterung für diese Domain aktivieren',
    'popupCurrentSite': 'Aktuelle Website: ',
    'popupAdvancedFeatures': 'Erweiterte Funktionen',
    'popupAutoScroll': 'Automatisches Scrollen',
    'popupProgressBar': 'Seitenfortschritt',
    'popupScreenNavigation': 'Vorheriger/nächster Bildschirm',
    'popupScrollBookmarks': 'Scrollpositions-Lesezeichen',
    'popupOutlineNavigation': 'Abschnittsnavigation',
    'popupUnavailable': 'Steuerung auf dieser Seite nicht verfügbar',
    'popupRatingPromptText': 'Wenn diese Erweiterung Ihnen geholfen hat, können Sie sie im Chrome Web Store bewerten.',
    'popupRatingPromptRate': 'Bewerten',
    'popupRatingPromptLater': 'Später',
    'popupRatingPromptNever': 'Nicht mehr anzeigen'
  },
  'fr-FR': {
    'popupSettings': 'Ouvrir les paramètres',
    'popupEnableToggle': 'Activer l’extension sur ce domaine',
    'popupCurrentSite': 'Site actuel : ',
    'popupAdvancedFeatures': 'Fonctions avancées',
    'popupAutoScroll': 'Défilement automatique',
    'popupProgressBar': 'Progression de page',
    'popupScreenNavigation': 'Écran précédent/suivant',
    'popupScrollBookmarks': 'Marque-pages de position',
    'popupOutlineNavigation': 'Navigation par sections',
    'popupUnavailable': 'Commandes indisponibles sur cette page',
    'popupRatingPromptText': 'Si cette extension vous a aidé, vous pouvez la noter sur le Chrome Web Store.',
    'popupRatingPromptRate': 'Noter',
    'popupRatingPromptLater': 'Plus tard',
    'popupRatingPromptNever': 'Ne plus afficher'
  },
  'pt-BR': {
    'popupSettings': 'Abrir configurações',
    'popupEnableToggle': 'Ativar extensão neste domínio',
    'popupCurrentSite': 'Site atual: ',
    'popupAdvancedFeatures': 'Recursos avançados',
    'popupAutoScroll': 'Rolagem automática',
    'popupProgressBar': 'Progresso da página',
    'popupScreenNavigation': 'Tela anterior/seguinte',
    'popupScrollBookmarks': 'Favoritos de posição',
    'popupOutlineNavigation': 'Navegação por seções',
    'popupUnavailable': 'Controles indisponíveis nesta página',
    'popupRatingPromptText': 'Se esta extensão ajudou você, sinta-se à vontade para avaliá-la na Chrome Web Store.',
    'popupRatingPromptRate': 'Avaliar',
    'popupRatingPromptLater': 'Depois',
    'popupRatingPromptNever': 'Não mostrar novamente'
  },
  'zh-TW': {
    'popupSettings': '開啟設定',
    'popupEnableToggle': '在此主網域啟用外掛',
    'popupCurrentSite': '目前網站：',
    'popupAdvancedFeatures': '進階功能',
    'popupAutoScroll': '自動捲動',
    'popupProgressBar': '頁面進度條',
    'popupScreenNavigation': '上一屏／下一屏',
    'popupScrollBookmarks': '捲動位置書籤',
    'popupOutlineNavigation': '智慧段落跳轉',
    'popupUnavailable': '目前頁面不支援外掛功能控制',
    'popupRatingPromptText': '如果這個外掛幫到了你，歡迎在 Chrome Web Store 給我們評分。',
    'popupRatingPromptRate': '去評分',
    'popupRatingPromptLater': '稍後再說',
    'popupRatingPromptNever': '不再提示'
  },
  'ko-KR': {
    'popupSettings': '설정 열기',
    'popupEnableToggle': '이 도메인에서 확장 프로그램 사용',
    'popupCurrentSite': '현재 사이트: ',
    'popupAdvancedFeatures': '고급 기능',
    'popupAutoScroll': '자동 스크롤',
    'popupProgressBar': '페이지 진행률 표시줄',
    'popupScreenNavigation': '이전/다음 화면',
    'popupScrollBookmarks': '스크롤 위치 북마크',
    'popupOutlineNavigation': '스마트 구간 이동',
    'popupUnavailable': '이 페이지에서는 확장 기능을 제어할 수 없습니다',
    'popupRatingPromptText': '이 확장 프로그램이 도움이 되었다면 Chrome 웹 스토어에서 평가해 주세요.',
    'popupRatingPromptRate': '평가하기',
    'popupRatingPromptLater': '나중에',
    'popupRatingPromptNever': '다시 표시 안 함'
  },
  'it-IT': {
    'popupSettings': 'Apri impostazioni',
    'popupEnableToggle': 'Attiva l’estensione su questo dominio',
    'popupCurrentSite': 'Sito corrente: ',
    'popupAdvancedFeatures': 'Funzioni avanzate',
    'popupAutoScroll': 'Scorrimento automatico',
    'popupProgressBar': 'Progresso pagina',
    'popupScreenNavigation': 'Schermata precedente/successiva',
    'popupScrollBookmarks': 'Segnalibri posizione',
    'popupOutlineNavigation': 'Navigazione sezioni',
    'popupUnavailable': 'Controlli non disponibili in questa pagina',
    'popupRatingPromptText': 'Se questa estensione ti è stata utile, puoi valutarla sul Chrome Web Store.',
    'popupRatingPromptRate': 'Valuta',
    'popupRatingPromptLater': 'Più tardi',
    'popupRatingPromptNever': 'Non mostrare più'
  },
  'ru-RU': {
    'popupSettings': 'Открыть настройки',
    'popupEnableToggle': 'Включить расширение для этого домена',
    'popupCurrentSite': 'Текущий сайт: ',
    'popupAdvancedFeatures': 'Дополнительные функции',
    'popupAutoScroll': 'Автопрокрутка',
    'popupProgressBar': 'Индикатор прогресса',
    'popupScreenNavigation': 'Предыдущий/следующий экран',
    'popupScrollBookmarks': 'Закладки позиции',
    'popupOutlineNavigation': 'Навигация по разделам',
    'popupUnavailable': 'Управление расширением недоступно на этой странице',
    'popupRatingPromptText': 'Если расширение вам помогло, вы можете оценить его в Chrome Web Store.',
    'popupRatingPromptRate': 'Оценить',
    'popupRatingPromptLater': 'Позже',
    'popupRatingPromptNever': 'Больше не показывать'
  },
  'tr-TR': {
    'popupSettings': 'Ayarları aç',
    'popupEnableToggle': 'Bu alan adında uzantıyı etkinleştir',
    'popupCurrentSite': 'Geçerli site: ',
    'popupAdvancedFeatures': 'Gelişmiş özellikler',
    'popupAutoScroll': 'Otomatik kaydırma',
    'popupProgressBar': 'Sayfa ilerleme çubuğu',
    'popupScreenNavigation': 'Önceki/sonraki ekran',
    'popupScrollBookmarks': 'Kaydırma konumu yer imleri',
    'popupOutlineNavigation': 'Akıllı bölüm gezintisi',
    'popupUnavailable': 'Bu sayfada uzantı kontrolleri kullanılamaz',
    'popupRatingPromptText': 'Bu uzantı size yardımcı olduysa Chrome Web Store’da puan verebilirsiniz.',
    'popupRatingPromptRate': 'Puan ver',
    'popupRatingPromptLater': 'Daha sonra',
    'popupRatingPromptNever': 'Bir daha gösterme'
  },
  'id-ID': {
    'popupSettings': 'Buka pengaturan',
    'popupEnableToggle': 'Aktifkan ekstensi di domain ini',
    'popupCurrentSite': 'Situs saat ini: ',
    'popupAdvancedFeatures': 'Fitur lanjutan',
    'popupAutoScroll': 'Gulir otomatis',
    'popupProgressBar': 'Bilah progres halaman',
    'popupScreenNavigation': 'Layar sebelumnya/berikutnya',
    'popupScrollBookmarks': 'Bookmark posisi gulir',
    'popupOutlineNavigation': 'Navigasi bagian pintar',
    'popupUnavailable': 'Kontrol ekstensi tidak tersedia di halaman ini',
    'popupRatingPromptText': 'Jika ekstensi ini membantu Anda, silakan beri rating di Chrome Web Store.',
    'popupRatingPromptRate': 'Beri rating',
    'popupRatingPromptLater': 'Nanti',
    'popupRatingPromptNever': 'Jangan tampilkan lagi'
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
  if (lang.indexOf('ru') === 0) return 'ru-RU';
  if (lang.indexOf('tr') === 0) return 'tr-TR';
  if (lang.indexOf('id') === 0) return 'id-ID';
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
  hideRatingPrompt();
  renderState(domainUtils.normalizeState(null, domainFeatureDefaults), false);
  recordRatingPopupOpen(false);
}

function hideRatingPrompt() {
  if (!ratingPromptEl) return;
  ratingPromptEl.classList.remove('is-visible');
}

function showRatingPrompt(state, version) {
  if (!ratingPromptEl) return;
  ratingPromptEl.classList.add('is-visible');
  ratingUtils.recordShown(state, version, function () {});
}

function recordRatingPopupOpen(domainEnabled) {
  if (!chrome.storage || !chrome.storage.local || !ratingUtils) return;
  ratingUtils.recordPopupOpen(domainEnabled, function (result) {
    if (!result.shouldShow) {
      hideRatingPrompt();
      return;
    }
    showRatingPrompt(result.state, result.version);
  });
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
      autoScroll: featureToggleEls.autoScroll.checked,
      progressBar: featureToggleEls.progressBar.checked,
      screenNavigation: featureToggleEls.screenNavigation.checked,
      scrollBookmarks: featureToggleEls.scrollBookmarks.checked,
      outlineNavigation: featureToggleEls.outlineNavigation.checked
    }
  }, domainFeatureDefaults);
}

function handleControlChange(feature) {
  if (ignoreChanges || !currentDomainKey) return;
  setControlsDisabled(false);
  var state = readStateFromControls();
  persistCurrentState(
    state,
    feature === 'autoScroll' ? null : {
      feature: feature,
      enabled: feature === 'extension'
        ? state.extensionEnabled
        : state.features[feature]
    }
  );
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
        var currentState = domainUtils.getState(domainFeatureStates, currentDomainKey, domainFeatureDefaults);
        renderState(currentState, true);
        recordRatingPopupOpen(currentState.extensionEnabled);
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
if (ratingRateBtn) {
  ratingRateBtn.addEventListener('click', function () {
    ratingUtils.recordRatedClicked(function () {
      hideRatingPrompt();
      chrome.tabs.create({ url: ratingUtils.STORE_REVIEW_URL });
    });
  });
}
if (ratingLaterBtn) {
  ratingLaterBtn.addEventListener('click', function () {
    ratingUtils.remindLater(hideRatingPrompt);
  });
}
if (ratingNeverBtn) {
  ratingNeverBtn.addEventListener('click', function () {
    ratingUtils.neverAsk(hideRatingPrompt);
  });
}

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
