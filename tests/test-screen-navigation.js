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
  const frames = new Map();
  const canceledFrames = [];
  let nextFrameId = 1;

  const documentElement = {
    tagName: 'HTML',
    scrollHeight: 3000,
    clientHeight: 800,
    scrollTop: 1000,
    getBoundingClientRect() {
      return { left: 0, top: 0, right: 1200, bottom: 800, width: 1200, height: 800 };
    }
  };
  const body = {
    tagName: 'BODY',
    scrollHeight: 3000,
    clientHeight: 800,
    scrollTop: 1000
  };
  const document = {
    body,
    documentElement,
    scrollingElement: documentElement,
    readyState: 'complete',
    querySelectorAll() {
      return elements;
    },
    getElementById() {
      return null;
    },
    addEventListener() {}
  };
  const window = {
    innerWidth: 1200,
    innerHeight: 800,
    pageYOffset: 1000,
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
      i18n: {
        getMessage(key) {
          return key;
        }
      },
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
      canceledFrames.push(id);
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
  return { sandbox, elements, frames, canceledFrames, documentElement, window };
}

function createCustomContainer() {
  return {
    tagName: 'MAIN',
    scrollHeight: 1900,
    clientHeight: 600,
    scrollTop: 700,
    overflowY: 'auto',
    getAttribute(name) {
      return name === 'role' ? 'main' : null;
    },
    getBoundingClientRect() {
      return { left: 0, top: 20, right: 1200, bottom: 800, width: 1200, height: 780 };
    }
  };
}

const context = createContext();
const { sandbox } = context;

const defaults = sandbox.mergeAdvancedSettings({});
assert(defaults.screenNavigation.enabled === false, 'screen navigation defaults to disabled');
assert(defaults.screenNavigation.screenStepRatio === 0.9, 'screen navigation defaults to a 90% step');
assert(defaults.screenNavigation.previousScreenButtonColor === '#4A9EDD', 'previous screen uses the default color');
assert(defaults.screenNavigation.nextScreenButtonColor === '#4A9EDD', 'next screen uses the default color');
assert(defaults.screenNavigation.opacity === 100, 'screen navigation opacity defaults to 100%');

const merged = sandbox.mergeAdvancedSettings({
  screenNavigation: {
    screenStepRatio: 2,
    previousScreenButtonColor: '#112233',
    nextScreenButtonColor: '#445566',
    opacity: 35
  }
});
assert(merged.screenNavigation.screenStepRatio === 1, 'screen step ratio is clamped to 100%');
assert(merged.screenNavigation.previousScreenButtonColor === '#112233', 'previous color is merged independently');
assert(merged.screenNavigation.nextScreenButtonColor === '#445566', 'next color is merged independently');
assert(merged.screenNavigation.opacity === 35, 'screen navigation uses one shared opacity');

const root = context.documentElement;
assert(sandbox.getScreenNavigationTarget(root, 1, 0.5) === 1400, 'root next screen supports a 50% step');
assert(sandbox.getScreenNavigationTarget(root, 1, 0.9) === 1720, 'root next screen supports a 90% step');
assert(sandbox.getScreenNavigationTarget(root, -1, 1) === 200, 'root previous screen supports a 100% step');

context.window.pageYOffset = 100;
root.scrollTop = 100;
assert(sandbox.getScreenNavigationTarget(root, -1, 0.9) === 0, 'previous screen clamps at the top boundary');
context.window.pageYOffset = 2100;
root.scrollTop = 2100;
assert(sandbox.getScreenNavigationTarget(root, 1, 0.9) === 2200, 'next screen clamps at the bottom boundary');

const customContainer = createCustomContainer();
assert(sandbox.getScreenNavigationTarget(customContainer, -1, 0.9) === 160, 'custom container uses its own viewport height');
assert(sandbox.getScreenNavigationTarget(customContainer, 1, 0.9) === 1240, 'custom container next step uses 90% of clientHeight');
assert(sandbox.getScreenNavigationTarget(customContainer, 1, 1) === 1300, 'custom container clamps at its own bottom');

context.documentElement.scrollHeight = 800;
context.window.pageYOffset = 0;
context.sandbox.document.body.scrollHeight = 800;
context.elements.push(customContainer);
vm.runInContext('advancedSettings.screenNavigation.enabled = true;', sandbox);
sandbox.navigateByScreen(1);
assert(context.frames.size === 1, 'screen navigation starts one smooth scroll animation');
sandbox.navigateByScreen(-1);
assert(context.frames.size === 1, 'a new screen jump replaces the old animation');
assert(context.canceledFrames.length === 1, 'a new screen jump cancels the previous animation frame');
assert(vm.runInContext('currentScrollContainer === document.querySelectorAll()[0]', sandbox), 'dynamic container is resolved on demand');

const previousIcon = sandbox.getScreenNavigationIconSvg('previous');
const nextIcon = sandbox.getScreenNavigationIconSvg('next');
assert(previousIcon.includes('<rect') && nextIcon.includes('<rect'), 'screen buttons use a dedicated viewport outline');
assert(previousIcon !== nextIcon, 'previous and next screen icons retain distinct directions');
assert(!previousIcon.includes('getIconSvg') && !nextIcon.includes('getIconSvg'), 'screen icons are independent from the main icon set');

const topButton = { className: 'psm-scroll-top' };
const progressButton = { className: 'psm-progress-button' };
const bottomButton = { className: 'psm-scroll-bottom' };
const buttonChildren = [topButton, progressButton, bottomButton];
const buttonContainer = {
  insertBefore(button, reference) {
    const existingIndex = buttonChildren.indexOf(button);
    if (existingIndex >= 0) buttonChildren.splice(existingIndex, 1);
    buttonChildren.splice(buttonChildren.indexOf(reference), 0, button);
  }
};
let createdScreenButtons = 0;
function createTestScreenButton(direction) {
  createdScreenButtons += 1;
  const button = {
    direction,
    className: direction === 'previous' ? 'psm-screen-previous' : 'psm-screen-next',
    remove() {
      const index = buttonChildren.indexOf(button);
      if (index >= 0) buttonChildren.splice(index, 1);
    }
  };
  return button;
}
sandbox.getButtonContainer = () => buttonContainer;
sandbox.getButtonElements = () => ({
  topButton,
  previousScreenButton: buttonChildren.find((button) => button.className === 'psm-screen-previous') || null,
  progressButton,
  nextScreenButton: buttonChildren.find((button) => button.className === 'psm-screen-next') || null,
  bottomButton
});
sandbox.createScreenNavigationButton = createTestScreenButton;
vm.runInContext('advancedSettings.screenNavigation.enabled = true;', sandbox);
sandbox.ensureScreenNavigationControls();
sandbox.ensureScreenNavigationControls();
assert(createdScreenButtons === 2, 'repeated enable creates only one button per direction');
assert(
  buttonChildren.map((button) => button.className).join('|') ===
    'psm-scroll-top|psm-screen-previous|psm-progress-button|psm-screen-next|psm-scroll-bottom',
  'runtime button order is top, previous, progress, next, bottom'
);
vm.runInContext('advancedSettings.screenNavigation.enabled = false;', sandbox);
sandbox.ensureScreenNavigationControls();
assert(
  !buttonChildren.some((button) => button.className.startsWith('psm-screen-')),
  'disabling screen navigation removes both runtime buttons'
);

console.log('screen navigation tests passed');
