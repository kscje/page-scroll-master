const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { getSharedRuntimeSource } = require('./runtime-loader');
const ROOT = path.join(__dirname, '..');

function createOptionsContext() {
  const sandbox = {
    console,
    URL,
    navigator: { language: 'en-US', platform: 'MacIntel', userAgent: 'Chrome' },
    setTimeout() {},
    clearTimeout() {},
    requestAnimationFrame() {},
    window: { scrollTo() {}, addEventListener() {}, document: null },
    document: {
      addEventListener() {},
      getElementById() { return null; },
      querySelectorAll() { return []; },
      createElement() { return { style: {}, appendChild() {}, addEventListener() {} }; },
      head: { appendChild() {} },
      documentElement: { scrollHeight: 1000 }
    },
    chrome: {
      storage: {
        sync: { get(keys, callback) { callback({}); }, set(data, callback) { if (callback) callback(); } },
        local: { get(keys, callback) { callback({}); }, set(data, callback) { if (callback) callback(); } }
      },
      tabs: { query(queryInfo, callback) { callback([]); }, sendMessage() {} },
      runtime: { lastError: null }
    }
  };
  sandbox.window.document = sandbox.document;
  vm.runInNewContext(
    getSharedRuntimeSource(ROOT, path.join(ROOT, 'options.js')) + '\n' +
      fs.readFileSync(path.join(ROOT, 'options.js'), 'utf8') +
      '\nthis.__translations = translations;' +
      '\nthis.__releaseNotes = RELEASE_NOTES;' +
      '\nthis.__releaseNotesTranslations = releaseNotesTranslations;',
    sandbox,
    { filename: 'options.js' }
  );
  return sandbox;
}

function createPopupContext() {
  const elements = {
    extensionToggle: { addEventListener() {}, checked: false, disabled: false },
    progressBarToggle: { addEventListener() {}, checked: false, disabled: false },
    autoScrollToggle: { addEventListener() {}, checked: false, disabled: false },
    screenNavigationToggle: { addEventListener() {}, checked: false, disabled: false },
    scrollBookmarksToggle: { addEventListener() {}, checked: false, disabled: false },
    outlineNavigationToggle: { addEventListener() {}, checked: false, disabled: false },
    currentSite: { textContent: '', style: {} },
    unavailableMessage: { textContent: '', style: {} },
    openSettings: { addEventListener() {} },
    ratingPrompt: { classList: { add() {}, remove() {}, contains() { return false; } } },
    ratingPromptRate: { addEventListener() {} },
    ratingPromptLater: { addEventListener() {} },
    ratingPromptNever: { addEventListener() {} }
  };
  const sandbox = {
    console,
    URL,
    Boolean,
    Object,
    Array,
    navigator: { language: 'en-US' },
    document: {
      getElementById(id) { return elements[id]; },
      querySelectorAll() { return []; }
    },
    chrome: {
      storage: {
        sync: { get(key, callback) { callback({}); } },
        local: {
          get(keys, callback) { callback({}); },
          set(data, callback) { if (callback) callback(); }
        },
        onChanged: { addListener() {} }
      },
      runtime: { lastError: null, openOptionsPage() {}, getManifest() { return { version: '2.5.0' }; } },
      tabs: {
        query(queryInfo, callback) { callback([]); },
        sendMessage(tabId, message, callback) { if (callback) callback(); }
      },
      i18n: { getMessage() { return ''; } }
    }
  };
  const popupPath = path.join(ROOT, 'popup.js');
  vm.runInNewContext(
    getSharedRuntimeSource(ROOT, popupPath) + '\n' + fs.readFileSync(popupPath, 'utf8'),
    sandbox,
    { filename: 'popup.js' }
  );
  return sandbox;
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

const optionsContext = createOptionsContext();
const popupContext = createPopupContext();
const cases = [
  ['zh-CN', 'zh-CN'],
  ['zh-TW', 'zh-TW'],
  ['zh-HK', 'zh-TW'],
  ['zh-Hant', 'zh-TW'],
  ['es-MX', 'es-ES'],
  ['ja-JP', 'ja-JP'],
  ['de-DE', 'de-DE'],
  ['fr-CA', 'fr-FR'],
  ['pt-PT', 'pt-BR'],
  ['ko-KR', 'ko-KR'],
  ['it-IT', 'it-IT'],
  ['ru-RU', 'ru-RU'],
  ['ru-UA', 'ru-RU'],
  ['tr-TR', 'tr-TR'],
  ['id-ID', 'id-ID'],
  ['id', 'id-ID']
];

cases.forEach(([input, expected]) => {
  assert(optionsContext.normalizeLanguage(input) === expected, `options normalizeLanguage(${input}) -> ${expected}`);
  assert(popupContext.normalizeLanguage(input) === expected, `popup normalizeLanguage(${input}) -> ${expected}`);
});

assert(optionsContext.__translations['es-ES'], 'options translations include Spanish');
assert(optionsContext.__translations['ja-JP'], 'options translations include Japanese');
assert(optionsContext.__translations['de-DE'], 'options translations include German');
assert(optionsContext.__translations['fr-FR'], 'options translations include French');
assert(optionsContext.__translations['pt-BR'], 'options translations include Portuguese');
assert(optionsContext.__translations['zh-TW'], 'options translations include Traditional Chinese');
assert(optionsContext.__translations['ko-KR'], 'options translations include Korean');
assert(optionsContext.__translations['it-IT'], 'options translations include Italian');
assert(optionsContext.__translations['ru-RU'], 'options translations include Russian');
assert(optionsContext.__translations['tr-TR'], 'options translations include Turkish');
assert(optionsContext.__translations['id-ID'], 'options translations include Indonesian');
assert(popupContext.popupTranslations['es-ES'], 'popup translations include Spanish');
assert(popupContext.popupTranslations['ja-JP'], 'popup translations include Japanese');
assert(popupContext.popupTranslations['de-DE'], 'popup translations include German');
assert(popupContext.popupTranslations['fr-FR'], 'popup translations include French');
assert(popupContext.popupTranslations['pt-BR'], 'popup translations include Portuguese');
assert(popupContext.popupTranslations['zh-TW'], 'popup translations include Traditional Chinese');
assert(popupContext.popupTranslations['ko-KR'], 'popup translations include Korean');
assert(popupContext.popupTranslations['it-IT'], 'popup translations include Italian');
assert(popupContext.popupTranslations['ru-RU'], 'popup translations include Russian');
assert(popupContext.popupTranslations['tr-TR'], 'popup translations include Turkish');
assert(popupContext.popupTranslations['id-ID'], 'popup translations include Indonesian');

const expectedOptionLanguages = ['zh-CN', 'zh-TW', 'en-US', 'es-ES', 'ja-JP', 'de-DE', 'fr-FR', 'pt-BR', 'ko-KR', 'it-IT', 'ru-RU', 'tr-TR', 'id-ID'];
const expectedButtonColorLabels = {
  'zh-CN': '按钮颜色',
  'zh-TW': '按鈕顏色',
  'en-US': 'Button color',
  'es-ES': 'Color del botón',
  'ja-JP': 'ボタンの色',
  'de-DE': 'Schaltflächenfarbe',
  'fr-FR': 'Couleur du bouton',
  'pt-BR': 'Cor do botão',
  'ko-KR': '버튼 색상',
  'it-IT': 'Colore del pulsante',
  'ru-RU': 'Цвет кнопки',
  'tr-TR': 'Düğme rengi',
  'id-ID': 'Warna tombol'
};
const englishOptionKeys = Object.keys(optionsContext.__translations['en-US']).sort();
const outlineTranslationKeys = [
  'settings.outlineNavigationEnabled',
  'settings.outlineSources',
  'settings.outlineSourceH1',
  'settings.outlineSourceH2',
  'settings.outlineSourceH3',
  'settings.outlineSourceIdBlocks',
  'settings.outlineSourcesReset',
  'settings.outlineMaxItems',
  'settings.outlineMaxItemsError',
  'settings.outlineFilterShortHeadings',
  'settings.outlineHighlightCurrentSection'
];
const onboardingTranslationKeys = [
  'settings.onboardingTitle',
  'settings.onboardingIntro',
  'settings.onboardingCoreTitle',
  'settings.onboardingCoreDescription',
  'settings.onboardingPopupTitle',
  'settings.onboardingPopupDescription',
  'settings.onboardingSiteControlsTitle',
  'settings.onboardingSiteControlsDescription',
  'settings.onboardingFeatureExtension',
  'settings.onboardingFeatureProgress',
  'settings.onboardingFeatureBookmarks',
  'settings.onboardingFeatureOutline',
  'settings.onboardingPrivacyTitle',
  'settings.onboardingPrivacyDescription',
  'settings.onboardingPrivacyOff',
  'settings.onboardingDismiss',
  'settings.onboardingReopen'
];
expectedOptionLanguages.forEach((lang) => {
  const keys = Object.keys(optionsContext.__translations[lang]).sort();
  assert(JSON.stringify(keys) === JSON.stringify(englishOptionKeys), `${lang} options translation keys match English`);
  assert(
    !/feedback|回饋|反馈|フィードバック|피드백/i.test(
      optionsContext.__translations[lang]['settings.tab.feedback']
    ),
    `${lang} suggestions tab title refers to about information instead of feedback`
  );
  assert(
    optionsContext.__translations[lang]['settings.progressColorMode'] === expectedButtonColorLabels[lang] &&
      optionsContext.__translations[lang]['settings.readingToolCustomColor'] === expectedButtonColorLabels[lang],
    `${lang} uses the button color label for advanced feature colors`
  );
  outlineTranslationKeys.forEach((key) => {
    assert(
      Object.prototype.hasOwnProperty.call(optionsContext.__translations[lang], key),
      `${lang} explicitly defines ${key}`
    );
  });
  onboardingTranslationKeys.forEach((key) => {
    assert(
      typeof optionsContext.__translations[lang][key] === 'string' &&
      optionsContext.__translations[lang][key].trim(),
      `${lang} defines onboarding copy for ${key}`
    );
  });

  const releaseText = optionsContext.__releaseNotesTranslations[lang];
  assert(releaseText, `${lang} release notes exist`);
  assert(
    JSON.stringify(Object.keys(releaseText.categories).sort()) ===
      JSON.stringify(['added', 'fixed', 'improved']),
    `${lang} release notes use only the supported categories`
  );
  const releaseItemKeys = optionsContext.__releaseNotes
    .flatMap((release) => Object.values(release.categories).flat())
    .sort();
  assert(
    releaseItemKeys.every((key) => typeof releaseText.items[key] === 'string' && releaseText.items[key].trim()),
    `${lang} release-note items are complete`
  );
});

assert(optionsContext.__releaseNotes[0].version === '2.5.3', 'release notes are ordered newest first');
assert(
  optionsContext.__releaseNotes[optionsContext.__releaseNotes.length - 1].version === '1.8.0',
  'release notes start at v1.8'
);

const localeRoot = path.join(ROOT, '_locales');
const expectedLocaleDirCount = expectedOptionLanguages.length;
const localeDirs = fs.readdirSync(localeRoot)
  .filter((dir) => fs.existsSync(path.join(localeRoot, dir, 'messages.json')))
  .sort();
assert(
  localeDirs.length === expectedLocaleDirCount,
  `_locales contains ${expectedLocaleDirCount} message dirs`
);
assert(localeDirs.includes('en'), 'English locale file exists');
const englishLocale = JSON.parse(fs.readFileSync(path.join(localeRoot, 'en', 'messages.json'), 'utf8'));
const englishKeys = Object.keys(englishLocale).sort();

localeDirs.filter((dir) => dir !== 'en').forEach((localeDir) => {
  const localePath = path.join(localeRoot, localeDir, 'messages.json');
  assert(fs.existsSync(localePath), `${localeDir} locale file exists`);
  const locale = JSON.parse(fs.readFileSync(localePath, 'utf8'));
  const localeKeys = Object.keys(locale).sort();
  assert(JSON.stringify(localeKeys) === JSON.stringify(englishKeys), `${localeDir} locale keys match English`);
});

console.log('language normalization tests passed');
