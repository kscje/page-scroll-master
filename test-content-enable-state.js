const fs = require('fs');
const path = require('path');
const vm = require('vm');

function createContext() {
  let syncGetCallback = null;
  let localGetCallback = null;
  const windowListeners = {};
  let initializeCalls = 0;
  let removeCalls = 0;

  const sandbox = {
    document: {
      body: {},
      documentElement: { scrollHeight: 1200, clientHeight: 800, scrollTop: 0 },
      scrollingElement: null,
      readyState: 'complete',
      addEventListener() {},
      getElementById() {
        return null;
      },
      querySelectorAll() {
        return [];
      }
    },
    window: {
      innerWidth: 1200,
      innerHeight: 800,
      pageYOffset: 0,
      location: { hostname: 'www.youtube.com' },
      addEventListener(event, handler) {
        windowListeners[event] = handler;
      },
      getComputedStyle() {
        return { overflowY: 'visible' };
      },
      scrollTo() {}
    },
    chrome: {
      i18n: { getMessage: key => key },
      runtime: { onMessage: { addListener() {} } },
      storage: {
        sync: {
          get(keys, callback) {
            syncGetCallback = callback;
          }
        },
        local: {
          get(keys, callback) {
            localGetCallback = callback;
          }
        },
        onChanged: { addListener() {} }
      }
    },
    navigator: { platform: 'MacIntel', userAgent: 'Chrome' },
    performance: { now: () => 0 },
    requestAnimationFrame() {},
    MutationObserver: class {
      observe() {}
    },
    setTimeout() {},
    clearTimeout() {},
    console
  };
  sandbox.document.scrollingElement = sandbox.document.documentElement;

  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(path.join(__dirname, 'content.js'), 'utf8'), sandbox);

  sandbox.initializeButton = () => {
    initializeCalls += 1;
  };
  sandbox.removeButton = () => {
    removeCalls += 1;
  };

  return {
    sandbox,
    runSyncGet(result = {}) {
      syncGetCallback(result);
    },
    runLocalGet(result) {
      localGetCallback(result);
    },
    dispatchWindowLoad() {
      windowListeners.load();
    },
    get initializeCalls() {
      return initializeCalls;
    },
    get removeCalls() {
      return removeCalls;
    },
    getState() {
      return vm.runInContext('({ hasLoadedExtensionEnabledState, isExtensionEnabled })', sandbox);
    }
  };
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

const context = createContext();

context.runSyncGet({ scrollSpeed: 100, buttonSettings: {}, advancedSettings: {} });
context.dispatchWindowLoad();

assert(context.initializeCalls === 0, 'window load must not initialize before enableStates has loaded');

context.runLocalGet({ enableStates: { 'www.youtube.com': false } });

assert(context.initializeCalls === 0, 'disabled hostname must not initialize buttons after storage load');
assert(context.removeCalls === 1, 'disabled hostname should remove any button created by an earlier race');
const state = context.getState();
assert(state.hasLoadedExtensionEnabledState === true, 'enable state load flag should be set');
assert(state.isExtensionEnabled === false, 'disabled hostname should be reflected in content state');

console.log('content enable state tests passed');
