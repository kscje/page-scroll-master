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
    this._scrollTop = options.scrollTop || 0;
    this.scrollTopWriteCount = 0;
    this.parentElement = options.parentElement || null;
    this.children = [];
    this.style = {};
    this.attributes = options.attributes || {};
    this.id = options.id || '';
    this.className = options.className || '';
    this.isConnected = options.isConnected !== false;
    this.overflowY = options.overflowY || 'visible';
    this.visibility = options.visibility || 'visible';
    this.display = options.display || 'block';
    this.pointerEvents = options.pointerEvents;
    this.rect = options.rect || { left: 0, top: 0, right: 0, bottom: 0, width: 0, height: 0 };
    this.rectReadCount = 0;
    this.queryCount = 0;
    this.dispatchedEvents = [];
    Object.defineProperty(this, 'scrollTop', {
      get() {
        return this._scrollTop;
      },
      set(value) {
        this.scrollTopWriteCount += 1;
        this._scrollTop = value;
      },
      configurable: true
    });
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
    this.rectReadCount += 1;
    return this.rect;
  }

  contains(target) {
    if (target === this) return true;
    return this.children.some((child) => child.contains(target));
  }

  querySelectorAll() {
    this.queryCount += 1;
    return this.children.flatMap((child) => [child, ...child.querySelectorAll()]);
  }

  dispatchEvent(event) {
    this.dispatchedEvents.push(event);
    return true;
  }
}

function createContext(elements, options = {}) {
  const mutationObservers = [];
  const timers = [];
  const documentListeners = new Map();
  const runtimeMessages = [];
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
    createTreeWalker(root) {
      const collected = [];
      const walk = (node) => {
        for (const child of node.children || []) {
          collected.push(child);
          walk(child);
        }
      };
      if (root && root.children) walk(root);
      let index = 0;
      return {
        nextNode() {
          return index < collected.length ? collected[index++] : null;
        }
      };
    },
    elementFromPoint() {
      return options.elementFromPoint || null;
    },
    getElementById() {
      return null;
    },
    addEventListener(type, listener) {
      const listeners = documentListeners.get(type) || [];
      listeners.push(listener);
      documentListeners.set(type, listeners);
    },
    removeEventListener(type, listener) {
      const listeners = documentListeners.get(type) || [];
      documentListeners.set(type, listeners.filter((candidate) => candidate !== listener));
    }
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
        return {
          overflowY: element.overflowY,
          visibility: element.visibility,
          display: element.display,
          pointerEvents: element.pointerEvents
        };
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
      runtime: {
        onMessage: { addListener() {} },
        sendMessage(message) {
          runtimeMessages.push(message);
        }
      }
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
      constructor(callback) {
        this.callback = callback;
        mutationObservers.push(this);
      }

      observe() {}
    },
    setTimeout(callback, delay) {
      const timer = { callback, delay: delay || 0, canceled: false, ran: false };
      timers.push(timer);
      return timer;
    },
    clearTimeout(timer) {
      if (timer) timer.canceled = true;
    },
    console
  };

  vm.createContext(sandbox);
  const contentPath = path.join(ROOT, 'content.js');
  vm.runInContext(getSharedRuntimeSource(ROOT, contentPath), sandbox);
  vm.runInContext(fs.readFileSync(contentPath, 'utf8'), sandbox);
  sandbox.__mutationObservers = mutationObservers;
  sandbox.__runtimeMessages = runtimeMessages;
  sandbox.__timers = timers;
  sandbox.__dispatchDocumentEvent = (type, event = {}) => {
    (documentListeners.get(type) || []).slice().forEach((listener) => listener(event));
  };
  sandbox.__getPendingTimers = () => timers.filter((timer) => !timer.canceled && !timer.ran);
  sandbox.__runLatestTimer = () => {
    const timer = [...timers].reverse().find((candidate) => !candidate.canceled && !candidate.ran);
    assert(Boolean(timer), 'a pending timer is available');
    timer.ran = true;
    timer.callback();
  };
  return sandbox;
}

function createEmbeddedFrame(scrollContainer, options = {}) {
  const frameWidth = options.frameWidth || 1000;
  const frameHeight = options.frameHeight || 700;
  const frame = new FakeElement('iframe', {
    display: options.display,
    visibility: options.visibility,
    rect: options.rect || {
      left: 120,
      top: 100,
      right: 120 + frameWidth,
      bottom: 100 + frameHeight,
      width: frameWidth,
      height: frameHeight
    }
  });
  const documentElement = new FakeElement('html', {
    scrollHeight: frameHeight,
    clientHeight: frameHeight,
    rect: { left: 0, top: 0, right: frameWidth, bottom: frameHeight, width: frameWidth, height: frameHeight }
  });
  const body = new FakeElement('body', {
    scrollHeight: frameHeight,
    clientHeight: frameHeight,
    rect: { left: 0, top: 0, right: frameWidth, bottom: frameHeight, width: frameWidth, height: frameHeight }
  });
  documentElement.appendChild(body);
  const frameDocument = {
    body,
    documentElement,
    scrollingElement: documentElement,
    querySelectorAll() {
      return [scrollContainer];
    }
  };
  const frameWindow = {
    innerWidth: frameWidth,
    innerHeight: frameHeight,
    location: { origin: options.origin || 'https://example.test' },
    postedMessages: [],
    postMessage(message, targetOrigin) {
      this.postedMessages.push({ message, targetOrigin });
    },
    getComputedStyle(element) {
      return {
        overflowY: element.overflowY,
        visibility: element.visibility,
        display: element.display,
        pointerEvents: element.pointerEvents
      };
    },
    scrollTo(x, y) {
      const top = typeof x === 'object' ? x.top : y;
      documentElement.scrollTop = top;
      body.scrollTop = top;
    }
  };
  frameDocument.defaultView = frameWindow;
  [documentElement, body, scrollContainer].forEach((element) => {
    element.ownerDocument = frameDocument;
  });
  frame.contentDocument = frameDocument;
  frame.contentWindow = frameWindow;
  return { frame, frameDocument, frameWindow };
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

function testLowerScoredHiddenCandidatesAreNotProbedWhenMainWins() {
  const main = new FakeElement('main', {
    scrollHeight: 2800,
    clientHeight: 820,
    overflowY: 'auto',
    attributes: { role: 'main' },
    rect: { left: 0, top: 60, right: 1200, bottom: 900, width: 1200, height: 840 }
  });
  const hiddenDialogs = Array.from({ length: 24 }, () => new FakeElement('div', {
    scrollHeight: 5200,
    clientHeight: 360,
    overflowY: 'hidden',
    attributes: { role: 'dialog' },
    rect: { left: 360, top: 180, right: 840, bottom: 540, width: 480, height: 360 }
  }));
  const sandbox = createContext([main, ...hiddenDialogs]);

  assert(sandbox.findScrollContainer() === main, 'main content still wins over hidden dialog candidates');
  assert(
    hiddenDialogs.every((element) => element.scrollTopWriteCount === 0),
    'lower-scored hidden candidates are not probed with scrollTop writes'
  );
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

function testCustomElementScrollContainerIsDetected() {
  const chatScroller = new FakeElement('infinite-scroller', {
    scrollHeight: 3200,
    clientHeight: 600,
    overflowY: 'scroll',
    className: 'chat-history',
    rect: { left: 300, top: 40, right: 1200, bottom: 640, width: 900, height: 600 }
  });
  const decorativeBlob = new FakeElement('div', {
    scrollHeight: 4000,
    clientHeight: 900,
    overflowY: 'hidden',
    className: 'nl-blob nl-fg-blob',
    pointerEvents: 'none',
    rect: { left: 0, top: 0, right: 1200, bottom: 900, width: 1200, height: 900 }
  });
  const sandbox = createContext([decorativeBlob]);
  sandbox.document.body.appendChild(chatScroller);
  sandbox.document.body.appendChild(decorativeBlob);

  assert(
    sandbox.findScrollContainer() === chatScroller,
    'custom element scroll container should be detected even when it misses selector and class hints'
  );
  assert(
    decorativeBlob.scrollTopWriteCount === 0,
    'decorative pointer-events none background should not be probed with scrollTop writes'
  );
}

function testCustomElementCollectionSurvivesLargeCandidateList() {
  const chatScroller = new FakeElement('infinite-scroller', {
    scrollHeight: 3200,
    clientHeight: 600,
    overflowY: 'scroll',
    className: 'chat-history',
    rect: { left: 300, top: 40, right: 1200, bottom: 640, width: 900, height: 600 }
  });
  const selectorFillers = [];
  for (let i = 0; i < 240; i += 1) {
    selectorFillers.push(new FakeElement('div', {
      overflowY: 'hidden',
      className: 'layout-block-' + i
    }));
  }
  const sandbox = createContext(selectorFillers);
  sandbox.document.body.appendChild(chatScroller);

  assert(
    sandbox.findScrollContainer() === chatScroller,
    'custom element scroll container should still be collected when selector candidates already exceed the custom element limit'
  );
}

function testDecorativePointerEventsNoneLayerDoesNotBecomePrimaryContainer() {
  const decorativeBlob = new FakeElement('div', {
    scrollHeight: 4000,
    clientHeight: 900,
    overflowY: 'hidden',
    className: 'nl-blob nl-fg-blob',
    pointerEvents: 'none',
    rect: { left: 0, top: 0, right: 1200, bottom: 900, width: 1200, height: 900 }
  });
  const sandbox = createContext([decorativeBlob]);
  sandbox.document.body.appendChild(decorativeBlob);

  assert(
    sandbox.findScrollContainer() === sandbox.document.documentElement,
    'decorative pointer-events none background should not become the primary scroll container'
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

function testMutationContainerMeasurementWaitsForScrollCompletion() {
  const currentMain = new FakeElement('main', {
    scrollHeight: 3200,
    clientHeight: 860,
    overflowY: 'auto',
    attributes: { role: 'main' },
    rect: { left: 0, top: 40, right: 1200, bottom: 900, width: 1200, height: 860 }
  });
  const nextMain = new FakeElement('main', {
    scrollHeight: 4200,
    clientHeight: 860,
    overflowY: 'auto',
    attributes: { role: 'main' },
    rect: { left: 0, top: 40, right: 1200, bottom: 900, width: 1200, height: 860 }
  });
  const sandbox = createContext([currentMain, nextMain]);
  sandbox.currentMain = currentMain;
  sandbox.nextMain = nextMain;
  vm.runInContext(`
    currentScrollContainer = currentMain;
    currentScrollContainerStrategy = getEffectiveContainerStrategy();
    spaDetectionState.isInitialized = true;
    setupSpaDetection();
    activeScrollAnimationState = { container: currentMain };
  `, sandbox);

  const observer = sandbox.__mutationObservers[0];
  assert(Boolean(observer), 'SPA observer is available for deferred mutation processing');
  const initialRectReads = currentMain.rectReadCount + nextMain.rectReadCount;
  observer.callback([{ type: 'childList', addedNodes: [nextMain], removedNodes: [] }]);

  assert(
    currentMain.rectReadCount + nextMain.rectReadCount === initialRectReads,
    'MutationObserver callback queues DOM changes without measuring layout synchronously'
  );

  sandbox.__runLatestTimer();
  assert(
    currentMain.rectReadCount + nextMain.rectReadCount === initialRectReads,
    'deferred container measurement stays paused while scrolling is active'
  );

  vm.runInContext('activeScrollAnimationState = null;', sandbox);
  sandbox.__runLatestTimer();
  assert(
    currentMain.rectReadCount + nextMain.rectReadCount > initialRectReads,
    'queued container measurement resumes after scrolling completes'
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

function testSameOriginPrimaryIframeReceivesTopAndBottomActions() {
  const iframeScroller = new FakeElement('div', {
    className: 'document-scroll-viewport',
    scrollHeight: 2500,
    clientHeight: 700,
    overflowY: 'auto',
    rect: { left: 0, top: 0, right: 1000, bottom: 700, width: 1000, height: 700 }
  });
  const { frame } = createEmbeddedFrame(iframeScroller);
  const sandbox = createContext([frame], { elementFromPoint: frame });
  vm.runInContext("scrollMode = 'instant';", sandbox);

  sandbox.scrollToBottom();
  assert(iframeScroller.scrollTop === 1800, 'large same-origin iframe receives the bottom action');

  sandbox.scrollToTop();
  assert(iframeScroller.scrollTop === 0, 'large same-origin iframe receives the top action');
  assert(frame.dispatchedEvents.length === 0, 'iframe support avoids synthetic wheel fallback');
}

function testNormalMainContainerDoesNotDelegateToIframe() {
  const main = new FakeElement('main', {
    scrollHeight: 3000,
    clientHeight: 860,
    overflowY: 'auto',
    attributes: { role: 'main' },
    rect: { left: 0, top: 40, right: 1200, bottom: 900, width: 1200, height: 860 }
  });
  const iframeScroller = new FakeElement('div', {
    className: 'document-scroll-viewport',
    scrollHeight: 2500,
    clientHeight: 700,
    overflowY: 'auto',
    rect: { left: 0, top: 0, right: 1000, bottom: 700, width: 1000, height: 700 }
  });
  const { frame } = createEmbeddedFrame(iframeScroller);
  const sandbox = createContext([main, frame], { elementFromPoint: frame });
  vm.runInContext("scrollMode = 'instant';", sandbox);

  sandbox.scrollToBottom();

  assert(main.scrollTop > 0, 'existing primary DOM container keeps the bottom action');
  assert(iframeScroller.scrollTop === 0, 'existing primary DOM container does not delegate into an iframe');
}

function testPageStrategyDoesNotDelegateToIframe() {
  const iframeScroller = new FakeElement('div', {
    className: 'document-scroll-viewport',
    scrollHeight: 2500,
    clientHeight: 700,
    overflowY: 'auto',
    rect: { left: 0, top: 0, right: 1000, bottom: 700, width: 1000, height: 700 }
  });
  const { frame } = createEmbeddedFrame(iframeScroller);
  const sandbox = createContext([frame], { elementFromPoint: frame });
  vm.runInContext("scrollMode = 'instant'; currentDomainFeatureState.containerStrategy = 'page';", sandbox);

  sandbox.scrollToBottom();

  assert(iframeScroller.scrollTop === 0, 'explicit page strategy keeps its existing root-only contract');
  assert(frame.dispatchedEvents.length === 1, 'page strategy retains the existing fallback behavior');
}

function testSmallOrHiddenIframeIsNotDelegatedTo() {
  const iframeScroller = new FakeElement('div', {
    className: 'document-scroll-viewport',
    scrollHeight: 1800,
    clientHeight: 200,
    overflowY: 'auto',
    rect: { left: 0, top: 0, right: 280, bottom: 200, width: 280, height: 200 }
  });
  const { frame } = createEmbeddedFrame(iframeScroller, {
    frameWidth: 280,
    frameHeight: 200,
    rect: { left: 40, top: 80, right: 320, bottom: 280, width: 280, height: 200 }
  });
  const sandbox = createContext([frame], { elementFromPoint: frame });
  vm.runInContext("scrollMode = 'instant';", sandbox);

  sandbox.scrollToBottom();

  assert(iframeScroller.scrollTop === 0, 'small embedded panels are not treated as page scroll targets');
  assert(frame.dispatchedEvents.length === 1, 'small iframe retains the existing fallback behavior');
}

function testIsolatedIframeReceivesBridgeMessage() {
  const iframeScroller = new FakeElement('div', {
    className: 'document-scroll-viewport',
    scrollHeight: 2500,
    clientHeight: 700,
    overflowY: 'auto',
    rect: { left: 0, top: 0, right: 1000, bottom: 700, width: 1000, height: 700 }
  });
  const { frame } = createEmbeddedFrame(iframeScroller);
  frame.name = 'isolated-frame';
  Object.defineProperty(frame, 'contentDocument', {
    get() {
      throw new Error('cross-origin frame');
    }
  });
  Object.defineProperty(frame, 'contentWindow', {
    get() {
      return null;
    }
  });
  const sandbox = createContext([frame], { elementFromPoint: frame });
  vm.runInContext("scrollMode = 'instant';", sandbox);
  sandbox.scrollToBottom();

  assert(iframeScroller.scrollTop === 0, 'the parent must not directly access an isolated iframe scroll container');
  assert(sandbox.__runtimeMessages.length === 1, 'isolated iframe should be routed through extension messaging');
  assert(
    sandbox.__runtimeMessages[0].scrollAction === 'scrollToBottom',
    'bridge message should preserve the requested bottom action'
  );
  assert(frame.dispatchedEvents.length === 0, 'isolated iframe support should not fall back to synthetic wheel events');
}

function testTinyHiddenParentRangeDoesNotBlockIframeBridge() {
  const iframeHost = new FakeElement('div', {
    id: 'bitable-iframe-host',
    scrollHeight: 904,
    clientHeight: 900,
    overflowY: 'hidden',
    rect: { left: 0, top: 0, right: 1200, bottom: 900, width: 1200, height: 900 }
  });
  const iframeScroller = new FakeElement('div', {
    className: 'bear-web-x-container catalogue-opened width-transition',
    scrollHeight: 2500,
    clientHeight: 700,
    overflowY: 'scroll',
    rect: { left: 0, top: 0, right: 1000, bottom: 700, width: 1000, height: 700 }
  });
  const { frame } = createEmbeddedFrame(iframeScroller);
  frame.name = 'docComponent-layout-tolerance';
  Object.defineProperty(frame, 'contentDocument', {
    get() {
      return null;
    }
  });
  Object.defineProperty(frame, 'contentWindow', {
    get() {
      return null;
    }
  });
  const sandbox = createContext([iframeHost, frame], { elementFromPoint: frame });
  vm.runInContext("scrollMode = 'instant'; currentScrollContainer = document.querySelectorAll()[0];", sandbox);

  sandbox.scrollToBottom();

  assert(
    sandbox.__runtimeMessages.length === 1 &&
      sandbox.__runtimeMessages[0].frameName === 'docComponent-layout-tolerance',
    'a 4px hidden parent layout range must not preempt the visible iframe bridge'
  );
  assert(iframeHost.scrollTop === 0, 'tiny hidden parent layout range should remain untouched');
}

function testWheelFallbackPrefersLarkCanvasAndAddsPointerCoordinates() {
  const mainContainer = new FakeElement('div', {
    id: 'mainContainer',
    scrollHeight: 900,
    clientHeight: 900,
    overflowY: 'hidden',
    rect: { left: 0, top: 0, right: 1200, bottom: 900, width: 1200, height: 900 }
  });
  const gridView = new FakeElement('div', {
    className: 'faster-view gridView',
    scrollHeight: 680,
    clientHeight: 680,
    overflowY: 'hidden',
    rect: { left: 240, top: 148, right: 1200, bottom: 828, width: 960, height: 680 }
  });
  const canvas = new FakeElement('canvas', {
    attributes: { role: 'faster' },
    rect: { left: 240, top: 148, right: 1200, bottom: 828, width: 960, height: 680 }
  });
  mainContainer.appendChild(gridView);
  gridView.appendChild(canvas);
  const sandbox = createContext([mainContainer, gridView, canvas], { elementFromPoint: canvas });

  sandbox.scrollToBottom();

  assert(canvas.dispatchedEvents.length === 1, 'Lark fallback should dispatch to the canvas interaction surface');
  assert(mainContainer.dispatchedEvents.length === 0, 'Lark fallback should not dispatch to the full-screen wrapper');
  const event = canvas.dispatchedEvents[0];
  assert(event.clientX > 240 && event.clientX < 1200, 'wheel clientX should be inside the canvas');
  assert(event.clientY > 148 && event.clientY < 828, 'wheel clientY should be inside the canvas');
}

function testWheelFallbackDirectionReplacementAndUserCancellation() {
  const canvas = new FakeElement('canvas', {
    attributes: { role: 'faster' },
    rect: { left: 120, top: 100, right: 1120, bottom: 850, width: 1000, height: 750 }
  });
  const sandbox = createContext([canvas], { elementFromPoint: canvas });

  sandbox.scrollToBottom();
  const firstTimer = sandbox.__getPendingTimers()[0];
  sandbox.scrollToTop();

  assert(firstTimer.canceled === true, 'a new top action should cancel the previous bottom fallback loop');
  assert(canvas.dispatchedEvents.length === 2, 'replacement action should dispatch its first wheel event immediately');
  assert(canvas.dispatchedEvents[0].deltaY > 0, 'bottom fallback should dispatch a positive delta');
  assert(canvas.dispatchedEvents[1].deltaY < 0, 'top fallback should dispatch a negative delta');

  const replacementTimer = sandbox.__getPendingTimers()[0];
  sandbox.__dispatchDocumentEvent('wheel', { type: 'wheel' });
  assert(replacementTimer.canceled === true, 'a user wheel event should cancel the active fallback loop');
  assert(sandbox.__getPendingTimers().length === 0, 'user cancellation should leave no fallback timer pending');

  sandbox.scrollToBottom();
  const routeTimer = sandbox.__getPendingTimers()[0];
  sandbox.window.location.href = 'https://example.test/next';
  sandbox.handleOutlineRouteChange();
  assert(routeTimer.canceled === true, 'a SPA route change should cancel the active fallback loop');
}

function testScrollablePageDoesNotUseWheelFallback() {
  const main = new FakeElement('main', {
    scrollHeight: 3000,
    clientHeight: 860,
    overflowY: 'auto',
    attributes: { role: 'main' },
    rect: { left: 0, top: 40, right: 1200, bottom: 900, width: 1200, height: 860 }
  });
  const sandbox = createContext([main], { elementFromPoint: main });
  vm.runInContext("scrollMode = 'instant';", sandbox);

  sandbox.scrollToBottom();

  assert(main.scrollTop > 0, 'ordinary scrollable pages should still use their DOM scroll range');
  assert(main.dispatchedEvents.length === 0, 'ordinary scrollable pages should not enter the wheel fallback');
}

function testVirtualGridWinsOverAsyncSidebarAndHiddenPanel() {
  const sidebar = new FakeElement('div', {
    scrollHeight: 1200,
    clientHeight: 462,
    overflowY: 'scroll',
    rect: { left: 0, top: 236, right: 298, bottom: 698, width: 298, height: 462 }
  });
  const hiddenAskPanel = new FakeElement('div', {
    scrollHeight: 530,
    clientHeight: 395,
    overflowY: 'scroll',
    visibility: 'hidden',
    rect: { left: 1, top: 45, right: 380, bottom: 440, width: 379, height: 395 }
  });
  const transientPanel = new FakeElement('div', {
    scrollHeight: 1800,
    clientHeight: 560,
    overflowY: 'auto',
    rect: { left: 430, top: 160, right: 730, bottom: 720, width: 300, height: 560 }
  });
  const canvas = new FakeElement('canvas', {
    attributes: { role: 'faster' },
    rect: { left: 300, top: 148, right: 1200, bottom: 737, width: 900, height: 589 }
  });
  const sandbox = createContext([sidebar, hiddenAskPanel, transientPanel, canvas], {
    elementFromPoint: canvas
  });
  vm.runInContext("scrollMode = 'instant';", sandbox);

  assert(
    sandbox.getReadOnlyScrollCandidateType(hiddenAskPanel) === false,
    'CSS-hidden panels should not be scroll-container candidates'
  );
  assert(
    sandbox.findScrollContainer() === transientPanel,
    'the setup should retain a non-primary DOM candidate to exercise Canvas preference'
  );

  sandbox.scrollToBottom();

  assert(canvas.dispatchedEvents.length === 1, 'point-hit virtual grid should receive the bottom action');
  assert(sidebar.scrollTop === 0, 'the async sidebar should not receive the table action');
  assert(hiddenAskPanel.scrollTop === 0, 'the hidden panel should not receive the table action');
  assert(transientPanel.scrollTop === 0, 'a non-primary DOM panel should not preempt the virtual grid');
}

function testRetainableMainStillWinsOverVirtualGrid() {
  const main = new FakeElement('main', {
    scrollHeight: 3000,
    clientHeight: 860,
    overflowY: 'auto',
    attributes: { role: 'main' },
    rect: { left: 0, top: 40, right: 1200, bottom: 900, width: 1200, height: 860 }
  });
  const canvas = new FakeElement('canvas', {
    attributes: { role: 'faster' },
    rect: { left: 240, top: 148, right: 1200, bottom: 828, width: 960, height: 680 }
  });
  const sandbox = createContext([main, canvas], { elementFromPoint: canvas });
  vm.runInContext("scrollMode = 'instant';", sandbox);

  sandbox.scrollToBottom();

  assert(main.scrollTop > 0, 'a retainable main DOM container should keep normal scrolling');
  assert(canvas.dispatchedEvents.length === 0, 'Canvas fallback should not replace normal main scrolling');
}

function testWheelFallbackStopsAtConfiguredStepBound() {
  const gridWrapper = new FakeElement('div', {
    className: 'gridView base-grid',
    rect: { left: 120, top: 100, right: 1120, bottom: 850, width: 1000, height: 750 }
  });
  const canvas = new FakeElement('canvas', {
    rect: { left: 120, top: 100, right: 1120, bottom: 850, width: 1000, height: 750 }
  });
  gridWrapper.appendChild(canvas);
  const sandbox = createContext([gridWrapper, canvas], { elementFromPoint: canvas });

  sandbox.scrollToBottom();
  while (sandbox.__getPendingTimers().length) {
    sandbox.__runLatestTimer();
  }

  assert(canvas.dispatchedEvents.length === 28, 'generic canvas fallback should keep its 28-step bound');
  assert(sandbox.__getPendingTimers().length === 0, 'bounded fallback completion should leave no timer pending');
}

function testFasterCanvasUsesExtendedWheelFallbackBudget() {
  const canvas = new FakeElement('canvas', {
    attributes: { role: 'faster' },
    rect: { left: 120, top: 100, right: 1120, bottom: 850, width: 1000, height: 750 }
  });
  const sandbox = createContext([canvas], { elementFromPoint: canvas });

  sandbox.scrollToBottom();
  const resumeDelays = [];
  while (sandbox.__getPendingTimers().length) {
    const pending = sandbox.__getPendingTimers();
    resumeDelays.push(pending[pending.length - 1].delay);
    sandbox.__runLatestTimer();
  }

  assert(
    canvas.dispatchedEvents.length === 400,
    'role="faster" canvas fallback should use the extended 400-pulse budget'
  );
  assert(
    resumeDelays.length === 399,
    'the first pulse dispatches immediately and every later pulse is scheduled'
  );
  assert(
    resumeDelays.filter((delay) => delay === 16).length === 395,
    'intra-wave pulses should keep the 16ms cadence'
  );
  const waveGaps = resumeDelays.filter((delay) => delay >= 480);
  assert(
    waveGaps.length === 4,
    'each 80-pulse wave should be followed by one long settle gap'
  );
  assert(
    canvas.dispatchedEvents.every((event) => event.deltaY > 0),
    'extended budget should keep dispatching toward the requested direction'
  );
  assert(sandbox.__getPendingTimers().length === 0, 'extended fallback completion should leave no timer pending');
}

function testFasterCanvasWheelFallbackStopsAtDurationCap() {
  const canvas = new FakeElement('canvas', {
    attributes: { role: 'faster' },
    rect: { left: 120, top: 100, right: 1120, bottom: 850, width: 1000, height: 750 }
  });
  const sandbox = createContext([canvas], { elementFromPoint: canvas });

  sandbox.scrollToBottom();
  assert(canvas.dispatchedEvents.length === 1, 'the first pulse should still dispatch immediately');
  const durationCap = vm.runInContext('FASTER_GRID_FALLBACK_MAX_DURATION_MS', sandbox);
  sandbox.performance.now = () => durationCap;
  sandbox.__runLatestTimer();

  assert(
    canvas.dispatchedEvents.length === 1,
    'the duration cap should stop further pulses before dispatching'
  );
  assert(sandbox.__getPendingTimers().length === 0, 'duration-capped fallback should leave no timer pending');
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
testLowerScoredHiddenCandidatesAreNotProbedWhenMainWins();
testHiddenProgrammaticEdgePanelDoesNotBecomePrimaryContainer();
testHiddenNonProgrammableViewportIsIgnored();
testCustomElementScrollContainerIsDetected();
testCustomElementCollectionSurvivesLargeCandidateList();
testDecorativePointerEventsNoneLayerDoesNotBecomePrimaryContainer();
testPageStrategyForcesRootScrollContainer();
testEventDrivenDetectionUpdatesLateContent();
testRootWithoutScrollRangeDoesNotBlockLateScrollableContent();
testAddedPrimaryScrollCandidateTriggersReevaluation();
testScrollActionRefreshesStaleConnectedContainer();
testMutationContainerMeasurementWaitsForScrollCompletion();
testWheelFallbackTargetsMainViewportWhenNoDomScrollRangeExists();
testSameOriginPrimaryIframeReceivesTopAndBottomActions();
testNormalMainContainerDoesNotDelegateToIframe();
testPageStrategyDoesNotDelegateToIframe();
testSmallOrHiddenIframeIsNotDelegatedTo();
testIsolatedIframeReceivesBridgeMessage();
testTinyHiddenParentRangeDoesNotBlockIframeBridge();
testWheelFallbackPrefersLarkCanvasAndAddsPointerCoordinates();
testWheelFallbackDirectionReplacementAndUserCancellation();
testScrollablePageDoesNotUseWheelFallback();
testVirtualGridWinsOverAsyncSidebarAndHiddenPanel();
testRetainableMainStillWinsOverVirtualGrid();
testWheelFallbackStopsAtConfiguredStepBound();
testFasterCanvasUsesExtendedWheelFallbackBudget();
testFasterCanvasWheelFallbackStopsAtDurationCap();

console.log('scroll container detection tests passed');
