const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { getSharedRuntimeSource } = require('./runtime-loader');
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
    this.isConnected = options.isConnected !== false;
    this.overflowY = options.overflowY || 'visible';
    this.rect = options.rect || { left: 0, top: 0, right: 0, bottom: 0, width: 0, height: 0 };
    this.dispatchedEvents = [];
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

  dispatchEvent(event) {
    this.dispatchedEvents.push(event);
    return true;
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
    elementFromPoint() {
      return options.elementFromPoint || null;
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
      location: { hostname: 'example.test', href: options.href || 'https://example.test/current' },
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
    WheelEvent: class {
      constructor(type, eventOptions = {}) {
        this.type = type;
        Object.assign(this, eventOptions);
      }
    },
    requestAnimationFrame() {},
    MutationObserver: class {
      observe() {}
    },
    setTimeout() {},
    clearTimeout() {},
    console
  };

  vm.createContext(sandbox);
  const contentPath = path.join(ROOT, 'content.js');
  vm.runInContext(getSharedRuntimeSource(ROOT, contentPath), sandbox);
  vm.runInContext(fs.readFileSync(contentPath, 'utf8'), sandbox);
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

function testMainContainerWinsOverScrollableSidebar() {
  const main = new FakeElement('main', {
    scrollHeight: 3600,
    clientHeight: 860,
    overflowY: 'auto',
    attributes: { role: 'main' },
    rect: { left: 320, top: 20, right: 1200, bottom: 900, width: 880, height: 880 }
  });
  const sidebar = new FakeElement('aside', {
    scrollHeight: 6400,
    clientHeight: 860,
    overflowY: 'auto',
    attributes: { role: 'complementary' },
    rect: { left: 0, top: 20, right: 280, bottom: 900, width: 280, height: 880 }
  });
  const sandbox = createContext([main, sidebar]);

  assert(sandbox.findScrollContainer() === main, 'main content should beat a narrow scrollable sidebar');
}

function testWideMainContainerWinsOverLongUnlabeledEdgePanel() {
  const mainContent = new FakeElement('div', {
    scrollHeight: 1900,
    clientHeight: 840,
    overflowY: 'auto',
    rect: { left: 320, top: 0, right: 1200, bottom: 900, width: 880, height: 900 }
  });
  const edgePanel = new FakeElement('div', {
    scrollHeight: 9200,
    clientHeight: 840,
    overflowY: 'auto',
    rect: { left: 0, top: 0, right: 300, bottom: 900, width: 300, height: 900 }
  });
  const sandbox = createContext([mainContent, edgePanel]);

  assert(sandbox.findScrollContainer() === mainContent, 'wide main content should beat a long unlabeled edge panel');
}

function testTransientUnlabeledEdgePanelDoesNotBecomePrimaryContainer() {
  const edgePanel = new FakeElement('div', {
    scrollHeight: 9200,
    clientHeight: 840,
    overflowY: 'auto',
    rect: { left: 0, top: 0, right: 300, bottom: 900, width: 300, height: 900 }
  });
  const sandbox = createContext([edgePanel]);

  assert(
    sandbox.findScrollContainer() === sandbox.document.documentElement,
    'transient unlabeled edge panel should not become the primary scroll container'
  );
}

function testRouteChangeRetainsPreviousMainUntilNewMainAppears() {
  const previousMainContent = new FakeElement('div', {
    scrollHeight: 2600,
    clientHeight: 840,
    overflowY: 'auto',
    rect: { left: 320, top: 0, right: 1200, bottom: 900, width: 880, height: 900 }
  });
  const elements = [
    new FakeElement('div', {
      scrollHeight: 9200,
      clientHeight: 840,
      overflowY: 'auto',
      rect: { left: 0, top: 0, right: 300, bottom: 900, width: 300, height: 900 }
    })
  ];
  const sandbox = createContext(elements, { href: 'https://example.test/route-a' });
  sandbox.previousMainContent = previousMainContent;
  vm.runInContext(`
    spaDetectionState.isInitialized = true;
    outlineLastKnownUrl = 'https://example.test/route-a';
    currentScrollContainer = previousMainContent;
    window.location.href = 'https://example.test/route-b';
  `, sandbox);

  assert(sandbox.handleOutlineRouteChange() === true, 'route change should restart container detection');
  assert(
    sandbox.resolveScrollContainer() === previousMainContent,
    'route change should retain the previous main container while only the edge panel is scrollable'
  );

  const nextMainContent = new FakeElement('div', {
    scrollHeight: 1900,
    clientHeight: 840,
    overflowY: 'auto',
    rect: { left: 320, top: 0, right: 1200, bottom: 900, width: 880, height: 900 }
  });
  elements.unshift(nextMainContent);
  sandbox.detectAndUpdateScrollContainer();

  assert(sandbox.resolveScrollContainer() === nextMainContent, 'retry detection should bind to the wide main content when it appears');
}

function testMainContainerWinsOverDialogPanel() {
  const main = new FakeElement('main', {
    scrollHeight: 2800,
    clientHeight: 820,
    overflowY: 'auto',
    attributes: { role: 'main' },
    rect: { left: 0, top: 60, right: 1200, bottom: 900, width: 1200, height: 840 }
  });
  const dialog = new FakeElement('div', {
    scrollHeight: 4000,
    clientHeight: 360,
    overflowY: 'auto',
    attributes: { role: 'dialog' },
    rect: { left: 360, top: 180, right: 840, bottom: 540, width: 480, height: 360 }
  });
  const sandbox = createContext([main, dialog]);

  assert(sandbox.findScrollContainer() === main, 'main content should beat a scrollable dialog panel');
}

function testProgrammaticHiddenViewportCanBePrimaryContainer() {
  const appViewport = new FakeElement('div', {
    scrollHeight: 3600,
    clientHeight: 860,
    overflowY: 'hidden',
    rect: { left: 0, top: 40, right: 1200, bottom: 900, width: 1200, height: 860 }
  });
  const sandbox = createContext([appViewport]);

  assert(
    sandbox.findScrollContainer() === appViewport,
    'large programmatic hidden viewport should be selected for virtualized app pages'
  );
}

function testMainContainerWinsOverHiddenProgrammaticDialog() {
  const main = new FakeElement('main', {
    scrollHeight: 2800,
    clientHeight: 820,
    overflowY: 'auto',
    attributes: { role: 'main' },
    rect: { left: 0, top: 60, right: 1200, bottom: 900, width: 1200, height: 840 }
  });
  const hiddenDialog = new FakeElement('div', {
    scrollHeight: 5200,
    clientHeight: 360,
    overflowY: 'hidden',
    attributes: { role: 'dialog' },
    rect: { left: 360, top: 180, right: 840, bottom: 540, width: 480, height: 360 }
  });
  const sandbox = createContext([main, hiddenDialog]);

  assert(sandbox.findScrollContainer() === main, 'main content should beat a hidden programmatic dialog viewport');
}

function testHiddenProgrammaticEdgePanelDoesNotBecomePrimaryContainer() {
  const edgePanel = new FakeElement('div', {
    scrollHeight: 9200,
    clientHeight: 840,
    overflowY: 'hidden',
    rect: { left: 0, top: 0, right: 300, bottom: 900, width: 300, height: 900 }
  });
  const sandbox = createContext([edgePanel]);

  assert(
    sandbox.findScrollContainer() === sandbox.document.documentElement,
    'hidden programmatic edge panel should not become the primary scroll container'
  );
}

function testHiddenNonProgrammableViewportIsIgnored() {
  const clippedLayer = new FakeElement('div', {
    scrollHeight: 3600,
    clientHeight: 860,
    overflowY: 'hidden',
    rect: { left: 0, top: 40, right: 1200, bottom: 900, width: 1200, height: 860 }
  });
  Object.defineProperty(clippedLayer, 'scrollTop', {
    get() {
      return 0;
    },
    set() {}
  });
  const sandbox = createContext([clippedLayer]);

  assert(
    sandbox.findScrollContainer() === sandbox.document.documentElement,
    'hidden viewport without a writable scrollTop should be ignored'
  );
}

function testPageStrategyForcesRootScrollContainer() {
  const main = new FakeElement('main', {
    scrollHeight: 2400,
    clientHeight: 860,
    overflowY: 'auto',
    attributes: { role: 'main' },
    rect: { left: 0, top: 20, right: 1200, bottom: 900, width: 1200, height: 880 }
  });
  const sandbox = createContext([main]);

  assert(sandbox.findScrollContainer('page') === sandbox.document.documentElement, 'page strategy forces the root scroll element');
}

function testEventDrivenDetectionUpdatesLateContent() {
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

  sandbox.detectAndUpdateScrollContainer();

  assert(sandbox.resolveScrollContainer() === main, 'late content should be selected after event-driven detection');
}

function testRootWithoutScrollRangeDoesNotBlockLateScrollableContent() {
  const elements = [];
  const sandbox = createContext(elements);

  assert(sandbox.resolveScrollContainer() === sandbox.document.documentElement, 'root fallback should be used before the app viewport appears');

  const appViewport = new FakeElement('div', {
    scrollHeight: 3200,
    clientHeight: 860,
    overflowY: 'auto',
    rect: { left: 0, top: 40, right: 1200, bottom: 900, width: 1200, height: 860 }
  });
  elements.push(appViewport);

  assert(
    sandbox.resolveScrollContainer() === appViewport,
    'zero-range root fallback should not block late app scroll viewport detection'
  );
}

function testAddedPrimaryScrollCandidateTriggersReevaluation() {
  const previousMain = new FakeElement('div', {
    scrollHeight: 2600,
    clientHeight: 840,
    overflowY: 'auto',
    rect: { left: 320, top: 0, right: 1200, bottom: 900, width: 880, height: 900 }
  });
  const nextMain = new FakeElement('main', {
    scrollHeight: 3200,
    clientHeight: 860,
    overflowY: 'auto',
    attributes: { role: 'main' },
    rect: { left: 300, top: 0, right: 1200, bottom: 900, width: 900, height: 900 }
  });
  const sandbox = createContext([previousMain]);
  sandbox.previousMain = previousMain;
  sandbox.nextMain = nextMain;
  vm.runInContext('currentScrollContainer = previousMain;', sandbox);

  const shouldReevaluate = sandbox.shouldReevaluateScrollContainer([
    { type: 'childList', addedNodes: [nextMain], removedNodes: [] }
  ]);

  assert(shouldReevaluate === true, 'adding a likely primary scroll container should refresh the cached container');
}

function testScrollActionRefreshesStaleConnectedContainer() {
  const previousMain = new FakeElement('div', {
    scrollHeight: 2600,
    clientHeight: 840,
    overflowY: 'auto',
    rect: { left: 320, top: 0, right: 320, bottom: 0, width: 0, height: 0 }
  });
  const nextMain = new FakeElement('main', {
    scrollHeight: 3600,
    clientHeight: 860,
    overflowY: 'auto',
    attributes: { role: 'main' },
    rect: { left: 300, top: 0, right: 1200, bottom: 900, width: 900, height: 900 }
  });
  const sandbox = createContext([previousMain, nextMain]);
  sandbox.previousMain = previousMain;
  sandbox.nextMain = nextMain;
  vm.runInContext('currentScrollContainer = previousMain;', sandbox);

  sandbox.scrollToBottom();

  assert(
    sandbox.resolveScrollContainer() === nextMain,
    'scroll action should refresh a stale connected SPA container before scrolling'
  );
}

function testWheelFallbackTargetsMainViewportWhenNoDomScrollRangeExists() {
  const appViewport = new FakeElement('div', {
    scrollHeight: 860,
    clientHeight: 860,
    overflowY: 'hidden',
    attributes: { role: 'grid' },
    rect: { left: 80, top: 120, right: 1180, bottom: 900, width: 1100, height: 780 }
  });
  const sandbox = createContext([appViewport], { elementFromPoint: appViewport });

  sandbox.scrollToBottom();

  assert(appViewport.dispatchedEvents.length === 1, 'bottom action should dispatch one immediate wheel fallback event');
  assert(appViewport.dispatchedEvents[0].type === 'wheel', 'fallback event should be a wheel event');
  assert(appViewport.dispatchedEvents[0].deltaY > 0, 'bottom fallback should scroll downward');
}

testDelayedMainContainerWinsOverRootFallback();
testMainContainerWinsOverSmallNestedCodeBlock();
testMainContainerWinsOverScrollableSidebar();
testWideMainContainerWinsOverLongUnlabeledEdgePanel();
testTransientUnlabeledEdgePanelDoesNotBecomePrimaryContainer();
testRouteChangeRetainsPreviousMainUntilNewMainAppears();
testMainContainerWinsOverDialogPanel();
testProgrammaticHiddenViewportCanBePrimaryContainer();
testMainContainerWinsOverHiddenProgrammaticDialog();
testHiddenProgrammaticEdgePanelDoesNotBecomePrimaryContainer();
testHiddenNonProgrammableViewportIsIgnored();
testPageStrategyForcesRootScrollContainer();
testEventDrivenDetectionUpdatesLateContent();
testRootWithoutScrollRangeDoesNotBlockLateScrollableContent();
testAddedPrimaryScrollCandidateTriggersReevaluation();
testScrollActionRefreshesStaleConnectedContainer();
testWheelFallbackTargetsMainViewportWhenNoDomScrollRangeExists();

console.log('scroll container detection tests passed');
