const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { getSharedRuntimeSource } = require('./runtime-loader');
const ROOT = path.join(__dirname, '..');

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
  const contentPath = path.join(ROOT, 'content.js');
  vm.runInContext(getSharedRuntimeSource(ROOT, contentPath), sandbox);
  vm.runInContext(fs.readFileSync(contentPath, 'utf8'), sandbox);

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
      return vm.runInContext(`({
        hasLoadedExtensionEnabledState,
        isExtensionEnabled,
        currentDomainKey,
        autoScrollEnabled: advancedSettings.autoScroll.enabled,
        progressEnabled: advancedSettings.progressBar.enabled,
        screenNavigationEnabled: advancedSettings.screenNavigation.enabled,
        bookmarksEnabled: advancedSettings.scrollBookmarks.enabled,
        outlineEnabled: advancedSettings.outlineNavigation.enabled
      })`, sandbox);
    }
  };
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function createEventTarget() {
  const listeners = new Map();

  function getListeners(type) {
    if (!listeners.has(type)) {
      listeners.set(type, new Set());
    }
    return listeners.get(type);
  }

  return {
    addEventListener(type, handler) {
      getListeners(type).add(handler);
    },
    removeEventListener(type, handler) {
      getListeners(type).delete(handler);
    },
    dispatch(type, event = {}) {
      Array.from(getListeners(type)).forEach((handler) => handler(event));
    },
    count(type) {
      return getListeners(type).size;
    },
    total() {
      return Array.from(listeners.values()).reduce((sum, handlers) => sum + handlers.size, 0);
    }
  };
}

function createClassList() {
  const classes = new Set();
  return {
    add(value) {
      classes.add(value);
    },
    remove(value) {
      classes.delete(value);
    },
    contains(value) {
      return classes.has(value);
    }
  };
}

function createLifecycleContext() {
  const documentEvents = createEventTarget();
  const windowEvents = createEventTarget();
  const storageListeners = new Set();
  const timers = new Map();
  const animationFrames = new Map();
  const observers = [];
  let nextTimerId = 1;
  let nextAnimationFrameId = 1;
  let host = null;

  function createButton() {
    const events = createEventTarget();
    return {
      ...events,
      classList: createClassList()
    };
  }

  const document = {
    body: {},
    documentElement: {
      scrollHeight: 1200,
      clientHeight: 800,
      scrollTop: 0,
      tagName: 'HTML',
      getBoundingClientRect() {
        return { left: 0, top: 0, width: 1200, height: 800 };
      }
    },
    scrollingElement: null,
    readyState: 'loading',
    hidden: false,
    fullscreenElement: null,
    webkitFullscreenElement: null,
    mozFullScreenElement: null,
    msFullscreenElement: null,
    addEventListener: documentEvents.addEventListener,
    removeEventListener: documentEvents.removeEventListener,
    getElementById(id) {
      return id === 'page-scroll-master-host' ? host : null;
    },
    querySelectorAll() {
      return [];
    }
  };
  document.scrollingElement = document.documentElement;

  const window = {
    innerWidth: 1200,
    innerHeight: 800,
    pageYOffset: 0,
    location: {
      href: 'https://docs.example.co.uk/article',
      hostname: 'docs.example.co.uk'
    },
    history: {
      pushState() {},
      replaceState() {}
    },
    addEventListener: windowEvents.addEventListener,
    removeEventListener: windowEvents.removeEventListener,
    getComputedStyle() {
      return { overflowY: 'visible' };
    },
    scrollTo() {}
  };

  const sandbox = {
    document,
    window,
    chrome: {
      i18n: { getMessage: key => key },
      runtime: {
        lastError: null,
        onMessage: { addListener() {} },
        sendMessage(message, callback) {
          if (callback) callback();
        }
      },
      storage: {
        sync: { get() {} },
        local: { get() {} },
        onChanged: {
          addListener(handler) {
            storageListeners.add(handler);
          },
          removeListener(handler) {
            storageListeners.delete(handler);
          }
        }
      }
    },
    navigator: { platform: 'MacIntel', userAgent: 'Chrome' },
    performance: { now: () => 1000 },
    requestAnimationFrame(callback) {
      const id = nextAnimationFrameId++;
      animationFrames.set(id, callback);
      return id;
    },
    cancelAnimationFrame(id) {
      animationFrames.delete(id);
    },
    MutationObserver: class {
      constructor(callback) {
        this.callback = callback;
        this.active = false;
        observers.push(this);
      }

      observe() {
        this.active = true;
      }

      disconnect() {
        this.active = false;
      }
    },
    setTimeout(callback, delay) {
      const id = nextTimerId++;
      timers.set(id, { callback, delay });
      return id;
    },
    clearTimeout(id) {
      timers.delete(id);
    },
    console
  };

  vm.createContext(sandbox);
  const contentPath = path.join(ROOT, 'content.js');
  vm.runInContext(getSharedRuntimeSource(ROOT, contentPath), sandbox);
  vm.runInContext(fs.readFileSync(contentPath, 'utf8'), sandbox);

  sandbox.initializeButton = () => {
    if (host) return;
    const container = {
      classList: createClassList()
    };
    const topButton = createButton();
    const bottomButton = createButton();
    host = {
      shadowRoot: {
        getElementById(id) {
          return id === 'page-scroll-master-button' ? container : null;
        }
      },
      remove() {
        host = null;
      }
    };

    document.addEventListener('click', sandbox.handleReadingToolDocumentClick, true);
    sandbox.setupHoverHideFunctionality(container, topButton, bottomButton);
    vm.runInContext(`
      currentScrollContainer = document.scrollingElement;
      fullscreenManager.buttonContainer = getButtonContainer();
      fullscreenManager.init();
      if (!spaDetectionState.isInitialized) {
        spaDetectionState.isInitialized = true;
        setupSpaDetection();
      }
    `, sandbox);
  };

  function runTimersWithDelay(delay) {
    Array.from(timers.entries())
      .filter(([, timer]) => timer.delay === delay)
      .forEach(([id, timer]) => {
        timers.delete(id);
        timer.callback();
      });
  }

  return {
    sandbox,
    documentEvents,
    windowEvents,
    storageListeners,
    timers,
    animationFrames,
    observers,
    get hostCount() {
      return host ? 1 : 0;
    },
    runInitialSpaDetection() {
      runTimersWithDelay(80);
    },
    triggerMutation() {
      const observer = observers.find((candidate) => candidate.active);
      assert(observer, 'enabled lifecycle should have an active observer');
      observer.callback([{
        type: 'childList',
        addedNodes: [{}],
        removedNodes: []
      }]);
    },
    detachHost() {
      host = null;
    },
    activeObserverCount() {
      return observers.filter((observer) => observer.active).length;
    }
  };
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

const enabledContext = createContext();
enabledContext.runSyncGet({ scrollSpeed: 100, buttonSettings: {}, advancedSettings: {} });
enabledContext.runLocalGet({
  domainFeatureMigrationVersion: 1,
  domainFeatureDefaults: {
    extensionEnabled: true,
    features: {
      autoScroll: false,
      progressBar: false,
      screenNavigation: false,
      scrollBookmarks: false,
      outlineNavigation: false
    }
  },
  domainFeatureStates: {
    'youtube.com': {
      extensionEnabled: true,
      features: {
        autoScroll: true,
        progressBar: true,
        screenNavigation: true,
        scrollBookmarks: false,
        outlineNavigation: true
      }
    }
  }
});

const enabledState = enabledContext.getState();
assert(enabledState.currentDomainKey === 'youtube.com', 'content script normalizes subdomains to the main domain');
assert(enabledContext.initializeCalls === 1, 'enabled main-domain state initializes buttons');
assert(enabledState.autoScrollEnabled === true, 'auto scroll feature state is applied at runtime');
assert(enabledState.progressEnabled === true, 'progress feature state is applied at runtime');
assert(enabledState.screenNavigationEnabled === true, 'screen navigation feature state is applied at runtime');
assert(enabledState.bookmarksEnabled === false, 'disabled bookmark feature stays off');
assert(enabledState.outlineEnabled === true, 'outline feature state is applied at runtime');

const defaultContext = createContext();
defaultContext.runSyncGet({ scrollSpeed: 100, buttonSettings: {}, advancedSettings: {} });
defaultContext.runLocalGet({
  domainFeatureMigrationVersion: 1,
  domainFeatureDefaults: {
    extensionEnabled: true,
    features: {
      autoScroll: false,
      progressBar: false,
      screenNavigation: false,
      scrollBookmarks: false,
      outlineNavigation: false
    }
  },
  domainFeatureStates: {}
});
const defaultState = defaultContext.getState();
assert(defaultState.isExtensionEnabled === true, 'an unrecorded domain remains enabled by default');
assert(defaultContext.initializeCalls === 1, 'an unrecorded domain initializes the extension');

const lifecycle = createLifecycleContext();
const baselineDocumentListeners = lifecycle.documentEvents.total();
const baselineWindowListeners = lifecycle.windowEvents.total();
const baselineStorageListeners = lifecycle.storageListeners.size;
const enabledDomainState = {
  extensionEnabled: true,
  features: {
    autoScroll: false,
    progressBar: false,
    screenNavigation: false,
    scrollBookmarks: false,
    outlineNavigation: false
  }
};
const disabledDomainState = {
  extensionEnabled: false,
  features: enabledDomainState.features
};

for (let cycle = 1; cycle <= 10; cycle++) {
  lifecycle.sandbox.applyDomainFeatureState(enabledDomainState);
  assert(lifecycle.hostCount === 1, `cycle ${cycle}: enabling creates exactly one host`);
  assert(lifecycle.activeObserverCount() === 1, `cycle ${cycle}: enabling creates one active observer`);
  assert(lifecycle.windowEvents.count('beforeunload') === 1, `cycle ${cycle}: beforeunload is registered once`);
  assert(
    lifecycle.documentEvents.count('visibilitychange') === 2,
    `cycle ${cycle}: hover visibility listener is registered once alongside the global listener`
  );

  lifecycle.runInitialSpaDetection();
  lifecycle.triggerMutation();
  lifecycle.sandbox.window.history.pushState({}, '', `/cycle-${cycle}`);
  assert(lifecycle.timers.size === 3, `cycle ${cycle}: SPA and route timers are tracked`);

  if (cycle === 10) {
    lifecycle.detachHost();
  }
  lifecycle.sandbox.applyDomainFeatureState(disabledDomainState);
  assert(lifecycle.hostCount === 0, `cycle ${cycle}: disabling removes the host`);
  assert(lifecycle.activeObserverCount() === 0, `cycle ${cycle}: disabling disconnects observers`);
  assert(lifecycle.timers.size === 0, `cycle ${cycle}: disabling clears SPA timers`);
  assert(lifecycle.animationFrames.size === 0, `cycle ${cycle}: disabling clears animation frames`);
  assert(
    lifecycle.documentEvents.total() === baselineDocumentListeners,
    `cycle ${cycle}: disabling restores document listeners to baseline`
  );
  assert(
    lifecycle.windowEvents.total() === baselineWindowListeners,
    `cycle ${cycle}: disabling restores window listeners to baseline`
  );
  assert(
    lifecycle.storageListeners.size === baselineStorageListeners,
    `cycle ${cycle}: disabling restores storage listeners to baseline`
  );
}

console.log('content enable state tests passed');
