const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ROOT = path.join(__dirname, '..');
const CONTENT_SOURCE_PATH = process.env.CONTENT_SOURCE || path.join(ROOT, 'content.js');

class FakeElement {
  constructor(tagName, options = {}) {
    this.tagName = tagName.toUpperCase();
    this.id = options.id || '';
    this.textContent = options.textContent || '';
    this.innerText = options.innerText || '';
    this.children = [];
    this.parentElement = null;
    this.scrollHeight = options.scrollHeight || 0;
    this.clientHeight = options.clientHeight || 0;
    this.scrollTop = options.scrollTop || 0;
    this.overflowY = options.overflowY || 'visible';
    this.display = options.display || 'block';
    this.visibility = options.visibility || 'visible';
    this.attributes = { ...(options.attributes || {}) };
    this.rect = options.rect || { left: 0, top: 0, right: 200, bottom: 24, width: 200, height: 24 };
    this.offsetParent = options.offsetParent === undefined ? {} : options.offsetParent;
    this.isConnected = options.isConnected !== false;
    this.queryCount = 0;
    if (this.id) this.attributes.id = this.id;
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

  getClientRects() {
    return this.rect.width > 0 || this.rect.height > 0 ? [this.rect] : [];
  }

  querySelectorAll(selector) {
    this.queryCount++;
    const selectors = selector.split(',').map((part) => part.trim());
    const matches = [];
    const walk = (element) => {
      const tagName = element.tagName.toLowerCase();
      const isHeading = ['h1', 'h2', 'h3'].includes(tagName);
      const matchesSelector = selectors.some((part) => {
        if (part === tagName) return true;
        if (part === '[id]:not(h1):not(h2):not(h3)') {
          return Boolean(element.getAttribute('id')) && !isHeading;
        }
        return false;
      });
      if (matchesSelector) matches.push(element);
      element.children.forEach(walk);
    };
    this.children.forEach(walk);
    return matches;
  }

  querySelector(selector) {
    const selectors = selector.split(',').map((part) => part.trim());
    let match = null;
    const walk = (element) => {
      if (match) return;
      const tagName = element.tagName.toLowerCase();
      const role = element.getAttribute('role');
      if (
        selectors.includes(tagName) ||
        (selectors.includes('[role="main"]') && role === 'main')
      ) {
        match = element;
        return;
      }
      element.children.forEach(walk);
    };
    this.children.forEach(walk);
    return match;
  }
}

function createContext(options = {}) {
  const documentElement = new FakeElement('html', {
    scrollHeight: options.rootScrollHeight || 900,
    clientHeight: 900,
    rect: { left: 0, top: 0, right: 1200, bottom: 900, width: 1200, height: 900 }
  });
  const body = new FakeElement('body', {
    scrollHeight: options.rootScrollHeight || 900,
    clientHeight: 900,
    rect: { left: 0, top: 0, right: 1200, bottom: 900, width: 1200, height: 900 }
  });
  documentElement.appendChild(body);
  const scrollCandidates = options.scrollCandidates || [];

  const document = {
    body,
    documentElement,
    scrollingElement: documentElement,
    readyState: 'loading',
    querySelectorAll() {
      return scrollCandidates;
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
      scrollTo() {},
      getComputedStyle(element) {
        return {
          overflowY: element.overflowY,
          display: element.display,
          visibility: element.visibility
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
    console,
    Set,
    Number
  };

  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(CONTENT_SOURCE_PATH, 'utf8'), sandbox);
  return { sandbox, body, documentElement };
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function outlineSettings(overrides = {}) {
  return {
    enabled: true,
    sources: {
      h1: true,
      h2: true,
      h3: false,
      idBlocks: false,
      ...(overrides.sources || {})
    },
    maxItems: overrides.maxItems || 30,
    filterShortHeadings: overrides.filterShortHeadings !== false,
    highlightCurrentSection: overrides.highlightCurrentSection !== false
  };
}

function testDisabledOutlineSkipsHeadingScan() {
  const { sandbox, body } = createContext({ rootScrollHeight: 2400 });
  const snapshot = sandbox.buildOutlineSnapshot();

  assert(body.queryCount === 0, 'disabled outline must not query heading candidates');
  assert(snapshot.items.length === 0, 'disabled outline returns no items');
  assert(snapshot.totalCount === 0 && snapshot.truncated === false, 'disabled outline returns empty metadata');
  assert(snapshot.container === null, 'disabled outline does not resolve a scroll container');
}

function testMainScrollContainerScopeAndDefaultSources() {
  const main = new FakeElement('main', {
    scrollHeight: 2600,
    clientHeight: 850,
    overflowY: 'auto',
    attributes: { role: 'main' },
    rect: { left: 0, top: 50, right: 1200, bottom: 900, width: 1200, height: 850 }
  });
  const outsideHeading = new FakeElement('h1', { textContent: 'Outside heading' });
  const intro = new FakeElement('h2', { id: 'intro', textContent: '  Introduction  ' });
  const details = new FakeElement('h1', { textContent: 'Details' });
  const optional = new FakeElement('h3', { id: 'optional', textContent: 'Optional details' });
  const idBlock = new FakeElement('section', { id: 'appendix', textContent: 'Appendix' });
  main.appendChild(intro);
  main.appendChild(details);
  main.appendChild(optional);
  main.appendChild(idBlock);

  const { sandbox, body } = createContext({ scrollCandidates: [main] });
  body.appendChild(outsideHeading);
  body.appendChild(main);
  const snapshot = sandbox.buildOutlineSnapshot(outlineSettings());

  assert(snapshot.container === main, 'outline parsing uses the detected main scroll container');
  assert(body.queryCount === 0, 'custom scroll containers do not scan the whole page body');
  assert(main.queryCount === 1, 'outline candidates are collected with one ordered query');
  assert(snapshot.totalCount === 2, 'default sources only include H1 and H2');
  assert(snapshot.items[0].element === intro && snapshot.items[1].element === details, 'items preserve DOM order across heading levels');
  assert(snapshot.items[0].id === 'intro', 'existing element ids are retained');
  assert(snapshot.items[0].text === 'Introduction', 'outline text collapses surrounding whitespace');
  assert(snapshot.items[0].level === 2 && snapshot.items[0].order === 0, 'outline items include level and zero-based order');
  assert(snapshot.items[1].id === 'psm-outline-item-2', 'headings without ids receive snapshot-local ids');
}

function testOptionalSourcesAndIdBlockShape() {
  const main = new FakeElement('main');
  const first = new FakeElement('h1', { id: 'duplicate', textContent: 'First' });
  const second = new FakeElement('h3', { id: 'duplicate', textContent: 'Third level' });
  const idBlock = new FakeElement('section', { id: 'notes', textContent: 'Notes' });
  const emptyIdBlock = new FakeElement('div', { id: 'empty', textContent: '   ' });
  main.appendChild(first);
  main.appendChild(second);
  main.appendChild(idBlock);
  main.appendChild(emptyIdBlock);
  const { sandbox } = createContext();
  const snapshot = sandbox.buildOutlineSnapshot(outlineSettings({
    sources: { h2: false, h3: true, idBlocks: true }
  }), main);

  assert(snapshot.totalCount === 3, 'optional H3 and readable id blocks are included');
  assert(snapshot.items.map((item) => item.text).join('|') === 'First|Third level|Notes', 'optional sources retain DOM order');
  assert(snapshot.items[1].id === 'duplicate-2', 'snapshot item ids remain unique when page ids are duplicated');
  assert(snapshot.items[2].level === 0, 'non-heading id blocks use the base level');
  assert(snapshot.items[2].element === idBlock && snapshot.items[2].order === 2, 'id block items include element and order');
}

function testRootScopeAndTruncationMetadata() {
  const { sandbox, body, documentElement } = createContext({ rootScrollHeight: 3000 });
  for (let i = 0; i < 12; i++) {
    body.appendChild(new FakeElement(i % 2 === 0 ? 'h1' : 'h2', {
      id: `section-${i + 1}`,
      textContent: `Section ${i + 1}`
    }));
  }
  const snapshot = sandbox.buildOutlineSnapshot(outlineSettings({ maxItems: 10 }), documentElement);

  assert(body.queryCount === 2, 'root scrolling pages perform one content-root lookup and one body heading scan');
  assert(snapshot.items.length === 10, 'maxItems limits retained outline items');
  assert(snapshot.allItems.length === 12, 'snapshot retains all outline items for incremental loading');
  assert(snapshot.totalCount === 12, 'snapshot retains the full scanned item count');
  assert(snapshot.truncated === true, 'snapshot marks truncated results');
  assert(snapshot.items[9].id === 'section-10' && snapshot.items[9].order === 9, 'truncation keeps the first items in DOM order');
}

function testRootScopePrefersMainContent() {
  const { sandbox, body, documentElement } = createContext({ rootScrollHeight: 2400 });
  const pageHeading = new FakeElement('h1', { textContent: 'Page chrome heading' });
  const article = new FakeElement('article');
  article.appendChild(new FakeElement('h1', { textContent: 'Earlier article title' }));
  const main = new FakeElement('main');
  const articleHeading = new FakeElement('h1', { textContent: 'Article title' });
  const sectionHeading = new FakeElement('h2', { textContent: 'Article section' });
  main.appendChild(articleHeading);
  main.appendChild(sectionHeading);
  body.appendChild(pageHeading);
  body.appendChild(article);
  body.appendChild(main);

  const snapshot = sandbox.buildOutlineSnapshot(outlineSettings(), documentElement);

  assert(main.queryCount === 1, 'root scrolling pages prefer main over earlier article regions');
  assert(body.queryCount === 1, 'root scrolling pages only inspect page chrome while locating the main region');
  assert(
    snapshot.items.map((item) => item.text).join('|') === 'Article title|Article section',
    'only headings in the preferred main content region are retained'
  );
}

function testSemanticAncestorFilteringAndContainerException() {
  const main = new FakeElement('main');
  const valid = new FakeElement('h1', { textContent: 'Article title' });
  const nav = new FakeElement('nav');
  const navHeading = new FakeElement('h2', { textContent: 'Navigation title' });
  const roleAside = new FakeElement('section', { attributes: { role: 'complementary' } });
  const asideHeading = new FakeElement('h2', { textContent: 'Related title' });
  const roleHeader = new FakeElement('div', { attributes: { role: 'banner' } });
  const headerHeading = new FakeElement('h2', { textContent: 'Banner title' });
  nav.appendChild(navHeading);
  roleAside.appendChild(asideHeading);
  roleHeader.appendChild(headerHeading);
  main.appendChild(valid);
  main.appendChild(nav);
  main.appendChild(roleAside);
  main.appendChild(roleHeader);
  const { sandbox } = createContext();
  const snapshot = sandbox.buildOutlineSnapshot(outlineSettings(), main);

  assert(snapshot.items.length === 1 && snapshot.items[0].element === valid, 'semantic noise ancestors are excluded');

  const navigationContainer = new FakeElement('nav');
  const containerHeading = new FakeElement('h1', { textContent: 'Navigation document' });
  navigationContainer.appendChild(containerHeading);
  const exceptionSnapshot = sandbox.buildOutlineSnapshot(outlineSettings(), navigationContainer);
  assert(exceptionSnapshot.items.length === 1, 'the main scroll container semantic tag does not exclude all descendants');
}

function testVisibilityFiltering() {
  const main = new FakeElement('main');
  const valid = new FakeElement('h1', { textContent: 'Visible heading' });
  const displayNone = new FakeElement('h2', { textContent: 'Display none', display: 'none' });
  const hiddenParent = new FakeElement('section', { visibility: 'hidden' });
  const hiddenChild = new FakeElement('h2', { textContent: 'Hidden by parent' });
  const collapsed = new FakeElement('h2', {
    textContent: 'Collapsed heading',
    rect: { left: 0, top: 0, right: 0, bottom: 0, width: 0, height: 0 },
    offsetParent: null
  });
  const normalFlowZeroSize = new FakeElement('h2', {
    textContent: 'Normal flow heading',
    rect: { left: 0, top: 0, right: 0, bottom: 0, width: 0, height: 0 }
  });
  const disconnected = new FakeElement('h2', {
    textContent: 'Detached heading',
    isConnected: false
  });
  hiddenParent.appendChild(hiddenChild);
  main.appendChild(valid);
  main.appendChild(displayNone);
  main.appendChild(hiddenParent);
  main.appendChild(collapsed);
  main.appendChild(normalFlowZeroSize);
  main.appendChild(disconnected);
  const { sandbox } = createContext();
  const snapshot = sandbox.buildOutlineSnapshot(outlineSettings(), main);

  assert(
    snapshot.items.map((item) => item.text).join('|') === 'Visible heading|Normal flow heading',
    'visibility filtering excludes hidden, collapsed and detached candidates while retaining zero-size normal-flow headings'
  );
}

function testTextQualityAndAdjacentDuplicateFiltering() {
  const main = new FakeElement('main');
  const whitespace = new FakeElement('h1', { textContent: '   ' });
  const oneCharacter = new FakeElement('h2', { textContent: 'A' });
  const punctuation = new FakeElement('h2', { textContent: '---' });
  const numberOnly = new FakeElement('h2', { textContent: '12.' });
  const isbn = new FakeElement('h2', { textContent: '978-0-470-74014-9' });
  const doi = new FakeElement('h2', { textContent: '10.1234/example.42' });
  const oclc = new FakeElement('h2', { textContent: 'OCLC 233939846' });
  const first = new FakeElement('h2', {
    textContent: '  API   Reference ',
    rect: { left: 0, top: 100, right: 200, bottom: 124, width: 200, height: 24 }
  });
  const nearDuplicate = new FakeElement('h2', {
    textContent: 'API Reference',
    rect: { left: 0, top: 106, right: 200, bottom: 130, width: 200, height: 24 }
  });
  const distantDuplicate = new FakeElement('h2', {
    textContent: 'API Reference',
    rect: { left: 0, top: 180, right: 200, bottom: 204, width: 200, height: 24 }
  });
  const localized = new FakeElement('h2', { textContent: '配置  说明' });
  [whitespace, oneCharacter, punctuation, numberOnly, isbn, doi, oclc, first, nearDuplicate, distantDuplicate, localized]
    .forEach((element) => main.appendChild(element));
  const { sandbox } = createContext();
  const snapshot = sandbox.buildOutlineSnapshot(outlineSettings(), main);

  assert(
    snapshot.items.map((item) => item.text).join('|') === 'API Reference|API Reference|配置 说明',
    'text filtering normalizes whitespace, rejects low-information headings and removes only nearby adjacent duplicates'
  );
  assert(snapshot.items[0].order === 0 && snapshot.items[2].order === 2, 'orders are assigned after filtering');

  const relaxed = sandbox.buildOutlineSnapshot(outlineSettings({ filterShortHeadings: false }), main);
  assert(
    relaxed.items.some((item) => item.text === 'A'),
    'disabling short-heading filtering permits short readable headings'
  );
  assert(
    !relaxed.items.some((item) => ['---', '12.', '978-0-470-74014-9', '10.1234/example.42', 'OCLC 233939846'].includes(item.text)),
    'punctuation, numeric and identifier headings remain unreadable when short filtering is disabled'
  );
}

function testBibliographyStructureFiltering() {
  const main = new FakeElement('main');
  const publications = new FakeElement('h2', { textContent: 'Publications' });
  const bibliography = new FakeElement('ul');
  const bibliographyItem = new FakeElement('li');
  const author = new FakeElement('h2', { textContent: 'Wales, Jimmy; Wecker, Andrea' });
  const journal = new FakeElement('h2', { textContent: 'Advances in Futures and Options Research' });
  const table = new FakeElement('table');
  const cell = new FakeElement('td');
  const tableHeading = new FakeElement('h2', { textContent: 'Reference metadata' });
  const contentList = new FakeElement('ol');
  const contentItem = new FakeElement('li');
  const section = new FakeElement('section');
  const realSectionHeading = new FakeElement('h2', { textContent: 'Installation guide' });
  bibliographyItem.appendChild(author);
  bibliographyItem.appendChild(journal);
  bibliography.appendChild(bibliographyItem);
  cell.appendChild(tableHeading);
  table.appendChild(cell);
  section.appendChild(realSectionHeading);
  contentItem.appendChild(section);
  contentList.appendChild(contentItem);
  main.appendChild(publications);
  main.appendChild(bibliography);
  main.appendChild(table);
  main.appendChild(contentList);
  const { sandbox } = createContext();

  const snapshot = sandbox.buildOutlineSnapshot(outlineSettings(), main);

  assert(
    snapshot.items.map((item) => item.text).join('|') === 'Publications|Installation guide',
    'bibliography list and table metadata headings are excluded while section headings inside content lists remain available'
  );
}

function testAdjacentTargetsUseTopNavigationAnchorAndBoundaries() {
  const { sandbox, body, documentElement } = createContext({ rootScrollHeight: 3000 });
  const first = new FakeElement('h1', {
    textContent: 'First section',
    rect: { left: 0, top: 100, right: 400, bottom: 124, width: 400, height: 24 }
  });
  const second = new FakeElement('h2', {
    textContent: 'Second section',
    rect: { left: 0, top: 500, right: 400, bottom: 524, width: 400, height: 24 }
  });
  const third = new FakeElement('h2', {
    textContent: 'Third section',
    rect: { left: 0, top: 900, right: 400, bottom: 924, width: 400, height: 24 }
  });
  [first, second, third].forEach((element) => body.appendChild(element));

  let snapshot = sandbox.buildOutlineSnapshot(outlineSettings(), documentElement);
  let targets = sandbox.getOutlineAdjacentTargets(snapshot);
  assert(targets.previous === null, 'previous is disabled before or within the first outline item');
  assert(targets.next.element === first, 'next jumps to the first heading below the viewport-top navigation anchor');

  sandbox.window.pageYOffset = 484;
  documentElement.scrollTop = 484;
  first.rect.top = -384;
  second.rect.top = 16;
  third.rect.top = 416;
  snapshot = sandbox.buildOutlineSnapshot(outlineSettings(), documentElement);
  targets = sandbox.getOutlineAdjacentTargets(snapshot);
  assert(targets.previous.element === first, 'previous skips the current heading when the user is near its top');
  assert(targets.next.element === third, 'next finds the heading after the current top-anchored section');

  sandbox.window.pageYOffset = 884;
  documentElement.scrollTop = 884;
  first.rect.top = -784;
  second.rect.top = -384;
  third.rect.top = 16;
  snapshot = sandbox.buildOutlineSnapshot(outlineSettings(), documentElement);
  targets = sandbox.getOutlineAdjacentTargets(snapshot);
  assert(targets.previous.element === second, 'previous remains available at the last outline item');
  assert(targets.next === null, 'next is disabled at the last outline item');
}

function testCurrentItemUsesReadingAnchor() {
  const { sandbox, body, documentElement } = createContext({ rootScrollHeight: 3000 });
  const first = new FakeElement('h1', {
    textContent: 'First section',
    rect: { left: 0, top: 320, right: 400, bottom: 344, width: 400, height: 24 }
  });
  const second = new FakeElement('h2', {
    textContent: 'Second section',
    rect: { left: 0, top: 620, right: 400, bottom: 644, width: 400, height: 24 }
  });
  [first, second].forEach((element) => body.appendChild(element));

  let snapshot = sandbox.buildOutlineSnapshot(outlineSettings(), documentElement);
  assert(sandbox.getOutlineCurrentItem(snapshot) === null, 'no current item is selected before the first heading reaches the reading anchor');

  sandbox.window.pageYOffset = 400;
  documentElement.scrollTop = 400;
  first.rect.top = -80;
  second.rect.top = 220;
  snapshot = sandbox.buildOutlineSnapshot(outlineSettings(), documentElement);
  assert(sandbox.getOutlineCurrentItem(snapshot).element === second, 'current item is the last heading before the reading anchor');

  sandbox.window.pageYOffset = 700;
  documentElement.scrollTop = 700;
  first.rect.top = -380;
  second.rect.top = -80;
  snapshot = sandbox.buildOutlineSnapshot(outlineSettings(), documentElement);
  assert(sandbox.getOutlineCurrentItem(snapshot).element === second, 'current item remains the last valid heading after scrolling within a section');
}

testDisabledOutlineSkipsHeadingScan();
testMainScrollContainerScopeAndDefaultSources();
testOptionalSourcesAndIdBlockShape();
testRootScopeAndTruncationMetadata();
testRootScopePrefersMainContent();
testSemanticAncestorFilteringAndContainerException();
testVisibilityFiltering();
testTextQualityAndAdjacentDuplicateFiltering();
testBibliographyStructureFiltering();
testAdjacentTargetsUseTopNavigationAnchorAndBoundaries();
testCurrentItemUsesReadingAnchor();

console.log('outline navigation tests passed');
