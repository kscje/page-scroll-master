const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { getSharedRuntimeSource } = require('./runtime-loader');

const ROOT = path.join(__dirname, '..');
const CONTENT_PATH = path.join(ROOT, 'content.js');
const CONTENT_SOURCE = getSharedRuntimeSource(ROOT, CONTENT_PATH) +
  '\n' + fs.readFileSync(CONTENT_PATH, 'utf8');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function createContext() {
  const frames = new Map();
  const windowListeners = {};
  const nativeScrollCalls = [];
  let nextFrameId = 1;
  let now = 0;

  const documentElement = {
    tagName: 'HTML',
    scrollHeight: 12000,
    clientHeight: 800,
    scrollTop: 0,
    isConnected: true,
    getBoundingClientRect() {
      return { left: 0, top: 0, right: 1000, bottom: 800, width: 1000, height: 800 };
    }
  };
  const body = {
    tagName: 'BODY',
    scrollHeight: 12000,
    clientHeight: 800,
    scrollTop: 0,
    isConnected: true
  };

  const sandbox = {
    document: {
      body,
      documentElement,
      scrollingElement: documentElement,
      readyState: 'complete',
      hidden: false,
      getElementById() {
        return null;
      },
      querySelectorAll() {
        return [];
      },
      addEventListener() {},
      removeEventListener() {}
    },
    window: {
      innerWidth: 1000,
      innerHeight: 800,
      pageYOffset: 0,
      location: {
        href: 'https://example.test/article',
        hostname: 'example.test'
      },
      history: {
        pushState() {},
        replaceState() {}
      },
      addEventListener(type, callback) {
        windowListeners[type] = windowListeners[type] || [];
        windowListeners[type].push(callback);
      },
      removeEventListener(type, callback) {
        windowListeners[type] = (windowListeners[type] || []).filter((listener) => listener !== callback);
      },
      getComputedStyle(element) {
        return { overflowY: element.overflowY || 'visible' };
      },
      scrollTo(x, y) {
        const options = typeof x === 'object' ? x : { left: x, top: y, behavior: 'auto' };
        nativeScrollCalls.push({ ...options });
        y = options.top;
        this.pageYOffset = y;
        documentElement.scrollTop = y;
        body.scrollTop = y;
      }
    },
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
        onChanged: { addListener() {}, removeListener() {} }
      }
    },
    navigator: { platform: 'MacIntel', userAgent: 'Chrome' },
    performance: {
      now() {
        return now;
      }
    },
    requestAnimationFrame(callback) {
      const id = nextFrameId++;
      frames.set(id, callback);
      return id;
    },
    cancelAnimationFrame(id) {
      frames.delete(id);
    },
    MutationObserver: class {
      observe() {}
      disconnect() {}
    },
    setTimeout() {},
    clearTimeout() {},
    console
  };

  vm.createContext(sandbox);
  vm.runInContext(CONTENT_SOURCE, sandbox, { filename: 'content.js' });

  function runNextFrame(timestamp) {
    const entry = frames.entries().next().value;
    assert(entry, 'an animation frame is available');
    const [id, callback] = entry;
    frames.delete(id);
    now = timestamp;
    callback(timestamp);
  }

  function runUntilIdle(timestamps) {
    timestamps.forEach((timestamp) => {
      if (frames.size > 0) {
        runNextFrame(timestamp);
      }
    });
    assert(frames.size === 0, 'animation frame queue drains');
  }

  return {
    sandbox,
    body,
    documentElement,
    frames,
    runNextFrame,
    runUntilIdle,
    dispatchWindow(type) {
      (windowListeners[type] || []).slice().forEach((listener) => listener({ type }));
    },
    nativeScrollCalls,
    setNow(value) {
      now = value;
    }
  };
}

{
  const context = createContext();
  const { sandbox, body, documentElement } = context;
  vm.runInContext("scrollMode = 'smooth';", sandbox);

  sandbox.scrollToBottom();

  assert(context.frames.size === 0, 'default top/bottom action does not schedule a JavaScript animation frame');
  assert(context.nativeScrollCalls.length === 1, 'default bottom action starts one native scroll');
  assert(context.nativeScrollCalls[0].behavior === 'smooth', 'default bottom action requests native smooth behavior');
  assert(context.nativeScrollCalls[0].top === 11200, 'native bottom action targets the current scroll range');

  documentElement.scrollHeight = 14000;
  body.scrollHeight = 14000;
  context.dispatchWindow('scrollend');

  assert(context.nativeScrollCalls.length === 2, 'native bottom action retargets when the page grows');
  assert(context.nativeScrollCalls[1].top === 13200, 'native retarget uses the latest bottom range');
  context.dispatchWindow('scrollend');
  assert(vm.runInContext('activeNativeScrollState === null', sandbox), 'native scroll state clears after completion');
}

{
  const context = createContext();
  const { sandbox, documentElement } = context;
  documentElement.scrollTop = 8000;
  sandbox.window.pageYOffset = 8000;
  vm.runInContext("scrollMode = 'custom'; scrollSpeed = 300;", sandbox);

  sandbox.scrollToTop();

  assert(context.frames.size === 1, 'a non-default saved duration keeps the custom animation compatibility path');
  assert(context.nativeScrollCalls.length === 0, 'custom-duration compatibility does not start native smooth scrolling');
}

{
  const context = createContext();
  const { sandbox, documentElement } = context;
  documentElement.scrollTop = 8000;
  sandbox.window.pageYOffset = 8000;
  vm.runInContext("scrollMode = 'instant'; scrollSpeed = 600;", sandbox);

  sandbox.scrollToTop();

  assert(vm.runInContext('activeScrollAnimationState === null', sandbox), 'instant mode does not start a JavaScript scroll animation');
  assert(context.nativeScrollCalls.length === 1, 'instant mode performs one native scroll call');
  assert(context.nativeScrollCalls[0].behavior === 'auto', 'instant mode requests immediate native behavior');
  assert(documentElement.scrollTop === 0, 'instant mode reaches the target immediately');
}

{
  const context = createContext();
  const { sandbox } = context;
  const calls = [];
  const listeners = {};
  const customContainer = {
    tagName: 'DIV',
    scrollHeight: 5000,
    clientHeight: 800,
    scrollTop: 0,
    isConnected: true,
    scrollTo(options) {
      calls.push({ ...options });
      this.scrollTop = options.top;
    },
    addEventListener(type, callback) {
      listeners[type] = callback;
    },
    removeEventListener(type) {
      delete listeners[type];
    }
  };
  vm.runInContext("scrollMode = 'smooth';", sandbox);

  sandbox.scrollToPosition(customContainer, 3200);

  assert(calls.length === 1, 'smooth mode supports a custom scroll container');
  assert(calls[0].behavior === 'smooth', 'custom containers use native smooth behavior when available');
  assert(context.frames.size === 0, 'custom-container native smooth scrolling avoids a JavaScript scroll animation');
}

{
  const context = createContext();
  const { sandbox, documentElement } = context;
  documentElement.scrollTop = 6000;
  sandbox.window.pageYOffset = 6000;
  sandbox.window.matchMedia = () => ({ matches: true });
  vm.runInContext("scrollMode = 'smooth';", sandbox);

  sandbox.scrollToTop();

  assert(context.nativeScrollCalls[0].behavior === 'auto', 'reduced-motion preference makes smooth mode immediate');
  assert(vm.runInContext('activeNativeScrollState === null', sandbox), 'reduced-motion scrolling does not retain native animation state');
}

{
  const context = createContext();
  const { sandbox, documentElement } = context;
  let firstCompleted = false;
  let firstCanceled = false;

  vm.runInContext('scrollSpeed = 300;', sandbox);
  sandbox.smoothScrollTo(documentElement, 9000, {
    onCancel: () => {
      firstCanceled = true;
    },
    onComplete: () => {
      firstCompleted = true;
    }
  });
  sandbox.smoothScrollTo(documentElement, 1200);

  assert(firstCanceled === true, 'starting a new scroll cancels the previous animation');
  assert(firstCompleted === false, 'canceled animation does not run its completion callback');
  assert(context.frames.size === 1, 'only the newest animation keeps a frame scheduled');
  context.runUntilIdle([100, 200, 300, 450]);
  assert(documentElement.scrollTop === 1200, 'newest animation controls the final scroll target');
  assert(firstCompleted === false, 'old completion callback stays inactive after frames drain');
}

{
  const context = createContext();
  const { sandbox, documentElement } = context;
  vm.runInContext('scrollSpeed = 100;', sandbox);
  sandbox.smoothScrollTo(documentElement, 11000);
  context.runNextFrame(100);

  assert(documentElement.scrollTop > 0, 'long scroll makes progress on a late frame');
  assert(documentElement.scrollTop < 11000, 'late frame is displacement-limited instead of jumping to the target');
  assert(context.frames.size === 1, 'limited long scroll keeps the animation alive until its guard limit');
  context.runUntilIdle([150, 200]);
  assert(documentElement.scrollTop === 11000, 'long scroll still converges at the duration guard limit');
}

{
  const context = createContext();
  const { sandbox, body, documentElement } = context;
  documentElement.scrollHeight = 3000;
  body.scrollHeight = 3000;
  vm.runInContext('scrollSpeed = 400;', sandbox);
  sandbox.smoothScrollTo(documentElement, sandbox.getElementScrollRange(documentElement), { targetMode: 'bottom' });
  context.runNextFrame(100);

  documentElement.scrollHeight = 5000;
  body.scrollHeight = 5000;
  context.runUntilIdle([250, 400, 600, 650]);

  assert(documentElement.scrollTop === 4200, 'bottom animation refreshes a growing scrollHeight and settles at the new bottom');
}

console.log('scroll animation performance tests passed');
