const fs = require('fs');
const path = require('path');
const vm = require('vm');
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
    fs.readFileSync(path.join(ROOT, 'options.js'), 'utf8') + '\nthis.__translations = translations;',
    sandbox,
    { filename: 'options.js' }
  );
  return sandbox;
}

function createPopupContext() {
  const elements = {
    enableToggle: { addEventListener() {}, checked: false, disabled: false },
    toggleLabel: { textContent: '' },
    openSettings: { addEventListener() {} }
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
        local: { get(keys, callback) { callback({}); } },
        onChanged: { addListener() {} }
      },
      runtime: { lastError: null, openOptionsPage() {} },
      tabs: { query(queryInfo, callback) { callback([]); } },
      i18n: { getMessage() { return ''; } }
    }
  };
  vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'popup.js'), 'utf8'), sandbox, { filename: 'popup.js' });
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
  ['ru-RU', 'en-US']
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
assert(popupContext.popupTranslations['es-ES'], 'popup translations include Spanish');
assert(popupContext.popupTranslations['ja-JP'], 'popup translations include Japanese');
assert(popupContext.popupTranslations['de-DE'], 'popup translations include German');
assert(popupContext.popupTranslations['fr-FR'], 'popup translations include French');
assert(popupContext.popupTranslations['pt-BR'], 'popup translations include Portuguese');
assert(popupContext.popupTranslations['zh-TW'], 'popup translations include Traditional Chinese');
assert(popupContext.popupTranslations['ko-KR'], 'popup translations include Korean');
assert(popupContext.popupTranslations['it-IT'], 'popup translations include Italian');

const expectedOptionLanguages = ['zh-CN', 'zh-TW', 'en-US', 'es-ES', 'ja-JP', 'de-DE', 'fr-FR', 'pt-BR', 'ko-KR', 'it-IT'];
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
expectedOptionLanguages.forEach((lang) => {
  const keys = Object.keys(optionsContext.__translations[lang]).sort();
  assert(JSON.stringify(keys) === JSON.stringify(englishOptionKeys), `${lang} options translation keys match English`);
  outlineTranslationKeys.forEach((key) => {
    assert(
      Object.prototype.hasOwnProperty.call(optionsContext.__translations[lang], key),
      `${lang} explicitly defines ${key}`
    );
  });
});

const expectedLocaleDirs = ['de', 'fr', 'pt_BR', 'zh_TW', 'ko', 'it'];
const englishLocale = JSON.parse(fs.readFileSync(path.join(ROOT, '_locales', 'en', 'messages.json'), 'utf8'));
const englishKeys = Object.keys(englishLocale).sort();

expectedLocaleDirs.forEach((localeDir) => {
  const localePath = path.join(ROOT, '_locales', localeDir, 'messages.json');
  assert(fs.existsSync(localePath), `${localeDir} locale file exists`);
  const locale = JSON.parse(fs.readFileSync(localePath, 'utf8'));
  const localeKeys = Object.keys(locale).sort();
  assert(JSON.stringify(localeKeys) === JSON.stringify(englishKeys), `${localeDir} locale keys match English`);
});

console.log('language normalization tests passed');
