const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ROOT = path.join(__dirname, '..');
const CONTENT_SOURCE_PATH = process.env.CONTENT_SOURCE || path.join(ROOT, 'content.js');

function createContext() {
  const sandbox = {
    document: {
      body: null,
      documentElement: {},
      scrollingElement: {},
      readyState: 'loading',
      getElementById() { return null; },
      querySelectorAll() { return []; },
      addEventListener() {}
    },
    window: {
      location: { hostname: 'example.test' },
      innerHeight: 800,
      pageYOffset: 0,
      addEventListener() {},
      getComputedStyle() { return { overflowY: 'visible' }; },
      scrollTo() {}
    },
    chrome: {
      i18n: { getMessage: (key) => key },
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
    MutationObserver: class { observe() {} },
    setTimeout() {},
    clearTimeout() {},
    console
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

const sandbox = createContext();
const iconSets = ['defaultArrow', 'triangle', 'chevron', 'doubleArrow'];

iconSets.forEach((iconSet) => {
  const top = sandbox.getIconSvg('top', iconSet);
  const bottom = sandbox.getIconSvg('bottom', iconSet);
  assert(top.includes('<svg') && bottom.includes('<svg'), `${iconSet} returns SVG markup`);
  assert(top !== bottom, `${iconSet} returns direction-specific icons`);
});

assert(
  sandbox.getIconSvg('top', 'missing-set') === sandbox.getIconSvg('top', 'defaultArrow'),
  'invalid icon set falls back to default arrow'
);

const merged = sandbox.mergeAdvancedSettings({
  iconCustomization: {
    enabled: true,
    iconSet: 'chevron',
    iconColor: 'not-a-color'
  }
});

assert(merged.iconCustomization.enabled === true, 'icon customization enabled state is preserved');
assert(merged.iconCustomization.iconSet === 'chevron', 'icon set is preserved');
assert(merged.iconCustomization.iconColor === '#FFFFFF', 'invalid icon color falls back to white');

const legacyDisabled = sandbox.mergeAdvancedSettings({
  iconCustomization: {
    enabled: false,
    iconSet: 'minimalArrow',
    iconColor: '#111111'
  }
});

assert(legacyDisabled.iconCustomization.enabled === true, 'icon customization is always enabled');
assert(legacyDisabled.iconCustomization.iconSet === 'defaultArrow', 'removed icon set falls back to default arrow');

console.log('icon customization tests passed');
