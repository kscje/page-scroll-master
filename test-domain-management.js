const fs = require('fs');
const vm = require('vm');

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
  vm.runInNewContext(fs.readFileSync('options.js', 'utf8'), sandbox, { filename: 'options.js' });
  return { sandbox, localData };
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

const { sandbox, localData } = createContext();

assert(sandbox.parseHostnameInput('example.com') === 'example.com', 'bare hostname is accepted');
assert(sandbox.parseHostnameInput('https://example.com/a') === 'example.com', 'https URL is normalized to hostname');
assert(sandbox.parseHostnameInput('http://sub.example.com/path') === 'sub.example.com', 'http URL subdomain is preserved');
assert(sandbox.parseHostnameInput('chrome://extensions') === '', 'non-http URL is rejected');
assert(sandbox.parseHostnameInput('') === '', 'empty input is rejected');

sandbox.saveEnableStates({
  'disabled.example': false,
  'enabled.example': true,
  'also-disabled.example': false
});
const remaining = sandbox.clearDisabledSites();
assert(remaining['enabled.example'] === true, 'clear disabled sites preserves true entries');
assert(!Object.prototype.hasOwnProperty.call(remaining, 'disabled.example'), 'clear disabled sites removes false entries');

const restored = sandbox.restoreAllSitesEnabled();
assert(Object.keys(restored).length === 0, 'restore all enabled returns empty state object');
assert(Object.keys(localData.enableStates).length === 0, 'restore all enabled clears local enableStates');

console.log('domain management tests passed');
