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
  ['zh-TW', 'zh-CN'],
  ['es-MX', 'es-ES'],
  ['ja-JP', 'ja-JP'],
  ['fr-FR', 'en-US']
];

cases.forEach(([input, expected]) => {
  assert(optionsContext.normalizeLanguage(input) === expected, `options normalizeLanguage(${input}) -> ${expected}`);
  assert(popupContext.normalizeLanguage(input) === expected, `popup normalizeLanguage(${input}) -> ${expected}`);
});

assert(optionsContext.__translations['es-ES'], 'options translations include Spanish');
assert(optionsContext.__translations['ja-JP'], 'options translations include Japanese');
assert(popupContext.popupTranslations['es-ES'], 'popup translations include Spanish');
assert(popupContext.popupTranslations['ja-JP'], 'popup translations include Japanese');

console.log('language normalization tests passed');
