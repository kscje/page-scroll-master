const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ROOT = path.join(__dirname, '..');
const CONTENT_SOURCE_PATH = process.env.CONTENT_SOURCE || path.join(ROOT, 'content.js');

class FakeElement {
  constructor(tagName, options = {}) {
    this.tagName = tagName.toUpperCase();
    this.id = options.id || '';
    this.className = options.className || '';
    this.textContent = options.textContent || '';
    this.innerText = options.innerText || '';
    this.children = [];
    this.parentNode = null;
    this.style = {};
    this.attributes = {};
    this.listeners = {};
    this.scrollHeight = options.scrollHeight || 0;
    this.clientHeight = options.clientHeight || 0;
    this.scrollTop = options.scrollTop || 0;
    this.overflowY = options.overflowY || 'visible';
    this.display = options.display || 'block';
    this.visibility = options.visibility || 'visible';
    this.rect = options.rect || { left: 0, top: 0, width: 200, height: 24, right: 200, bottom: 24 };
    this.offsetParent = options.offsetParent === undefined ? {} : options.offsetParent;
    this.isConnected = options.isConnected !== false;
    this.queryCount = 0;
    if (this.id) this.attributes.id = this.id;
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
    if (value.includes('<span')) {
      this.appendChild(new FakeElement('span'));
    }
    const buttonPattern = /<button([^>]*)>([^<]*)<\/button>/g;
    let buttonMatch = buttonPattern.exec(value);
    while (buttonMatch) {
      const attributes = buttonMatch[1] || '';
      const button = new FakeElement('button');
      const actionMatch = attributes.match(/data-action="([^"]+)"/);
      const actionIndexMatch = attributes.match(/data-action-index="([^"]+)"/);
      if (actionMatch) button.setAttribute('data-action', actionMatch[1]);
      if (actionIndexMatch) button.setAttribute('data-action-index', actionIndexMatch[1]);
      button.textContent = buttonMatch[2] || '';
      this.appendChild(button);
      buttonMatch = buttonPattern.exec(value);
    }
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
    child.parentElement = this;
    this.children.push(child);
    return child;
  }

  insertBefore(child, reference) {
    child.parentNode = this;
    this.children = this.children.filter((existing) => existing !== child);
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

  removeAttribute(name) {
    delete this.attributes[name];
  }

  getAttribute(name) {
    return this.attributes[name] || null;
  }

  scrollIntoView(options) {
    this.scrollIntoViewOptions = options || {};
  }

  getBoundingClientRect() {
    return this.rect;
  }

  getClientRects() {
    return this.rect.width > 0 || this.rect.height > 0 ? [this.rect] : [];
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
    this.queryCount++;
    const matches = [];
    const selectors = selector.split(',').map((part) => part.trim());
    const walk = (element) => {
      const classNames = element.className.split(/\s+/).filter(Boolean);
      const tagName = element.tagName.toLowerCase();
      const isHeading = ['h1', 'h2', 'h3'].includes(tagName);
      const matchesSelector = selectors.some((part) => {
        if (part.startsWith('.')) return classNames.includes(part.slice(1));
        if (part === '[role="main"]') return element.getAttribute('role') === 'main';
        if (part === '[id]:not(h1):not(h2):not(h3)') {
          return Boolean(element.getAttribute('id')) && !isHeading;
        }
        return tagName === part;
      });
      if (matchesSelector) {
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

function createContext(syncData = {}, initialLocalData = {}) {
  const localData = {
    enableStates: {},
    ...JSON.parse(JSON.stringify(initialLocalData))
  };
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
  const mutationObservers = [];
  const runtimeMessageListeners = [];
  const location = {
    href: 'https://example.test/docs?page=1&utm_source=newsletter&ref=keep#section',
    hostname: 'example.test'
  };
  const updateLocation = (url) => {
    const nextUrl = new URL(url, location.href);
    location.href = nextUrl.href;
    location.hostname = nextUrl.hostname;
    location.hash = nextUrl.hash;
  };
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
      location,
      history: {
        pushState(state, title, url) {
          if (url !== undefined && url !== null) updateLocation(url);
        },
        replaceState(state, title, url) {
          if (url !== undefined && url !== null) updateLocation(url);
        }
      },
      scrollTo(x, y) {
        this.pageYOffset = y;
        documentElement.scrollTop = y;
        body.scrollTop = y;
      },
      getComputedStyle(element) {
        return {
          overflowY: element.overflowY,
          display: element.display,
          visibility: element.visibility
        };
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
            const result = {};
            keys.forEach((key) => {
              if (localData[key] !== undefined) result[key] = localData[key];
            });
            callback(result);
          },
          set(data, callback) {
            Object.assign(localData, JSON.parse(JSON.stringify(data)));
            if (callback) callback();
          },
          remove(key, callback) {
            delete localData[key];
            if (callback) callback();
          }
        },
        onChanged: { addListener() {} }
      },
      runtime: {
        onMessage: {
          addListener(callback) {
            runtimeMessageListeners.push(callback);
          }
        }
      }
    },
    navigator: { platform: 'MacIntel', userAgent: 'Chrome' },
    performance: { now: () => 0 },
    requestAnimationFrame(callback) {
      callback(100);
      return 1;
    },
    cancelAnimationFrame() {},
    MutationObserver: class {
      constructor(callback) {
        this.callback = callback;
        mutationObservers.push(this);
      }

      observe(target, options) {
        this.target = target;
        this.options = options;
      }
    },
    setTimeout(callback) {
      callback();
      return 1;
    },
    clearTimeout() {},
    console,
    URL,
    URLSearchParams,
    Set,
    Number
  };

  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(CONTENT_SOURCE_PATH, 'utf8'), sandbox);
  sandbox.__localData = localData;
  sandbox.__documentListeners = documentListeners;
  sandbox.__windowListeners = windowListeners;
  sandbox.__mutationObservers = mutationObservers;
  sandbox.__runtimeMessageListeners = runtimeMessageListeners;
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

function testIconSizingSurvivesIconRebuild() {
  const sandbox = createContext();
  const root = sandbox.getScrollRoot();
  const topIcon = root.querySelector('.psm-scroll-top').querySelector('.scroll-icon');
  assert(topIcon.style.width === '40%', 'default icon size is applied after initial render');

  sandbox.applyButtonIcons();

  const rebuiltTopIcon = root.querySelector('.psm-scroll-top').querySelector('.scroll-icon');
  assert(rebuiltTopIcon.style.width === '40%', 'rebuilt icon keeps computed width instead of falling back to CSS');
  assert(rebuiltTopIcon.style.height === '40%', 'rebuilt icon keeps computed height instead of falling back to CSS');
  assert(
    root.querySelector('style').textContent.includes('width: 40%;'),
    'content CSS fallback must match default computed icon size'
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
  assert(merged.outlineNavigation.enabled === false, 'outline navigation is disabled by default');
  assert(merged.outlineNavigation.sources.h1 === true && merged.outlineNavigation.sources.h2 === true, 'old settings receive default H1 and H2 sources');
  assert(merged.outlineNavigation.maxItems === 30, 'old settings receive the default outline batch size');
  assert(merged.scrollBookmarks.restoreMode === 'prompt', 'scroll bookmark restore mode defaults to prompt');

  const lowerLimit = sandbox.mergeAdvancedSettings({
    outlineNavigation: { maxItems: 1 }
  });
  const upperLimit = sandbox.mergeAdvancedSettings({
    outlineNavigation: { maxItems: 100 }
  });
  const invalidLimit = sandbox.mergeAdvancedSettings({
    outlineNavigation: { maxItems: 'invalid' }
  });
  assert(lowerLimit.outlineNavigation.maxItems === 10, 'outline batch size clamps to 10');
  assert(upperLimit.outlineNavigation.maxItems === 50, 'outline batch size clamps to 50');
  assert(invalidLimit.outlineNavigation.maxItems === 30, 'invalid outline batch size falls back to 30');

  const restoredSources = sandbox.mergeAdvancedSettings({
    outlineNavigation: {
      sources: { h1: false, h2: false, h3: false, idBlocks: false }
    }
  });
  assert(restoredSources.outlineNavigation.sources.h1 === true && restoredSources.outlineNavigation.sources.h2 === true, 'empty outline sources restore H1 and H2');

  const explicitOutline = sandbox.mergeAdvancedSettings({
    readingTools: { features: { outlineNavigation: false } },
    outlineNavigation: { enabled: true }
  });
  assert(explicitOutline.outlineNavigation.enabled === true, 'explicit outline settings win over legacy reading tool feature state');
  const migratedFeature = sandbox.mergeAdvancedSettings({
    readingTools: { features: { outlineNavigation: true } }
  });
  assert(migratedFeature.outlineNavigation.enabled === true, 'legacy reading tool feature state migrates to outline settings');
  const migratedBookmarkFeature = sandbox.mergeAdvancedSettings({
    readingTools: { enabled: true, buttonPosition: 'betweenScrollButtons', features: { scrollBookmarks: true } }
  });
  assert(migratedBookmarkFeature.scrollBookmarks.enabled === true, 'legacy reading tool state migrates to scroll bookmark settings');
  assert(migratedBookmarkFeature.scrollBookmarks.buttonPosition === 'betweenScrollButtons', 'legacy reading tool position migrates to scroll bookmark settings');
  const migratedProgressColors = sandbox.mergeAdvancedSettings({
    scrollBookmarks: { buttonColorMode: 'followProgressBar' },
    outlineNavigation: { buttonColorMode: 'followProgressBar' }
  });
  assert(migratedProgressColors.scrollBookmarks.buttonColorMode === 'followTopButton', 'legacy bookmark progress color migrates to top button color');
  assert(migratedProgressColors.outlineNavigation.buttonColorMode === 'followTopButton', 'legacy outline progress color migrates to top button color');
  const migratedManualRestore = sandbox.mergeAdvancedSettings({
    scrollBookmarks: { restorePromptEnabled: false }
  });
  assert(migratedManualRestore.scrollBookmarks.restoreMode === 'manual', 'disabled legacy restore prompts migrate to manual mode');
  const limitSandbox = createContext({
    advancedSettings: {
      scrollBookmarks: { perDomainLimit: 2 }
    }
  });
  assert(limitSandbox.mergeAdvancedSettings({
    scrollBookmarks: { perDomainLimit: 2 }
  }).scrollBookmarks.perDomainLimit === 2, 'scroll bookmark per-domain limit accepts 2');
  const limitedBookmarks = limitSandbox.enforceBookmarkLimits({
    'exact:https://example.test/old': { domain: 'example.test', savedAt: 1000 },
    'exact:https://example.test/middle': { domain: 'example.test', savedAt: 2000 },
    'exact:https://example.test/new': { domain: 'example.test', savedAt: 3000 }
  }, 'exact:https://example.test/new');
  assert(Object.keys(limitedBookmarks).length === 2, 'per-domain limit 2 keeps two bookmarks');
  assert(!limitedBookmarks['exact:https://example.test/old'], 'per-domain limit 2 removes the oldest bookmark');
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
  assert(root.querySelector('.psm-scroll-top').style.borderRadius === '50%', 'round top button keeps circular radius');
  assert(root.querySelector('.psm-progress-button').style.borderRadius === '999px', 'round vertical progress button uses pill radius');

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

function testReadingToolsDomAndBookmarks() {
  let sandbox = createContext({
    advancedSettings: {
      scrollBookmarks: { enabled: true, buttonPosition: 'pageBottom', buttonColorMode: 'followTopButton' }
    }
  });
  let root = sandbox.getScrollRoot();
  const standalone = root.getElementById('page-scroll-master-bookmark-tool');
  assert(Boolean(standalone), 'enabled scroll bookmarks create a standalone container');
  assert(Boolean(root.querySelector('.psm-bookmark-tool-button')), 'enabled scroll bookmarks create the bookmark button');
  assert(root.querySelectorAll('.psm-scroll-button').length === 3, 'standalone bookmark tool adds one button without progress');
  assert(root.querySelector('.psm-bookmark-tool-button').style.backgroundColor === '#4A9EDD', 'bookmark tool follows top button color');
  assert(standalone.style.bottom === '8px', 'page-bottom bookmark tool uses edge distance when scroll buttons are centered');

  sandbox = createContext({
    buttonSettings: { verticalAlignment: 'top' },
    advancedSettings: {
      scrollBookmarks: { enabled: true, buttonPosition: 'pageTop' }
    }
  });
  root = sandbox.getScrollRoot();
  assert(root.getElementById('page-scroll-master-bookmark-tool').style.top === '104px', 'page-top bookmark tool avoids top-aligned scroll buttons on the same side');

  sandbox = createContext({
    advancedSettings: {
      progressBar: { enabled: true, mode: 'verticalButton' },
      scrollBookmarks: { enabled: true, buttonPosition: 'betweenScrollButtons' }
    }
  });
  root = sandbox.getScrollRoot();
  const classOrder = root.getElementById('page-scroll-master-button').children.map((child) => child.className);
  assert(classOrder[0].includes('psm-scroll-top'), 'between mode keeps top button first');
  assert(classOrder[1].includes('psm-progress-button'), 'between mode keeps vertical progress below top button');
  assert(classOrder[2].includes('psm-bookmark-tool-button'), 'between mode places bookmark tool below vertical progress');
  assert(classOrder[3].includes('psm-scroll-bottom'), 'between mode keeps bottom button last');

  const normalized = sandbox.normalizeBookmarkUrl('https://example.test/docs?utm_source=x&page=1&fbclid=y&source=keep#part');
  assert(normalized === 'https://example.test/docs?page=1&source=keep#part', 'bookmark URL normalization only removes explicit tracking params and keeps source/hash');

  sandbox.document.documentElement.scrollTop = 600;
  sandbox.window.pageYOffset = 600;
  sandbox.saveScrollBookmark();
  const saved = sandbox.__localData.bookmarks;
  const keys = Object.keys(saved || {});
  assert(keys.length === 1, 'saving current position writes one bookmark');
  assert(keys[0] === 'exact:https://example.test/docs?page=1&ref=keep#section', 'bookmark key keeps non-tracking params and hash');
  assert(saved[keys[0]].scrollPct === 0.5, 'saved bookmark stores scroll percentage');
}

function testReadingToolMenuSaveAndRestorePrompt() {
  const sandbox = createContext({
    advancedSettings: {
      scrollBookmarks: { enabled: true, buttonPosition: 'pageBottom', restoreMode: 'prompt' }
    }
  });
  const root = sandbox.getScrollRoot();
  const button = root.querySelector('.psm-bookmark-tool-button');
  button.rect = { left: 940, top: 700, width: 40, height: 40, right: 980, bottom: 740 };

  sandbox.document.documentElement.scrollTop = 360;
  sandbox.window.pageYOffset = 360;
  sandbox.handleBookmarkToolClick({ stopPropagation() {} });
  const menu = root.getElementById('page-scroll-master-bookmark-menu');
  const fixedSection = menu.querySelector('.psm-reading-menu-fixed');
  const outlineSection = menu.querySelector('.psm-reading-menu-outline');
  assert(fixedSection.children.length === 2, 'bookmark feature contributes save and restore actions');
  assert(!fixedSection.children.some((child) => child.getAttribute('data-action') === 'manage-bookmarks'), 'bookmark menu does not include a manage bookmarks action');
  assert(outlineSection.children.length === 0, 'outline section remains empty until outline actions are implemented');
  const saveButton = fixedSection.children.find((child) => child.getAttribute('data-action') === 'save-bookmark');
  menu.listeners.click[0]({ stopPropagation() {}, target: saveButton });
  assert(Object.keys(sandbox.__localData.bookmarks || {}).length === 1, 'bookmark menu save action stores the current position');

  sandbox.document.documentElement.scrollTop = 0;
  sandbox.window.pageYOffset = 0;
  const key = 'exact:https://example.test/docs?page=1&ref=keep#section';
  sandbox.__localData.bookmarks = {
    [key]: {
      normalizedUrl: 'https://example.test/docs?page=1&ref=keep#section',
      domain: 'example.test',
      scrollPct: 0.25,
      savedAt: Date.now()
    }
  };

  sandbox.handleBookmarkToolClick({ stopPropagation() {} });
  const restoreButton = fixedSection.children.find((child) => child.getAttribute('data-action') === 'restore-bookmark');
  menu.listeners.click[0]({ stopPropagation() {}, target: restoreButton });
  assert(sandbox.window.pageYOffset === 300, 'manual restore loads the saved percentage after reopening the page');

  sandbox.document.documentElement.scrollTop = 0;
  sandbox.window.pageYOffset = 0;
  sandbox.checkRestorePrompt();
  const toast = root.getElementById('page-scroll-master-bookmark-toast');
  assert(toast.classList.contains('psm-open'), 'restore prompt shows a toast when a matching bookmark exists');
  assert(sandbox.window.pageYOffset === 0, 'restore prompt does not scroll before the user chooses continue');
  const continueButton = toast.children.find((child) => child.getAttribute('data-action-index') === '0');
  continueButton.listeners.click[0]({ stopPropagation() {} });
  assert(sandbox.window.pageYOffset === 300, 'clicking continue restores by saved percentage');

  delete sandbox.__localData.bookmarks[key];
  sandbox.document.documentElement.scrollTop = 0;
  sandbox.window.pageYOffset = 0;
  sandbox.handleBookmarkToolClick({ stopPropagation() {} });
  const missingRestoreButton = fixedSection.children.find((child) => child.getAttribute('data-action') === 'restore-bookmark');
  menu.listeners.click[0]({ stopPropagation() {}, target: missingRestoreButton });
  assert(toast.querySelector('span').textContent === '当前页面没有可加载的已保存位置', 'manual restore explains when the current page has no bookmark');
}

function testScrollBookmarkRestoreModes() {
  const key = 'exact:https://example.test/docs?page=1&ref=keep#section';
  const bookmark = {
    normalizedUrl: 'https://example.test/docs?page=1&ref=keep#section',
    domain: 'example.test',
    scrollPct: 0.25,
    savedAt: Date.now()
  };
  const automatic = createContext(
    {
      advancedSettings: {
        scrollBookmarks: { enabled: true, restoreMode: 'auto' }
      }
    },
    {
      bookmarks: { [key]: bookmark }
    }
  );
  assert(automatic.window.pageYOffset === 300, 'automatic mode loads the latest matching bookmark');
  automatic.document.documentElement.scrollTop = 0;
  automatic.window.pageYOffset = 0;
  automatic.checkBookmarkRestoreOnOpen();
  assert(automatic.window.pageYOffset === 0, 'automatic mode only runs once per page URL lifecycle');

  const manual = createContext({
    advancedSettings: {
      scrollBookmarks: { enabled: true, restoreMode: 'manual' }
    }
  });
  manual.__localData.bookmarks = { [key]: bookmark };
  manual.checkBookmarkRestoreOnOpen();
  const root = manual.getScrollRoot();
  const toast = root.getElementById('page-scroll-master-bookmark-toast');
  assert(manual.window.pageYOffset === 0, 'manual mode does not restore on page open');
  assert(!toast || !toast.classList.contains('psm-open'), 'manual mode does not show a restore prompt');
}

function testOptionsPageOpenRestoresSavedBookmark() {
  const sandbox = createContext({
    advancedSettings: {
      scrollBookmarks: { enabled: false, restoreMode: 'manual' }
    }
  });
  const key = 'exact:https://example.test/docs?page=1&ref=keep#section';
  sandbox.__localData.bookmarks = {
    [key]: {
      normalizedUrl: 'https://example.test/docs?page=1&ref=keep#section',
      domain: 'example.test',
      scrollPct: 0.4,
      savedAt: Date.now()
    }
  };
  sandbox.__localData.pendingScrollBookmarkRestore = {
    key,
    requestedAt: Date.now()
  };

  sandbox.document.documentElement.scrollTop = 0;
  sandbox.window.pageYOffset = 0;
  sandbox.checkPendingScrollBookmarkRestore(() => {});

  assert(sandbox.window.pageYOffset === 480, 'options-page open request restores the saved percentage');
  assert(!sandbox.__localData.pendingScrollBookmarkRestore, 'successful options-page restore consumes the one-time request');
}

function testDynamicReadingToolMenuStructure() {
  const sandbox = createContext({
    advancedSettings: {
      scrollBookmarks: { enabled: false },
      outlineNavigation: {
        enabled: false
      }
    }
  });
  const root = sandbox.getScrollRoot();
  assert(!root.querySelector('.psm-bookmark-tool-button'), 'disabled bookmarks do not expose a bookmark button');
  assert(!root.querySelector('.psm-outline-tool-button'), 'disabled outline navigation does not expose an outline button');
  assert(sandbox.getScrollBookmarkMenuModel().fixedActions.length === 0, 'disabled bookmarks contribute no fixed actions');
  assert(sandbox.getOutlineMenuModel().outlineEnabled === false, 'disabled outline contributes no outline menu');
}

function testOutlineDisabledBookmarkMenuDoesNotScanOrRenderOutline() {
  const sandbox = createContext({
    advancedSettings: {
      scrollBookmarks: { enabled: true },
      outlineNavigation: {
        enabled: false
      }
    }
  });
  const root = sandbox.getScrollRoot();
  sandbox.document.body.appendChild(new FakeElement('h1', {
    id: 'intro',
    textContent: 'Introduction',
    rect: { left: 0, top: 120, right: 400, bottom: 144, width: 400, height: 24 }
  }));

  sandbox.handleBookmarkToolClick({ stopPropagation() {} });

  const menu = root.getElementById('page-scroll-master-bookmark-menu');
  assert(menu.classList.contains('psm-open'), 'bookmark-only reading menu still opens when outline is disabled');
  assert(menu.querySelector('.psm-reading-menu-fixed').children.length === 2, 'bookmark-only menu keeps save and restore actions');
  assert(menu.querySelector('.psm-reading-menu-outline').children.length === 0, 'disabled outline renders no outline section content');
  assert(sandbox.document.body.queryCount === 0, 'disabled outline does not scan headings when opening bookmark-only menu');
}

function testOutlineMenuListRendering() {
  const sandbox = createContext({
    advancedSettings: {
      outlineNavigation: {
        enabled: true
      }
    }
  });
  const root = sandbox.getScrollRoot();
  const button = root.querySelector('.psm-outline-tool-button');
  sandbox.document.body.appendChild(new FakeElement('h1', {
    id: 'intro',
    textContent: 'Introduction',
    rect: { left: 0, top: 120, right: 400, bottom: 144, width: 400, height: 24 }
  }));
  sandbox.document.body.appendChild(new FakeElement('h2', {
    textContent: 'API Reference',
    rect: { left: 0, top: 520, right: 400, bottom: 544, width: 400, height: 24 }
  }));

  assert(Boolean(button), 'outline-only settings expose the outline tool button');
  assert(sandbox.document.body.queryCount === 0, 'outline headings are not scanned during button initialization');
  sandbox.handleOutlineToolClick({ stopPropagation() {} });

  const menu = root.getElementById('page-scroll-master-outline-menu');
  const fixedSection = menu.querySelector('.psm-reading-menu-fixed');
  const outlineSection = menu.querySelector('.psm-reading-menu-outline');
  assert(fixedSection.children.length === 2, 'outline-only mode renders previous and next fixed actions');
  assert(fixedSection.children[0].textContent === '上一段', 'previous outline action uses the specified label');
  assert(fixedSection.children[0].disabled === true, 'previous outline action is disabled at the first section boundary');
  assert(fixedSection.children[0].getAttribute('aria-disabled') === 'true', 'disabled previous action exposes aria-disabled');
  assert(fixedSection.children[1].textContent === '下一段', 'next outline action uses the specified label');
  assert(fixedSection.children[1].disabled !== true, 'next outline action is enabled when a following section exists');
  assert(outlineSection.children.length === 3, 'outline menu renders heading and filtered outline items');
  assert(outlineSection.children[0].textContent === '页面目录', 'outline section starts with its heading');
  assert(outlineSection.children[1].tagName === 'BUTTON', 'outline entries render as interactive buttons');
  assert(outlineSection.children[1].textContent === 'Introduction', 'outline entry preserves its filtered text');
  assert(outlineSection.children[1].title === 'Introduction', 'outline entry exposes its full accessible title');
  assert(outlineSection.children[1].getAttribute('data-outline-id') === 'intro', 'outline entry carries its snapshot id');
  assert(outlineSection.children[1].getAttribute('data-outline-level') === '1', 'H1 outline entries expose their heading level');
  assert(outlineSection.children[1].classList.contains('psm-outline-current'), 'outline entry at the reading anchor is highlighted');
  assert(outlineSection.children[1].getAttribute('aria-current') === 'location', 'current outline entry exposes aria-current');
  assert(
    outlineSection.children[1].scrollIntoViewOptions.block === 'nearest',
    'opening the menu scrolls the current outline entry into view'
  );
  assert(outlineSection.children[2].getAttribute('data-outline-order') === '1', 'outline entry carries its snapshot order');
  assert(sandbox.document.body.queryCount === 2, 'opening the menu performs one content-root lookup and one outline scan');
}

function testOutlineMenuRootPageJump() {
  const sandbox = createContext({
    scrollSpeed: 100,
    advancedSettings: {
      readingTools: {
        enabled: true,
        features: { scrollBookmarks: false, outlineNavigation: true }
      },
      outlineNavigation: { enabled: true }
    }
  });
  const root = sandbox.getScrollRoot();
  const target = new FakeElement('h2', {
    id: 'root-target',
    textContent: 'Root target',
    rect: { left: 0, top: 500, right: 400, bottom: 524, width: 400, height: 24 }
  });
  sandbox.document.body.appendChild(target);
  sandbox.document.documentElement.scrollTop = 300;
  sandbox.window.pageYOffset = 300;

  sandbox.handleReadingToolClick({ stopPropagation() {} });
  const menu = root.getElementById('page-scroll-master-reading-menu');
  const targetButton = menu.querySelector('.psm-reading-menu-outline').children[1];
  const host = sandbox.document.getElementById('page-scroll-master-host');
  sandbox.__documentListeners.click[0]({
    target: host,
    composedPath() {
      return [targetButton, menu, root, host, sandbox.document];
    }
  });
  assert(menu.classList.contains('psm-open'), 'document capture ignores outline clicks inside the extension shadow root');
  menu.listeners.click[0]({ stopPropagation() {}, target: targetButton });

  assert(sandbox.window.pageYOffset === 784, 'root outline jump uses current page scroll plus target viewport position and offset');
  assert(menu.classList.contains('psm-open'), 'outline jump keeps the reading tool menu open');
  sandbox.__documentListeners.click[0]({
    target: sandbox.document.body,
    composedPath() {
      return [sandbox.document.body, sandbox.document.documentElement, sandbox.document];
    }
  });
  assert(!menu.classList.contains('psm-open'), 'clicking the page outside the extension closes the outline menu');
  sandbox.handleReadingToolClick({ stopPropagation() {} });
  const closeButton = menu.querySelector('.psm-reading-menu-close');
  menu.listeners.click[0]({ stopPropagation() {}, target: closeButton });
  assert(!menu.classList.contains('psm-open'), 'outline menu closes from its explicit close button');
}

function testPinnedOutlineMenuOnlyClosesExplicitly() {
  const sandbox = createContext({
    advancedSettings: {
      outlineNavigation: { enabled: true }
    }
  });
  const root = sandbox.getScrollRoot();
  sandbox.document.body.appendChild(new FakeElement('h1', {
    id: 'intro',
    textContent: 'Introduction',
    rect: { left: 0, top: 120, right: 400, bottom: 144, width: 400, height: 24 }
  }));

  sandbox.handleOutlineToolClick({ stopPropagation() {} });
  const menu = root.getElementById('page-scroll-master-outline-menu');
  let pinButton = menu.querySelector('.psm-reading-menu-pin');
  assert(pinButton.getAttribute('aria-pressed') === 'false', 'outline menu starts unpinned');
  const pinIconPath = new FakeElement('path');
  pinButton.appendChild(pinIconPath);
  menu.listeners.click[0]({
    stopPropagation() {},
    target: pinIconPath,
    composedPath() {
      return [pinIconPath, pinButton, menu];
    }
  });

  pinButton = menu.querySelector('.psm-reading-menu-pin');
  assert(menu.__psmPinned === true, 'SVG pin click stores pinned state on the current menu');
  assert(menu.classList.contains('psm-pinned'), 'pinned outline menu exposes its visual state');
  assert(pinButton.getAttribute('aria-pressed') === 'true', 'pinned button exposes pressed state');

  sandbox.__documentListeners.click[0]({
    target: sandbox.document.body,
    composedPath() {
      return [sandbox.document.body, sandbox.document.documentElement, sandbox.document];
    }
  });
  assert(menu.classList.contains('psm-open'), 'page clicks do not close a pinned outline menu');

  sandbox.handleOutlineToolClick({ stopPropagation() {} });
  assert(menu.classList.contains('psm-open'), 'outline tool button does not close a pinned menu');

  pinButton = menu.querySelector('.psm-reading-menu-pin');
  menu.listeners.click[0]({ stopPropagation() {}, target: pinButton });
  assert(menu.__psmPinned === false, 'pin action can restore the unpinned state');
  sandbox.__documentListeners.click[0]({
    target: sandbox.document.body,
    composedPath() {
      return [sandbox.document.body, sandbox.document.documentElement, sandbox.document];
    }
  });
  assert(!menu.classList.contains('psm-open'), 'page clicks close the outline menu after unpinning');

  sandbox.handleOutlineToolClick({ stopPropagation() {} });
  pinButton = menu.querySelector('.psm-reading-menu-pin');
  menu.listeners.click[0]({ stopPropagation() {}, target: pinButton });
  const closeButton = menu.querySelector('.psm-reading-menu-close');
  menu.listeners.click[0]({ stopPropagation() {}, target: closeButton });
  assert(!menu.classList.contains('psm-open'), 'explicit close button closes a pinned outline menu');
}

function testOutlineMenuCustomContainerJump() {
  const container = new FakeElement('main', {
    scrollHeight: 5000,
    clientHeight: 600,
    scrollTop: 200,
    overflowY: 'auto',
    rect: { left: 0, top: 100, right: 900, bottom: 700, width: 900, height: 600 }
  });
  const target = new FakeElement('h2', {
    id: 'custom-target',
    textContent: 'Custom target',
    rect: { left: 0, top: 460, right: 400, bottom: 484, width: 400, height: 24 }
  });
  container.appendChild(target);
  const sandbox = createContext({
    scrollSpeed: 100,
    advancedSettings: {
      readingTools: {
        enabled: true,
        features: { scrollBookmarks: false, outlineNavigation: true }
      },
      outlineNavigation: { enabled: true }
    }
  });
  sandbox.document.body.appendChild(container);
  sandbox.document.querySelectorAll = () => [container];
  const root = sandbox.getScrollRoot();

  sandbox.handleReadingToolClick({ stopPropagation() {} });
  const menu = root.getElementById('page-scroll-master-reading-menu');
  const targetButton = menu.querySelector('.psm-reading-menu-outline').children[1];
  menu.listeners.click[0]({ stopPropagation() {}, target: targetButton });

  assert(container.scrollTop === 544, 'custom container jump uses target position relative to the container and offset');
  assert(sandbox.window.pageYOffset === 0, 'custom container jump does not scroll the root page');
  assert(menu.classList.contains('psm-open'), 'custom-container outline jump keeps the menu open');
}

function testOutlineMenuAdjacentActionJumpAndBoundaryState() {
  const sandbox = createContext({
    scrollSpeed: 100,
    advancedSettings: {
      readingTools: {
        enabled: true,
        features: { scrollBookmarks: false, outlineNavigation: true }
      },
      outlineNavigation: { enabled: true }
    }
  });
  const root = sandbox.getScrollRoot();
  const first = new FakeElement('h1', {
    textContent: 'First section',
    rect: { left: 0, top: -384, right: 400, bottom: -360, width: 400, height: 24 }
  });
  const second = new FakeElement('h2', {
    textContent: 'Second section',
    rect: { left: 0, top: 16, right: 400, bottom: 40, width: 400, height: 24 }
  });
  const third = new FakeElement('h2', {
    textContent: 'Third section',
    rect: { left: 0, top: 416, right: 400, bottom: 440, width: 400, height: 24 }
  });
  [first, second, third].forEach((element) => sandbox.document.body.appendChild(element));
  sandbox.document.documentElement.scrollTop = 484;
  sandbox.window.pageYOffset = 484;

  sandbox.handleReadingToolClick({ stopPropagation() {} });
  const menu = root.getElementById('page-scroll-master-reading-menu');
  const fixedSection = menu.querySelector('.psm-reading-menu-fixed');
  const previousButton = fixedSection.children[0];
  const nextButton = fixedSection.children[1];
  assert(previousButton.disabled !== true, 'previous outline action is enabled after the first section');
  assert(nextButton.disabled !== true, 'next outline action is enabled before the last section');

  menu.listeners.click[0]({ stopPropagation() {}, target: previousButton });
  assert(sandbox.window.pageYOffset === 84, 'previous outline action reuses outline jump coordinates and reading offset');
  assert(menu.classList.contains('psm-open'), 'previous outline action keeps the reading tool menu open');

  first.rect.top = 16;
  second.rect.top = 416;
  third.rect.top = 816;
  sandbox.updateOutlineCurrentHighlight(menu, menu.__psmMenuModel);
  assert(previousButton.disabled === true, 'adjacent action state updates after jumping to the first section');
  assert(nextButton.disabled !== true, 'next action becomes available after the current section changes');
  menu.listeners.click[0]({ stopPropagation() {}, target: nextButton });
  assert(sandbox.window.pageYOffset === 484, 'next outline action recalculates its target after the previous jump');
  assert(menu.classList.contains('psm-open'), 'next outline action keeps the reading tool menu open');

  const closeButton = menu.querySelector('.psm-reading-menu-close');
  menu.listeners.click[0]({ stopPropagation() {}, target: closeButton });

  sandbox.window.pageYOffset = 884;
  sandbox.document.documentElement.scrollTop = 884;
  first.rect.top = -784;
  second.rect.top = -384;
  third.rect.top = 16;
  sandbox.handleReadingToolClick({ stopPropagation() {} });
  const lastMenu = root.getElementById('page-scroll-master-reading-menu');
  const lastFixedSection = lastMenu.querySelector('.psm-reading-menu-fixed');
  assert(lastFixedSection.children[0].disabled !== true, 'previous remains enabled at the last section');
  assert(lastFixedSection.children[1].disabled === true, 'next outline action is disabled at the last section');
}

function testOutlineAdjacentActionsUseTopNavigationAnchor() {
  const sandbox = createContext({
    scrollSpeed: 100,
    advancedSettings: {
      outlineNavigation: {
        enabled: true,
        sources: { h1: true, h2: true, h3: true, idBlocks: false }
      }
    }
  });
  const root = sandbox.getScrollRoot();
  const previous = new FakeElement('h2', {
    textContent: 'Domestic policy',
    rect: { left: 0, top: -84, right: 400, bottom: -60, width: 400, height: 24 }
  });
  const current = new FakeElement('h3', {
    textContent: 'Economy',
    rect: { left: 0, top: 16, right: 400, bottom: 40, width: 400, height: 24 }
  });
  const next = new FakeElement('h3', {
    textContent: 'Education',
    rect: { left: 0, top: 140, right: 400, bottom: 164, width: 400, height: 24 }
  });
  [previous, current, next].forEach((element) => sandbox.document.body.appendChild(element));
  sandbox.document.documentElement.scrollTop = 1000;
  sandbox.window.pageYOffset = 1000;

  sandbox.handleOutlineToolClick({ stopPropagation() {} });
  const menu = root.getElementById('page-scroll-master-outline-menu');
  const fixedSection = menu.querySelector('.psm-reading-menu-fixed');
  assert(fixedSection.children[0].disabled !== true, 'short sections still expose the previous action');

  menu.listeners.click[0]({ stopPropagation() {}, target: fixedSection.children[0] });
  assert(
    sandbox.window.pageYOffset === 900,
    'previous action uses the heading near the viewport top instead of a later heading inside the reading anchor'
  );
}

function testClickedOutlineItemRemainsSelectedAfterShortSectionJump() {
  const sandbox = createContext({
    scrollSpeed: 100,
    advancedSettings: {
      outlineNavigation: {
        enabled: true,
        sources: { h1: true, h2: true, h3: true, idBlocks: false },
        highlightCurrentSection: true
      }
    }
  });
  const root = sandbox.getScrollRoot();
  const gunControl = new FakeElement('h3', {
    id: 'gun-control',
    textContent: 'Gun control',
    rect: { left: 0, top: 500, right: 400, bottom: 524, width: 400, height: 24 }
  });
  const foreignPolicy = new FakeElement('h2', {
    id: 'foreign-policy',
    textContent: 'Foreign policy',
    rect: { left: 0, top: 650, right: 400, bottom: 674, width: 400, height: 24 }
  });
  sandbox.document.body.appendChild(gunControl);
  sandbox.document.body.appendChild(foreignPolicy);

  sandbox.handleOutlineToolClick({ stopPropagation() {} });
  const menu = root.getElementById('page-scroll-master-outline-menu');
  const outlineSection = menu.querySelector('.psm-reading-menu-outline');
  const gunControlButton = outlineSection.children[1];
  const foreignPolicyButton = outlineSection.children[2];
  menu.listeners.click[0]({ stopPropagation() {}, target: gunControlButton });

  assert(
    gunControlButton.classList.contains('psm-outline-current'),
    'clicked short-section outline item remains selected after programmatic scrolling'
  );
  assert(
    foreignPolicyButton.getAttribute('aria-current') === null,
    'reading anchor does not overwrite the clicked outline item with the following short section'
  );
}

function testProgrammaticOutlineJumpSuppressesIntermediateHighlightChanges() {
  const sandbox = createContext({
    scrollSpeed: 100,
    advancedSettings: {
      outlineNavigation: {
        enabled: true,
        sources: { h1: true, h2: true, h3: true, idBlocks: false },
        highlightCurrentSection: true
      }
    }
  });
  const root = sandbox.getScrollRoot();
  const target = new FakeElement('h3', {
    id: 'target-section',
    textContent: 'Target section',
    rect: { left: 0, top: 500, right: 400, bottom: 524, width: 400, height: 24 }
  });
  const following = new FakeElement('h2', {
    id: 'following-section',
    textContent: 'Following section',
    rect: { left: 0, top: 620, right: 400, bottom: 644, width: 400, height: 24 }
  });
  sandbox.document.body.appendChild(target);
  sandbox.document.body.appendChild(following);

  sandbox.handleOutlineToolClick({ stopPropagation() {} });
  const menu = root.getElementById('page-scroll-master-outline-menu');
  const outlineSection = menu.querySelector('.psm-reading-menu-outline');
  const targetButton = outlineSection.children[1];
  const followingButton = outlineSection.children[2];
  menu.__psmHighlightLockId = 'target-section';
  sandbox.setOutlineMenuCurrentItem(menu, 'target-section');

  sandbox.window.pageYOffset = 500;
  sandbox.document.documentElement.scrollTop = 500;
  target.rect.top = 0;
  following.rect.top = 120;
  sandbox.updateOutlineCurrentHighlight(menu, menu.__psmMenuModel);

  assert(
    targetButton.classList.contains('psm-outline-current'),
    'programmatic jump lock keeps the clicked item selected during intermediate scroll frames'
  );
  assert(
    followingButton.getAttribute('aria-current') === null,
    'intermediate reading-anchor updates do not select a following short section'
  );

  menu.__psmHighlightLockId = '';
  sandbox.updateOutlineCurrentHighlight(menu, menu.__psmMenuModel);
  assert(
    followingButton.classList.contains('psm-outline-current'),
    'automatic highlight resumes after the programmatic jump lock is released'
  );
}

function testOutlineMenuCurrentHighlightUpdatesOnScroll() {
  const sandbox = createContext({
    advancedSettings: {
      readingTools: {
        enabled: true,
        features: { scrollBookmarks: false, outlineNavigation: true }
      },
      outlineNavigation: { enabled: true, highlightCurrentSection: true }
    }
  });
  const root = sandbox.getScrollRoot();
  const first = new FakeElement('h1', {
    id: 'first-section',
    textContent: 'First section',
    rect: { left: 0, top: 120, right: 400, bottom: 144, width: 400, height: 24 }
  });
  const second = new FakeElement('h2', {
    id: 'second-section',
    textContent: 'Second section',
    rect: { left: 0, top: 520, right: 400, bottom: 544, width: 400, height: 24 }
  });
  [first, second].forEach((element) => sandbox.document.body.appendChild(element));

  sandbox.handleReadingToolClick({ stopPropagation() {} });
  const menu = root.getElementById('page-scroll-master-reading-menu');
  const outlineSection = menu.querySelector('.psm-reading-menu-outline');
  const firstButton = outlineSection.children[1];
  const secondButton = outlineSection.children[2];
  assert(firstButton.classList.contains('psm-outline-current'), 'initial current section highlights the first outline item');
  assert(secondButton.getAttribute('aria-current') === null, 'non-current outline item does not expose aria-current');

  sandbox.window.pageYOffset = 400;
  sandbox.document.documentElement.scrollTop = 400;
  first.rect.top = -280;
  second.rect.top = 120;
  sandbox.requestOutlineHighlightUpdate();
  assert(!firstButton.classList.contains('psm-outline-current'), 'scroll update removes the stale current highlight');
  assert(firstButton.getAttribute('aria-current') === null, 'scroll update removes stale aria-current');
  assert(secondButton.classList.contains('psm-outline-current'), 'scroll update highlights the new current section');
  assert(secondButton.getAttribute('aria-current') === 'location', 'scroll update exposes aria-current on the new section');

  sandbox.hideReadingToolMenu();
  first.rect.top = 120;
  second.rect.top = 520;
  sandbox.requestOutlineHighlightUpdate();
  assert(secondButton.classList.contains('psm-outline-current'), 'closed menu no longer updates outline highlight state');
}

function testOutlineMenuHighlightCanBeDisabled() {
  const sandbox = createContext({
    advancedSettings: {
      readingTools: {
        enabled: true,
        features: { scrollBookmarks: false, outlineNavigation: true }
      },
      outlineNavigation: { enabled: true, highlightCurrentSection: false }
    }
  });
  const root = sandbox.getScrollRoot();
  sandbox.document.body.appendChild(new FakeElement('h1', {
    id: 'intro',
    textContent: 'Introduction',
    rect: { left: 0, top: 120, right: 400, bottom: 144, width: 400, height: 24 }
  }));
  sandbox.document.body.appendChild(new FakeElement('h2', {
    textContent: 'API Reference',
    rect: { left: 0, top: 520, right: 400, bottom: 544, width: 400, height: 24 }
  }));

  sandbox.handleReadingToolClick({ stopPropagation() {} });
  const menu = root.getElementById('page-scroll-master-reading-menu');
  const fixedSection = menu.querySelector('.psm-reading-menu-fixed');
  const outlineSection = menu.querySelector('.psm-reading-menu-outline');
  assert(fixedSection.children[1].disabled !== true, 'next outline action remains available when current highlight is disabled');
  assert(!outlineSection.children[1].classList.contains('psm-outline-current'), 'disabled highlight setting does not mark current outline item');
  assert(outlineSection.children[1].getAttribute('aria-current') === null, 'disabled highlight setting does not expose aria-current');
}

function testOutlineRouteChangeInvalidatesSnapshotAndClosesMenu() {
  const sandbox = createContext({
    advancedSettings: {
      readingTools: {
        enabled: true,
        features: { scrollBookmarks: false, outlineNavigation: true }
      },
      outlineNavigation: { enabled: true, highlightCurrentSection: true }
    }
  });
  const root = sandbox.getScrollRoot();
  sandbox.document.body.appendChild(new FakeElement('h1', {
    id: 'intro',
    textContent: 'Introduction',
    rect: { left: 0, top: 120, right: 400, bottom: 144, width: 400, height: 24 }
  }));
  sandbox.document.body.appendChild(new FakeElement('h2', {
    textContent: 'API Reference',
    rect: { left: 0, top: 520, right: 400, bottom: 544, width: 400, height: 24 }
  }));

  assert(sandbox.window.history.pushState.__psmOutlineWrapped === true, 'SPA route detection wraps pushState');
  assert(sandbox.window.history.replaceState.__psmOutlineWrapped === true, 'SPA route detection wraps replaceState');
  sandbox.handleReadingToolClick({ stopPropagation() {} });
  const menu = root.getElementById('page-scroll-master-reading-menu');
  const outlineSection = menu.querySelector('.psm-reading-menu-outline');
  const firstButton = outlineSection.children[1];
  const initialGeneration = menu.__psmMenuModel.outlineSnapshot.generation;
  assert(menu.classList.contains('psm-open'), 'outline menu starts open before route change');
  assert(firstButton.getAttribute('aria-current') === 'location', 'open menu has current section state before route change');

  sandbox.window.history.pushState({}, '', '/docs/next');

  assert(!menu.classList.contains('psm-open'), 'SPA route change closes the outline menu immediately');
  assert(menu.__psmMenuModel.outlineSnapshot === null, 'SPA route change invalidates the open menu snapshot');
  assert(!firstButton.classList.contains('psm-outline-current'), 'SPA route change clears stale current-section class');
  assert(firstButton.getAttribute('aria-current') === null, 'SPA route change clears stale aria-current');

  sandbox.handleReadingToolClick({ stopPropagation() {} });
  assert(menu.classList.contains('psm-open'), 'menu can reopen after SPA route change');
  assert(
    menu.__psmMenuModel.outlineSnapshot.generation > initialGeneration,
    'reopened outline menu receives a fresh snapshot generation'
  );
}

function testOutlineDomChangeInvalidatesWithoutClosedMenuScan() {
  const sandbox = createContext({
    advancedSettings: {
      readingTools: {
        enabled: true,
        features: { scrollBookmarks: false, outlineNavigation: true }
      },
      outlineNavigation: { enabled: true }
    }
  });
  const heading = new FakeElement('h1', {
    id: 'intro',
    textContent: 'Introduction',
    rect: { left: 0, top: 120, right: 400, bottom: 144, width: 400, height: 24 }
  });
  sandbox.document.body.appendChild(heading);
  const observer = sandbox.__mutationObservers[0];
  assert(Boolean(observer), 'SPA MutationObserver is initialized for outline invalidation');
  assert(sandbox.document.body.queryCount === 0, 'closed outline menu has not scanned headings before DOM mutation');

  const added = new FakeElement('h2', {
    textContent: 'New section',
    rect: { left: 0, top: 520, right: 400, bottom: 544, width: 400, height: 24 }
  });
  sandbox.document.body.appendChild(added);
  observer.callback([{ type: 'childList', addedNodes: [added], removedNodes: [] }]);

  assert(sandbox.document.body.queryCount === 0, 'closed outline menu invalidates without rebuilding the snapshot');
}

function testOpenOutlineMenuRefreshesAfterDomChange() {
  const sandbox = createContext({
    advancedSettings: {
      readingTools: {
        enabled: true,
        features: { scrollBookmarks: false, outlineNavigation: true }
      },
      outlineNavigation: { enabled: true, highlightCurrentSection: true }
    }
  });
  const root = sandbox.getScrollRoot();
  const intro = new FakeElement('h1', {
    id: 'intro',
    textContent: 'Introduction',
    rect: { left: 0, top: 120, right: 400, bottom: 144, width: 400, height: 24 }
  });
  sandbox.document.body.appendChild(intro);
  sandbox.handleReadingToolClick({ stopPropagation() {} });

  const menu = root.getElementById('page-scroll-master-reading-menu');
  let outlineSection = menu.querySelector('.psm-reading-menu-outline');
  const initialGeneration = menu.__psmMenuModel.outlineSnapshot.generation;
  assert(menu.classList.contains('psm-open'), 'outline menu starts open before DOM mutation');
  assert(outlineSection.children.length === 2, 'open outline menu initially renders one heading item');

  const details = new FakeElement('h2', {
    id: 'details',
    textContent: 'Details',
    rect: { left: 0, top: 520, right: 400, bottom: 544, width: 400, height: 24 }
  });
  sandbox.document.body.appendChild(details);
  sandbox.__mutationObservers[0].callback([{ type: 'childList', addedNodes: [details], removedNodes: [] }]);

  outlineSection = menu.querySelector('.psm-reading-menu-outline');
  assert(menu.classList.contains('psm-open'), 'DOM mutation refresh keeps the outline menu open');
  assert(
    menu.__psmMenuModel.outlineSnapshot.generation > initialGeneration,
    'DOM mutation refresh rebuilds the outline snapshot with a new generation'
  );
  assert(outlineSection.children.length === 3, 'DOM mutation refresh rerenders the added outline item');
  assert(outlineSection.children[2].textContent === 'Details', 'DOM mutation refresh includes the newly added heading');
}

function testOutlineSettingsChangeRefreshesOpenMenu() {
  const sandbox = createContext({
    advancedSettings: {
      readingTools: {
        enabled: true,
        features: { scrollBookmarks: false, outlineNavigation: true }
      },
      outlineNavigation: { enabled: true }
    }
  });
  const root = sandbox.getScrollRoot();
  sandbox.document.body.appendChild(new FakeElement('h1', {
    id: 'intro',
    textContent: 'Introduction',
    rect: { left: 0, top: 120, right: 400, bottom: 144, width: 400, height: 24 }
  }));
  sandbox.document.body.appendChild(new FakeElement('h2', {
    id: 'details',
    textContent: 'Details',
    rect: { left: 0, top: 520, right: 400, bottom: 544, width: 400, height: 24 }
  }));
  sandbox.handleReadingToolClick({ stopPropagation() {} });

  const menu = root.getElementById('page-scroll-master-reading-menu');
  let outlineSection = menu.querySelector('.psm-reading-menu-outline');
  const initialGeneration = menu.__psmMenuModel.outlineSnapshot.generation;
  assert(outlineSection.children.length === 3, 'open outline menu initially includes H1 and H2 items');

  sandbox.__runtimeMessageListeners[0]({
    action: 'updateAdvancedSettings',
    settings: {
      readingTools: {
        enabled: true,
        features: { scrollBookmarks: false, outlineNavigation: true }
      },
      outlineNavigation: {
        enabled: true,
        sources: { h1: true, h2: false, h3: false, idBlocks: false }
      }
    }
  });

  outlineSection = menu.querySelector('.psm-reading-menu-outline');
  assert(menu.classList.contains('psm-open'), 'outline settings refresh keeps the menu open');
  assert(
    menu.__psmMenuModel.outlineSnapshot.generation > initialGeneration,
    'outline settings refresh invalidates the previous snapshot generation'
  );
  assert(outlineSection.children.length === 2, 'outline settings refresh removes items from disabled sources');
  assert(outlineSection.children[1].textContent === 'Introduction', 'outline settings refresh keeps allowed source items');
}

function testNonOutlineSettingsChangeDoesNotRefreshOpenMenu() {
  const sandbox = createContext({
    advancedSettings: {
      readingTools: {
        enabled: true,
        features: { scrollBookmarks: false, outlineNavigation: true }
      },
      outlineNavigation: { enabled: true }
    }
  });
  const root = sandbox.getScrollRoot();
  sandbox.document.body.appendChild(new FakeElement('h1', {
    id: 'intro',
    textContent: 'Introduction',
    rect: { left: 0, top: 120, right: 400, bottom: 144, width: 400, height: 24 }
  }));
  sandbox.handleReadingToolClick({ stopPropagation() {} });

  const menu = root.getElementById('page-scroll-master-reading-menu');
  const initialGeneration = menu.__psmMenuModel.outlineSnapshot.generation;
  const initialQueryCount = sandbox.document.body.queryCount;

  sandbox.__runtimeMessageListeners[0]({
    action: 'updateAdvancedSettings',
    settings: {
      progressBar: { enabled: true, mode: 'verticalButton' },
      readingTools: {
        enabled: true,
        features: { scrollBookmarks: false, outlineNavigation: true }
      },
      outlineNavigation: { enabled: true }
    }
  });

  assert(menu.classList.contains('psm-open'), 'non-outline settings update keeps the menu open');
  assert(menu.__psmMenuModel.outlineSnapshot.generation === initialGeneration, 'non-outline settings update keeps the outline snapshot generation');
  assert(sandbox.document.body.queryCount === initialQueryCount, 'non-outline settings update does not rescan outline headings');
}

function testDisablingOutlineSettingsRefreshesOpenBookmarkMenu() {
  const sandbox = createContext({
    advancedSettings: {
      scrollBookmarks: { enabled: true },
      outlineNavigation: { enabled: true }
    }
  });
  const root = sandbox.getScrollRoot();
  sandbox.document.body.appendChild(new FakeElement('h1', {
    id: 'intro',
    textContent: 'Introduction',
    rect: { left: 0, top: 120, right: 400, bottom: 144, width: 400, height: 24 }
  }));
  sandbox.handleOutlineToolClick({ stopPropagation() {} });

  const outlineMenu = root.getElementById('page-scroll-master-outline-menu');
  assert(outlineMenu.classList.contains('psm-open'), 'outline menu starts open');
  assert(outlineMenu.querySelector('.psm-reading-menu-fixed').children.length === 2, 'outline menu includes only outline fixed actions before disabling outline');
  assert(outlineMenu.querySelector('.psm-reading-menu-outline').children.length === 2, 'outline menu includes outline content before disabling outline');

  sandbox.__runtimeMessageListeners[0]({
    action: 'updateAdvancedSettings',
    settings: {
      scrollBookmarks: { enabled: true },
      outlineNavigation: { enabled: false }
    }
  });

  assert(!root.querySelector('.psm-outline-tool-button'), 'disabling outline removes the outline button');
  assert(Boolean(root.querySelector('.psm-bookmark-tool-button')), 'disabling outline keeps the bookmark button');
  sandbox.handleBookmarkToolClick({ stopPropagation() {} });
  const bookmarkMenu = root.getElementById('page-scroll-master-bookmark-menu');
  assert(bookmarkMenu.classList.contains('psm-open'), 'bookmark menu can open after outline is disabled');
  assert(bookmarkMenu.querySelector('.psm-reading-menu-fixed').children.length === 2, 'bookmark menu keeps save and restore actions only');
  assert(bookmarkMenu.querySelector('.psm-reading-menu-outline').children.length === 0, 'bookmark menu has no outline content');
}

function testOutlineMenuDetachedTargetDoesNotJump() {
  const sandbox = createContext({
    advancedSettings: {
      readingTools: {
        enabled: true,
        features: { scrollBookmarks: false, outlineNavigation: true }
      },
      outlineNavigation: { enabled: true }
    }
  });
  const root = sandbox.getScrollRoot();
  const target = new FakeElement('h2', {
    textContent: 'Temporary target',
    rect: { left: 0, top: 500, right: 400, bottom: 524, width: 400, height: 24 }
  });
  sandbox.document.body.appendChild(target);
  sandbox.handleReadingToolClick({ stopPropagation() {} });
  const menu = root.getElementById('page-scroll-master-reading-menu');
  const targetButton = menu.querySelector('.psm-reading-menu-outline').children[1];
  target.isConnected = false;
  menu.listeners.click[0]({ stopPropagation() {}, target: targetButton });

  assert(sandbox.window.pageYOffset === 0, 'detached outline targets cancel without scrolling');
  assert(menu.classList.contains('psm-open'), 'cancelled detached target keeps the menu open');
}

function testOutlineMenuEmptyAndTruncatedStates() {
  let sandbox = createContext({
    advancedSettings: {
      readingTools: {
        enabled: true,
        features: { scrollBookmarks: false, outlineNavigation: true }
      },
      outlineNavigation: { enabled: true }
    }
  });
  let root = sandbox.getScrollRoot();
  let menu;
  sandbox.handleReadingToolClick({ stopPropagation() {} });
  let outlineSection = root.getElementById('page-scroll-master-reading-menu')
    .querySelector('.psm-reading-menu-outline');
  let fixedSection = root.getElementById('page-scroll-master-reading-menu')
    .querySelector('.psm-reading-menu-fixed');
  assert(fixedSection.children.length === 2, 'empty outline still renders previous and next actions');
  assert(fixedSection.children[0].disabled === true, 'empty outline disables previous action');
  assert(fixedSection.children[0].getAttribute('aria-disabled') === 'true', 'empty outline previous action exposes aria-disabled');
  assert(fixedSection.children[1].disabled === true, 'empty outline disables next action');
  assert(fixedSection.children[1].getAttribute('aria-disabled') === 'true', 'empty outline next action exposes aria-disabled');
  assert(outlineSection.children.length === 2, 'empty outline renders heading and empty state');
  assert(outlineSection.children[1].textContent === '未检测到可跳转标题', 'empty outline uses the specified message');

  sandbox = createContext({
    advancedSettings: {
      readingTools: {
        enabled: true,
        features: { scrollBookmarks: false, outlineNavigation: true }
      },
      outlineNavigation: { enabled: true, maxItems: 10 }
    }
  });
  root = sandbox.getScrollRoot();
  for (let i = 0; i < 12; i++) {
    sandbox.document.body.appendChild(new FakeElement('h2', {
      id: `section-${i + 1}`,
      textContent: `Section ${i + 1}`,
      rect: { left: 0, top: 120 + (i * 360), right: 400, bottom: 144 + (i * 360), width: 400, height: 24 }
    }));
  }
  sandbox.handleReadingToolClick({ stopPropagation() {} });
  outlineSection = root.getElementById('page-scroll-master-reading-menu')
    .querySelector('.psm-reading-menu-outline');
  assert(outlineSection.children.length === 12, 'incremental outline renders heading, ten items and load-more action');
  assert(outlineSection.children[10].textContent === 'Section 10', 'initial outline batch keeps the last item at the configured batch size');
  assert(
    outlineSection.children[11].textContent === '加载更多（剩余 2 项）',
    'incremental outline reports the remaining item count'
  );
  assert(
    !outlineSection.children.some((child) => child.textContent === 'Section 11'),
    'initial outline batch does not render items beyond the configured limit'
  );
  menu = root.getElementById('page-scroll-master-reading-menu');
  menu.listeners.click[0]({ stopPropagation() {}, target: outlineSection.children[11] });
  outlineSection = menu.querySelector('.psm-reading-menu-outline');
  assert(outlineSection.children.length === 13, 'load-more action appends the remaining outline items');
  assert(outlineSection.children[11].textContent === 'Section 11', 'load-more action preserves directory order');
  assert(outlineSection.children[12].textContent === 'Section 12', 'load-more action loads the final item');
  assert(menu.classList.contains('psm-open'), 'loading more keeps the outline menu open');
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
testIconSizingSurvivesIconRebuild();
testAdvancedSettingsMergeAndProgressMath();
testProgressClickRatios();
testEnabledProgressDomModes();
testReadingToolsDomAndBookmarks();
testReadingToolMenuSaveAndRestorePrompt();
testScrollBookmarkRestoreModes();
testOptionsPageOpenRestoresSavedBookmark();
testDynamicReadingToolMenuStructure();
testOutlineDisabledBookmarkMenuDoesNotScanOrRenderOutline();
testOutlineMenuListRendering();
testOutlineMenuRootPageJump();
testPinnedOutlineMenuOnlyClosesExplicitly();
testOutlineMenuCustomContainerJump();
testOutlineMenuAdjacentActionJumpAndBoundaryState();
testOutlineAdjacentActionsUseTopNavigationAnchor();
testClickedOutlineItemRemainsSelectedAfterShortSectionJump();
testProgrammaticOutlineJumpSuppressesIntermediateHighlightChanges();
testOutlineMenuCurrentHighlightUpdatesOnScroll();
testOutlineMenuHighlightCanBeDisabled();
testOutlineRouteChangeInvalidatesSnapshotAndClosesMenu();
testOutlineDomChangeInvalidatesWithoutClosedMenuScan();
testOpenOutlineMenuRefreshesAfterDomChange();
testOutlineSettingsChangeRefreshesOpenMenu();
testNonOutlineSettingsChangeDoesNotRefreshOpenMenu();
testDisablingOutlineSettingsRefreshesOpenBookmarkMenu();
testOutlineMenuDetachedTargetDoesNotJump();
testOutlineMenuEmptyAndTruncatedStates();
testProgressHoverPreview();
testRemainingReadingTimeLabels();

console.log('progress bar tests passed');
