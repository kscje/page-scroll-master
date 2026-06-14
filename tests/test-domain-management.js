const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { getSharedRuntimeSource } = require('./runtime-loader');

const ROOT = path.join(__dirname, '..');

function createContext() {
  const localData = {};
  const sandbox = {
    console,
    URL,
    navigator: { language: 'en-US', platform: 'MacIntel', userAgent: 'Chrome' },
    setTimeout(callback) { callback(); return 1; },
    clearTimeout() {},
    requestAnimationFrame(callback) { callback(); return 1; },
    window: { scrollTo() {}, addEventListener() {}, document: null },
    document: {
      addEventListener() {},
      getElementById() { return null; },
      querySelectorAll() { return []; },
      createElement() {
        return {
          style: {},
          children: [],
          appendChild(child) { this.children.push(child); return child; },
          addEventListener() {}
        };
      },
      head: { appendChild() {} },
      documentElement: { scrollHeight: 1000 }
    },
    chrome: {
      storage: {
        sync: {
          get(keys, callback) { callback({}); },
          set(data, callback) { if (callback) callback(); }
        },
        local: {
          get(keys, callback) {
            const result = {};
            keys.forEach((key) => {
              if (localData[key] !== undefined) result[key] = localData[key];
            });
            callback(result);
          },
          set(data, callback) {
            Object.assign(localData, JSON.parse(JSON.stringify(data)));
            if (callback) callback();
          }
        }
      },
      tabs: { query(queryInfo, callback) { callback([]); }, sendMessage() {} },
      runtime: { lastError: null }
    }
  };
  sandbox.window.document = sandbox.document;
  const optionsPath = path.join(ROOT, 'options.js');
  vm.runInNewContext(
    getSharedRuntimeSource(ROOT, optionsPath) + '\n' + fs.readFileSync(optionsPath, 'utf8'),
    sandbox,
    { filename: 'options.js' }
  );
  return { sandbox, localData };
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const { sandbox, localData } = createContext();

assert(sandbox.parseHostnameInput('example.com') === 'example.com', 'bare hostname is accepted');
assert(sandbox.parseHostnameInput('https://docs.example.com/a') === 'example.com', 'subdomain URL resolves to the main domain');
assert(sandbox.parseHostnameInput('http://sub.example.co.uk/path') === 'example.co.uk', 'multi-label public suffix resolves correctly');
assert(sandbox.parseHostnameInput('http://localhost:3000/path') === 'localhost', 'localhost uses the full hostname');
assert(sandbox.parseHostnameInput('chrome://extensions') === '', 'non-http URL is rejected');

sandbox.saveDomainFeatureStates({
  'disabled.example': {
    extensionEnabled: false,
    features: { progressBar: true }
  },
  'enabled.example': {
    extensionEnabled: true,
    features: { scrollBookmarks: true }
  }
});
const remaining = sandbox.clearDisabledSites();
assert(remaining['enabled.example'].extensionEnabled === true, 'clear disabled sites preserves enabled records');
assert(!Object.prototype.hasOwnProperty.call(remaining, 'disabled.example'), 'clear disabled sites removes disabled records');

const restored = sandbox.restoreAllSitesEnabled();
assert(Object.keys(restored).length === 0, 'clear all returns an empty state object');
assert(Object.keys(localData.domainFeatureStates).length === 0, 'clear all removes every domain record');

const migration = sandbox.PageScrollMasterDomain.migrateStorage({
  enableStates: {
    'docs.example.co.uk': false,
    'app.example.co.uk': true
  }
}, {
  progressBar: { enabled: true },
  scrollBookmarks: { enabled: true },
  outlineNavigation: { enabled: false }
});
assert(Object.keys(migration.states).length === 1, 'legacy subdomains merge into one main-domain record');
assert(migration.states['example.co.uk'].extensionEnabled === false, 'an explicit legacy disabled state wins during merge');
assert(migration.defaults.features.progressBar === true, 'legacy progress behavior is preserved in migration defaults');
assert(migration.defaults.features.scrollBookmarks === true, 'legacy bookmark behavior is preserved in migration defaults');

console.log('domain management tests passed');
