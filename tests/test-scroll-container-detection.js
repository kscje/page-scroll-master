const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ROOT = path.join(__dirname, '..');

class FakeElement {
  constructor(tagName, options = {}) {
    this.tagName = tagName.toUpperCase();
    this.scrollHeight = options.scrollHeight || 0;
    this.clientHeight = options.clientHeight || 0;
    this.scrollTop = options.scrollTop || 0;
    this.parentElement = options.parentElement || null;
    this.children = [];
    this.style = {};
    this.attributes = options.attributes || {};
    this.overflowY = options.overflowY || 'visible';
    this.rect = options.rect || { left: 0, top: 0, right: 0, bottom: 0, width: 0, height: 0 };
  }

  appendChild(child) {
    child.parentElement = this;
    this.children.push(child);
    return child;
  }

  getAttribute(name) {
    return this.attributes[name] || null;
  }

  getBoundingClientRect() {
    return this.rect;
  }
}

function createContext(elements, options = {}) {
  const documentElement = options.documentElement || new FakeElement('html', {
    scrollHeight: 900,
    clientHeight: 900,
    rect: { left: 0, top: 0, right: 1200, bottom: 900, width: 1200, height: 900 }
  });
  const body = options.body || new FakeElement('body', {
    scrollHeight: 900,
    clientHeight: 900,
    rect: { left: 0, top: 0, right: 1200, bottom: 900, width: 1200, height: 900 }
  });
  documentElement.appendChild(body);

  const document = {
    body,
    documentElement,
    scrollingElement: options.scrollingElement || documentElement,
    readyState: 'loading',
    querySelectorAll() {
      return elements;
    },
    getElementById() {
      return null;
    },
    addEventListener() {}
  };

  const sandbox = {
    document,
    window: {
      innerWidth: 1200,
      innerHeight: 900,
      pageYOffset: 0,
      location: { hostname: 'example.test' },
      scrollTo(x, y) {
        this.pageYOffset = y;
        documentElement.scrollTop = y;
        body.scrollTop = y;
      },
      getComputedStyle(element) {
        return { overflowY: element.overflowY };
      },
      addEventListener() {}
    },
    chrome: {
      i18n: { getMessage: key => key },
      storage: {
        sync: { get() {} },
        local: { get() {} },
        onChanged: { addListener() {} }
      },
      runtime: { onMessage: { addListener() {} } }
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

  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'content.js'), 'utf8'), sandbox);
  return sandbox;
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function testDelayedMainContainerWinsOverRootFallback() {
  const main = new FakeElement('main', {
    scrollHeight: 2400,
    clientHeight: 860,
    overflowY: 'auto',
    attributes: { role: 'main' },
    rect: { left: 0, top: 20, right: 1200, bottom: 900, width: 1200, height: 880 }
  });
  const sandbox = createContext([main]);

  assert(sandbox.findScrollContainer() === main, 'main scroll container should be selected immediately');
}

function testMainContainerWinsOverSmallNestedCodeBlock() {
  const main = new FakeElement('main', {
    scrollHeight: 3000,
    clientHeight: 860,
    overflowY: 'auto',
    attributes: { role: 'main' },
    rect: { left: 0, top: 20, right: 1200, bottom: 900, width: 1200, height: 880 }
  });
  const code = new FakeElement('pre', {
    scrollHeight: 1200,
    clientHeight: 120,
    overflowY: 'auto',
    rect: { left: 80, top: 180, right: 720, bottom: 300, width: 640, height: 120 }
  });
  main.appendChild(code);
  const sandbox = createContext([main, code]);

  assert(sandbox.findScrollContainer() === main, 'small code block should not beat the main scroll container');
}

function testClickResolvesContainerAfterLateContentAppears() {
  const elements = [];
  const sandbox = createContext(elements);

  assert(sandbox.resolveScrollContainer() === sandbox.document.documentElement, 'root fallback should be used before content appears');

  const main = new FakeElement('main', {
    scrollHeight: 2200,
    clientHeight: 850,
    overflowY: 'overlay',
    attributes: { role: 'main' },
    rect: { left: 0, top: 40, right: 1200, bottom: 900, width: 1200, height: 860 }
  });
  elements.push(main);

  assert(sandbox.resolveScrollContainer() === main, 'late content should be selected on demand before scrolling');
}

testDelayedMainContainerWinsOverRootFallback();
testMainContainerWinsOverSmallNestedCodeBlock();
testClickResolvesContainerAfterLateContentAppears();

console.log('scroll container detection tests passed');
