const fs = require('fs');
const path = require('path');
const vm = require('vm');
const CONTENT_SOURCE_PATH = process.env.CONTENT_SOURCE || path.join(__dirname, 'content.js');

class FakeElement {
  constructor(tagName, options = {}) {
    this.tagName = tagName.toUpperCase();
    this.id = options.id || '';
    this.className = options.className || '';
    this.children = [];
    this.parentNode = null;
    this.style = {};
    this.attributes = {};
    this.listeners = {};
    this.scrollHeight = options.scrollHeight || 0;
    this.clientHeight = options.clientHeight || 0;
    this.scrollTop = options.scrollTop || 0;
    this.overflowY = options.overflowY || 'visible';
    this.rect = options.rect || { left: 0, top: 0, width: 0, height: 0, right: 0, bottom: 0 };
    this.classList = {
      add: (...names) => {
        const classes = new Set(this.className.split(/\s+/).filter(Boolean));
        names.forEach((name) => classes.add(name));
        this.className = Array.from(classes).join(' ');
      },
      remove: (...names) => {
        const classes = new Set(this.className.split(/\s+/).filter(Boolean));
        names.forEach((name) => classes.delete(name));
        this.className = Array.from(classes).join(' ');
      },
      toggle: (name, force) => {
        const classes = new Set(this.className.split(/\s+/).filter(Boolean));
        const shouldAdd = force === undefined ? !classes.has(name) : Boolean(force);
        if (shouldAdd) {
          classes.add(name);
        } else {
          classes.delete(name);
        }
        this.className = Array.from(classes).join(' ');
        return shouldAdd;
      },
      contains: (name) => this.className.split(/\s+/).includes(name)
    };
  }

  set innerHTML(value) {
    this._innerHTML = value;
    this.children = [];
    if (value.includes('scroll-icon')) {
      this.appendChild(new FakeElement('svg', { className: 'scroll-icon' }));
    }
    if (value.includes('psm-progress-fill')) {
      this.appendChild(new FakeElement('span', { className: 'psm-progress-fill' }));
    }
    if (value.includes('psm-progress-label')) {
      this.appendChild(new FakeElement('span', { className: 'psm-progress-label' }));
    }
    if (value.includes('psm-progress-hover-line')) {
      this.appendChild(new FakeElement('span', { className: 'psm-progress-hover-line' }));
    }
    if (value.includes('psm-progress-hover-tooltip')) {
      this.appendChild(new FakeElement('span', { className: 'psm-progress-hover-tooltip' }));
    }
    if (value.includes('psm-horizontal-progress-fill')) {
      this.appendChild(new FakeElement('div', { className: 'psm-horizontal-progress-fill' }));
    }
    if (value.includes('psm-horizontal-progress-label')) {
      this.appendChild(new FakeElement('span', { className: 'psm-horizontal-progress-label' }));
    }
  }

  get innerHTML() {
    return this._innerHTML || '';
  }

  appendChild(child) {
    child.parentNode = this;
    this.children.push(child);
    return child;
  }

  insertBefore(child, reference) {
    child.parentNode = this;
    const index = this.children.indexOf(reference);
    if (index === -1) {
      this.children.push(child);
    } else {
      this.children.splice(index, 0, child);
    }
    return child;
  }

  replaceChild(newChild, oldChild) {
    const index = this.children.indexOf(oldChild);
    if (index !== -1) {
      newChild.parentNode = this;
      this.children[index] = newChild;
      oldChild.parentNode = null;
    }
    return oldChild;
  }

  remove() {
    if (!this.parentNode) return;
    this.parentNode.children = this.parentNode.children.filter((child) => child !== this);
    this.parentNode = null;
  }

  attachShadow() {
    this.shadowRoot = new FakeElement('#shadow-root');
    return this.shadowRoot;
  }

  addEventListener(type, callback) {
    this.listeners[type] = this.listeners[type] || [];
    this.listeners[type].push(callback);
  }

  removeEventListener(type, callback) {
    this.listeners[type] = (this.listeners[type] || []).filter((listener) => listener !== callback);
  }

  setAttribute(name, value) {
    this.attributes[name] = value;
  }

  getAttribute(name) {
    return this.attributes[name] || null;
  }

  getBoundingClientRect() {
    return this.rect;
  }

  getElementById(id) {
    if (this.id === id) return this;
    for (const child of this.children) {
      const result = child.getElementById(id);
      if (result) return result;
    }
    return null;
  }

  querySelector(selector) {
    return this.querySelectorAll(selector)[0] || null;
  }

  querySelectorAll(selector) {
    const matches = [];
    const isClass = selector.startsWith('.');
    const wanted = isClass ? selector.slice(1) : selector;
    const walk = (element) => {
      const classNames = element.className.split(/\s+/).filter(Boolean);
      if ((isClass && classNames.includes(wanted)) || (!isClass && element.tagName.toLowerCase() === wanted)) {
        matches.push(element);
      }
      element.children.forEach(walk);
    };
    this.children.forEach(walk);
    return matches;
  }

  cloneNode(deep) {
    const clone = new FakeElement(this.tagName, {
      id: this.id,
      className: this.className,
      scrollHeight: this.scrollHeight,
      clientHeight: this.clientHeight,
      scrollTop: this.scrollTop,
      overflowY: this.overflowY,
      rect: this.rect
    });
    clone.style = { ...this.style };
    clone.attributes = { ...this.attributes };
    clone._innerHTML = this._innerHTML;
    if (deep) {
      this.children.forEach((child) => clone.appendChild(child.cloneNode(true)));
    }
    return clone;
  }
}

function createContext(syncData = {}) {
  const documentElement = new FakeElement('html', {
    scrollHeight: 2000,
    clientHeight: 800,
    overflowY: 'auto',
    rect: { left: 0, top: 0, right: 1000, bottom: 800, width: 1000, height: 800 }
  });
  const body = new FakeElement('body', {
    scrollHeight: 2000,
    clientHeight: 800,
    rect: { left: 0, top: 0, right: 1000, bottom: 800, width: 1000, height: 800 }
  });
  documentElement.appendChild(body);

  const documentListeners = {};
  const windowListeners = {};
  const document = {
    body,
    documentElement,
    scrollingElement: documentElement,
    readyState: 'complete',
    getElementById(id) {
      return body.getElementById(id);
    },
    createElement(tagName) {
      return new FakeElement(tagName);
    },
    querySelectorAll() {
      return [];
    },
    addEventListener(type, callback) {
      documentListeners[type] = documentListeners[type] || [];
      documentListeners[type].push(callback);
    },
    fullscreenElement: null
  };

  const sandbox = {
    document,
    window: {
      innerWidth: 1000,
      innerHeight: 800,
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
      addEventListener(type, callback) {
        windowListeners[type] = windowListeners[type] || [];
        windowListeners[type].push(callback);
      },
      removeEventListener(type, callback) {
        windowListeners[type] = (windowListeners[type] || []).filter((listener) => listener !== callback);
      }
    },
    chrome: {
      i18n: { getMessage: (key) => key },
      storage: {
        sync: {
          get(keys, callback) {
            const result = {};
            keys.forEach((key) => {
              if (syncData[key] !== undefined) result[key] = syncData[key];
            });
            callback(result);
          }
        },
        local: {
          get(keys, callback) {
            callback({ enableStates: {} });
          }
        },
        onChanged: { addListener() {} }
      },
      runtime: { onMessage: { addListener() {} } }
    },
    navigator: { platform: 'MacIntel', userAgent: 'Chrome' },
    performance: { now: () => 0 },
    requestAnimationFrame(callback) {
      callback(100);
      return 1;
    },
    cancelAnimationFrame() {},
    MutationObserver: class {
      observe() {}
    },
    setTimeout(callback) {
      callback();
      return 1;
    },
    clearTimeout() {},
    console,
    URL,
    Set,
    Number
  };

  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(CONTENT_SOURCE_PATH, 'utf8'), sandbox);
  return sandbox;
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function testDefaultCreatesOnlyTwoButtons() {
  const sandbox = createContext();
  const root = sandbox.getScrollRoot();
  const buttons = root.querySelectorAll('.psm-scroll-button');
  const styleElement = root.querySelector('style');
  assert(buttons.length === 2, 'default advanced settings should create exactly two buttons');
  assert(!root.querySelector('.psm-progress-button'), 'default settings should not create vertical progress button');
  assert(!root.getElementById('page-scroll-master-horizontal-progress'), 'default settings should not create horizontal progress bar');
  assert(
    styleElement.textContent.includes('padding: 0;'),
    'content button container must not add padding on top of edge distance'
  );
}

function testAdvancedSettingsMergeAndProgressMath() {
  const sandbox = createContext();
  const merged = sandbox.mergeAdvancedSettings({
    progressBar: { enabled: true, verticalHeight: 999, thickness: 5, customColor: 'nope' },
    iconCustomization: { iconColor: 'bad' }
  });
  assert(merged.progressBar.enabled === true, 'partial advanced settings are merged');
  assert(merged.progressBar.verticalHeight === 400, 'vertical height is clamped');
  assert(merged.progressBar.thickness === 4, 'invalid horizontal thickness falls back to 4');
  assert(merged.progressBar.customColor === '#4A9EDD', 'invalid progress color falls back');
  assert(merged.iconCustomization.iconColor === '#FFFFFF', 'invalid icon color falls back');
  sandbox.document.documentElement.scrollTop = 600;
  sandbox.window.pageYOffset = 600;
  assert(sandbox.getScrollProgress(sandbox.document.documentElement) === 0.5, 'root progress uses current scrollTop divided by range');
}

function testProgressClickRatios() {
  const sandbox = createContext();
  const container = sandbox.resolveScrollContainer();
  sandbox.handleHorizontalProgressClick({
    currentTarget: {
      getBoundingClientRect: () => ({ left: 0, width: 100 })
    },
    clientX: 75
  });
  assert(container.scrollTop === 900, 'horizontal click at 75% jumps to 75% of scroll range');

  sandbox.handleVerticalProgressClick({
    currentTarget: {
      getBoundingClientRect: () => ({ top: 0, height: 100 })
    },
    clientY: 20
  });
  assert(container.scrollTop === 240, 'vertical click near top maps to low page progress');
}

function testEnabledProgressDomModes() {
  let sandbox = createContext({
    advancedSettings: {
      progressBar: { enabled: true, mode: 'verticalButton', showPercentage: true }
    }
  });
  let root = sandbox.getScrollRoot();
  assert(Boolean(root.querySelector('.psm-progress-button')), 'vertical mode creates progress button');
  assert(root.querySelectorAll('.psm-scroll-button').length === 3, 'vertical mode inserts third button');

  sandbox = createContext({
    advancedSettings: {
      progressBar: { enabled: true, mode: 'horizontalBar', horizontalPosition: 'bottom' }
    }
  });
  root = sandbox.getScrollRoot();
  const bottomHorizontalBar = root.getElementById('page-scroll-master-horizontal-progress');
  assert(Boolean(bottomHorizontalBar), 'horizontal mode creates edge progress bar');
  sandbox.updateHorizontalProgressBar(0.4);
  assert(bottomHorizontalBar.classList.contains('psm-is-bottom'), 'bottom horizontal mode positions label above the bar');
  assert(!root.querySelector('.psm-progress-button'), 'horizontal mode does not create vertical progress button');
}

function testProgressHoverPreview() {
  let sandbox = createContext({
    advancedSettings: {
      progressBar: { enabled: true, mode: 'verticalButton', clickToJump: true }
    }
  });
  let root = sandbox.getScrollRoot();
  let progressButton = root.querySelector('.psm-progress-button');
  progressButton.rect = { left: 0, top: 10, width: 40, height: 120, right: 40, bottom: 130 };
  sandbox.handleVerticalProgressPointerMove({
    currentTarget: progressButton,
    clientY: 70
  });
  assert(progressButton.querySelector('.psm-progress-hover-line').style.top === '50%', 'vertical hover line follows pointer percentage');
  assert(progressButton.querySelector('.psm-progress-hover-tooltip').textContent === '50%', 'vertical hover tooltip shows target percentage');
  sandbox.hideProgressHoverPreview({ currentTarget: progressButton });
  assert(progressButton.querySelector('.psm-progress-hover-tooltip').style.display === 'none', 'vertical hover tooltip hides on leave');

  sandbox = createContext({
    advancedSettings: {
      progressBar: { enabled: true, mode: 'horizontalBar', clickToJump: true }
    }
  });
  root = sandbox.getScrollRoot();
  const horizontalBar = root.getElementById('page-scroll-master-horizontal-progress');
  horizontalBar.rect = { left: 20, top: 0, width: 200, height: 3, right: 220, bottom: 3 };
  sandbox.handleHorizontalProgressPointerMove({
    currentTarget: horizontalBar,
    clientX: 170
  });
  assert(horizontalBar.querySelector('.psm-progress-hover-line').style.left === '75%', 'horizontal hover line follows pointer percentage');
  assert(horizontalBar.querySelector('.psm-progress-hover-tooltip').textContent === '75%', 'horizontal hover tooltip shows target percentage');

  sandbox = createContext({
    advancedSettings: {
      progressBar: { enabled: true, mode: 'horizontalBar', clickToJump: false }
    }
  });
  root = sandbox.getScrollRoot();
  const disabledHorizontalBar = root.getElementById('page-scroll-master-horizontal-progress');
  disabledHorizontalBar.querySelector('.psm-progress-hover-tooltip').style.display = 'block';
  sandbox.updateHorizontalProgressBar(0.2);
  assert(disabledHorizontalBar.querySelector('.psm-progress-hover-tooltip').style.display === 'none', 'hover preview hides when click jump is disabled');
}

function testRemainingReadingTimeLabels() {
  let sandbox = createContext({
    advancedSettings: {
      progressBar: { enabled: true, mode: 'verticalButton', showRemainingTime: true }
    }
  });
  sandbox.document.body.textContent = '测试'.repeat(1000);
  let root = sandbox.getScrollRoot();
  let progressButton = root.querySelector('.psm-progress-button');
  sandbox.updateVerticalProgressButton(0.5);
  assert(progressButton.querySelector('.psm-progress-label').textContent === '50%\n2m', 'vertical progress label shows percentage and remaining reading time');

  sandbox = createContext({
    advancedSettings: {
      progressBar: { enabled: true, mode: 'horizontalBar', showPercentage: true, showRemainingTime: true }
    }
  });
  sandbox.document.body.textContent = 'word '.repeat(900);
  root = sandbox.getScrollRoot();
  const horizontalBar = root.getElementById('page-scroll-master-horizontal-progress');
  sandbox.updateHorizontalProgressBar(0.5);
  assert(horizontalBar.querySelector('.psm-horizontal-progress-label').textContent === '50% · 2m', 'horizontal progress label combines percentage and remaining time');
  assert(sandbox.estimateReadingSecondsFromText('word '.repeat(225)) === 60, 'latin reading estimate uses words per minute');
}

testDefaultCreatesOnlyTwoButtons();
testAdvancedSettingsMergeAndProgressMath();
testProgressClickRatios();
testEnabledProgressDomModes();
testProgressHoverPreview();
testRemainingReadingTimeLabels();

console.log('progress bar tests passed');
