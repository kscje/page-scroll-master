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
  const elements = [];
  const videos = [];
  const documentListeners = new Map();
  const frames = new Map();
  let nextFrameId = 1;

  const documentElement = {
    tagName: 'HTML',
    scrollHeight: 3000,
    clientHeight: 800,
    scrollTop: 100,
    getBoundingClientRect() {
      return { left: 0, top: 0, right: 1200, bottom: 800, width: 1200, height: 800 };
    }
  };
  const body = {
    tagName: 'BODY',
    scrollHeight: 3000,
    clientHeight: 800,
    scrollTop: 100
  };
  const document = {
    body,
    documentElement,
    scrollingElement: documentElement,
    readyState: 'complete',
    hidden: false,
    querySelectorAll(selector) {
      return selector === 'video' ? videos : elements;
    },
    getElementById() {
      return null;
    },
    addEventListener(type, handler) {
      if (!documentListeners.has(type)) documentListeners.set(type, new Set());
      documentListeners.get(type).add(handler);
    },
    removeEventListener(type, handler) {
      if (documentListeners.has(type)) documentListeners.get(type).delete(handler);
    }
  };
  const window = {
    innerWidth: 1200,
    innerHeight: 800,
    pageYOffset: 100,
    location: {
      href: 'https://docs.example.com/article',
      hostname: 'docs.example.com'
    },
    history: {
      pushState() {},
      replaceState() {}
    },
    addEventListener() {},
    removeEventListener() {},
    getSelection() {
      return { isCollapsed: true, toString: () => '' };
    },
    getComputedStyle(element) {
      return { overflowY: element.overflowY || 'visible' };
    },
    scrollTo(x, y) {
      this.pageYOffset = y;
      documentElement.scrollTop = y;
      body.scrollTop = y;
    }
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
        onChanged: { addListener() {}, removeListener() {} }
      }
    },
    navigator: { platform: 'MacIntel', userAgent: 'Chrome' },
    performance: { now: () => 0 },
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
    callback(timestamp);
  }

  function dispatchDocument(type, event = {}) {
    (documentListeners.get(type) || []).forEach((handler) => handler(event));
  }

  return {
    sandbox,
    elements,
    videos,
    frames,
    documentElement,
    window,
    runNextFrame,
    dispatchDocument,
    documentListenerTotal() {
      return Array.from(documentListeners.values()).reduce((sum, listeners) => sum + listeners.size, 0);
    }
  };
}

const context = createContext();
const { sandbox } = context;

const defaults = sandbox.mergeAdvancedSettings({});
assert(defaults.autoScroll.enabled === false, 'auto scroll defaults to disabled');
assert(defaults.autoScroll.speedPreset === 'standard', 'auto scroll defaults to standard speed');
assert(defaults.autoScroll.customSpeed === 40, 'auto scroll custom speed defaults to 40 px/s');
assert(defaults.autoScroll.buttonPosition === 'pageTop', 'auto scroll button defaults to page top');
assert(defaults.autoScroll.buttonColor === '#4A9EDD', 'auto scroll button has one custom color');
assert(!Object.prototype.hasOwnProperty.call(defaults.autoScroll, 'buttonColorMode'), 'auto scroll has no color-follow mode');

const merged = sandbox.mergeAdvancedSettings({
  autoScroll: {
    speedPreset: 'custom',
    customSpeed: 999,
    buttonPosition: 'betweenScrollButtons',
    buttonColor: 'invalid',
    pauseOnVideo: false
  }
});
assert(merged.autoScroll.customSpeed === 300, 'custom speed is clamped to 300 px/s');
assert(merged.autoScroll.buttonPosition === 'pageMiddle', 'legacy middle position normalizes to page middle');
assert(merged.autoScroll.buttonColor === '#4A9EDD', 'invalid auto scroll color falls back safely');
assert(merged.autoScroll.pauseOnVideo === false, 'pause settings merge independently');

vm.runInContext('advancedSettings.autoScroll.enabled = true;', sandbox);
const listenerBaseline = context.documentListenerTotal();
assert(sandbox.startAutoScroll() === true, 'auto scroll starts on a scrollable root page');
assert(vm.runInContext('autoScrollRuntime.state', sandbox) === 'playing', 'start enters playing state');
const pauseListenerTotal = context.documentListenerTotal();
assert(pauseListenerTotal > listenerBaseline, 'starting auto scroll binds pause listeners');
assert(sandbox.startAutoScroll() === true, 'starting auto scroll again keeps playback active');
assert(context.documentListenerTotal() === pauseListenerTotal, 'repeated auto scroll starts do not duplicate pause listeners');
context.runNextFrame(0);
for (let index = 1; index <= 10; index++) {
  context.runNextFrame(index * 100);
}
assert(context.window.pageYOffset === 140, 'standard speed moves 40 pixels per second');

context.dispatchDocument('wheel');
assert(vm.runInContext('autoScrollRuntime.state', sandbox) === 'paused', 'wheel input pauses playback');
assert(context.frames.size === 0, 'pausing cancels the animation frame');
assert(sandbox.toggleAutoScroll() === 'playing', 'page button resumes paused playback');
assert(context.frames.size === 1, 'resume schedules one animation frame');

sandbox.smoothScrollTo(context.documentElement, 500);
assert(vm.runInContext('autoScrollRuntime.state', sandbox) === 'paused', 'programmatic navigation pauses auto scroll first');

context.window.pageYOffset = 2198;
context.documentElement.scrollTop = 2198;
vm.runInContext('autoScrollRuntime.state = "stopped";', sandbox);
assert(sandbox.startAutoScroll() === true, 'auto scroll can start near the bottom');
context.runNextFrame(0);
context.runNextFrame(100);
assert(vm.runInContext('autoScrollRuntime.state', sandbox) === 'stopped', 'reaching the bottom stops playback');
assert(context.window.pageYOffset === 2200, 'bottom stop clamps to the scroll range');

context.window.pageYOffset = 100;
context.documentElement.scrollTop = 100;
assert(sandbox.startAutoScroll() === true, 'playback restarts after a bottom stop');
context.window.location.href = 'https://docs.example.com/next';
assert(sandbox.handleOutlineRouteChange() === true, 'SPA route change is detected');
assert(vm.runInContext('autoScrollRuntime.state', sandbox) === 'stopped', 'SPA route change stops auto scroll');

const video = {
  tagName: 'VIDEO',
  paused: false,
  ended: false,
  readyState: 4,
  getBoundingClientRect() {
    return { width: 600, height: 400 };
  }
};
context.videos.push(video);
assert(sandbox.startAutoScroll() === false, 'an already-playing primary video prevents playback');

const playIcon = sandbox.getAutoScrollIconSvg('play');
const pauseIcon = sandbox.getAutoScrollIconSvg('pause');
assert(playIcon.includes('psm-auto-scroll-icon'), 'play icon uses the auto scroll icon class');
assert(pauseIcon.includes('psm-auto-scroll-icon'), 'pause icon uses the auto scroll icon class');
assert(pauseIcon.includes('M9 6v12M15 6v12'), 'pause icon uses two visible bars');

let autoScrollIconNode = null;
const autoScrollButton = {
  setAttribute() {},
  querySelector(selector) {
    return selector === '.psm-auto-scroll-icon' ? autoScrollIconNode : null;
  },
  set innerHTML(value) {
    this.html = value;
    autoScrollIconNode = { style: {} };
  },
  get innerHTML() {
    return this.html || '';
  }
};
sandbox.getButtonElements = () => ({ autoScrollButton });
vm.runInContext('autoScrollRuntime.state = "stopped"; updateAutoScrollButtonState();', sandbox);
assert(autoScrollIconNode.style.width === '48%' && autoScrollIconNode.style.height === '48%', 'initial play icon gets the compact size');
vm.runInContext('autoScrollRuntime.state = "playing"; updateAutoScrollButtonState();', sandbox);
assert(autoScrollIconNode.style.width === '48%' && autoScrollIconNode.style.height === '48%', 'pause icon gets the same compact size');
vm.runInContext('autoScrollRuntime.state = "paused"; updateAutoScrollButtonState();', sandbox);
assert(autoScrollIconNode.style.width === '48%' && autoScrollIconNode.style.height === '48%', 'resumed play icon keeps the compact size');

vm.runInContext('advancedSettings.autoScroll.enabled = false; stopAutoScroll(); unbindAutoScrollPauseListeners();', sandbox);
assert(context.frames.size === 0, 'disabled auto scroll keeps no active animation frame');
assert(context.documentListenerTotal() === listenerBaseline, 'disabled auto scroll removes pause listeners');

console.log('auto scroll tests passed');
