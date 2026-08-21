const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function createElement(tagName, options = {}) {
  return {
    tagName: tagName.toUpperCase(),
    className: options.className || '',
    id: options.id || '',
    scrollHeight: options.scrollHeight || 0,
    clientHeight: options.clientHeight || 0,
    scrollTop: options.scrollTop || 0,
    scrollLeft: 0,
    parentElement: options.parentElement || null,
    getAttribute(name) {
      return (options.attributes || {})[name] || null;
    },
    getBoundingClientRect() {
      return options.rect || { left: 0, top: 0, right: 0, bottom: 0, width: 0, height: 0 };
    },
    scrollTo(value) {
      this.scrollTop = typeof value === 'object' ? value.top : arguments[1];
    }
  };
}

function createBridgeContext(scroller, options = {}) {
  const runtimeListeners = [];
  const documentElement = createElement('html', {
    scrollHeight: 700,
    clientHeight: 700,
    rect: { left: 0, top: 0, right: 1000, bottom: 700, width: 1000, height: 700 }
  });
  const body = createElement('body', {
    scrollHeight: 700,
    clientHeight: 700,
    rect: { left: 0, top: 0, right: 1000, bottom: 700, width: 1000, height: 700 }
  });
  const window = {
    top: null,
    name: options.frameName || 'docComponent-test-frame',
    innerWidth: 1000,
    innerHeight: 700,
    getComputedStyle(element) {
      return {
        overflowY: element === scroller ? 'auto' : 'visible',
        display: 'block',
        visibility: 'visible'
      };
    }
  };
  window.top = options.topLevel ? window : {};
  const document = {
    scrollingElement: documentElement,
    documentElement,
    body,
    elementFromPoint() {
      return scroller;
    },
    querySelectorAll() {
      return [scroller];
    }
  };
  const sandbox = {
    window,
    document,
    chrome: {
      runtime: {
        onMessage: {
          addListener(listener) {
            runtimeListeners.push(listener);
          }
        }
      }
    },
    performance: { now: () => 0 },
    requestAnimationFrame(callback) {
      callback(1000);
      return 1;
    },
    cancelAnimationFrame() {}
  };
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'frame-scroll-bridge.js'), 'utf8'), sandbox);
  return { runtimeListeners, frameName: window.name };
}

function testBridgeScrollsItsOwnPrimaryContainer() {
  const scroller = createElement('div', {
    className: 'bear-web-x-container catalogue-opened width-transition',
    scrollHeight: 2500,
    clientHeight: 700,
    rect: { left: 0, top: 0, right: 1000, bottom: 700, width: 1000, height: 700 }
  });
  const { runtimeListeners, frameName } = createBridgeContext(scroller);

  assert(runtimeListeners.length === 1, 'child frame should register exactly one extension-message listener');
  runtimeListeners[0]({
    action: 'embeddedFrameScroll',
    frameName,
    scrollAction: 'scrollToBottom',
    scrollMode: 'instant',
    scrollSpeed: 100
  });

  assert(scroller.scrollTop === 1800, 'bottom bridge action should scroll the frame primary container');
  runtimeListeners[0]({
    action: 'embeddedFrameScroll',
    frameName,
    scrollAction: 'scrollToTop',
    scrollMode: 'custom',
    scrollSpeed: 100
  });
  assert(scroller.scrollTop === 0, 'custom bridge action should preserve animated top behavior');
}

function testBridgeRejectsMessagesFromOtherWindows() {
  const scroller = createElement('div', {
    className: 'document-scroll-viewport',
    scrollHeight: 2500,
    clientHeight: 700,
    scrollTop: 300,
    rect: { left: 0, top: 0, right: 1000, bottom: 700, width: 1000, height: 700 }
  });
  const { runtimeListeners } = createBridgeContext(scroller);

  runtimeListeners[0]({
    action: 'embeddedFrameScroll',
    frameName: 'another-frame',
    scrollAction: 'scrollToBottom'
  });

  assert(scroller.scrollTop === 300, 'messages for another frame must be ignored');
}

function testBridgeDoesNothingInTheTopLevelPage() {
  const scroller = createElement('div', {
    scrollHeight: 2500,
    clientHeight: 700,
    rect: { left: 0, top: 0, right: 1000, bottom: 700, width: 1000, height: 700 }
  });
  const { runtimeListeners } = createBridgeContext(scroller, { topLevel: true });

  assert(runtimeListeners.length === 0, 'the bridge must not add listeners or UI behavior to top-level pages');
}

testBridgeScrollsItsOwnPrimaryContainer();
testBridgeRejectsMessagesFromOtherWindows();
testBridgeDoesNothingInTheTopLevelPage();

console.log('frame scroll bridge tests passed');
