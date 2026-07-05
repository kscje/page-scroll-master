// 默认设置
const domainUtils = PageScrollMasterDomain;
const DOMAIN_STORAGE_KEYS = domainUtils.STORAGE_KEYS;
let scrollSpeed = 100; // 默认滚动速度为100ms
let isExtensionEnabled = false; // 当前网站插件启用状态
let hasLoadedExtensionEnabledState = false; // 站点启用状态加载完成前不初始化按钮
const currentDomainKey = domainUtils.getDomainKey(window.location.href || window.location.hostname);
let domainFeatureStates = {};
let domainFeatureDefaults = domainUtils.normalizeDefaults();
let currentDomainFeatureState = domainUtils.getState({}, currentDomainKey, domainFeatureDefaults);
let currentScrollContainer = null; // 当前页面的滚动容器
let currentScrollContainerStrategy = domainUtils.DEFAULT_CONTAINER_STRATEGY;
const DEFAULT_BUTTON_COLOR = '#4A9EDD'; // 默认按钮颜色
const DEFAULT_ICON_COLOR = '#FFFFFF';
const DEFAULT_PROGRESS_VERTICAL_HEIGHT = 80;
const MAX_PROGRESS_VERTICAL_HEIGHT = 400;
const READING_SPEED_CJK_CHARS_PER_MINUTE = 500;
const READING_SPEED_LATIN_WORDS_PER_MINUTE = 225;
const READING_ESTIMATE_CACHE_MS = 5000;
const HOST_ID = 'page-scroll-master-host';
const CONTAINER_ID = 'page-scroll-master-button';
const DYNAMIC_STYLE_ID = 'page-scroll-master-dynamic-styles';
const HORIZONTAL_PROGRESS_ID = 'page-scroll-master-horizontal-progress';
const BOOKMARK_TOOL_CONTAINER_ID = 'page-scroll-master-bookmark-tool';
const OUTLINE_TOOL_CONTAINER_ID = 'page-scroll-master-outline-tool';
const AUTO_SCROLL_TOOL_CONTAINER_ID = 'page-scroll-master-auto-scroll-tool';
const BOOKMARK_MENU_ID = 'page-scroll-master-bookmark-menu';
const OUTLINE_MENU_ID = 'page-scroll-master-outline-menu';
const BOOKMARK_TOAST_ID = 'page-scroll-master-bookmark-toast';
const BOOKMARKS_STORAGE_KEY = 'bookmarks';
const PENDING_BOOKMARK_RESTORE_STORAGE_KEY = 'pendingScrollBookmarkRestore';
const PENDING_BOOKMARK_RESTORE_MAX_AGE = 2 * 60 * 1000;
const PENDING_BOOKMARK_RESTORE_RETRY_DELAY = 250;
const PENDING_BOOKMARK_RESTORE_MAX_RETRIES = 20;
const SCROLL_ANIMATION_MAX_DURATION_FACTOR = 1.5;
const SCROLL_ANIMATION_BOTTOM_REFRESH_MS = 200;
let outlineHighlightScrollTarget = null;
let outlineHighlightUpdateFrame = null;
let outlineHighlightMenu = null;
let outlineHighlightModel = null;
let outlineSnapshotGeneration = 0;
let outlineLastKnownUrl = window.location.href;
let outlineRouteChangeTimer = null;
const LABEL_SCROLL_TOP = chrome.i18n.getMessage('popupScrollTop') || 'Scroll to Top';
const LABEL_SCROLL_BOTTOM = chrome.i18n.getMessage('popupScrollBottom') || 'Scroll to Bottom';
const LABEL_PREVIOUS_SCREEN = chrome.i18n.getMessage('previousScreen') || 'Previous Screen';
const LABEL_NEXT_SCREEN = chrome.i18n.getMessage('nextScreen') || 'Next Screen';
const LABEL_AUTO_SCROLL_PLAY = chrome.i18n.getMessage('autoScrollPlay') || 'Start auto scroll';
const LABEL_AUTO_SCROLL_PAUSE = chrome.i18n.getMessage('autoScrollPause') || 'Pause auto scroll';
const AUTO_SCROLL_ICON_SIZE = '48%';

function recordAnalyticsAction(actionKey) {
  if (!chrome.runtime || typeof chrome.runtime.sendMessage !== 'function') return;
  chrome.runtime.sendMessage({
    action: 'analytics:recordAction',
    actionKey
  }, () => {
    if (chrome.runtime.lastError) return;
  });
}
const DEFAULT_ADVANCED_SETTINGS = {
  autoScroll: {
    enabled: false,
    speedPreset: 'standard',
    customSpeed: 40,
    buttonPosition: 'pageTop',
    buttonColor: DEFAULT_BUTTON_COLOR,
    pauseOnUserScroll: true,
    pauseOnTextSelection: true,
    pauseOnEditableFocus: true,
    pauseWhenPageHidden: true,
    pauseOnFullscreen: true,
    pauseOnVideo: true
  },
  screenNavigation: {
    enabled: false,
    screenStepRatio: 0.9,
    previousScreenButtonColor: DEFAULT_BUTTON_COLOR,
    nextScreenButtonColor: DEFAULT_BUTTON_COLOR
  },
  progressBar: {
    enabled: false,
    mode: 'verticalButton',
    horizontalPosition: 'top',
    colorMode: 'custom',
    customColor: '#4a9edd',
    thickness: 4,
    verticalHeight: DEFAULT_PROGRESS_VERTICAL_HEIGHT,
    clickToJump: true,
    showPercentage: true,
    showRemainingTime: false
  },
  iconCustomization: {
    enabled: true,
    iconSet: 'defaultArrow',
    iconColor: DEFAULT_ICON_COLOR,
    customIcon: {
      enabled: false,
      topIconDataUrl: '',
      bottomIconDataUrl: ''
    }
  },
  scrollBookmarks: {
    enabled: false,
    buttonPosition: 'pageBottom',
    buttonColorMode: 'custom',
    buttonCustomColor: '#4a9edd',
    matchMode: 'exact',
    perDomainLimit: 1,
    globalLimit: 300,
    restoreMode: 'prompt'
  },
  outlineNavigation: {
    enabled: false,
    buttonPosition: 'pageBottom',
    buttonColorMode: 'custom',
    buttonCustomColor: '#4a9edd',
    sources: {
      h1: true,
      h2: true,
      h3: false,
      idBlocks: false
    },
    maxItems: 30,
    filterShortHeadings: true,
    highlightCurrentSection: true
  }
};

// SPA 页面动态加载检测配置
const SPA_DETECTION_CONFIG = {
  // 首次延迟检测时间（ms），仅在首次初始化时使用
  initialDelay: 80,
  // 使用 MutationObserver 检测 DOM 变化后的防抖间隔
  mutationDebounceDelay: 200,
  // 动态重试固定间隔（等距重试，不再指数递增）
  retryInterval: 500,
  // 最大重试次数
  maxRetries: 20
};
let spaDetectionState = {
  retryCount: 0,
  observer: null,
  initialTimer: null,
  debounceTimer: null,
  retryTimer: null,
  domReadyHandler: null,
  isInitialized: false
};
let initializationRetryTimer = null;
let buttonSettings = {
  horizontalPosition: 'right',
  verticalAlignment: 'center',
  showButton: true, // 始终显示按钮
  buttonSize: 40,
  buttonSizeUnit: 'px', // 固定为px单位
  buttonSpacing: 8, // 按钮间距，默认8px
  edgeDistance: 8, // 边缘距离，默认8px
  topButtonColor: DEFAULT_BUTTON_COLOR, // 默认顶部按钮颜色
  bottomButtonColor: DEFAULT_BUTTON_COLOR, // 默认底部按钮颜色
  opacity: 100,
  enableHoverHide: true, // 启用鼠标悬停+快捷键隐藏按钮
  hoverHideKey: 'Ctrl', // 快捷键组合
  buttonShape: 'round' // 按钮形状：round-圆形，square-正方形
};
let advancedSettings = mergeAdvancedSettings();
let progressScrollTarget = null;
let progressUpdateFrame = null;
let screenNavigationAnimationContainer = null;
let autoScrollRuntime = {
  state: 'stopped',
  frame: null,
  container: null,
  lastTimestamp: null,
  remainder: 0,
  listenersBound: false
};
const scrollAnimationStateMap = new WeakMap();
let activeScrollAnimationState = null;
let readingEstimateCache = {
  target: null,
  calculatedAt: 0,
  textLength: 0,
  seconds: 0
};
let bookmarkRestoreCheckedForKey = '';
let restorePromptShownForKey = '';
let pendingBookmarkRestoreKeyInProgress = '';

const SCROLLABLE_OVERFLOW_VALUES = new Set(['auto', 'scroll', 'overlay']);
const PROGRAMMATIC_SCROLL_OVERFLOW_VALUES = new Set(['hidden']);
const WHEEL_FALLBACK_MAX_STEPS = 28;
const WHEEL_FALLBACK_INTERVAL_MS = 16;
const SCROLL_CONTAINER_CANDIDATE_SELECTOR = [
  'div',
  'section',
  'main',
  'article',
  'aside',
  'nav',
  'header',
  'footer',
  'pre',
  'code',
  '[role="main"]',
  '[role="document"]',
  '[role="navigation"]',
  '[role="complementary"]',
  '[role="dialog"]',
  '[role="grid"]',
  '[role="table"]',
  '[role="tree"]',
  '[role="listbox"]',
  '[class*="scroll"]',
  '[class*="Scroll"]',
  '[class*="viewport"]',
  '[class*="Viewport"]',
  '[style*="overflow"]'
].join(', ');
const WHEEL_FALLBACK_TARGET_SELECTOR = [
  'main',
  'article',
  'section',
  '[role="main"]',
  '[role="document"]',
  '[role="grid"]',
  '[role="table"]',
  '[role="listbox"]',
  '[role="tree"]',
  '[class*="scroll"]',
  '[class*="Scroll"]',
  '[class*="viewport"]',
  '[class*="Viewport"]',
  '[class*="grid"]',
  '[class*="Grid"]',
  '[class*="table"]',
  '[class*="Table"]',
  '[class*="sheet"]',
  '[class*="Sheet"]',
  '[class*="base"]',
  '[class*="Base"]'
].join(', ');
const OUTLINE_METADATA_TAGS = new Set([
  'table',
  'thead',
  'tbody',
  'tfoot',
  'tr',
  'th',
  'td',
  'figcaption',
  'blockquote',
  'cite'
]);

function isPlainObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value);
}

function deepMergeDefaults(defaults, saved) {
  const result = Array.isArray(defaults) ? [] : {};

  Object.keys(defaults).forEach((key) => {
    const defaultValue = defaults[key];
    const savedValue = isPlainObject(saved) ? saved[key] : undefined;

    if (isPlainObject(defaultValue)) {
      result[key] = deepMergeDefaults(defaultValue, savedValue);
    } else {
      result[key] = savedValue === undefined ? defaultValue : savedValue;
    }
  });

  return result;
}

function mergeAdvancedSettings(savedSettings) {
  const merged = deepMergeDefaults(DEFAULT_ADVANCED_SETTINGS, savedSettings);
  const savedAutoScroll = isPlainObject(savedSettings) && isPlainObject(savedSettings.autoScroll)
    ? savedSettings.autoScroll
    : {};
  const savedOutline = isPlainObject(savedSettings) && isPlainObject(savedSettings.outlineNavigation)
    ? savedSettings.outlineNavigation
    : {};
  const savedScrollBookmarks = isPlainObject(savedSettings) && isPlainObject(savedSettings.scrollBookmarks)
    ? savedSettings.scrollBookmarks
    : {};
  const savedReadingTools = isPlainObject(savedSettings) && isPlainObject(savedSettings.readingTools)
    ? savedSettings.readingTools
    : {};
  const savedFeatures = isPlainObject(savedSettings) &&
    isPlainObject(savedSettings.readingTools) &&
    isPlainObject(savedSettings.readingTools.features)
    ? savedSettings.readingTools.features
    : {};
  merged.progressBar.customColor = validateHexColor(merged.progressBar.customColor, '#4a9edd');
  merged.autoScroll.speedPreset = normalizeAutoScrollSpeedPreset(merged.autoScroll.speedPreset);
  merged.autoScroll.customSpeed = clampNumber(merged.autoScroll.customSpeed, 10, 300, 40);
  merged.autoScroll.buttonPosition = normalizeFeatureButtonPosition(merged.autoScroll.buttonPosition);
  merged.autoScroll.buttonColor = validateHexColor(merged.autoScroll.buttonColor, DEFAULT_BUTTON_COLOR);
  [
    'pauseOnUserScroll',
    'pauseOnTextSelection',
    'pauseOnEditableFocus',
    'pauseWhenPageHidden',
    'pauseOnFullscreen',
    'pauseOnVideo'
  ].forEach((key) => {
    merged.autoScroll[key] = normalizeBoolean(
      savedAutoScroll[key],
      DEFAULT_ADVANCED_SETTINGS.autoScroll[key]
    );
  });
  merged.screenNavigation.screenStepRatio = clampNumber(
    merged.screenNavigation.screenStepRatio,
    0.5,
    1,
    0.9
  );
  merged.screenNavigation.previousScreenButtonColor = validateHexColor(
    merged.screenNavigation.previousScreenButtonColor,
    DEFAULT_BUTTON_COLOR
  );
  merged.screenNavigation.nextScreenButtonColor = validateHexColor(
    merged.screenNavigation.nextScreenButtonColor,
    DEFAULT_BUTTON_COLOR
  );
  merged.progressBar.thickness = normalizeProgressThickness(merged.progressBar.thickness);
  merged.progressBar.verticalHeight = clampNumber(merged.progressBar.verticalHeight, 40, MAX_PROGRESS_VERTICAL_HEIGHT, DEFAULT_PROGRESS_VERTICAL_HEIGHT);
  merged.iconCustomization.enabled = true;
  merged.iconCustomization.iconSet = normalizeIconSet(merged.iconCustomization.iconSet);
  merged.iconCustomization.iconColor = validateHexColor(merged.iconCustomization.iconColor, DEFAULT_ICON_COLOR);
  const legacyBookmarkEnabled = savedReadingTools.enabled === true && savedFeatures.scrollBookmarks !== false;
  const bookmarkEnabled = typeof savedScrollBookmarks.enabled === 'boolean'
    ? savedScrollBookmarks.enabled
    : legacyBookmarkEnabled;
  const outlineEnabled = typeof savedOutline.enabled === 'boolean'
    ? savedOutline.enabled
    : savedFeatures.outlineNavigation === true;
  merged.scrollBookmarks.enabled = bookmarkEnabled;
  merged.scrollBookmarks.buttonPosition = normalizeFeatureButtonPosition(
    savedScrollBookmarks.buttonPosition === undefined && savedReadingTools.buttonPosition !== undefined
      ? savedReadingTools.buttonPosition
      : merged.scrollBookmarks.buttonPosition
  );
  merged.scrollBookmarks.buttonColorMode = normalizeFeatureButtonColorMode(
    savedScrollBookmarks.buttonColorMode === undefined && savedReadingTools.buttonColorMode !== undefined
      ? savedReadingTools.buttonColorMode
      : merged.scrollBookmarks.buttonColorMode
  );
  merged.scrollBookmarks.buttonCustomColor = validateHexColor(
    savedScrollBookmarks.buttonCustomColor === undefined ? savedReadingTools.buttonCustomColor : merged.scrollBookmarks.buttonCustomColor,
    '#4a9edd'
  );
  merged.outlineNavigation.enabled = outlineEnabled;
  merged.outlineNavigation.buttonPosition = normalizeFeatureButtonPosition(
    savedOutline.buttonPosition === undefined && savedReadingTools.buttonPosition !== undefined
      ? savedReadingTools.buttonPosition
      : merged.outlineNavigation.buttonPosition
  );
  merged.outlineNavigation.buttonColorMode = normalizeFeatureButtonColorMode(
    savedOutline.buttonColorMode === undefined && savedReadingTools.buttonColorMode !== undefined
      ? savedReadingTools.buttonColorMode
      : merged.outlineNavigation.buttonColorMode
  );
  merged.outlineNavigation.buttonCustomColor = validateHexColor(
    savedOutline.buttonCustomColor === undefined ? savedReadingTools.buttonCustomColor : merged.outlineNavigation.buttonCustomColor,
    '#4a9edd'
  );
  merged.outlineNavigation.sources.h1 = normalizeBoolean(
    merged.outlineNavigation.sources.h1,
    DEFAULT_ADVANCED_SETTINGS.outlineNavigation.sources.h1
  );
  merged.outlineNavigation.sources.h2 = normalizeBoolean(
    merged.outlineNavigation.sources.h2,
    DEFAULT_ADVANCED_SETTINGS.outlineNavigation.sources.h2
  );
  merged.outlineNavigation.sources.h3 = normalizeBoolean(
    merged.outlineNavigation.sources.h3,
    DEFAULT_ADVANCED_SETTINGS.outlineNavigation.sources.h3
  );
  merged.outlineNavigation.sources.idBlocks = normalizeBoolean(
    merged.outlineNavigation.sources.idBlocks,
    DEFAULT_ADVANCED_SETTINGS.outlineNavigation.sources.idBlocks
  );
  if (!Object.values(merged.outlineNavigation.sources).some(Boolean)) {
    merged.outlineNavigation.sources.h1 = true;
    merged.outlineNavigation.sources.h2 = true;
  }
  merged.outlineNavigation.maxItems = normalizeOutlineMaxItems(merged.outlineNavigation.maxItems);
  merged.outlineNavigation.filterShortHeadings = normalizeBoolean(
    merged.outlineNavigation.filterShortHeadings,
    DEFAULT_ADVANCED_SETTINGS.outlineNavigation.filterShortHeadings
  );
  merged.outlineNavigation.highlightCurrentSection = normalizeBoolean(
    merged.outlineNavigation.highlightCurrentSection,
    DEFAULT_ADVANCED_SETTINGS.outlineNavigation.highlightCurrentSection
  );
  merged.scrollBookmarks.matchMode = 'exact';
  merged.scrollBookmarks.perDomainLimit = normalizePerDomainLimit(merged.scrollBookmarks.perDomainLimit);
  merged.scrollBookmarks.globalLimit = clampNumber(merged.scrollBookmarks.globalLimit, 1, 300, 300);
  merged.scrollBookmarks.restoreMode = normalizeBookmarkRestoreMode(
    savedScrollBookmarks.restoreMode,
    savedScrollBookmarks.restorePromptEnabled
  );
  return merged;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function clampNumber(value, min, max, fallback) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return clamp(number, min, max);
}

function normalizeBoolean(value, fallback) {
  return typeof value === 'boolean' ? value : fallback;
}

function normalizeAutoScrollSpeedPreset(value) {
  return ['slow', 'standard', 'fast', 'custom'].includes(value) ? value : 'standard';
}

function getAutoScrollSpeed(settings = advancedSettings.autoScroll) {
  const presetSpeeds = {
    slow: 20,
    standard: 40,
    fast: 80
  };
  const preset = normalizeAutoScrollSpeedPreset(settings && settings.speedPreset);
  return preset === 'custom'
    ? clampNumber(settings.customSpeed, 10, 300, 40)
    : presetSpeeds[preset];
}

function normalizeOutlineMaxItems(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return DEFAULT_ADVANCED_SETTINGS.outlineNavigation.maxItems;
  return clamp(Math.round(number), 10, 50);
}

function validateHexColor(color, fallback) {
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color || '') ? color : fallback;
}

function hexToRgb(color) {
  const hex = validateHexColor(color, DEFAULT_BUTTON_COLOR).slice(1);
  const normalized = hex.length === 3
    ? hex.split('').map((char) => char + char).join('')
    : hex;
  const value = parseInt(normalized, 16);
  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255
  };
}

function getProgressFillColor() {
  const rgb = hexToRgb(getProgressColor());
  const shade = 0.72;
  const r = Math.round(rgb.r * shade);
  const g = Math.round(rgb.g * shade);
  const b = Math.round(rgb.b * shade);
  return `rgb(${r}, ${g}, ${b})`;
}

function normalizeProgressThickness(value) {
  const number = Number(value);
  return [2, 3, 4, 6, 8, 12, 16].includes(number) ? number : 4;
}

function normalizeIconSet(value) {
  return ['defaultArrow', 'triangle', 'chevron', 'doubleArrow'].includes(value)
    ? value
    : 'defaultArrow';
}

function normalizeReadingToolPosition(value) {
  if (value === 'betweenScrollButtons') return 'pageMiddle';
  return ['pageTop', 'pageBottom', 'pageMiddle'].includes(value) ? value : 'pageBottom';
}

function normalizeReadingToolColorMode(value) {
  return ['followTopButton', 'followBottomButton', 'custom'].includes(value)
    ? value
    : 'followTopButton';
}

function normalizeFeatureButtonPosition(value) {
  return normalizeReadingToolPosition(value);
}

function normalizeFeatureButtonColorMode(value) {
  return normalizeReadingToolColorMode(value);
}

function normalizePerDomainLimit(value) {
  const limit = Number(value);
  return [1, 2, 3].includes(limit) ? limit : 1;
}

function normalizeBookmarkRestoreMode(value, legacyRestorePromptEnabled) {
  if (['auto', 'prompt', 'manual'].includes(value)) {
    return value;
  }
  return legacyRestorePromptEnabled === false ? 'manual' : 'prompt';
}

function isRootScrollElement(element) {
  return element === document.scrollingElement ||
    element === document.documentElement ||
    element === document.body;
}

function getElementScrollRange(element) {
  if (!element) return 0;

  if (isRootScrollElement(element)) {
    const body = document.body;
    const documentElement = document.documentElement;
    const scrollHeight = Math.max(
      element.scrollHeight || 0,
      body ? body.scrollHeight || 0 : 0,
      documentElement ? documentElement.scrollHeight || 0 : 0
    );
    const viewportHeight = window.innerHeight || documentElement.clientHeight || element.clientHeight || 0;
    return Math.max(0, scrollHeight - viewportHeight);
  }

  return Math.max(0, (element.scrollHeight || 0) - (element.clientHeight || 0));
}

function getPageScrollContainer() {
  return document.scrollingElement || document.documentElement;
}

function getEffectiveContainerStrategy() {
  return domainUtils.normalizeContainerStrategy(currentDomainFeatureState.containerStrategy);
}

function isScrollContainerUsable(container) {
  if (!container) return false;
  if (!isRootScrollElement(container) && container.isConnected === false) return false;
  return getElementScrollRange(container) > 1;
}

function nodeContains(container, target) {
  if (!container || !target) return false;
  if (container === target) return true;
  return typeof container.contains === 'function' && container.contains(target);
}

function isLikelyPrimaryScrollCandidate(element) {
  if (!element || !element.tagName || !canScrollVertically(element)) return false;
  if (isLikelyPeripheralEdgeScrollContainer(element)) return false;

  const metrics = getElementViewportMetrics(element);
  return isSemanticallyPrimaryScrollContainer(element) ||
    (metrics.widthRatio >= 0.45 && metrics.heightRatio >= 0.35);
}

function hasAddedPrimaryScrollCandidate(node) {
  if (!node || typeof node !== 'object') return false;
  const candidates = [];
  if (node.tagName) {
    candidates.push(node);
  }
  if (typeof node.querySelectorAll === 'function') {
    candidates.push(...Array.from(node.querySelectorAll(SCROLL_CONTAINER_CANDIDATE_SELECTOR)).slice(0, 80));
  }

  return candidates.some(isLikelyPrimaryScrollCandidate);
}

function shouldReevaluateScrollContainer(mutations) {
  if (!isScrollContainerUsable(currentScrollContainer)) return true;
  if (!Array.isArray(mutations)) return false;

  return mutations.some((mutation) => {
    const removedNodes = Array.from(mutation.removedNodes || []);
    if (removedNodes.some((node) => nodeContains(node, currentScrollContainer))) {
      return true;
    }

    const addedNodes = Array.from(mutation.addedNodes || []);
    return addedNodes.some(hasAddedPrimaryScrollCandidate);
  });
}

function canScrollVertically(element) {
  if (!element || getElementScrollRange(element) <= 1) return false;
  if (isRootScrollElement(element)) return true;

  const overflowY = window.getComputedStyle(element).overflowY;
  if (SCROLLABLE_OVERFLOW_VALUES.has(overflowY)) return true;
  if (!PROGRAMMATIC_SCROLL_OVERFLOW_VALUES.has(overflowY)) return false;

  const originalScrollTop = element.scrollTop || 0;
  const probeScrollTop = originalScrollTop <= 0 ? 1 : originalScrollTop - 1;
  element.scrollTop = probeScrollTop;
  const canSetScrollTop = element.scrollTop !== originalScrollTop;
  element.scrollTop = originalScrollTop;
  return canSetScrollTop;
}

function getElementViewportMetrics(element) {
  if (!element || typeof element.getBoundingClientRect !== 'function') {
    return {
      areaRatio: 0,
      widthRatio: 0,
      heightRatio: 0,
      viewportHeight: 0,
      touchesLeftEdge: false,
      touchesRightEdge: false
    };
  }

  const rect = element.getBoundingClientRect();
  const viewportWidth = window.innerWidth || document.documentElement.clientWidth || 0;
  const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0;
  if (!viewportWidth || !viewportHeight || rect.width <= 0 || rect.height <= 0) {
    return {
      areaRatio: 0,
      widthRatio: 0,
      heightRatio: 0,
      viewportHeight,
      touchesLeftEdge: false,
      touchesRightEdge: false
    };
  }

  const visibleWidth = Math.max(0, Math.min(rect.right, viewportWidth) - Math.max(rect.left, 0));
  const visibleHeight = Math.max(0, Math.min(rect.bottom, viewportHeight) - Math.max(rect.top, 0));
  const visibleArea = visibleWidth * visibleHeight;
  const viewportArea = viewportWidth * viewportHeight;
  return {
    areaRatio: visibleArea / viewportArea,
    widthRatio: visibleWidth / viewportWidth,
    heightRatio: visibleHeight / viewportHeight,
    viewportHeight,
    touchesLeftEdge: rect.left <= 12,
    touchesRightEdge: rect.right >= viewportWidth - 12
  };
}

function getElementViewportScore(element) {
  const metrics = getElementViewportMetrics(element);
  return metrics ? metrics.areaRatio || 0 : 0;
}

function getWheelFallbackPointCandidates() {
  const viewportWidth = window.innerWidth || document.documentElement.clientWidth || 0;
  const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0;
  if (!viewportWidth || !viewportHeight || typeof document.elementFromPoint !== 'function') {
    return [];
  }

  return [
    [viewportWidth * 0.5, viewportHeight * 0.55],
    [viewportWidth * 0.5, viewportHeight * 0.7],
    [viewportWidth * 0.62, viewportHeight * 0.55],
    [viewportWidth * 0.38, viewportHeight * 0.55]
  ]
    .map(([x, y]) => document.elementFromPoint(Math.round(x), Math.round(y)))
    .filter(Boolean);
}

function scoreWheelFallbackTarget(element) {
  if (!element || !element.tagName || typeof element.getBoundingClientRect !== 'function') {
    return -Infinity;
  }

  const tagName = element.tagName.toLowerCase();
  const role = element.getAttribute ? (element.getAttribute('role') || '').toLowerCase() : '';
  const className = typeof element.className === 'string' ? element.className : '';
  const id = element.id || '';
  const text = `${tagName} ${role} ${id} ${className}`;
  const metrics = getElementViewportMetrics(element);
  let score = (metrics.areaRatio || 0) * 3000;

  if (['main', 'article', 'section'].includes(tagName)) score += 500;
  if (['main', 'document', 'grid', 'table', 'listbox', 'tree'].includes(role)) score += 650;
  if (/base|bitable|sheet|grid|table|view|viewport|scroll/i.test(text)) score += 500;
  if (metrics.widthRatio >= 0.45 && metrics.heightRatio >= 0.35) score += 700;
  if (metrics.widthRatio >= 0.6) score += 350;
  if (getElementScrollRange(element) > 1) score += 250;
  if (['nav', 'aside', 'header', 'footer'].includes(tagName)) score -= 1600;
  if (['navigation', 'complementary', 'banner', 'contentinfo', 'dialog'].includes(role)) score -= 1600;
  if (isLikelyPeripheralEdgeScrollContainer(element)) score -= 2200;

  return score;
}

function getWheelFallbackTarget() {
  const seen = new Set();
  const candidates = [];

  getWheelFallbackPointCandidates().forEach((element) => {
    let current = element;
    while (current && current !== document.documentElement.parentElement) {
      if (!seen.has(current)) {
        seen.add(current);
        candidates.push(current);
      }
      if (current === document.body || current === document.documentElement) break;
      current = current.parentElement;
    }
  });

  if (typeof document.querySelectorAll === 'function') {
    Array.from(document.querySelectorAll(WHEEL_FALLBACK_TARGET_SELECTOR)).slice(0, 120).forEach((element) => {
      if (!seen.has(element)) {
        seen.add(element);
        candidates.push(element);
      }
    });
  }

  return candidates
    .filter((element) => {
      const metrics = getElementViewportMetrics(element);
      return metrics.areaRatio > 0.02 && metrics.widthRatio > 0.2 && metrics.heightRatio > 0.12;
    })
    .sort((a, b) => scoreWheelFallbackTarget(b) - scoreWheelFallbackTarget(a))[0] ||
    document.elementFromPoint?.(
      Math.round((window.innerWidth || document.documentElement.clientWidth || 0) * 0.5),
      Math.round((window.innerHeight || document.documentElement.clientHeight || 0) * 0.55)
    ) ||
    document.body ||
    document.documentElement;
}

function isSemanticallyPrimaryScrollContainer(element) {
  const tagName = element && element.tagName ? element.tagName.toLowerCase() : '';
  const role = element && element.getAttribute ? (element.getAttribute('role') || '').toLowerCase() : '';
  return ['main', 'article'].includes(tagName) || ['main', 'document'].includes(role);
}

function isLikelyPeripheralEdgeScrollContainer(element) {
  if (!element || isRootScrollElement(element) || isSemanticallyPrimaryScrollContainer(element)) return false;
  const metrics = getElementViewportMetrics(element);
  return metrics.widthRatio > 0 &&
    metrics.widthRatio < 0.36 &&
    metrics.heightRatio > 0.45 &&
    (metrics.touchesLeftEdge || metrics.touchesRightEdge);
}

function isRetainablePrimaryScrollContainer(element) {
  if (!element) return false;
  if (isRootScrollElement(element)) return true;
  if (element.isConnected === false) return false;
  if (isLikelyPeripheralEdgeScrollContainer(element)) return false;
  const metrics = getElementViewportMetrics(element);
  return isSemanticallyPrimaryScrollContainer(element) ||
    (metrics.widthRatio >= 0.45 && metrics.heightRatio >= 0.4);
}

function scoreScrollContainer(element) {
  const range = getElementScrollRange(element);
  const viewportMetrics = getElementViewportMetrics(element);
  const viewportScore = viewportMetrics ? viewportMetrics.areaRatio || 0 : 0;
  const tagName = element.tagName ? element.tagName.toLowerCase() : '';
  const role = element.getAttribute ? (element.getAttribute('role') || '').toLowerCase() : '';
  const rangeCap = Math.max(1200, (viewportMetrics.viewportHeight || 0) * 4);
  let score = Math.min(range, rangeCap);

  score += viewportScore * 2000;

  if (isRootScrollElement(element)) score += 1000;
  if (['main', 'article'].includes(tagName)) score += 700;
  if (tagName === 'section') score += 300;
  if (['body', 'html'].includes(tagName)) score += 500;
  if (['main', 'document'].includes(role)) score += 600;
  if (['nav', 'aside', 'header', 'footer'].includes(tagName)) score -= 1800;
  if (['navigation', 'complementary', 'banner', 'contentinfo', 'dialog'].includes(role)) score -= 1800;
  if (tagName === 'pre' || tagName === 'code') score -= 2000;
  if (viewportScore < 0.03) score -= 2500;
  else if (viewportScore < 0.12) score -= 1500;
  if (isLikelyPeripheralEdgeScrollContainer(element)) {
    score -= 2600;
  }
  if (viewportMetrics.widthRatio >= 0.45 && viewportMetrics.heightRatio >= 0.5) score += 1200;
  if (viewportMetrics.widthRatio >= 0.6) score += 800;

  return score;
}

// 自动检测页面的滚动容器
// 策略：综合根滚动元素和常见内容容器，优先选择可见面积大、滚动范围大、语义更接近主内容的容器
function findScrollContainer(strategy = getEffectiveContainerStrategy(), options = {}) {
  if (domainUtils.normalizeContainerStrategy(strategy) === 'page') {
    return getPageScrollContainer();
  }

  const fallback = getPageScrollContainer();
  const candidates = [
    fallback,
    document.scrollingElement,
    document.documentElement,
    document.body,
    ...document.querySelectorAll(SCROLL_CONTAINER_CANDIDATE_SELECTOR)
  ].filter(Boolean);
  const seen = new Set();
  const scrollableElements = [];

  for (const el of candidates) {
    if (seen.has(el)) continue;
    seen.add(el);
    if (!canScrollVertically(el)) continue;
    scrollableElements.push(el);
  }

  if (scrollableElements.length === 0) {
    return fallback;
  }

  if (scrollableElements.length === 1) {
    if (isLikelyPeripheralEdgeScrollContainer(scrollableElements[0])) {
      if (isRetainablePrimaryScrollContainer(options.preferredContainer)) {
        return options.preferredContainer;
      }
      return fallback;
    }
    return scrollableElements[0];
  }

  let bestCandidate = scrollableElements[0];
  let bestScore = scoreScrollContainer(bestCandidate);

  for (let i = 1; i < scrollableElements.length; i++) {
    const score = scoreScrollContainer(scrollableElements[i]);
    if (score > bestScore) {
      bestScore = score;
      bestCandidate = scrollableElements[i];
    }
  }

  return bestCandidate;
}

function setCurrentScrollContainer(nextContainer, strategy) {
  const oldContainer = currentScrollContainer;
  const nextStrategy = domainUtils.normalizeContainerStrategy(strategy);
  if (nextContainer === oldContainer && nextStrategy === currentScrollContainerStrategy) {
    return false;
  }

  if (autoScrollRuntime.state !== 'stopped' && autoScrollRuntime.container === oldContainer) {
    stopAutoScroll();
  }
  currentScrollContainer = nextContainer;
  currentScrollContainerStrategy = nextStrategy;

  if (advancedSettings.progressBar.enabled) {
    bindProgressToContainer(currentScrollContainer || getPageScrollContainer());
  }

  return true;
}

function resolveScrollContainer(options = {}) {
  const strategy = getEffectiveContainerStrategy();
  if (options.refresh === true || strategy !== currentScrollContainerStrategy || !isScrollContainerUsable(currentScrollContainer)) {
    const nextContainer = findScrollContainer(strategy, {
      preferredContainer: currentScrollContainer
    });
    setCurrentScrollContainer(nextContainer, strategy);
  }

  return currentScrollContainer || getPageScrollContainer();
}

function getOutlineScanRoot(container) {
  if (!container) return null;
  if (isRootScrollElement(container)) {
    const pageRoot = document.body || document.documentElement;
    if (!pageRoot || typeof pageRoot.querySelectorAll !== 'function') {
      return pageRoot;
    }
    const contentRoots = Array.from(pageRoot.querySelectorAll('main, [role="main"], article'));
    return contentRoots.find((element) => element.tagName && element.tagName.toLowerCase() === 'main') ||
      contentRoots.find((element) => element.getAttribute && element.getAttribute('role') === 'main') ||
      contentRoots.find((element) => element.tagName && element.tagName.toLowerCase() === 'article') ||
      pageRoot;
  }
  return container;
}

function getOutlineCandidateSelector(sources) {
  const selectors = [];
  if (sources.h1) selectors.push('h1');
  if (sources.h2) selectors.push('h2');
  if (sources.h3) selectors.push('h3');
  if (sources.idBlocks) selectors.push('[id]:not(h1):not(h2):not(h3)');
  return selectors.join(', ');
}

function getOutlineItemLevel(element) {
  const tagName = element && element.tagName ? element.tagName.toLowerCase() : '';
  if (/^h[1-3]$/.test(tagName)) {
    return Number(tagName.slice(1));
  }
  return 0;
}

function getOutlineItemText(element) {
  if (!element) return '';
  return (element.innerText || element.textContent || '').replace(/\s+/g, ' ').trim();
}

function isOutlineSemanticNoise(element, scanRoot) {
  let current = element;
  while (current && current !== scanRoot) {
    const tagName = current.tagName ? current.tagName.toLowerCase() : '';
    const role = current.getAttribute ? (current.getAttribute('role') || '').toLowerCase() : '';
    if (
      ['nav', 'footer', 'aside', 'header'].includes(tagName) ||
      ['banner', 'navigation', 'complementary'].includes(role) ||
      OUTLINE_METADATA_TAGS.has(tagName)
    ) {
      return true;
    }
    if (tagName === 'li') {
      let sectionRoot = element.parentElement;
      let hasSectionRoot = false;
      while (sectionRoot && sectionRoot !== current) {
        const sectionTag = sectionRoot.tagName ? sectionRoot.tagName.toLowerCase() : '';
        if (['article', 'section', 'main'].includes(sectionTag)) {
          hasSectionRoot = true;
          break;
        }
        sectionRoot = sectionRoot.parentElement;
      }
      if (!hasSectionRoot) return true;
    }
    current = current.parentElement;
  }
  return false;
}

function hasOutlineLayout(element) {
  if (!element) return false;
  if (typeof element.getClientRects === 'function' && element.getClientRects().length > 0) {
    return true;
  }
  if (typeof element.getBoundingClientRect === 'function') {
    const rect = element.getBoundingClientRect();
    if (rect && (rect.width > 0 || rect.height > 0)) {
      return true;
    }
  }
  return element.offsetParent !== null && element.offsetParent !== undefined;
}

function isOutlineElementVisible(element, scanRoot) {
  if (!element || element.isConnected === false || !hasOutlineLayout(element)) {
    return false;
  }

  let current = element;
  while (current) {
    if (current.isConnected === false) return false;
    if (typeof window.getComputedStyle === 'function') {
      const style = window.getComputedStyle(current);
      if (style && (style.display === 'none' || style.visibility === 'hidden')) {
        return false;
      }
    }
    if (current === scanRoot) break;
    current = current.parentElement;
  }
  return true;
}

function isOutlineTextReadable(text, filterShortHeadings) {
  if (!text) return false;
  const meaningfulCharacters = text.match(/[\p{L}\p{N}]/gu) || [];
  if (meaningfulCharacters.length === 0) return false;
  const normalizedText = text.trim();
  const compactText = normalizedText.replace(/\s+/g, '');
  if (!/\p{L}/u.test(normalizedText)) return false;
  if (/^(?:isbn(?:-1[03])?|issn|oclc|doi|ssrn)\b/i.test(normalizedText)) return false;
  if (/^10\.\d{4,9}\/\S+$/i.test(compactText)) return false;
  if (/^(?:97[89][-\s]?)?(?:\d[-\s]?){9}[\dX]$/i.test(normalizedText)) return false;
  if (!filterShortHeadings) return true;
  return meaningfulCharacters.length >= 2;
}

function areOutlineCandidatesNear(first, second) {
  if (
    !first ||
    !second ||
    typeof first.getBoundingClientRect !== 'function' ||
    typeof second.getBoundingClientRect !== 'function'
  ) {
    return false;
  }
  const firstRect = first.getBoundingClientRect();
  const secondRect = second.getBoundingClientRect();
  if (!firstRect || !secondRect) return false;
  return Math.abs((secondRect.top || 0) - (firstRect.top || 0)) <= 8;
}

function createOutlineItemId(element, order, usedIds) {
  const elementId = element && element.getAttribute ? (element.getAttribute('id') || '').trim() : '';
  const baseId = elementId || `psm-outline-item-${order + 1}`;
  let itemId = baseId;
  let suffix = 2;

  while (usedIds.has(itemId)) {
    itemId = `${baseId}-${suffix}`;
    suffix++;
  }
  usedIds.add(itemId);
  return itemId;
}

function buildOutlineSnapshot(outlineSettings = advancedSettings.outlineNavigation, container = null) {
  if (!outlineSettings || outlineSettings.enabled !== true) {
    return {
      items: [],
      allItems: [],
      totalCount: 0,
      truncated: false,
      container: null,
      generation: outlineSnapshotGeneration
    };
  }

  const settings = deepMergeDefaults(DEFAULT_ADVANCED_SETTINGS.outlineNavigation, outlineSettings);
  const scrollContainer = container || resolveScrollContainer();
  const scanRoot = getOutlineScanRoot(scrollContainer);
  const selector = getOutlineCandidateSelector(settings.sources);
  if (!scanRoot || !selector || typeof scanRoot.querySelectorAll !== 'function') {
    return {
      items: [],
      allItems: [],
      totalCount: 0,
      truncated: false,
      container: scrollContainer,
      generation: outlineSnapshotGeneration
    };
  }

  const candidates = Array.from(scanRoot.querySelectorAll(selector));
  const allItems = [];
  const usedIds = new Set();

  candidates.forEach((element) => {
    const text = getOutlineItemText(element);
    if (
      isOutlineSemanticNoise(element, scanRoot) ||
      !isOutlineElementVisible(element, scanRoot) ||
      !isOutlineTextReadable(text, settings.filterShortHeadings)
    ) {
      return;
    }
    const previousItem = allItems[allItems.length - 1];
    if (
      previousItem &&
      previousItem.text === text &&
      areOutlineCandidatesNear(previousItem.element, element)
    ) {
      return;
    }
    const order = allItems.length;
    allItems.push({
      id: createOutlineItemId(element, order, usedIds),
      text,
      level: getOutlineItemLevel(element),
      element,
      order
    });
  });

  const maxItems = normalizeOutlineMaxItems(settings.maxItems);
  return {
    items: allItems.slice(0, maxItems),
    allItems,
    totalCount: allItems.length,
    truncated: allItems.length > maxItems,
    container: scrollContainer,
    generation: outlineSnapshotGeneration
  };
}

function getScrollTop(container) {
  if (isRootScrollElement(container)) {
    return window.pageYOffset ||
      document.documentElement.scrollTop ||
      (document.body ? document.body.scrollTop : 0) ||
      0;
  }

  return container.scrollTop || 0;
}

function setScrollTop(container, top) {
  if (isRootScrollElement(container)) {
    window.scrollTo(0, top);
    document.documentElement.scrollTop = top;
    if (document.body) {
      document.body.scrollTop = top;
    }
    return;
  }

  container.scrollTop = top;
}

function isAutoScrollContainerConnected(container) {
  return Boolean(
    container &&
    (isRootScrollElement(container) || container.isConnected !== false)
  );
}

function updateAutoScrollButtonState() {
  const { autoScrollButton } = getButtonElements();
  if (!autoScrollButton) return;
  const isPlaying = autoScrollRuntime.state === 'playing';
  const label = isPlaying ? LABEL_AUTO_SCROLL_PAUSE : LABEL_AUTO_SCROLL_PLAY;
  autoScrollButton.title = label;
  autoScrollButton.setAttribute('aria-label', label);
  autoScrollButton.setAttribute('aria-pressed', isPlaying ? 'true' : 'false');
  autoScrollButton.innerHTML = getAutoScrollIconSvg(isPlaying ? 'pause' : 'play');
  applyAutoScrollIconSizing(autoScrollButton);
}

function cancelAutoScrollFrame() {
  if (autoScrollRuntime.frame !== null) {
    cancelAnimationFrame(autoScrollRuntime.frame);
    autoScrollRuntime.frame = null;
  }
}

function stopAutoScroll() {
  cancelAutoScrollFrame();
  autoScrollRuntime.state = 'stopped';
  autoScrollRuntime.container = null;
  autoScrollRuntime.lastTimestamp = null;
  autoScrollRuntime.remainder = 0;
  updateAutoScrollButtonState();
}

function pauseAutoScroll() {
  if (autoScrollRuntime.state !== 'playing') return false;
  cancelAutoScrollFrame();
  autoScrollRuntime.state = 'paused';
  autoScrollRuntime.lastTimestamp = null;
  autoScrollRuntime.remainder = 0;
  updateAutoScrollButtonState();
  return true;
}

function autoScrollFrame(timestamp) {
  if (autoScrollRuntime.state !== 'playing') return;
  const container = autoScrollRuntime.container;
  if (!advancedSettings.autoScroll.enabled || !isAutoScrollContainerConnected(container)) {
    stopAutoScroll();
    return;
  }

  if (autoScrollRuntime.lastTimestamp === null) {
    autoScrollRuntime.lastTimestamp = timestamp;
    autoScrollRuntime.frame = requestAnimationFrame(autoScrollFrame);
    return;
  }

  const elapsedMs = clamp(timestamp - autoScrollRuntime.lastTimestamp, 0, 100);
  autoScrollRuntime.lastTimestamp = timestamp;
  const range = getElementScrollRange(container);
  const currentTop = getScrollTop(container);
  if (range <= 1 || currentTop >= range - 1) {
    setScrollTop(container, range);
    stopAutoScroll();
    return;
  }

  const distance = (getAutoScrollSpeed() * elapsedMs / 1000) + autoScrollRuntime.remainder;
  const pixelDistance = Math.floor(distance);
  autoScrollRuntime.remainder = distance - pixelDistance;
  if (pixelDistance > 0) {
    setScrollTop(container, Math.min(range, currentTop + pixelDistance));
  }

  if (getScrollTop(container) >= range - 1) {
    setScrollTop(container, range);
    stopAutoScroll();
    return;
  }
  autoScrollRuntime.frame = requestAnimationFrame(autoScrollFrame);
}

function startAutoScroll() {
  if (!advancedSettings.autoScroll.enabled) return false;
  if (autoScrollRuntime.state === 'playing') {
    if (isAutoScrollContainerConnected(autoScrollRuntime.container)) {
      return true;
    }
    stopAutoScroll();
  }
  bindAutoScrollPauseListeners();
  if (advancedSettings.autoScroll.pauseWhenPageHidden && document.hidden) return false;
  if (advancedSettings.autoScroll.pauseOnFullscreen && fullscreenManager.checkFullscreen()) return false;
  if (advancedSettings.autoScroll.pauseOnVideo && hasPlayingPrimaryVideo()) return false;
  const container = autoScrollRuntime.state === 'paused' && isAutoScrollContainerConnected(autoScrollRuntime.container)
    ? autoScrollRuntime.container
    : resolveScrollContainer();
  const range = getElementScrollRange(container);
  if (!container || range <= 1 || getScrollTop(container) >= range - 1) {
    stopAutoScroll();
    return false;
  }
  cancelScrollAnimation(container);
  autoScrollRuntime.state = 'playing';
  autoScrollRuntime.container = container;
  autoScrollRuntime.lastTimestamp = null;
  autoScrollRuntime.remainder = 0;
  updateAutoScrollButtonState();
  autoScrollRuntime.frame = requestAnimationFrame(autoScrollFrame);
  return true;
}

function toggleAutoScroll() {
  if (autoScrollRuntime.state === 'playing') {
    pauseAutoScroll();
    return 'paused';
  }
  return startAutoScroll() ? 'playing' : 'stopped';
}

function hasActiveTextSelection() {
  if (typeof window.getSelection !== 'function') return false;
  const selection = window.getSelection();
  return Boolean(selection && !selection.isCollapsed && String(selection).trim());
}

function hasPlayingPrimaryVideo() {
  if (typeof document.querySelectorAll !== 'function') return false;
  const viewportArea = Math.max(
    1,
    (window.innerWidth || document.documentElement.clientWidth || 0) *
    (window.innerHeight || document.documentElement.clientHeight || 0)
  );
  return Array.from(document.querySelectorAll('video')).some((video) => {
    if (!video || String(video.tagName || '').toLowerCase() !== 'video') return false;
    if (!video || video.paused || video.ended || video.readyState < 2) return false;
    if (typeof video.getBoundingClientRect !== 'function') return true;
    const rect = video.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0 && (rect.width * rect.height) >= viewportArea * 0.08;
  });
}

function isEditableTarget(target) {
  if (!target) return false;
  const tagName = target.tagName ? target.tagName.toLowerCase() : '';
  return ['input', 'textarea', 'select'].includes(tagName) || target.isContentEditable === true;
}

function handleAutoScrollUserInput() {
  if (advancedSettings.autoScroll.pauseOnUserScroll) {
    pauseAutoScroll();
  }
}

function handleAutoScrollSelectionChange() {
  if (advancedSettings.autoScroll.pauseOnTextSelection && hasActiveTextSelection()) {
    pauseAutoScroll();
  }
}

function handleAutoScrollFocusIn(event) {
  if (advancedSettings.autoScroll.pauseOnEditableFocus && isEditableTarget(event.target)) {
    pauseAutoScroll();
  }
}

function handleAutoScrollVisibilityChange() {
  if (advancedSettings.autoScroll.pauseWhenPageHidden && document.hidden) {
    pauseAutoScroll();
  }
}

function handleAutoScrollVideoPlay(event) {
  if (
    advancedSettings.autoScroll.pauseOnVideo &&
    event.target &&
    String(event.target.tagName || '').toLowerCase() === 'video'
  ) {
    pauseAutoScroll();
  }
}

function handleAutoScrollPointerDown(event) {
  if (!advancedSettings.autoScroll.pauseOnUserScroll || autoScrollRuntime.state !== 'playing') return;
  const container = autoScrollRuntime.container;
  let rect;
  if (isRootScrollElement(container)) {
    rect = {
      left: 0,
      right: window.innerWidth || document.documentElement.clientWidth || 0,
      top: 0,
      bottom: window.innerHeight || document.documentElement.clientHeight || 0
    };
  } else if (container && typeof container.getBoundingClientRect === 'function') {
    rect = container.getBoundingClientRect();
  }
  if (
    rect &&
    event.clientX >= rect.right - 18 &&
    event.clientX <= rect.right + 2 &&
    event.clientY >= rect.top &&
    event.clientY <= rect.bottom
  ) {
    pauseAutoScroll();
  }
}

function handleAutoScrollKeyDown(event) {
  if (!advancedSettings.autoScroll.pauseOnUserScroll) return;
  if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '].includes(event.key)) {
    pauseAutoScroll();
  }
}

function bindAutoScrollPauseListeners() {
  if (autoScrollRuntime.listenersBound || typeof document.addEventListener !== 'function') return;
  autoScrollRuntime.listenersBound = true;
  document.addEventListener('wheel', handleAutoScrollUserInput, true);
  document.addEventListener('touchstart', handleAutoScrollUserInput, true);
  document.addEventListener('pointerdown', handleAutoScrollPointerDown, true);
  document.addEventListener('keydown', handleAutoScrollKeyDown, true);
  document.addEventListener('selectionchange', handleAutoScrollSelectionChange);
  document.addEventListener('focusin', handleAutoScrollFocusIn, true);
  document.addEventListener('visibilitychange', handleAutoScrollVisibilityChange);
  document.addEventListener('play', handleAutoScrollVideoPlay, true);
  if (typeof window.addEventListener === 'function') {
    window.addEventListener('pagehide', stopAutoScroll);
  }
}

function unbindAutoScrollPauseListeners() {
  if (!autoScrollRuntime.listenersBound || typeof document.removeEventListener !== 'function') return;
  autoScrollRuntime.listenersBound = false;
  document.removeEventListener('wheel', handleAutoScrollUserInput, true);
  document.removeEventListener('touchstart', handleAutoScrollUserInput, true);
  document.removeEventListener('pointerdown', handleAutoScrollPointerDown, true);
  document.removeEventListener('keydown', handleAutoScrollKeyDown, true);
  document.removeEventListener('selectionchange', handleAutoScrollSelectionChange);
  document.removeEventListener('focusin', handleAutoScrollFocusIn, true);
  document.removeEventListener('visibilitychange', handleAutoScrollVisibilityChange);
  document.removeEventListener('play', handleAutoScrollVideoPlay, true);
  if (typeof window.removeEventListener === 'function') {
    window.removeEventListener('pagehide', stopAutoScroll);
  }
}

function getOutlineTargetScrollTop(element, container, offset = 16) {
  if (
    !element ||
    !container ||
    element.isConnected === false ||
    typeof element.getBoundingClientRect !== 'function'
  ) {
    return null;
  }

  const targetRect = element.getBoundingClientRect();
  if (isRootScrollElement(container)) {
    return getScrollTop(container) + targetRect.top - offset;
  }
  if (typeof container.getBoundingClientRect !== 'function') {
    return null;
  }

  const containerRect = container.getBoundingClientRect();
  return getScrollTop(container) + targetRect.top - containerRect.top - offset;
}

function scrollToOutlineItem(element, container, options = {}) {
  const targetTop = getOutlineTargetScrollTop(element, container);
  if (targetTop === null) return false;
  if (!options.keepMenuOpen) {
    hideReadingToolMenu();
  }
  smoothScrollTo(container, targetTop, options);
  return true;
}

function getOutlineReadingAnchorTop(container) {
  if (!container) return 0;
  const viewportHeight = isRootScrollElement(container)
    ? (window.innerHeight || document.documentElement.clientHeight || container.clientHeight || 0)
    : (container.clientHeight || 0);
  return getScrollTop(container) + (viewportHeight * 0.3);
}

function getOutlineNavigationAnchorTop(container) {
  if (!container) return 0;
  return getScrollTop(container) + 24;
}

function getOutlineItemTop(item, container) {
  if (!item || !item.element) return null;
  return getOutlineTargetScrollTop(item.element, container, 0);
}

function getOutlineAdjacentTargets(snapshot) {
  const items = snapshot && Array.isArray(snapshot.allItems) ? snapshot.allItems : snapshot.items || [];
  const container = snapshot ? snapshot.container : null;
  if (!items.length || !container) {
    return {
      previous: null,
      next: null
    };
  }

  const anchorTop = getOutlineNavigationAnchorTop(container);
  const positionedItems = items
    .map((item) => ({
      item,
      top: getOutlineItemTop(item, container)
    }))
    .filter((entry) => entry.top !== null);
  let currentPosition = -1;
  for (let position = 0; position < positionedItems.length; position++) {
    if (positionedItems[position].top <= anchorTop) {
      currentPosition = position;
      continue;
    }
    break;
  }

  return {
    previous: currentPosition > 0 ? positionedItems[currentPosition - 1].item : null,
    next: currentPosition + 1 < positionedItems.length
      ? positionedItems[currentPosition + 1].item
      : null
  };
}

function getOutlineCurrentItem(snapshot) {
  const items = snapshot && Array.isArray(snapshot.allItems) ? snapshot.allItems : snapshot.items || [];
  const container = snapshot ? snapshot.container : null;
  if (!items.length || !container) return null;

  const anchorTop = getOutlineReadingAnchorTop(container);
  let currentItem = null;
  for (let index = 0; index < items.length; index++) {
    const itemTop = getOutlineItemTop(items[index], container);
    if (itemTop === null) continue;
    if (itemTop <= anchorTop) {
      currentItem = items[index];
    } else {
      break;
    }
  }
  return currentItem;
}

function invalidateOutlineSnapshot() {
  outlineSnapshotGeneration++;
  outlineHighlightModel = null;
  const root = getScrollRoot();
  const menus = root
    ? [root.getElementById(OUTLINE_MENU_ID), root.getElementById('page-scroll-master-reading-menu')].filter(Boolean)
    : [];
  menus.forEach((menu) => {
    if (!menu.__psmMenuModel) return;
    setOutlineMenuCurrentItem(menu, '');
    menu.__psmMenuModel.outlineSnapshot = null;
    menu.__psmMenuModel.outlineHighlightEnabled = false;
  });
  unbindOutlineHighlightUpdates();
}

function restartSpaScrollContainerDetection() {
  if (!spaDetectionState.isInitialized) return;
  spaDetectionState.retryCount = 0;
  if (spaDetectionState.retryTimer) {
    clearTimeout(spaDetectionState.retryTimer);
    spaDetectionState.retryTimer = null;
  }
  detectAndUpdateScrollContainer();
}

function handleOutlineRouteChange() {
  if (window.location.href === outlineLastKnownUrl) return false;
  stopAutoScroll();
  outlineLastKnownUrl = window.location.href;
  bookmarkRestoreCheckedForKey = '';
  restorePromptShownForKey = '';
  pendingBookmarkRestoreKeyInProgress = '';
  invalidateOutlineSnapshot();
  hideReadingToolMenu();
  checkBookmarkRestoreOnLifecycle();
  restartSpaScrollContainerDetection();
  return true;
}

function refreshOpenOutlineMenu() {
  const { root, outlineButton } = getButtonElements();
  const menus = root
    ? [root.getElementById(OUTLINE_MENU_ID), root.getElementById('page-scroll-master-reading-menu')].filter(Boolean)
    : [];
  const openMenus = menus.filter((menu) => menu.classList.contains('psm-open'));
  if (!openMenus.length) return false;

  openMenus.forEach((menu) => {
    const model = getOutlineMenuModel({ resolveOutline: true });
    renderReadingToolMenu(menu, { model });
    if (!hasReadingToolMenuContent(model)) {
      hideReadingToolMenu();
      return;
    }
    positionReadingToolMenu(outlineButton, menu, model);
    bindOutlineHighlightUpdates(menu, model);
  });
  return true;
}

function handleOutlineDomChange() {
  if (!advancedSettings.outlineNavigation.enabled) return false;
  invalidateOutlineSnapshot();
  return refreshOpenOutlineMenu();
}

function getOutlineSettingsSignature(settings) {
  const outline = settings && settings.outlineNavigation ? settings.outlineNavigation : {};
  const sources = outline.sources || {};
  return [
    outline.enabled === true ? '1' : '0',
    sources.h1 === true ? '1' : '0',
    sources.h2 === true ? '1' : '0',
    sources.h3 === true ? '1' : '0',
    sources.idBlocks === true ? '1' : '0',
    String(outline.maxItems),
    outline.filterShortHeadings === true ? '1' : '0',
    outline.highlightCurrentSection === true ? '1' : '0'
  ].join('|');
}

function haveOutlineSettingsChanged(previousSettings, nextSettings) {
  return getOutlineSettingsSignature(previousSettings) !== getOutlineSettingsSignature(nextSettings);
}

function handleOutlineSettingsChange(previousSettings, nextSettings) {
  if (!haveOutlineSettingsChanged(previousSettings, nextSettings)) return false;
  invalidateOutlineSnapshot();
  return refreshOpenOutlineMenu();
}

function applyAdvancedSettingsUpdate(nextSettings) {
  const previousSettings = advancedSettings;
  advancedSettings = mergeAdvancedSettings(nextSettings);
  applyEffectiveDomainFeatures();
  if (!advancedSettings.autoScroll.enabled) {
    stopAutoScroll();
  }
  applyAdvancedSettings();
  handleOutlineSettingsChange(previousSettings, advancedSettings);
}

function setupOutlineRouteChangeDetection() {
  if (setupOutlineRouteChangeDetection.initialized) return;
  setupOutlineRouteChangeDetection.initialized = true;
  outlineLastKnownUrl = window.location.href;

  const dispatchRouteCheck = () => {
    if (outlineRouteChangeTimer) {
      clearTimeout(outlineRouteChangeTimer);
    }
    outlineRouteChangeTimer = setTimeout(() => {
      outlineRouteChangeTimer = null;
      handleOutlineRouteChange();
    }, 0);
  };

  ['pushState', 'replaceState'].forEach((methodName) => {
    if (!window.history || typeof window.history[methodName] !== 'function') return;
    const original = window.history[methodName];
    if (original.__psmOutlineWrapped) return;
    const wrapped = function (...args) {
      const result = original.apply(this, args);
      dispatchRouteCheck();
      return result;
    };
    wrapped.__psmOutlineWrapped = true;
    wrapped.__psmOutlineOriginal = original;
    window.history[methodName] = wrapped;
  });

  window.addEventListener('popstate', handleOutlineRouteChange);
  window.addEventListener('hashchange', handleOutlineRouteChange);
}

function teardownOutlineRouteChangeDetection() {
  if (!setupOutlineRouteChangeDetection.initialized) return;
  if (outlineRouteChangeTimer) {
    clearTimeout(outlineRouteChangeTimer);
    outlineRouteChangeTimer = null;
  }
  ['pushState', 'replaceState'].forEach((methodName) => {
    if (!window.history || typeof window.history[methodName] !== 'function') return;
    const wrapped = window.history[methodName];
    if (wrapped.__psmOutlineWrapped && wrapped.__psmOutlineOriginal) {
      window.history[methodName] = wrapped.__psmOutlineOriginal;
    }
  });
  if (typeof window.removeEventListener === 'function') {
    window.removeEventListener('popstate', handleOutlineRouteChange);
    window.removeEventListener('hashchange', handleOutlineRouteChange);
  }
  setupOutlineRouteChangeDetection.initialized = false;
}

function getScrollRoot() {
  const host = document.getElementById(HOST_ID);
  return host ? host.shadowRoot : null;
}

function getButtonContainer() {
  const root = getScrollRoot();
  return root ? root.getElementById(CONTAINER_ID) : null;
}

function getButtonElements() {
  const root = getScrollRoot();
  if (!root || typeof root.querySelector !== 'function') {
    return {
      root: null,
      topButton: null,
      previousScreenButton: null,
      progressButton: null,
      nextScreenButton: null,
      bottomButton: null,
      autoScrollButton: null,
      bookmarkButton: null,
      outlineButton: null
    };
  }

  return {
    root,
    topButton: root.querySelector('.psm-scroll-top'),
    previousScreenButton: root.querySelector('.psm-screen-previous'),
    progressButton: root.querySelector('.psm-progress-button'),
    nextScreenButton: root.querySelector('.psm-screen-next'),
    bottomButton: root.querySelector('.psm-scroll-bottom'),
    autoScrollButton: root.querySelector('.psm-auto-scroll-button'),
    bookmarkButton: root.querySelector('.psm-bookmark-tool-button'),
    outlineButton: root.querySelector('.psm-outline-tool-button')
  };
}

function getScrollTargetBottom() {
  const container = resolveScrollContainer();
  return getElementScrollRange(container);
}

// 从存储中加载用户设置
function loadSettings() {
  chrome.storage.sync.get(['scrollSpeed', 'buttonSettings', 'advancedSettings'], (result) => {
    if (result.scrollSpeed) {
      scrollSpeed = result.scrollSpeed;
    }
    if (result.buttonSettings) {
      buttonSettings = { ...buttonSettings, ...result.buttonSettings };
    }
    advancedSettings = mergeAdvancedSettings(result.advancedSettings);
    loadDomainFeatureState(result.advancedSettings);
  });
}

function getDomainStorageKeys() {
  return [
    DOMAIN_STORAGE_KEYS.states,
    DOMAIN_STORAGE_KEYS.defaults,
    DOMAIN_STORAGE_KEYS.migrationVersion,
    DOMAIN_STORAGE_KEYS.legacyStates
  ];
}

function applyEffectiveDomainFeatures() {
  const state = domainUtils.normalizeState(currentDomainFeatureState, domainFeatureDefaults);
  advancedSettings.autoScroll.enabled = state.extensionEnabled && state.features.autoScroll;
  advancedSettings.progressBar.enabled = state.extensionEnabled && state.features.progressBar;
  advancedSettings.screenNavigation.enabled = state.extensionEnabled && state.features.screenNavigation;
  advancedSettings.scrollBookmarks.enabled = state.extensionEnabled && state.features.scrollBookmarks;
  advancedSettings.outlineNavigation.enabled = state.extensionEnabled && state.features.outlineNavigation;
}

function applyDomainFeatureState(nextState) {
  const wasEnabled = isExtensionEnabled;
  const previousStrategy = getEffectiveContainerStrategy();
  currentDomainFeatureState = domainUtils.normalizeState(nextState, domainFeatureDefaults);
  isExtensionEnabled = currentDomainFeatureState.extensionEnabled;
  hasLoadedExtensionEnabledState = true;
  applyEffectiveDomainFeatures();
  const nextStrategy = getEffectiveContainerStrategy();

  if (!isExtensionEnabled) {
    stopAutoScroll();
    removeButton();
    return;
  }
  if (!wasEnabled || !document.getElementById(HOST_ID)) {
    initializeButton();
    return;
  }
  if (nextStrategy !== previousStrategy) {
    detectAndUpdateScrollContainer();
  }
  applyAdvancedSettings();
}

function loadDomainFeatureState(legacyAdvancedSettings) {
  chrome.storage.local.get(getDomainStorageKeys(), function (result) {
    const migration = domainUtils.migrateStorage(result, legacyAdvancedSettings);
    domainFeatureStates = migration.states;
    domainFeatureDefaults = migration.defaults;
    const finish = () => {
      applyDomainFeatureState(
        domainUtils.getState(domainFeatureStates, currentDomainKey, domainFeatureDefaults)
      );
    };

    if (!migration.needsWrite || !chrome.storage.local.set) {
      finish();
      return;
    }
    chrome.storage.local.set(domainUtils.toStorageData(migration), finish);
  });
}

function smoothScrollTo(container, targetTop, options = {}) {
  if (!container) return;
  pauseAutoScroll();
  if (activeScrollAnimationState && activeScrollAnimationState.container !== container) {
    cancelScrollAnimation(activeScrollAnimationState.container);
  }
  cancelScrollAnimation(container);

  const start = getScrollTop(container);
  let range = getElementScrollRange(container);
  let end = clampNumber(targetTop, 0, range, 0);
  const targetMode = options.targetMode || '';
  const startTime = performance.now();
  const duration = Math.max(1, scrollSpeed);
  const maxDuration = duration * SCROLL_ANIMATION_MAX_DURATION_FACTOR;
  const animationState = {
    frame: null,
    container,
    onCancel: options.onCancel,
    lastBottomRefreshTime: startTime
  };
  scrollAnimationStateMap.set(container, animationState);
  activeScrollAnimationState = animationState;

  function scroll(currentTime) {
    if (scrollAnimationStateMap.get(container) !== animationState) return;
    if (targetMode === 'bottom' && currentTime - animationState.lastBottomRefreshTime >= SCROLL_ANIMATION_BOTTOM_REFRESH_MS) {
      animationState.lastBottomRefreshTime = currentTime;
      range = getElementScrollRange(container);
      if (range > end) {
        end = range;
      }
    }

    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const easeProgress = easeInOutCubic(progress);
    const currentTop = getScrollTop(container);
    const idealTop = start + (end - start) * easeProgress;
    const maxStep = getMaxScrollAnimationStep(container, end - start);
    const delta = idealTop - currentTop;
    let nextTop = idealTop;
    let isStepLimited = false;
    if (Math.abs(delta) > maxStep && elapsed < maxDuration) {
      nextTop = currentTop + (Math.sign(delta) * maxStep);
      isStepLimited = true;
    }

    setScrollTop(container, nextTop);

    if (progress < 1 || (isStepLimited && elapsed < maxDuration)) {
      animationState.frame = requestAnimationFrame(scroll);
    } else {
      scrollAnimationStateMap.delete(container);
      if (activeScrollAnimationState === animationState) {
        activeScrollAnimationState = null;
      }
      if (targetMode === 'bottom') {
        setScrollTop(container, getElementScrollRange(container));
      }
      requestProgressUpdate();
      if (typeof options.onComplete === 'function') {
        options.onComplete();
      } else {
        requestOutlineHighlightUpdate();
      }
      if (
        typeof options.onNoMovement === 'function' &&
        Math.abs(end - start) > 1 &&
        Math.abs(getScrollTop(container) - start) <= 1
      ) {
        options.onNoMovement();
      }
    }
  }

  animationState.frame = requestAnimationFrame(scroll);
}

function createWheelEvent(deltaY) {
  const options = {
    bubbles: true,
    cancelable: true,
    deltaMode: 0,
    deltaX: 0,
    deltaY
  };
  if (typeof WheelEvent === 'function') {
    return new WheelEvent('wheel', options);
  }
  if (typeof document.createEvent === 'function') {
    const event = document.createEvent('WheelEvent');
    if (typeof event.initEvent === 'function') {
      event.initEvent('wheel', true, true);
    }
    Object.defineProperty(event, 'deltaY', { value: deltaY });
    Object.defineProperty(event, 'deltaX', { value: 0 });
    Object.defineProperty(event, 'deltaMode', { value: 0 });
    return event;
  }
  return null;
}

function startWheelFallbackScroll(direction) {
  const target = getWheelFallbackTarget();
  if (!target || typeof target.dispatchEvent !== 'function') return false;

  const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 800;
  const deltaY = Math.sign(direction || 1) * Math.max(600, viewportHeight * 0.9);
  let steps = 0;

  function step() {
    const event = createWheelEvent(deltaY);
    if (!event) return;
    target.dispatchEvent(event);
    steps++;
    if (steps < WHEEL_FALLBACK_MAX_STEPS) {
      setTimeout(step, WHEEL_FALLBACK_INTERVAL_MS);
    } else {
      requestProgressUpdate();
      requestOutlineHighlightUpdate();
    }
  }

  step();
  return true;
}

function cancelScrollAnimation(container) {
  if (!container) return;
  const animationState = scrollAnimationStateMap.get(container);
  if (!animationState) return;
  if (animationState.frame) {
    cancelAnimationFrame(animationState.frame);
  }
  scrollAnimationStateMap.delete(container);
  if (activeScrollAnimationState === animationState) {
    activeScrollAnimationState = null;
  }
  if (typeof animationState.onCancel === 'function') {
    animationState.onCancel();
  }
}

function navigateOutlineMenuToItem(item, snapshot, menu) {
  if (!item || !snapshot) return false;
  if (menu) {
    menu.__psmHighlightLockId = item.id;
    setOutlineMenuCurrentItem(menu, item.id, { scrollCurrentIntoView: true });
  }
  const didStart = scrollToOutlineItem(item.element, snapshot.container, {
    keepMenuOpen: true,
    onCancel: () => {
      if (menu && menu.__psmHighlightLockId === item.id) {
        menu.__psmHighlightLockId = '';
      }
    },
    onComplete: () => {
      if (!menu || menu.__psmHighlightLockId !== item.id) return;
      if (!menu.classList.contains('psm-open')) {
        menu.__psmHighlightLockId = '';
        return;
      }
      setOutlineMenuCurrentItem(menu, item.id, { scrollCurrentIntoView: true });
      updateOutlineAdjacentActions(menu, menu.__psmMenuModel);
      menu.__psmHighlightLockId = '';
    }
  });
  if (!didStart && menu && menu.__psmHighlightLockId === item.id) {
    menu.__psmHighlightLockId = '';
  }
  if (didStart) {
    recordAnalyticsAction('outlineJumpClicks');
  }
  return didStart;
}

// 平滑滚动到顶部
function scrollToTop() {
  const container = resolveScrollContainer({ refresh: true });
  if (getElementScrollRange(container) <= 1) {
    startWheelFallbackScroll(-1);
    return;
  }
  smoothScrollTo(container, 0, {
    onNoMovement: () => startWheelFallbackScroll(-1)
  });
}

// 平滑滚动到底部
function scrollToBottom() {
  const container = resolveScrollContainer({ refresh: true });
  const range = getElementScrollRange(container);
  if (range <= 1) {
    startWheelFallbackScroll(1);
    return;
  }
  smoothScrollTo(container, range, {
    targetMode: 'bottom',
    onNoMovement: () => startWheelFallbackScroll(1)
  });
}

function getScrollContainerViewportHeight(container) {
  if (!container) return 0;
  if (isRootScrollElement(container)) {
    return window.innerHeight || document.documentElement.clientHeight || container.clientHeight || 0;
  }
  return container.clientHeight || 0;
}

function getMaxScrollAnimationStep(container, distance) {
  const viewportHeight = Math.max(1, getScrollContainerViewportHeight(container) || 0);
  const expectedFrameCount = Math.max(1, scrollSpeed / 16);
  const distancePerFrame = Math.abs(distance) / expectedFrameCount;
  return Math.max(80, viewportHeight * 0.8, distancePerFrame * 2);
}

function getScreenNavigationTarget(container, direction, ratio = advancedSettings.screenNavigation.screenStepRatio) {
  const currentTop = getScrollTop(container);
  const maxScrollTop = getElementScrollRange(container);
  const viewportHeight = getScrollContainerViewportHeight(container);
  const normalizedRatio = clampNumber(ratio, 0.5, 1, 0.9);
  return clamp(currentTop + (direction * viewportHeight * normalizedRatio), 0, maxScrollTop);
}

function navigateByScreen(direction) {
  if (!advancedSettings.screenNavigation.enabled) return false;
  const container = resolveScrollContainer();
  const targetTop = getScreenNavigationTarget(container, direction);
  if (screenNavigationAnimationContainer) {
    cancelScrollAnimation(screenNavigationAnimationContainer);
  }
  screenNavigationAnimationContainer = container;
  smoothScrollTo(container, targetTop, {
    onCancel: () => {
      if (screenNavigationAnimationContainer === container) {
        screenNavigationAnimationContainer = null;
      }
    },
    onComplete: () => {
      if (screenNavigationAnimationContainer === container) {
        screenNavigationAnimationContainer = null;
      }
      requestOutlineHighlightUpdate();
    }
  });
  return true;
}

// 缓动函数
function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function getIconSvg(direction, iconSet) {
  const isTop = direction === 'top';
  const icons = {
    defaultArrow: {
      top: '<svg class="scroll-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg>',
      bottom: '<svg class="scroll-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12l7 7 7-7"/></svg>'
    },
    triangle: {
      top: '<svg class="scroll-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 5l8 12H4z"/></svg>',
      bottom: '<svg class="scroll-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 19L4 7h16z"/></svg>'
    },
    chevron: {
      top: '<svg class="scroll-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 15l7-7 7 7"/></svg>',
      bottom: '<svg class="scroll-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 9l7 7 7-7"/></svg>'
    },
    doubleArrow: {
      top: '<svg class="scroll-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.7" stroke-linecap="round" stroke-linejoin="round"><path d="M7 13l5-5 5 5M7 19l5-5 5 5"/></svg>',
      bottom: '<svg class="scroll-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.7" stroke-linecap="round" stroke-linejoin="round"><path d="M7 5l5 5 5-5M7 11l5 5 5-5"/></svg>'
    }
  };
  const set = icons[iconSet] || icons.defaultArrow;
  return isTop ? set.top : set.bottom;
}

function getBookmarkIconSvg() {
  return '<svg class="scroll-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 4.5A2.5 2.5 0 0 1 8.5 2h7A2.5 2.5 0 0 1 18 4.5V21l-6-3.5L6 21V4.5z"/></svg>';
}

function getOutlineIconSvg() {
  return '<svg class="scroll-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h10"/></svg>';
}

function getScreenNavigationIconSvg(direction) {
  const arrowPath = direction === 'previous'
    ? '<path d="M12 17V8M8.5 11.5 12 8l3.5 3.5"/>'
    : '<path d="M12 7v9m-3.5-3.5L12 16l3.5-3.5"/>';
  return `<svg class="scroll-icon psm-screen-navigation-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="3.5" width="16" height="17" rx="2"/>${arrowPath}</svg>`;
}

function getActiveIconSet() {
  return normalizeIconSet(advancedSettings.iconCustomization.iconSet);
}

function getActiveIconColor() {
  return validateHexColor(advancedSettings.iconCustomization.iconColor, DEFAULT_ICON_COLOR);
}

function getIconSizePercent() {
  return Math.max(40, Math.min(70, parseInt(buttonSettings.buttonSize, 10) * 0.6)) + '%';
}

function applyIconSizing() {
  const {
    topButton,
    previousScreenButton,
    nextScreenButton,
    bottomButton,
    bookmarkButton,
    outlineButton
  } = getButtonElements();
  const iconSize = getIconSizePercent();
  [topButton, previousScreenButton, nextScreenButton, bottomButton, bookmarkButton, outlineButton].forEach((button) => {
    if (!button) return;
    const icon = button.querySelector('.scroll-icon');
    if (!icon) return;
    icon.style.width = iconSize;
    icon.style.height = iconSize;
  });
  const { autoScrollButton } = getButtonElements();
  applyAutoScrollIconSizing(autoScrollButton);
}

function applyAutoScrollIconSizing(autoScrollButton) {
  const autoScrollIcon = autoScrollButton ? autoScrollButton.querySelector('.psm-auto-scroll-icon') : null;
  if (autoScrollIcon) {
    autoScrollIcon.style.width = AUTO_SCROLL_ICON_SIZE;
    autoScrollIcon.style.height = AUTO_SCROLL_ICON_SIZE;
  }
}

function applyButtonIcons() {
  const {
    topButton,
    previousScreenButton,
    nextScreenButton,
    bottomButton,
    bookmarkButton,
    outlineButton
  } = getButtonElements();
  if (!topButton || !bottomButton) return;
  const iconSet = getActiveIconSet();
  topButton.innerHTML = getIconSvg('top', iconSet);
  bottomButton.innerHTML = getIconSvg('bottom', iconSet);
  if (previousScreenButton) {
    previousScreenButton.innerHTML = getScreenNavigationIconSvg('previous');
  }
  if (nextScreenButton) {
    nextScreenButton.innerHTML = getScreenNavigationIconSvg('next');
  }
  if (bookmarkButton) {
    bookmarkButton.innerHTML = getBookmarkIconSvg();
  }
  if (outlineButton) {
    outlineButton.innerHTML = getOutlineIconSvg();
  }
  applyIconSizing();
}

function getProgressColor() {
  const progressSettings = advancedSettings.progressBar;
  if (progressSettings.colorMode === 'followBottomButton') {
    return validateHexColor(buttonSettings.bottomButtonColor, DEFAULT_BUTTON_COLOR);
  }
  if (progressSettings.colorMode === 'custom') {
    return validateHexColor(progressSettings.customColor, '#4a9edd');
  }
  return validateHexColor(buttonSettings.topButtonColor, DEFAULT_BUTTON_COLOR);
}

function isScrollBookmarkToolEnabled() {
  return Boolean(advancedSettings.scrollBookmarks.enabled && hasReadingToolMenuContent(getScrollBookmarkMenuModel()));
}

function isOutlineToolEnabled() {
  return Boolean(advancedSettings.outlineNavigation.enabled && hasReadingToolMenuContent(getOutlineMenuModel()));
}

function getFeatureToolColor(settings) {
  if (settings.buttonColorMode === 'followBottomButton') {
    return validateHexColor(buttonSettings.bottomButtonColor, DEFAULT_BUTTON_COLOR);
  }
  if (settings.buttonColorMode === 'custom') {
    return validateHexColor(settings.buttonCustomColor, '#4a9edd');
  }
  return validateHexColor(buttonSettings.topButtonColor, DEFAULT_BUTTON_COLOR);
}

function getBookmarkToolColor() {
  return getFeatureToolColor(advancedSettings.scrollBookmarks);
}

function getOutlineToolColor() {
  return getFeatureToolColor(advancedSettings.outlineNavigation);
}

function getBookmarkMenuActionLabel(label, scrollPct) {
  if (scrollPct === null || scrollPct === undefined || scrollPct === '') {
    return label;
  }
  const value = Number(scrollPct);
  if (!Number.isFinite(value)) {
    return label;
  }
  return `${label}（${Math.round(clamp(value, 0, 1) * 100)}%）`;
}

function createFeatureToolButton({ className, title, iconSvg, handler }) {
  const button = document.createElement('button');
  button.className = `psm-scroll-button psm-feature-tool-button ${className}`;
  button.type = 'button';
  button.title = title;
  button.setAttribute('aria-label', title);
  button.innerHTML = iconSvg;
  button.addEventListener('click', handler);
  return button;
}

function createBookmarkToolButton() {
  return createFeatureToolButton({
    className: 'psm-bookmark-tool-button',
    title: '滚动位置书签',
    iconSvg: getBookmarkIconSvg(),
    handler: handleBookmarkToolClick
  });
}

function createOutlineToolButton() {
  return createFeatureToolButton({
    className: 'psm-outline-tool-button',
    title: '智能段落跳转',
    iconSvg: getOutlineIconSvg(),
    handler: handleOutlineToolClick
  });
}

const readingToolMenuContributors = [];

function registerReadingToolMenuContributor(contributor) {
  if (typeof contributor === 'function' && !readingToolMenuContributors.includes(contributor)) {
    readingToolMenuContributors.push(contributor);
  }
}

function getScrollBookmarkMenuContribution(options = {}) {
  if (!advancedSettings.scrollBookmarks.enabled) {
    return null;
  }
  return {
    fixedActions: [
      {
        action: 'save-bookmark',
        label: getBookmarkMenuActionLabel('保存当前位置', options.currentScrollPct),
        handler: () => {
          hideReadingToolMenu();
          saveScrollBookmark();
        }
      },
      {
        action: 'restore-bookmark',
        label: getBookmarkMenuActionLabel('加载已保存位置', options.savedScrollPct),
        handler: () => {
          hideReadingToolMenu();
          restoreCurrentScrollBookmark();
        }
      }
    ]
  };
}

registerReadingToolMenuContributor(getScrollBookmarkMenuContribution);

function getOutlineMenuContribution(options = {}) {
  if (!advancedSettings.outlineNavigation.enabled) {
    return null;
  }
  if (!options.resolveOutline) {
    return { outlineEnabled: true };
  }

  const snapshot = buildOutlineSnapshot();
  const adjacentTargets = getOutlineAdjacentTargets(snapshot);
  const currentItem = advancedSettings.outlineNavigation.highlightCurrentSection
    ? getOutlineCurrentItem(snapshot)
    : null;
  const snapshotItems = Array.isArray(snapshot.allItems) ? snapshot.allItems : snapshot.items;
  const outlineItems = [
    {
      kind: 'outline-heading',
      label: '页面目录'
    }
  ];

  if (snapshotItems.length === 0) {
    outlineItems.push({
      kind: 'outline-status',
      label: '未检测到可跳转标题'
    });
  } else {
    snapshotItems.forEach((item) => {
      outlineItems.push({
        kind: 'outline-item',
        action: `outline-jump-${item.order}`,
        label: item.text,
        title: item.text,
        outlineId: item.id,
        order: item.order,
        level: item.level,
        current: Boolean(currentItem && currentItem.id === item.id),
        handler: (menu) => {
          navigateOutlineMenuToItem(item, snapshot, menu);
        }
      });
    });
  }

  return {
    outlineEnabled: true,
    outlineSnapshot: snapshot,
    outlineHighlightEnabled: advancedSettings.outlineNavigation.highlightCurrentSection,
    outlineBatchSize: normalizeOutlineMaxItems(advancedSettings.outlineNavigation.maxItems),
    outlineVisibleCount: Math.min(
      normalizeOutlineMaxItems(advancedSettings.outlineNavigation.maxItems),
      snapshotItems.length
    ),
    fixedActions: [
      {
        action: 'outline-previous',
        label: '上一段',
        disabled: !adjacentTargets.previous,
        handler: (menu) => {
          const target = getOutlineAdjacentTargets(snapshot).previous;
          if (target) {
            navigateOutlineMenuToItem(target, snapshot, menu);
          }
        }
      },
      {
        action: 'outline-next',
        label: '下一段',
        disabled: !adjacentTargets.next,
        handler: (menu) => {
          const target = getOutlineAdjacentTargets(snapshot).next;
          if (target) {
            navigateOutlineMenuToItem(target, snapshot, menu);
          }
        }
      }
    ],
    outlineItems
  };
}

registerReadingToolMenuContributor(getOutlineMenuContribution);

function createEmptyReadingToolMenuModel() {
  return {
    fixedActions: [],
    outlineItems: [],
    outlineEnabled: false,
    outlineSnapshot: null,
    outlineHighlightEnabled: false,
    outlineBatchSize: DEFAULT_ADVANCED_SETTINGS.outlineNavigation.maxItems,
    outlineVisibleCount: 0
  };
}

function getMenuModelFromContributors(contributors, options = {}) {
  return contributors.reduce((model, contributor) => {
    const contribution = contributor(options);
    if (!contribution) return model;
    if (Array.isArray(contribution.fixedActions)) {
      model.fixedActions.push(...contribution.fixedActions);
    }
    if (Array.isArray(contribution.outlineItems)) {
      model.outlineItems.push(...contribution.outlineItems);
    }
    if (contribution.outlineEnabled) {
      model.outlineEnabled = true;
    }
    if (contribution.outlineSnapshot) {
      model.outlineSnapshot = contribution.outlineSnapshot;
    }
    if (contribution.outlineHighlightEnabled) {
      model.outlineHighlightEnabled = true;
    }
    if (Number.isInteger(contribution.outlineBatchSize)) {
      model.outlineBatchSize = contribution.outlineBatchSize;
    }
    if (Number.isInteger(contribution.outlineVisibleCount)) {
      model.outlineVisibleCount = contribution.outlineVisibleCount;
    }
    return model;
  }, createEmptyReadingToolMenuModel());
}

function getScrollBookmarkMenuModel(options = {}) {
  return getMenuModelFromContributors([getScrollBookmarkMenuContribution], options);
}

function getOutlineMenuModel(options = {}) {
  return getMenuModelFromContributors([getOutlineMenuContribution], options);
}

function getReadingToolMenuModel(options = {}) {
  return getMenuModelFromContributors(readingToolMenuContributors, options);
}

function hasReadingToolMenuContent(model) {
  return Boolean(model && (model.fixedActions.length || model.outlineItems.length || model.outlineEnabled));
}

function createReadingToolMenuItem(item) {
  if (item.kind === 'outline-heading' || item.kind === 'outline-status') {
    const row = document.createElement('div');
    row.className = `psm-reading-menu-${item.kind.replace('outline-', '')}`;
    row.textContent = item.label;
    if (item.title) {
      row.title = item.title;
    }
    if (item.outlineId) {
      row.setAttribute('data-outline-id', item.outlineId);
    }
    if (Number.isInteger(item.order)) {
      row.setAttribute('data-outline-order', String(item.order));
    }
    if (item.kind === 'outline-heading') {
      row.setAttribute('role', 'heading');
      row.setAttribute('aria-level', '2');
      const actions = document.createElement('span');
      actions.className = 'psm-reading-menu-heading-actions';
      const pinButton = document.createElement('button');
      pinButton.type = 'button';
      pinButton.className = item.pinned
        ? 'psm-reading-menu-pin psm-active'
        : 'psm-reading-menu-pin';
      pinButton.innerHTML = `
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M8 3h8l-1.5 6 3 3v2h-5v7h-1v-7h-5v-2l3-3L8 3z"></path>
        </svg>
      `;
      pinButton.title = item.pinned ? '取消钉住目录' : '钉住目录';
      pinButton.setAttribute('aria-label', pinButton.title);
      pinButton.setAttribute('aria-pressed', item.pinned ? 'true' : 'false');
      pinButton.setAttribute('data-action', 'outline-toggle-pin');
      actions.appendChild(pinButton);
      const closeButton = document.createElement('button');
      closeButton.type = 'button';
      closeButton.className = 'psm-reading-menu-close';
      closeButton.textContent = '×';
      closeButton.title = '关闭目录';
      closeButton.setAttribute('aria-label', '关闭目录');
      closeButton.setAttribute('data-action', 'outline-close');
      actions.appendChild(closeButton);
      row.appendChild(actions);
    }
    return row;
  }

  const button = document.createElement('button');
  if (item.kind === 'outline-item') {
    button.className = item.current
      ? 'psm-reading-menu-item psm-outline-current'
      : 'psm-reading-menu-item';
  } else if (item.kind === 'outline-load-more') {
    button.className = 'psm-reading-menu-item psm-outline-load-more';
  }
  button.type = 'button';
  button.textContent = item.label;
  button.setAttribute('data-action', item.action);
  if (item.title) {
    button.title = item.title;
  }
  if (item.outlineId) {
    button.setAttribute('data-outline-id', item.outlineId);
  }
  if (Number.isInteger(item.order)) {
    button.setAttribute('data-outline-order', String(item.order));
  }
  if (Number.isInteger(item.level) && item.level >= 1 && item.level <= 3) {
    button.setAttribute('data-outline-level', String(item.level));
    button.classList.add(`psm-outline-level-${item.level}`);
  }
  if (item.current) {
    button.setAttribute('aria-current', 'location');
  }
  if (item.disabled) {
    button.disabled = true;
    button.setAttribute('aria-disabled', 'true');
  }
  return button;
}

function getVisibleOutlineMenuItems(model) {
  const headingItems = model.outlineItems.filter((item) => item.kind !== 'outline-item');
  const outlineEntries = model.outlineItems.filter((item) => item.kind === 'outline-item');
  const visibleCount = Math.min(model.outlineVisibleCount, outlineEntries.length);
  const visibleItems = outlineEntries.slice(0, visibleCount);
  const items = [...headingItems, ...visibleItems];
  const remainingCount = outlineEntries.length - visibleCount;

  if (remainingCount > 0) {
    items.push({
      kind: 'outline-load-more',
      action: 'outline-load-more',
      label: `加载更多（剩余 ${remainingCount} 项）`
    });
  }
  return items;
}

function renderReadingToolMenu(menu, options = {}) {
  const model = options.model || getReadingToolMenuModel(options);
  if (!menu) return model;
  const fixedSection = menu.querySelector('.psm-reading-menu-fixed');
  const outlineSection = menu.querySelector('.psm-reading-menu-outline');

  [fixedSection, outlineSection].forEach((section) => {
    if (!section) return;
    while (section.children.length) {
      section.children[0].remove();
    }
  });

  model.fixedActions.forEach((item) => {
    fixedSection.appendChild(createReadingToolMenuItem(item));
  });
  getVisibleOutlineMenuItems(model).forEach((item) => {
    const renderedItem = item.kind === 'outline-heading'
      ? { ...item, pinned: menu.__psmPinned === true }
      : item;
    outlineSection.appendChild(createReadingToolMenuItem(renderedItem));
  });

  menu.__psmMenuModel = model;
  menu.classList.toggle('psm-pinned', menu.__psmPinned === true);
  fixedSection.style.display = model.fixedActions.length ? 'block' : 'none';
  outlineSection.style.display = model.outlineItems.length ? 'block' : 'none';
  return model;
}

function setOutlineMenuCurrentItem(menu, currentId, options = {}) {
  if (!menu) return;
  const outlineSection = menu.querySelector('.psm-reading-menu-outline');
  if (!outlineSection) return;
  const buttons = Array.from(outlineSection.querySelectorAll('.psm-reading-menu-item'));
  let currentButton = null;

  buttons.forEach((button) => {
    const isCurrent = Boolean(currentId && button.getAttribute('data-outline-id') === currentId);
    button.classList.toggle('psm-outline-current', isCurrent);
    if (isCurrent) {
      button.setAttribute('aria-current', 'location');
      currentButton = button;
    } else if (button.removeAttribute) {
      button.removeAttribute('aria-current');
    }
  });

  if (options.scrollCurrentIntoView && currentButton && typeof currentButton.scrollIntoView === 'function') {
    currentButton.scrollIntoView({ block: 'nearest' });
  }
}

function setReadingToolMenuActionDisabled(menu, action, disabled) {
  if (!menu) return;
  const fixedSection = menu.querySelector('.psm-reading-menu-fixed');
  if (!fixedSection) return;
  const button = Array.from(fixedSection.children)
    .find((element) => element.getAttribute && element.getAttribute('data-action') === action);
  if (!button) return;
  button.disabled = disabled;
  if (disabled) {
    button.setAttribute('aria-disabled', 'true');
  } else if (button.removeAttribute) {
    button.removeAttribute('aria-disabled');
  }
}

function updateOutlineAdjacentActions(menu, model) {
  if (!menu || !model || !model.outlineSnapshot) return;
  const adjacentTargets = getOutlineAdjacentTargets(model.outlineSnapshot);
  const previousAction = model.fixedActions.find((item) => item.action === 'outline-previous');
  const nextAction = model.fixedActions.find((item) => item.action === 'outline-next');
  if (previousAction) previousAction.disabled = !adjacentTargets.previous;
  if (nextAction) nextAction.disabled = !adjacentTargets.next;
  setReadingToolMenuActionDisabled(menu, 'outline-previous', !adjacentTargets.previous);
  setReadingToolMenuActionDisabled(menu, 'outline-next', !adjacentTargets.next);
}

function updateOutlineCurrentHighlight(menu, model, options = {}) {
  updateOutlineAdjacentActions(menu, model);
  if (menu && menu.__psmHighlightLockId && !options.ignoreProgrammaticLock) {
    return;
  }
  if (!menu || !model || !model.outlineHighlightEnabled || !model.outlineSnapshot) {
    setOutlineMenuCurrentItem(menu, '');
    return;
  }
  const currentItem = getOutlineCurrentItem(model.outlineSnapshot);
  setOutlineMenuCurrentItem(menu, currentItem ? currentItem.id : '', options);
}

function requestOutlineHighlightUpdate() {
  if (
    outlineHighlightMenu &&
    outlineHighlightMenu.__psmHighlightLockId
  ) {
    return;
  }
  if (outlineHighlightUpdateFrame) return;
  outlineHighlightUpdateFrame = requestAnimationFrame(() => {
    outlineHighlightUpdateFrame = null;
    if (
      outlineHighlightMenu &&
      outlineHighlightMenu.classList.contains('psm-open') &&
      outlineHighlightModel
    ) {
      updateOutlineCurrentHighlight(outlineHighlightMenu, outlineHighlightModel);
    }
  });
}

function unbindOutlineHighlightUpdates() {
  if (outlineHighlightScrollTarget) {
    outlineHighlightScrollTarget.removeEventListener('scroll', requestOutlineHighlightUpdate);
  }
  if (outlineHighlightUpdateFrame) {
    cancelAnimationFrame(outlineHighlightUpdateFrame);
  }
  outlineHighlightScrollTarget = null;
  outlineHighlightUpdateFrame = null;
  outlineHighlightMenu = null;
  outlineHighlightModel = null;
}

function bindOutlineHighlightUpdates(menu, model) {
  unbindOutlineHighlightUpdates();
  if (!menu || !model || !model.outlineHighlightEnabled || !model.outlineSnapshot || !model.outlineSnapshot.container) {
    updateOutlineCurrentHighlight(menu, model);
    return;
  }

  outlineHighlightMenu = menu;
  outlineHighlightModel = model;
  outlineHighlightScrollTarget = getProgressEventTarget(model.outlineSnapshot.container);
  outlineHighlightScrollTarget.addEventListener('scroll', requestOutlineHighlightUpdate, { passive: true });
  updateOutlineCurrentHighlight(menu, model, { scrollCurrentIntoView: true });
}

function handleReadingToolMenuAction(action, model = getReadingToolMenuModel(), menu = null) {
  if (action === 'outline-close') {
    hideReadingToolMenu({ force: true });
    return;
  }
  if (action === 'outline-toggle-pin' && menu && model) {
    menu.__psmPinned = menu.__psmPinned !== true;
    renderReadingToolMenu(menu, { model });
    bindOutlineHighlightUpdates(menu, model);
    return;
  }
  if (action === 'outline-load-more' && menu && model) {
    const outlineItemCount = model.outlineItems.filter((item) => item.kind === 'outline-item').length;
    model.outlineVisibleCount = Math.min(
      outlineItemCount,
      model.outlineVisibleCount + model.outlineBatchSize
    );
    renderReadingToolMenu(menu, { model });
    bindOutlineHighlightUpdates(menu, model);
    return;
  }
  const item = [...model.fixedActions, ...model.outlineItems]
    .find((candidate) => candidate.action === action);
  const isDynamicAdjacentAction = action === 'outline-previous' || action === 'outline-next';
  if (item && (!item.disabled || isDynamicAdjacentAction) && typeof item.handler === 'function') {
    item.handler(menu);
  }
}

function getReadingToolMenuAction(event, menu) {
  const eventPath = event && typeof event.composedPath === 'function'
    ? event.composedPath()
    : [event && event.target].filter(Boolean);
  const actionElement = eventPath.find((element) => {
    if (!element || element === menu || typeof element.getAttribute !== 'function') return false;
    return Boolean(element.getAttribute('data-action'));
  });
  return actionElement ? actionElement.getAttribute('data-action') : '';
}

function getFeatureToolMenu(root, menuId, options = {}) {
  if (!root) return null;
  let menu = root.getElementById(menuId);
  if (menu) return menu;

  menu = document.createElement('div');
  menu.id = menuId;
  menu.className = `psm-reading-menu ${options.className || ''}`.trim();

  const fixedSection = document.createElement('div');
  fixedSection.className = 'psm-reading-menu-fixed';
  fixedSection.setAttribute('data-menu-section', 'fixed-actions');
  menu.appendChild(fixedSection);

  const outlineSection = document.createElement('div');
  outlineSection.className = 'psm-reading-menu-outline';
  outlineSection.setAttribute('data-menu-section', 'outline-scroll');
  menu.appendChild(outlineSection);

  menu.addEventListener('click', (event) => {
    event.stopPropagation();
    const action = getReadingToolMenuAction(event, menu);
    handleReadingToolMenuAction(action, menu.__psmMenuModel, menu);
  });
  root.appendChild(menu);
  renderReadingToolMenu(menu, { model: createEmptyReadingToolMenuModel() });
  return menu;
}

function getBookmarkToolMenu(root) {
  return getFeatureToolMenu(root, BOOKMARK_MENU_ID, { className: 'psm-bookmark-menu' });
}

function getOutlineToolMenu(root) {
  return getFeatureToolMenu(root, OUTLINE_MENU_ID, { className: 'psm-outline-menu' });
}

function getReadingToolMenu(root) {
  return getFeatureToolMenu(root, 'page-scroll-master-reading-menu', { className: 'psm-legacy-reading-menu' });
}

function positionReadingToolMenu(button, menu, model = getReadingToolMenuModel()) {
  if (!button || !menu || typeof button.getBoundingClientRect !== 'function') return;
  const rect = button.getBoundingClientRect();
  const width = 200;
  const spacing = Math.max(8, Number(buttonSettings.buttonSpacing) || 8);
  const viewportWidth = window.innerWidth || document.documentElement.clientWidth || 0;
  const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0;
  const opensLeft = buttonSettings.horizontalPosition !== 'left';
  let left = opensLeft ? rect.left - width - spacing : rect.right + spacing;

  if (left < 8) left = Math.min(rect.left, 8);
  if (viewportWidth && left + width > viewportWidth - 8) left = Math.max(8, viewportWidth - width - 8);

  const measuredHeight = typeof menu.getBoundingClientRect === 'function'
    ? menu.getBoundingClientRect().height
    : 0;
  const estimatedOutlineHeight = Math.min(
    model.outlineItems.length * 36,
    viewportHeight ? viewportHeight * 0.4 : 320
  );
  const menuHeight = measuredHeight || Math.max(
    52,
    12 + (model.fixedActions.length * 36) + estimatedOutlineHeight + (model.outlineItems.length ? 5 : 0)
  );
  let top = rect.top + (rect.height / 2) - (menuHeight / 2);
  if (top < 8) top = 8;
  if (viewportHeight && top + menuHeight > viewportHeight - 8) top = Math.max(8, viewportHeight - menuHeight - 8);

  menu.style.left = `${left}px`;
  menu.style.top = `${top}px`;
}

function openFeatureToolMenu({ event, button, menu, model }) {
  if (event && typeof event.stopPropagation === 'function') {
    event.stopPropagation();
  }
  if (!menu || !button) return false;
  const willOpen = !menu.classList.contains('psm-open');
  if (willOpen) {
    pauseAutoScroll();
    hideReadingToolMenu();
    renderReadingToolMenu(menu, { model });
    if (!hasReadingToolMenuContent(model)) {
      hideReadingToolMenu();
      return false;
    }
    menu.classList.add('psm-open');
    positionReadingToolMenu(button, menu, model);
    bindOutlineHighlightUpdates(menu, model);
  } else {
    hideReadingToolMenu();
  }
  return willOpen;
}

function handleBookmarkToolClick(event) {
  const { root, bookmarkButton } = getButtonElements();
  const menu = getBookmarkToolMenu(root);
  if (event && typeof event.stopPropagation === 'function') {
    event.stopPropagation();
  }
  if (!menu || !bookmarkButton) return;
  if (menu.classList.contains('psm-open')) {
    openFeatureToolMenu({
      button: bookmarkButton,
      menu,
      model: getScrollBookmarkMenuModel({ resolveOutline: false })
    });
    return;
  }

  const currentScrollPct = getScrollProgress(resolveScrollContainer());
  const key = getCurrentBookmarkKey();
  chrome.storage.local.get([BOOKMARKS_STORAGE_KEY], (result) => {
    const bookmark = key ? normalizeBookmarks(result[BOOKMARKS_STORAGE_KEY])[key] : null;
    const savedScrollPct = bookmark && typeof bookmark.scrollPct === 'number'
      ? bookmark.scrollPct
      : null;
    const elements = getButtonElements();
    openFeatureToolMenu({
      button: elements.bookmarkButton,
      menu: getBookmarkToolMenu(elements.root),
      model: getScrollBookmarkMenuModel({
        resolveOutline: false,
        currentScrollPct,
        savedScrollPct
      })
    });
  });
}

function handleOutlineToolClick(event) {
  const { root, outlineButton } = getButtonElements();
  const menu = getOutlineToolMenu(root);
  const didOpen = openFeatureToolMenu({
    event,
    button: outlineButton,
    menu,
    model: getOutlineMenuModel({ resolveOutline: true })
  });
  if (didOpen) {
    recordAnalyticsAction('outlineOpenClicks');
  }
}

function handleReadingToolClick(event) {
  event.stopPropagation();
  const { root, bookmarkButton, outlineButton } = getButtonElements();
  const anchorButton = bookmarkButton || outlineButton;
  const menu = getReadingToolMenu(root);
  if (!menu || !anchorButton) return;
  const willOpen = !menu.classList.contains('psm-open');
  if (willOpen) {
    const model = renderReadingToolMenu(menu, { resolveOutline: true });
    if (!hasReadingToolMenuContent(model)) {
      hideReadingToolMenu();
      return;
    }
    menu.classList.add('psm-open');
    positionReadingToolMenu(anchorButton, menu, model);
    bindOutlineHighlightUpdates(menu, model);
  } else {
    hideReadingToolMenu();
  }
}

function hideReadingToolMenu(options = {}) {
  const root = getScrollRoot();
  if (!root) return;
  [BOOKMARK_MENU_ID, OUTLINE_MENU_ID, 'page-scroll-master-reading-menu'].forEach((menuId) => {
    const menu = root.getElementById(menuId);
    if (menu && (options.force || menu.__psmPinned !== true)) {
      menu.classList.remove('psm-open');
      menu.__psmHighlightLockId = '';
    }
  });
  const pinnedOpenMenu = [OUTLINE_MENU_ID, 'page-scroll-master-reading-menu']
    .map((menuId) => root.getElementById(menuId))
    .find((menu) => menu && menu.__psmPinned === true && menu.classList.contains('psm-open'));
  if (!pinnedOpenMenu) {
    unbindOutlineHighlightUpdates();
  }
}

function handleReadingToolDocumentClick(event) {
  const eventPath = event && typeof event.composedPath === 'function'
    ? event.composedPath()
    : [event && event.target].filter(Boolean);
  const isExtensionClick = eventPath.some((element) => element && element.id === HOST_ID);
  if (isExtensionClick) return;
  hideReadingToolMenu();
}

function getScrollProgress(container) {
  const range = getElementScrollRange(container);
  if (range <= 0) return 0;
  return clamp(getScrollTop(container) / range, 0, 1);
}

function getReadingText(container) {
  const source = isRootScrollElement(container) ? document.body : container;
  if (!source) return '';
  return (source.innerText || source.textContent || '').replace(/\s+/g, ' ').trim();
}

function estimateReadingSecondsFromText(text) {
  if (!text) return 0;
  const cjkMatches = text.match(/[\u3400-\u9FFF\u3040-\u30FF\uAC00-\uD7AF]/g) || [];
  const latinText = text
    .replace(/[\u3400-\u9FFF\u3040-\u30FF\uAC00-\uD7AF]/g, ' ')
    .replace(/[0-9_]+/g, ' ');
  const latinWords = latinText.match(/[A-Za-zÀ-ÖØ-öø-ÿ]+(?:['-][A-Za-zÀ-ÖØ-öø-ÿ]+)?/g) || [];
  const cjkSeconds = (cjkMatches.length / READING_SPEED_CJK_CHARS_PER_MINUTE) * 60;
  const latinSeconds = (latinWords.length / READING_SPEED_LATIN_WORDS_PER_MINUTE) * 60;
  return Math.max(0, cjkSeconds + latinSeconds);
}

function getEstimatedReadingSeconds(container) {
  if (!advancedSettings.progressBar.showRemainingTime) return 0;
  const target = isRootScrollElement(container) ? document.body : container;
  const now = Date.now();
  if (
    readingEstimateCache.target === target &&
    readingEstimateCache.seconds > 0 &&
    now - readingEstimateCache.calculatedAt < READING_ESTIMATE_CACHE_MS
  ) {
    return readingEstimateCache.seconds;
  }

  const text = getReadingText(container);
  const seconds = estimateReadingSecondsFromText(text);
  readingEstimateCache = {
    target,
    calculatedAt: now,
    textLength: text.length,
    seconds
  };
  return seconds;
}

function formatRemainingReadingTime(seconds) {
  if (!Number.isFinite(seconds) || seconds <= 0) return '0m';
  if (seconds < 60) return '<1m';
  const minutes = Math.ceil(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
}

function getRemainingReadingTimeText(progress, container) {
  if (!advancedSettings.progressBar.showRemainingTime) return '';
  const totalSeconds = getEstimatedReadingSeconds(container);
  if (totalSeconds < 30) return '';
  return formatRemainingReadingTime(totalSeconds * (1 - clamp(progress, 0, 1)));
}

function getProgressLabelText(percentText, remainingText, separator) {
  const parts = [];
  if (advancedSettings.progressBar.showPercentage) {
    parts.push(percentText);
  }
  if (remainingText) {
    parts.push(remainingText);
  }
  return parts.join(separator);
}

function getProgressEventTarget(container) {
  return isRootScrollElement(container) ? window : container;
}

function requestProgressUpdate() {
  if (!advancedSettings.progressBar.enabled) return;
  if (progressUpdateFrame) return;
  progressUpdateFrame = requestAnimationFrame(() => {
    progressUpdateFrame = null;
    updateProgressBar();
  });
}

function bindProgressToContainer(container) {
  if (!advancedSettings.progressBar.enabled || !container) {
    unbindProgressContainer();
    return;
  }

  const target = getProgressEventTarget(container);
  if (progressScrollTarget === target) {
    requestProgressUpdate();
    return;
  }

  unbindProgressContainer();
  progressScrollTarget = target;
  progressScrollTarget.addEventListener('scroll', requestProgressUpdate, { passive: true });
  requestProgressUpdate();
}

function unbindProgressContainer() {
  if (progressScrollTarget) {
    progressScrollTarget.removeEventListener('scroll', requestProgressUpdate);
    progressScrollTarget = null;
  }
  if (progressUpdateFrame) {
    if (typeof cancelAnimationFrame === 'function') {
      cancelAnimationFrame(progressUpdateFrame);
    }
    progressUpdateFrame = null;
  }
}

function handleHorizontalProgressClick(event) {
  if (!advancedSettings.progressBar.clickToJump) return;
  const rect = event.currentTarget.getBoundingClientRect();
  const ratio = rect.width <= 0 ? 0 : (event.clientX - rect.left) / rect.width;
  const container = resolveScrollContainer();
  smoothScrollTo(container, getElementScrollRange(container) * clamp(ratio, 0, 1));
  recordAnalyticsAction('progressJumpClicks');
}

function handleVerticalProgressClick(event) {
  if (!advancedSettings.progressBar.clickToJump) return;
  const rect = event.currentTarget.getBoundingClientRect();
  const ratio = rect.height <= 0 ? 0 : (event.clientY - rect.top) / rect.height;
  const container = resolveScrollContainer();
  smoothScrollTo(container, getElementScrollRange(container) * clamp(ratio, 0, 1));
  recordAnalyticsAction('progressJumpClicks');
}

function getPointerTargetRatio(event, orientation) {
  const rect = event.currentTarget.getBoundingClientRect();
  if (orientation === 'horizontal') {
    return rect.width <= 0 ? 0 : clamp((event.clientX - rect.left) / rect.width, 0, 1);
  }
  return rect.height <= 0 ? 0 : clamp((event.clientY - rect.top) / rect.height, 0, 1);
}

function updateProgressHoverPreview(target, ratio, orientation) {
  const line = target.querySelector('.psm-progress-hover-line');
  const tooltip = target.querySelector('.psm-progress-hover-tooltip');
  if (!line || !tooltip) return;

  const percent = Math.round(ratio * 100);
  line.style.display = 'block';
  tooltip.style.display = 'block';
  tooltip.textContent = `${percent}%`;

  if (orientation === 'horizontal') {
    const position = `${ratio * 100}%`;
    const isBottom = advancedSettings.progressBar.horizontalPosition === 'bottom';
    line.style.left = position;
    tooltip.style.left = position;
    tooltip.style.top = isBottom ? 'auto' : '100%';
    tooltip.style.bottom = isBottom ? '100%' : 'auto';
    tooltip.style.marginTop = isBottom ? '0' : '6px';
    tooltip.style.marginBottom = isBottom ? '6px' : '0';
  } else {
    line.style.top = `${ratio * 100}%`;
    tooltip.style.top = `${ratio * 100}%`;
  }
}

function hideProgressHoverPreview(event) {
  const line = event.currentTarget.querySelector('.psm-progress-hover-line');
  const tooltip = event.currentTarget.querySelector('.psm-progress-hover-tooltip');
  if (line) line.style.display = 'none';
  if (tooltip) tooltip.style.display = 'none';
}

function handleVerticalProgressPointerMove(event) {
  if (!advancedSettings.progressBar.clickToJump) return;
  updateProgressHoverPreview(event.currentTarget, getPointerTargetRatio(event, 'vertical'), 'vertical');
}

function handleHorizontalProgressPointerMove(event) {
  if (!advancedSettings.progressBar.clickToJump) return;
  updateProgressHoverPreview(event.currentTarget, getPointerTargetRatio(event, 'horizontal'), 'horizontal');
}

function createVerticalProgressButton() {
  const button = document.createElement('button');
  button.className = 'psm-scroll-button psm-progress-button';
  button.type = 'button';
  button.title = '0%';
  button.setAttribute('aria-label', 'Scroll progress');
  button.innerHTML = '<span class="psm-progress-fill"></span><span class="psm-progress-hover-line"></span><span class="psm-progress-hover-tooltip"></span><span class="psm-progress-label"></span>';
  button.addEventListener('click', handleVerticalProgressClick);
  button.addEventListener('pointermove', handleVerticalProgressPointerMove);
  button.addEventListener('pointerleave', hideProgressHoverPreview);
  return button;
}

function createHorizontalProgressBar(root) {
  if (!root || root.getElementById(HORIZONTAL_PROGRESS_ID)) return;
  const progress = document.createElement('div');
  progress.id = HORIZONTAL_PROGRESS_ID;
  progress.className = 'psm-horizontal-progress';
  progress.innerHTML = '<div class="psm-horizontal-progress-fill"></div><span class="psm-progress-hover-line"></span><span class="psm-progress-hover-tooltip"></span><span class="psm-horizontal-progress-label"></span>';
  progress.addEventListener('click', handleHorizontalProgressClick);
  progress.addEventListener('pointermove', handleHorizontalProgressPointerMove);
  progress.addEventListener('pointerleave', hideProgressHoverPreview);
  root.appendChild(progress);
}

function removeHorizontalProgressBar() {
  const root = getScrollRoot();
  const progress = root ? root.getElementById(HORIZONTAL_PROGRESS_ID) : null;
  if (progress) {
    progress.remove();
  }
}

function removeVerticalProgressButton() {
  const { progressButton } = getButtonElements();
  if (progressButton) {
    progressButton.remove();
  }
}

function ensureProgressControls() {
  const { root, topButton, bottomButton, progressButton } = getButtonElements();
  if (!root || !topButton || !bottomButton) return;

  if (!advancedSettings.progressBar.enabled) {
    removeHorizontalProgressBar();
    removeVerticalProgressButton();
    unbindProgressContainer();
    return;
  }

  if (advancedSettings.progressBar.mode === 'horizontalBar') {
    removeVerticalProgressButton();
    createHorizontalProgressBar(root);
  } else {
    removeHorizontalProgressBar();
    if (!progressButton) {
      bottomButton.parentNode.insertBefore(createVerticalProgressButton(), bottomButton);
    }
  }

  updateButtonStyle();
  bindProgressToContainer(resolveScrollContainer());
  updateProgressBar();
}

function removeFeatureToolControls({ button, root, containerId, menuId }) {
  if (button) {
    button.remove();
  }
  const standalone = root ? root.getElementById(containerId) : null;
  if (standalone) {
    standalone.remove();
  }
  const menu = root ? root.getElementById(menuId) : null;
  if (menu) {
    menu.remove();
  }
}

function getOrCreateFeatureToolButton(root, existingButton, createButton) {
  if (!root) return null;
  return existingButton || createButton();
}

function getOrCreateFeatureToolContainer(root, containerId) {
  if (!root) return null;
  let container = root.getElementById(containerId);
  if (container) return container;
  container = document.createElement('div');
  container.id = containerId;
  container.className = 'psm-feature-tool-container';
  root.appendChild(container);
  return container;
}

function ensureFeatureToolControls(config) {
  const elements = getButtonElements();
  const { root, bottomButton } = elements;
  if (!root || !bottomButton) return;
  const button = elements[config.buttonKey];

  if (!config.isEnabled()) {
    removeFeatureToolControls({
      button,
      root,
      containerId: config.containerId,
      menuId: config.menuId
    });
    return;
  }

  const nextButton = getOrCreateFeatureToolButton(root, button, config.createButton);
  if (!nextButton) return;

  const standalone = getOrCreateFeatureToolContainer(root, config.containerId);
  const position = config.settings().buttonPosition;
  if (position === 'pageMiddle') {
    if (standalone) {
      standalone.remove();
    }
    if (nextButton.parentNode !== bottomButton.parentNode) {
      bottomButton.parentNode.appendChild(nextButton);
    }
  } else if (standalone) {
    if (nextButton.parentNode !== standalone) {
      standalone.appendChild(nextButton);
    }
  }

  if (config.getMenu) {
    config.getMenu(root);
  }
}

function ensureReadingToolControls() {
  ensureFeatureToolControls({
    buttonKey: 'autoScrollButton',
    containerId: AUTO_SCROLL_TOOL_CONTAINER_ID,
    menuId: '',
    createButton: createAutoScrollButton,
    getMenu: null,
    isEnabled: () => advancedSettings.autoScroll.enabled,
    settings: () => advancedSettings.autoScroll
  });
  ensureFeatureToolControls({
    buttonKey: 'bookmarkButton',
    containerId: BOOKMARK_TOOL_CONTAINER_ID,
    menuId: BOOKMARK_MENU_ID,
    createButton: createBookmarkToolButton,
    getMenu: getBookmarkToolMenu,
    isEnabled: isScrollBookmarkToolEnabled,
    settings: () => advancedSettings.scrollBookmarks
  });
  ensureFeatureToolControls({
    buttonKey: 'outlineButton',
    containerId: OUTLINE_TOOL_CONTAINER_ID,
    menuId: OUTLINE_MENU_ID,
    createButton: createOutlineToolButton,
    getMenu: getOutlineToolMenu,
    isEnabled: isOutlineToolEnabled,
    settings: () => advancedSettings.outlineNavigation
  });

  const { bottomButton, autoScrollButton, bookmarkButton, outlineButton } = getButtonElements();
  if (bottomButton && autoScrollButton && advancedSettings.autoScroll.buttonPosition === 'pageMiddle') {
    bottomButton.parentNode.appendChild(autoScrollButton);
  }
  if (bottomButton && bookmarkButton && advancedSettings.scrollBookmarks.buttonPosition === 'pageMiddle') {
    bottomButton.parentNode.appendChild(bookmarkButton);
  }
  if (bottomButton && outlineButton && advancedSettings.outlineNavigation.buttonPosition === 'pageMiddle') {
    bottomButton.parentNode.appendChild(outlineButton);
  }

  updateReadingToolPosition();
  const buttonContainer = getButtonContainer();
  const hoverHideState = buttonContainer ? hoverHideStateMap.get(buttonContainer) : null;
  if (hoverHideState && hoverHideState.isHidden) {
    setHoverHideTargetsHidden(buttonContainer, true);
  }
  syncHoverHideTriggerTargets(buttonContainer, hoverHideState);
  updateButtonStyle();
  if (advancedSettings.autoScroll.enabled) {
    bindAutoScrollPauseListeners();
  } else {
    stopAutoScroll();
    unbindAutoScrollPauseListeners();
  }
  checkBookmarkRestoreOnLifecycle();
}

function checkBookmarkRestoreOnLifecycle() {
  if (!advancedSettings.scrollBookmarks.enabled) {
    return;
  }
  checkPendingScrollBookmarkRestore((handled) => {
    if (!handled) {
      checkBookmarkRestoreOnOpen();
    }
  });
}

function updateHorizontalProgressBar(progress) {
  const root = getScrollRoot();
  const bar = root ? root.getElementById(HORIZONTAL_PROGRESS_ID) : null;
  if (!bar) return;
  const fill = bar.querySelector('.psm-horizontal-progress-fill');
  const label = bar.querySelector('.psm-horizontal-progress-label');
  const percentText = `${Math.round(progress * 100)}%`;
  const remainingText = getRemainingReadingTimeText(progress, resolveScrollContainer());
  const labelText = getProgressLabelText(percentText, remainingText, ' · ');
  const isBottom = advancedSettings.progressBar.horizontalPosition === 'bottom';

  bar.classList.toggle('psm-is-bottom', isBottom);
  bar.style.top = isBottom ? 'auto' : '0';
  bar.style.bottom = isBottom ? '0' : 'auto';
  bar.style.height = `${normalizeProgressThickness(advancedSettings.progressBar.thickness)}px`;
  bar.style.cursor = advancedSettings.progressBar.clickToJump ? 'pointer' : 'default';
  bar.style.backgroundColor = getProgressColor();
  bar.title = percentText;
  if (!advancedSettings.progressBar.clickToJump) {
    hideProgressHoverPreview({ currentTarget: bar });
  }
  if (fill) {
    fill.style.width = `${progress * 100}%`;
    fill.style.backgroundColor = getProgressFillColor();
  }
  if (label) {
    label.textContent = labelText;
    label.style.display = labelText ? 'block' : 'none';
    label.style.color = getActiveIconColor();
  }
}

function updateVerticalProgressButton(progress) {
  const { progressButton } = getButtonElements();
  if (!progressButton) return;
  const fill = progressButton.querySelector('.psm-progress-fill');
  const label = progressButton.querySelector('.psm-progress-label');
  const percentText = `${Math.round(progress * 100)}%`;
  const remainingText = getRemainingReadingTimeText(progress, resolveScrollContainer());
  const labelText = getProgressLabelText(percentText, remainingText, '\n');

  progressButton.title = percentText;
  progressButton.style.cursor = advancedSettings.progressBar.clickToJump ? 'pointer' : 'default';
  if (!advancedSettings.progressBar.clickToJump) {
    hideProgressHoverPreview({ currentTarget: progressButton });
  }
  if (fill) {
    fill.style.height = `${progress * 100}%`;
    fill.style.backgroundColor = getProgressFillColor();
  }
  if (label) {
    label.textContent = labelText;
    label.style.display = labelText ? 'block' : 'none';
    label.style.color = getActiveIconColor();
  }
}

function updateProgressBar() {
  if (!advancedSettings.progressBar.enabled) return;
  const container = resolveScrollContainer();
  const progress = getScrollProgress(container);
  if (advancedSettings.progressBar.mode === 'horizontalBar') {
    updateHorizontalProgressBar(progress);
  } else {
    updateVerticalProgressButton(progress);
  }
}

function normalizeBookmarkUrl(rawUrl) {
  const parsed = new URL(rawUrl);
  const trackingKeys = new Set(['fbclid', 'gclid', 'mc_cid', 'mc_eid']);
  const remaining = [];

  parsed.searchParams.forEach((value, key) => {
    const lowerKey = key.toLowerCase();
    if (lowerKey.startsWith('utm_') || trackingKeys.has(lowerKey)) {
      return;
    }
    remaining.push([key, value]);
  });

  const query = new URLSearchParams();
  remaining.forEach(([key, value]) => query.append(key, value));
  const queryText = query.toString();
  return `${parsed.origin}${parsed.pathname}${queryText ? `?${queryText}` : ''}${parsed.hash || ''}`;
}

function getCurrentBookmarkKey() {
  try {
    return `exact:${normalizeBookmarkUrl(window.location.href)}`;
  } catch (err) {
    return '';
  }
}

function getElementSelector(element) {
  if (!element || isRootScrollElement(element)) return '';
  if (element.id) return `#${element.id}`;
  const tagName = element.tagName ? element.tagName.toLowerCase() : '';
  if (!tagName) return '';
  if (element.className && typeof element.className === 'string') {
    const firstClass = element.className.split(/\s+/).filter(Boolean)[0];
    if (firstClass) return `${tagName}.${firstClass}`;
  }
  return tagName;
}

function getElementDomPath(element) {
  if (!element || isRootScrollElement(element)) return '';
  const parts = [];
  let current = element;
  while (current && current !== document.body && current.nodeType !== 9 && parts.length < 6) {
    const tagName = current.tagName ? current.tagName.toLowerCase() : '';
    if (!tagName) break;
    const id = current.id ? `#${current.id}` : '';
    parts.unshift(`${tagName}${id}`);
    current = current.parentElement;
  }
  if (document.body) {
    parts.unshift('body');
  }
  return parts.join(' > ');
}

function getContainerSnapshot(container) {
  const computedStyle = !isRootScrollElement(container) && window.getComputedStyle
    ? window.getComputedStyle(container)
    : null;
  return {
    isScrollingElement: isRootScrollElement(container),
    tagName: container && container.tagName ? container.tagName : '',
    overflowY: computedStyle ? computedStyle.overflowY : '',
    selector: getElementSelector(container),
    domPath: getElementDomPath(container),
    scrollHeight: container && container.scrollHeight ? container.scrollHeight : document.documentElement.scrollHeight || 0,
    clientHeight: container && container.clientHeight ? container.clientHeight : window.innerHeight || document.documentElement.clientHeight || 0
  };
}

function normalizeBookmarks(bookmarks) {
  return bookmarks && typeof bookmarks === 'object' && !Array.isArray(bookmarks) ? bookmarks : {};
}

function enforceBookmarkLimits(bookmarks, activeKey) {
  const nextBookmarks = { ...normalizeBookmarks(bookmarks) };
  const domainLimit = advancedSettings.scrollBookmarks.perDomainLimit;
  const globalLimit = advancedSettings.scrollBookmarks.globalLimit;
  const entries = Object.entries(nextBookmarks);
  const byDomain = new Map();

  entries.forEach(([key, bookmark]) => {
    const domain = bookmark && bookmark.domain ? bookmark.domain : '';
    if (!domain) return;
    if (!byDomain.has(domain)) {
      byDomain.set(domain, []);
    }
    byDomain.get(domain).push([key, bookmark]);
  });

  byDomain.forEach((domainEntries) => {
    domainEntries
      .sort((a, b) => (b[1].savedAt || 0) - (a[1].savedAt || 0))
      .slice(domainLimit)
      .forEach(([key]) => {
        if (key !== activeKey) {
          delete nextBookmarks[key];
        }
      });
  });

  Object.entries(nextBookmarks)
    .sort((a, b) => (b[1].savedAt || 0) - (a[1].savedAt || 0))
    .slice(globalLimit)
    .forEach(([key]) => {
      if (key !== activeKey) {
        delete nextBookmarks[key];
      }
    });

  return nextBookmarks;
}

function saveScrollBookmark() {
  if (!advancedSettings.scrollBookmarks.enabled) {
    return;
  }

  let parsedUrl;
  let normalizedUrl;
  try {
    parsedUrl = new URL(window.location.href);
    normalizedUrl = normalizeBookmarkUrl(window.location.href);
  } catch (err) {
    showReadingToast('当前页面无法保存位置');
    return;
  }

  const container = resolveScrollContainer();
  const range = getElementScrollRange(container);
  const scrollPct = getScrollProgress(container);
  if (range <= 1 || scrollPct <= 0) {
    showReadingToast('当前页面还没有可保存的阅读位置');
    return;
  }

  const key = `${advancedSettings.scrollBookmarks.matchMode}:${normalizedUrl}`;
  chrome.storage.local.get([BOOKMARKS_STORAGE_KEY], (result) => {
    const bookmarks = normalizeBookmarks(result[BOOKMARKS_STORAGE_KEY]);
    const previous = bookmarks[key];
    const roundedPct = Math.round(scrollPct * 100);
    bookmarks[key] = {
      url: window.location.href,
      normalizedUrl,
      hash: parsedUrl.hash || '',
      matchMode: 'exact',
      domain: parsedUrl.hostname,
      pathname: parsedUrl.pathname,
      title: document.title || parsedUrl.hostname,
      scrollPct,
      scrollY: getScrollTop(container),
      savedAt: Date.now(),
      container: getContainerSnapshot(container)
    };

    const limitedBookmarks = enforceBookmarkLimits(bookmarks, key);
    chrome.storage.local.set({ [BOOKMARKS_STORAGE_KEY]: limitedBookmarks }, () => {
      recordAnalyticsAction('bookmarkSaveClicks');
      if (previous) {
        showReadingToast(`已更新位置到 ${roundedPct}%（原 ${Math.round((previous.scrollPct || 0) * 100)}%）`);
      } else {
        showReadingToast(`已保存当前位置 ${roundedPct}%`);
      }
    });
  });
}

function showReadingToast(message, actions) {
  const root = getScrollRoot();
  if (!root) return;
  let toast = root.getElementById(BOOKMARK_TOAST_ID);
  if (!toast) {
    toast = document.createElement('div');
    toast.id = BOOKMARK_TOAST_ID;
    toast.className = 'psm-reading-toast';
    root.appendChild(toast);
  }

  const buttons = (actions || []).map((action, index) => `<button type="button" data-action-index="${index}">${action.label}</button>`).join('');
  toast.innerHTML = `<span></span>${buttons}`;
  const text = toast.querySelector('span');
  if (text) text.textContent = message;
  toast.querySelectorAll('button').forEach((button) => {
    button.addEventListener('click', (event) => {
      event.stopPropagation();
      const index = Number(button.getAttribute('data-action-index'));
      if (actions[index] && typeof actions[index].handler === 'function') {
        actions[index].handler();
      }
      toast.classList.remove('psm-open');
    });
  });
  toast.classList.add('psm-open');

  if (!actions || actions.length === 0) {
    setTimeout(() => {
      toast.classList.remove('psm-open');
    }, 2200);
  }
}

function restoreCurrentScrollBookmark(options = {}) {
  if (!advancedSettings.scrollBookmarks.enabled && options.force !== true) {
    return;
  }

  const key = getCurrentBookmarkKey();
  if (!key) {
    if (options.showMissingMessage !== false) {
      showReadingToast('当前页面没有可加载的已保存位置');
    }
    return;
  }

  chrome.storage.local.get([BOOKMARKS_STORAGE_KEY], (result) => {
    const bookmarks = normalizeBookmarks(result[BOOKMARKS_STORAGE_KEY]);
    const bookmark = bookmarks[key];
    if (!bookmark || typeof bookmark.scrollPct !== 'number' || bookmark.scrollPct < 0.02) {
      if (options.showMissingMessage !== false) {
        showReadingToast('当前页面没有可加载的已保存位置');
      }
      return;
    }

    if (!restoreScrollBookmark(bookmark)) {
      showReadingToast('当前页面暂时无法加载已保存位置');
      return;
    }
    recordAnalyticsAction('bookmarkRestoreClicks');
  });
}

function restoreScrollBookmark(bookmark) {
  const container = resolveScrollContainer();
  const range = getElementScrollRange(container);
  if (range <= 1) return false;
  smoothScrollTo(container, range * clamp(bookmark.scrollPct, 0, 1));
  return true;
}

function clearPendingScrollBookmarkRestore(callback) {
  chrome.storage.local.remove(PENDING_BOOKMARK_RESTORE_STORAGE_KEY, () => {
    pendingBookmarkRestoreKeyInProgress = '';
    if (typeof callback === 'function') callback();
  });
}

function checkPendingScrollBookmarkRestore(callback) {
  const key = getCurrentBookmarkKey();
  if (!key) {
    callback(false);
    return;
  }
  if (pendingBookmarkRestoreKeyInProgress === key) {
    callback(true);
    return;
  }

  chrome.storage.local.get(
    [PENDING_BOOKMARK_RESTORE_STORAGE_KEY, BOOKMARKS_STORAGE_KEY],
    (result) => {
      const request = result[PENDING_BOOKMARK_RESTORE_STORAGE_KEY];
      const requestedAt = request && Number(request.requestedAt);
      if (!request || request.key !== key) {
        callback(false);
        return;
      }
      if (!Number.isFinite(requestedAt) || Date.now() - requestedAt > PENDING_BOOKMARK_RESTORE_MAX_AGE) {
        clearPendingScrollBookmarkRestore(() => callback(false));
        return;
      }

      const bookmarks = normalizeBookmarks(result[BOOKMARKS_STORAGE_KEY]);
      const bookmark = bookmarks[key];
      if (!bookmark || typeof bookmark.scrollPct !== 'number') {
        clearPendingScrollBookmarkRestore(() => callback(false));
        return;
      }

      pendingBookmarkRestoreKeyInProgress = key;
      const attemptRestore = (attempt) => {
        if (restoreScrollBookmark(bookmark)) {
          restorePromptShownForKey = key;
          clearPendingScrollBookmarkRestore(() => callback(true));
          return;
        }
        if (attempt < PENDING_BOOKMARK_RESTORE_MAX_RETRIES) {
          setTimeout(() => attemptRestore(attempt + 1), PENDING_BOOKMARK_RESTORE_RETRY_DELAY);
          return;
        }
        pendingBookmarkRestoreKeyInProgress = '';
        callback(true);
      };
      attemptRestore(0);
    }
  );
}

function checkRestorePrompt() {
  if (!advancedSettings.scrollBookmarks.enabled ||
      advancedSettings.scrollBookmarks.restoreMode !== 'prompt') {
    return;
  }

  const key = getCurrentBookmarkKey();
  if (!key || restorePromptShownForKey === key) return;

  chrome.storage.local.get([BOOKMARKS_STORAGE_KEY], (result) => {
    const bookmarks = normalizeBookmarks(result[BOOKMARKS_STORAGE_KEY]);
    const bookmark = bookmarks[key];
    if (!bookmark || typeof bookmark.scrollPct !== 'number' || bookmark.scrollPct < 0.02) {
      return;
    }
    if (restorePromptShownForKey === key) return;
    restorePromptShownForKey = key;
    const percent = Math.round(clamp(bookmark.scrollPct, 0, 1) * 100);
    showReadingToast(`从大约 ${percent}% 处继续？`, [
      {
        label: '继续',
        handler: () => {
          restoreCurrentScrollBookmark({ showMissingMessage: false });
        }
      },
      {
        label: '忽略',
        handler: () => {}
      }
    ]);
  });
}

function checkAutomaticBookmarkRestore() {
  if (!advancedSettings.scrollBookmarks.enabled ||
      advancedSettings.scrollBookmarks.restoreMode !== 'auto') {
    return;
  }

  const key = getCurrentBookmarkKey();
  if (!key || restorePromptShownForKey === key) return;

  chrome.storage.local.get([BOOKMARKS_STORAGE_KEY], (result) => {
    const bookmarks = normalizeBookmarks(result[BOOKMARKS_STORAGE_KEY]);
    const bookmark = bookmarks[key];
    if (!bookmark || typeof bookmark.scrollPct !== 'number' || bookmark.scrollPct < 0.02) {
      return;
    }

    if (restorePromptShownForKey === key) return;
    restorePromptShownForKey = key;
    const attemptRestore = (attempt) => {
      if (restoreScrollBookmark(bookmark)) {
        return;
      }
      if (attempt < PENDING_BOOKMARK_RESTORE_MAX_RETRIES) {
        setTimeout(() => attemptRestore(attempt + 1), PENDING_BOOKMARK_RESTORE_RETRY_DELAY);
      }
    };
    attemptRestore(0);
  });
}

function checkBookmarkRestoreOnOpen() {
  if (!advancedSettings.scrollBookmarks.enabled) {
    return;
  }
  const key = getCurrentBookmarkKey();
  if (!key || bookmarkRestoreCheckedForKey === key) {
    return;
  }
  bookmarkRestoreCheckedForKey = key;

  if (advancedSettings.scrollBookmarks.restoreMode === 'auto') {
    checkAutomaticBookmarkRestore();
  } else if (advancedSettings.scrollBookmarks.restoreMode === 'prompt') {
    checkRestorePrompt();
  }
}

function applyAdvancedSettings() {
  advancedSettings = mergeAdvancedSettings(advancedSettings);
  applyButtonIcons();
  ensureProgressControls();
  ensureScreenNavigationControls();
  ensureReadingToolControls();
  updateButtonStyle();
}

function createScreenNavigationButton(direction) {
  const isPrevious = direction === 'previous';
  const button = document.createElement('button');
  button.className = `psm-scroll-button psm-screen-navigation-button ${isPrevious ? 'psm-screen-previous' : 'psm-screen-next'}`;
  button.type = 'button';
  button.title = isPrevious ? LABEL_PREVIOUS_SCREEN : LABEL_NEXT_SCREEN;
  button.setAttribute('aria-label', button.title);
  button.innerHTML = getScreenNavigationIconSvg(direction);
  button.addEventListener('click', () => {
    navigateByScreen(isPrevious ? -1 : 1);
  });
  return button;
}

function getAutoScrollIconSvg(state) {
  if (state === 'pause') {
    return '<svg class="scroll-icon psm-auto-scroll-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" aria-hidden="true"><path d="M9 6v12M15 6v12"/></svg>';
  }
  return '<svg class="scroll-icon psm-auto-scroll-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>';
}

function createAutoScrollButton() {
  const button = document.createElement('button');
  button.className = 'psm-scroll-button psm-auto-scroll-button';
  button.type = 'button';
  button.addEventListener('click', () => {
    toggleAutoScroll();
  });
  updateAutoScrollButtonState();
  button.title = LABEL_AUTO_SCROLL_PLAY;
  button.setAttribute('aria-label', LABEL_AUTO_SCROLL_PLAY);
  button.setAttribute('aria-pressed', 'false');
  button.innerHTML = getAutoScrollIconSvg('play');
  return button;
}

function ensureScreenNavigationControls() {
  const container = getButtonContainer();
  if (!container) return;
  const { topButton, previousScreenButton, progressButton, nextScreenButton, bottomButton } = getButtonElements();
  if (!topButton || !bottomButton) return;

  if (!advancedSettings.screenNavigation.enabled) {
    cancelScrollAnimation(screenNavigationAnimationContainer);
    screenNavigationAnimationContainer = null;
    if (previousScreenButton) previousScreenButton.remove();
    if (nextScreenButton) nextScreenButton.remove();
    return;
  }

  const previousButton = previousScreenButton || createScreenNavigationButton('previous');
  const nextButton = nextScreenButton || createScreenNavigationButton('next');
  container.insertBefore(previousButton, progressButton || bottomButton);
  container.insertBefore(nextButton, bottomButton);
}

// 创建滚动按钮
function createScrollButton() {
  // 检查是否已存在按钮
  if (document.getElementById(HOST_ID)) {
    return true;
  }

  // 关键修复：确保 document.body 存在
  // 在 SPA 页面中，DOMContentLoaded 时 body 可能还未创建
  if (!document.body) {
    console.warn('[Page Scroll Master] document.body is not ready, retrying...');
    return false;
  }

  const host = document.createElement('div');
  host.id = HOST_ID;
  host.style.all = 'initial';
  const root = host.attachShadow({ mode: 'open' });

  // 创建按钮容器
  const buttonContainer = document.createElement('div');
  buttonContainer.id = CONTAINER_ID;
  buttonContainer.className = 'psm-container';

  // 创建顶部按钮 - 使用SVG图标替代字体字符
  const topButton = document.createElement('button');
  topButton.className = 'psm-scroll-button psm-scroll-top';
  topButton.type = 'button';
  topButton.title = LABEL_SCROLL_TOP;
  topButton.setAttribute('aria-label', LABEL_SCROLL_TOP);
  topButton.innerHTML = getIconSvg('top', getActiveIconSet());

  // 创建底部按钮 - 使用SVG图标替代字体字符
  const bottomButton = document.createElement('button');
  bottomButton.className = 'psm-scroll-button psm-scroll-bottom';
  bottomButton.type = 'button';
  bottomButton.title = LABEL_SCROLL_BOTTOM;
  bottomButton.setAttribute('aria-label', LABEL_SCROLL_BOTTOM);
  bottomButton.innerHTML = getIconSvg('bottom', getActiveIconSet());

  // 添加按钮到容器
  buttonContainer.appendChild(topButton);
  if (advancedSettings.screenNavigation.enabled) {
    buttonContainer.appendChild(createScreenNavigationButton('previous'));
  }
  if (advancedSettings.progressBar.enabled && advancedSettings.progressBar.mode === 'verticalButton') {
    buttonContainer.appendChild(createVerticalProgressButton());
  }
  if (advancedSettings.screenNavigation.enabled) {
    buttonContainer.appendChild(createScreenNavigationButton('next'));
  }
  buttonContainer.appendChild(bottomButton);
  if (advancedSettings.autoScroll.enabled && advancedSettings.autoScroll.buttonPosition === 'pageMiddle') {
    buttonContainer.appendChild(createAutoScrollButton());
  }
  if (isScrollBookmarkToolEnabled() && advancedSettings.scrollBookmarks.buttonPosition === 'pageMiddle') {
    buttonContainer.appendChild(createBookmarkToolButton());
  }
  if (isOutlineToolEnabled() && advancedSettings.outlineNavigation.buttonPosition === 'pageMiddle') {
    buttonContainer.appendChild(createOutlineToolButton());
  }

  // 添加到页面，Shadow DOM 隔离扩展样式和网页样式
  root.appendChild(buttonContainer);
  document.body.appendChild(host);
  if (advancedSettings.progressBar.enabled && advancedSettings.progressBar.mode === 'horizontalBar') {
    createHorizontalProgressBar(root);
  }

  // 添加事件监听器
  topButton.addEventListener('click', () => {
    recordAnalyticsAction('floatingTopClicks');
    scrollToTop();
  });
  bottomButton.addEventListener('click', () => {
    recordAnalyticsAction('floatingBottomClicks');
    scrollToBottom();
  });
  document.addEventListener('click', handleReadingToolDocumentClick, true);

  // 添加鼠标悬停+快捷键隐藏功能
  setupHoverHideFunctionality(buttonContainer, topButton, bottomButton);

  // 添加CSS样式
  addButtonStyles(root);

  // 应用位置设置
  updateButtonPosition();
  ensureReadingToolControls();

  // 应用显示/隐藏设置
  updateButtonVisibility();

  return true;
}

// 移除滚动按钮
function removeButton() {
  const host = document.getElementById(HOST_ID);
  stopAutoScroll();
  unbindAutoScrollPauseListeners();
  cancelScrollAnimation(screenNavigationAnimationContainer);
  screenNavigationAnimationContainer = null;
  cancelScrollAnimation(currentScrollContainer || resolveScrollContainer());
  unbindProgressContainer();
  unbindOutlineHighlightUpdates();
  if (typeof document.removeEventListener === 'function') {
    document.removeEventListener('click', handleReadingToolDocumentClick, true);
  }

  if (spaDetectionState.observer && typeof spaDetectionState.observer.disconnect === 'function') {
    spaDetectionState.observer.disconnect();
  }
  if (spaDetectionState.initialTimer) {
    clearTimeout(spaDetectionState.initialTimer);
  }
  if (spaDetectionState.debounceTimer) {
    clearTimeout(spaDetectionState.debounceTimer);
  }
  if (spaDetectionState.retryTimer) {
    clearTimeout(spaDetectionState.retryTimer);
  }
  if (spaDetectionState.domReadyHandler &&
      typeof document.removeEventListener === 'function') {
    document.removeEventListener('DOMContentLoaded', spaDetectionState.domReadyHandler);
  }
  if (initializationRetryTimer) {
    clearTimeout(initializationRetryTimer);
    initializationRetryTimer = null;
  }
  spaDetectionState = {
    retryCount: 0,
    observer: null,
    initialTimer: null,
    debounceTimer: null,
    retryTimer: null,
    domReadyHandler: null,
    isInitialized: false
  };
  teardownOutlineRouteChangeDetection();
  fullscreenManager.cleanup();
  if (activeHoverHideCleanup) {
    activeHoverHideCleanup();
  }

  if (!host) return;

  const root = host.shadowRoot;
  if (root) {
    const buttonContainer = root.getElementById(CONTAINER_ID);
    const state = hoverHideStateMap.get(buttonContainer);
    if (state && state.cleanup) {
      state.cleanup();
    }
    if (buttonContainer) {
      hoverHideStateMap.delete(buttonContainer);
    }
  }

  host.remove();
  fullscreenManager.buttonContainer = null;
}

// 添加按钮样式
function addButtonStyles(root) {
  const style = document.createElement('style');
  style.textContent = `
    :host {
      all: initial;
    }

    .psm-container {
      position: fixed;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding: 0;
      transition: opacity 0.3s ease, transform 0.3s ease;
    }
    
    .psm-scroll-button {
      appearance: none;
      -webkit-appearance: none;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      border: none;
      background-color: ${DEFAULT_BUTTON_COLOR};
      color: white;
      cursor: pointer;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
      transition: transform 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      user-select: none;
      -webkit-user-select: none;
      -moz-user-select: none;
      -ms-user-select: none;
      -webkit-touch-callout: none;
      outline: none;
      -webkit-tap-highlight-color: transparent;
      pointer-events: auto;
      touch-action: manipulation;
      min-width: unset;
      min-height: unset;
      max-width: none;
      max-height: none;
      box-sizing: border-box;
      padding: 0;
      margin: 0;
      font: 400 16px/1 Arial, sans-serif;
      line-height: 1;
      text-transform: none;
    }
    
    .psm-scroll-button .scroll-icon {
      width: 40%;
      height: 40%;
      flex: 0 0 auto;
      box-sizing: content-box;
      color: currentColor;
      stroke: currentColor;
      stroke-width: 3;
      display: block;
      overflow: visible;
      vertical-align: middle;
    }

    .psm-progress-button {
      position: relative;
      overflow: hidden;
    }

    .psm-progress-fill {
      position: absolute;
      left: 0;
      right: 0;
      top: 0;
      height: 0;
      opacity: 0.86;
      transition: height 0.12s linear, background-color 0.2s ease;
      pointer-events: none;
    }

    .psm-progress-hover-line {
      position: absolute;
      display: none;
      pointer-events: none;
      z-index: 2;
      background: rgba(255, 255, 255, 0.9);
      box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.16);
    }

    .psm-progress-button .psm-progress-hover-line {
      left: 0;
      right: 0;
      height: 2px;
      transform: translateY(-1px);
    }

    .psm-horizontal-progress .psm-progress-hover-line {
      top: -4px;
      bottom: -4px;
      width: 2px;
      transform: translateX(-1px);
    }

    .psm-progress-hover-tooltip {
      position: absolute;
      display: none;
      z-index: 3;
      pointer-events: none;
      padding: 3px 6px;
      border-radius: 4px;
      background: rgba(15, 23, 42, 0.86);
      color: white;
      font: 700 11px/1 Arial, sans-serif;
      white-space: nowrap;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.22);
    }

    .psm-progress-button .psm-progress-hover-tooltip {
      left: 50%;
      transform: translate(-50%, -50%);
    }

    .psm-horizontal-progress .psm-progress-hover-tooltip {
      transform: translateX(-50%);
    }

    .psm-progress-label {
      position: relative;
      z-index: 1;
      font: 600 11px/1.15 Arial, sans-serif;
      pointer-events: none;
      text-align: center;
      white-space: pre-line;
    }

    .psm-horizontal-progress {
      position: fixed;
      left: 0;
      right: 0;
      z-index: 9998;
      background: rgba(0, 0, 0, 0.12);
      overflow: visible;
      pointer-events: auto;
      transition: opacity 0.2s ease;
    }

    .psm-horizontal-progress-fill {
      height: 100%;
      width: 0;
      transition: width 0.12s linear, background-color 0.2s ease;
    }

    .psm-horizontal-progress-label {
      position: absolute;
      right: 8px;
      top: 100%;
      margin-top: 3px;
      padding: 1px 5px;
      border-radius: 4px;
      background: rgba(0, 0, 0, 0.46);
      font: 600 11px/1.4 Arial, sans-serif;
      color: white;
      pointer-events: none;
      white-space: nowrap;
    }

    .psm-horizontal-progress.psm-is-bottom .psm-horizontal-progress-label {
      top: auto;
      bottom: 100%;
      margin-top: 0;
      margin-bottom: 3px;
    }

    .psm-feature-tool-container {
      position: fixed;
      z-index: 9999;
      display: flex;
      padding: 0;
      transition: opacity 0.3s ease, transform 0.3s ease;
    }

    .psm-reading-menu {
      position: fixed;
      z-index: 10000;
      display: none;
      width: 200px;
      padding: 6px;
      border-radius: 8px;
      background: rgba(17, 24, 39, 0.96);
      box-shadow: 0 10px 28px rgba(0, 0, 0, 0.26);
      font: 500 13px/1.35 Arial, sans-serif;
      color: white;
      box-sizing: border-box;
    }

    .psm-reading-menu.psm-open {
      display: block;
    }

    .psm-reading-menu-fixed,
    .psm-reading-menu-outline {
      display: block;
    }

    .psm-reading-menu-outline {
      max-height: 40vh;
      overflow-y: auto;
      overscroll-behavior: contain;
      border-top: 1px solid rgba(255, 255, 255, 0.14);
      margin-top: 4px;
      padding-top: 4px;
    }

    .psm-reading-menu button {
      width: 100%;
      border: 0;
      border-radius: 6px;
      padding: 8px 10px;
      margin: 0;
      background: transparent;
      color: inherit;
      font: inherit;
      text-align: left;
      cursor: pointer;
    }

    .psm-reading-menu button:hover:not(:disabled) {
      background: rgba(255, 255, 255, 0.12);
    }

    .psm-reading-menu button:disabled {
      opacity: 0.42;
      cursor: default;
    }

    .psm-reading-menu-heading {
      position: sticky;
      top: 0;
      z-index: 1;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      padding: 7px 10px 5px;
      background: rgba(17, 24, 39, 0.98);
      color: rgba(255, 255, 255, 0.72);
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.04em;
    }

    .psm-reading-menu .psm-reading-menu-close {
      flex: 0 0 auto;
      width: 24px;
      min-height: 24px;
      padding: 0;
      border-radius: 5px;
      color: rgba(255, 255, 255, 0.78);
      font-size: 18px;
      line-height: 24px;
      text-align: center;
    }

    .psm-reading-menu-heading-actions {
      display: inline-flex;
      align-items: center;
      gap: 2px;
    }

    .psm-reading-menu .psm-reading-menu-pin {
      flex: 0 0 auto;
      width: 24px;
      min-height: 24px;
      padding: 0;
      border-radius: 5px;
      color: rgba(255, 255, 255, 0.62);
      font-size: 15px;
      line-height: 24px;
      text-align: center;
    }

    .psm-reading-menu .psm-reading-menu-pin.psm-active {
      background: rgba(74, 158, 221, 0.34);
      color: white;
    }

    .psm-reading-menu .psm-reading-menu-pin svg {
      width: 15px;
      height: 15px;
      fill: currentColor;
      vertical-align: middle;
    }

    .psm-reading-menu-item {
      overflow: hidden;
      padding: 7px 10px;
      border-radius: 6px;
      color: white;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .psm-reading-menu-item.psm-outline-level-2 {
      padding-left: 22px;
    }

    .psm-reading-menu-item.psm-outline-level-3 {
      padding-left: 34px;
    }

    .psm-reading-menu-item.psm-outline-load-more {
      margin-top: 3px;
      color: rgba(255, 255, 255, 0.78);
      font-size: 12px;
      text-align: center;
    }

    .psm-reading-menu-item.psm-outline-current {
      background: rgba(74, 158, 221, 0.28);
      box-shadow: inset 3px 0 0 currentColor;
      font-weight: 700;
    }

    .psm-reading-menu-status {
      padding: 7px 10px;
      color: rgba(255, 255, 255, 0.62);
      font-size: 11px;
      line-height: 1.45;
    }

    .psm-reading-toast {
      position: fixed;
      z-index: 10001;
      right: 16px;
      bottom: 16px;
      display: flex;
      align-items: center;
      gap: 8px;
      max-width: min(360px, calc(100vw - 32px));
      padding: 10px 12px;
      border-radius: 8px;
      background: rgba(17, 24, 39, 0.94);
      color: white;
      box-shadow: 0 10px 28px rgba(0, 0, 0, 0.26);
      font: 500 13px/1.35 Arial, sans-serif;
      opacity: 0;
      pointer-events: none;
      transform: translateY(8px);
      transition: opacity 0.18s ease, transform 0.18s ease;
      box-sizing: border-box;
    }

    .psm-reading-toast.psm-open {
      opacity: 1;
      pointer-events: auto;
      transform: translateY(0);
    }

    .psm-reading-toast span {
      flex: 1;
      min-width: 0;
    }

    .psm-reading-toast button {
      border: 0;
      border-radius: 6px;
      padding: 5px 8px;
      margin: 0;
      background: rgba(255, 255, 255, 0.14);
      color: white;
      font: 700 12px/1 Arial, sans-serif;
      cursor: pointer;
      white-space: nowrap;
    }
    
    .psm-scroll-button:hover {
      transform: scale(1.1);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    }
    
    .psm-scroll-button:active {
      transform: scale(0.95);
    }
    
    /* 防止父容器影响指针样式 */
    .psm-container:hover {
      cursor: default;
    }
    
    .psm-container.psm-hidden {
      opacity: 0;
      pointer-events: none;
      transform: scale(0.8);
    }
    
    .psm-container.psm-hidden .psm-scroll-button {
      pointer-events: none;
    }

    .psm-feature-tool-container.psm-hidden {
      opacity: 0;
      pointer-events: none;
      transform: scale(0.8);
    }

    .psm-feature-tool-container.psm-hidden .psm-scroll-button {
      pointer-events: none;
    }
    
    .psm-container.psm-fullscreen-hidden {
      opacity: 0 !important;
      pointer-events: none !important;
      transform: scale(0.8) !important;
      transition: opacity 0.2s ease, transform 0.2s ease !important;
    }

    .psm-horizontal-progress.psm-fullscreen-hidden,
    .psm-feature-tool-container.psm-fullscreen-hidden,
    .psm-reading-menu.psm-fullscreen-hidden,
    .psm-reading-toast.psm-fullscreen-hidden {
      opacity: 0 !important;
      pointer-events: none !important;
    }
  `;
  root.appendChild(style);
}

// 全局状态管理 - 使用WeakMap避免内存泄漏
const hoverHideStateMap = new WeakMap();
let activeHoverHideCleanup = null;

function getHoverHideTargets(buttonContainer) {
  const root = getScrollRoot();
  const targets = [buttonContainer];
  if (root) {
    [
      AUTO_SCROLL_TOOL_CONTAINER_ID,
      BOOKMARK_TOOL_CONTAINER_ID,
      OUTLINE_TOOL_CONTAINER_ID
    ].forEach((containerId) => {
      const container = root.getElementById(containerId);
      if (container) {
        targets.push(container);
      }
    });
  }
  return targets.filter(Boolean);
}

function setHoverHideTargetsHidden(buttonContainer, hidden) {
  getHoverHideTargets(buttonContainer).forEach((target) => {
    if (typeof target.classList.toggle === 'function') {
      target.classList.toggle('psm-hidden', hidden);
    } else if (hidden) {
      target.classList.add('psm-hidden');
    } else {
      target.classList.remove('psm-hidden');
    }
  });
}

function syncHoverHideTriggerTargets(buttonContainer, state) {
  if (!state || !state.eventHandlers) return;
  if (!state.hoverTargets) {
    state.hoverTargets = new Set();
  }

  const currentTargets = new Set(getHoverHideTargets(buttonContainer));
  currentTargets.forEach((target) => {
    if (
      state.hoverTargets.has(target) ||
      typeof target.addEventListener !== 'function'
    ) {
      return;
    }
    target.addEventListener('mouseenter', state.eventHandlers.mouseEnter);
    target.addEventListener('mouseleave', state.eventHandlers.mouseLeave);
    state.hoverTargets.add(target);
  });

  Array.from(state.hoverTargets).forEach((target) => {
    if (currentTargets.has(target)) return;
    if (typeof target.removeEventListener === 'function') {
      target.removeEventListener('mouseenter', state.eventHandlers.mouseEnter);
      target.removeEventListener('mouseleave', state.eventHandlers.mouseLeave);
    }
    state.hoverTargets.delete(target);
  });
}

// 检测是否为macOS系统
function isMac() {
  return navigator.platform.toUpperCase().indexOf('MAC') >= 0 || 
         navigator.userAgent.toUpperCase().indexOf('MAC') >= 0;
}

// 设置鼠标悬停+快捷键隐藏功能
function setupHoverHideFunctionality(buttonContainer, topButton, bottomButton) {
  // 获取或创建状态对象
  let state = hoverHideStateMap.get(buttonContainer);
  if (!state) {
    state = {
      isHovering: false,
      isKeyPressed: false,
      isHidden: false,
      lastHideTime: 0,
      hideTimeout: null,
      initialized: false
    };
    hoverHideStateMap.set(buttonContainer, state);
  }
  
  // 防止重复初始化
  if (state.initialized) {
    return;
  }
  state.initialized = true;
  
  // 鼠标悬停事件 - 使用mouseenter/mouseleave更精确
  function handleMouseEnter(e) {
    // 阻止事件冒泡，但不阻止默认行为（避免影响指针样式）
    e.stopPropagation();
    state.isHovering = true;
    checkHideConditions();
  }
  
  function handleMouseLeave(e) {
    e.stopPropagation();
    state.isHovering = false;
    if (!state.isKeyPressed) {
      showButtons();
    }
  }
  
  // 键盘事件 - 优化处理逻辑，使用repeat属性防止重复触发
  function handleKeyDown(e) {
    if (!buttonSettings.enableHoverHide) return;
    
    // 忽略自动重复触发的键盘事件
    if (e.repeat) return;
    
    const keyMap = {
      'Alt': e.altKey,
      'Ctrl': isMac() ? e.metaKey : e.ctrlKey,
      'Shift': e.shiftKey
    };
    
    const targetKey = buttonSettings.hoverHideKey || 'Ctrl';
    
    // 只在按键状态变化时触发
    if (keyMap[targetKey] && !state.isKeyPressed) {
      state.isKeyPressed = true;
      checkHideConditions();
    }
  }
  
  function handleKeyUp(e) {
    // 忽略自动重复触发的键盘事件
    if (e.repeat) return;
    
    const keyMap = {
      'Alt': e.altKey,
      'Ctrl': isMac() ? e.metaKey : e.ctrlKey,
      'Shift': e.shiftKey
    };
    
    const targetKey = buttonSettings.hoverHideKey || 'Ctrl';
    
    // 只在按键状态变化时触发
    if (!keyMap[targetKey] && state.isKeyPressed) {
      state.isKeyPressed = false;
      showButtons();
    }
  }
  
  // 检查隐藏条件 - 使用requestAnimationFrame优化性能
  function checkHideConditions() {
    // 清除之前的定时器
    if (state.hideTimeout) {
      cancelAnimationFrame(state.hideTimeout);
    }
    
    // 使用requestAnimationFrame代替setTimeout，更流畅
    state.hideTimeout = requestAnimationFrame(() => {
      if (buttonSettings.enableHoverHide && 
          state.isHovering && 
          state.isKeyPressed) {
        hideButtons();
      }
    });
  }
  
  // 隐藏按钮 - 使用CSS类切换，更稳定
  function hideButtons() {
    const now = performance.now();
    // 增加防抖间隔到200ms，更稳定
    if (now - state.lastHideTime < 200) {
      return;
    }
    state.lastHideTime = now;
    
    setHoverHideTargetsHidden(buttonContainer, true);
    state.isHidden = true;
  }
  
  // 显示按钮
  function showButtons() {
    // 如果隐藏条件仍然满足，不执行显示操作
    if (buttonSettings.enableHoverHide && 
        state.isHovering && 
        state.isKeyPressed) {
      return;
    }
    
    // 清除隐藏定时器
    if (state.hideTimeout) {
      cancelAnimationFrame(state.hideTimeout);
      state.hideTimeout = null;
    }
    
    setHoverHideTargetsHidden(buttonContainer, false);
    state.isHidden = false;
  }
  
  // 添加事件监听器 - 使用绑定后的函数引用，便于移除
  const boundMouseEnter = handleMouseEnter.bind(null);
  const boundMouseLeave = handleMouseLeave.bind(null);
  const boundKeyDown = handleKeyDown.bind(null);
  const boundKeyUp = handleKeyUp.bind(null);
  
  // 存储绑定后的函数，便于后续移除
  state.eventHandlers = {
    mouseEnter: boundMouseEnter,
    mouseLeave: boundMouseLeave,
    keyDown: boundKeyDown,
    keyUp: boundKeyUp
  };
  
  // 鼠标事件 - 主按钮组和独立高级按钮容器都可触发悬停隐藏
  syncHoverHideTriggerTargets(buttonContainer, state);
  
  // 键盘事件 - 仅使用document捕获阶段，避免重复监听
  document.addEventListener('keydown', boundKeyDown, true);
  document.addEventListener('keyup', boundKeyUp, true);
  
  // 当设置变化时更新功能
  const storageChangeHandler = (changes) => {
    if (changes.buttonSettings) {
      const newSettings = changes.buttonSettings.newValue;
      if (newSettings.enableHoverHide !== undefined) {
        buttonSettings.enableHoverHide = newSettings.enableHoverHide;
        if (!buttonSettings.enableHoverHide) {
          showButtons();
        }
      }
      if (newSettings.hoverHideKey) {
        buttonSettings.hoverHideKey = newSettings.hoverHideKey;
      }
    }
  };
  
  chrome.storage.onChanged.addListener(storageChangeHandler);
  state.storageHandler = storageChangeHandler;

  function handleVisibilityChange() {
    if (document.hidden) {
      state.isKeyPressed = false;
      state.isHovering = false;
      state.isHidden = false;
      showButtons();
    }
  }
  
  // 页面卸载时清理
  const cleanup = () => {
    // 移除事件监听器
    if (state.hoverTargets) {
      state.hoverTargets.forEach((target) => {
        if (typeof target.removeEventListener === 'function') {
          target.removeEventListener('mouseenter', boundMouseEnter);
          target.removeEventListener('mouseleave', boundMouseLeave);
        }
      });
      state.hoverTargets.clear();
    }
    
    document.removeEventListener('keydown', boundKeyDown, true);
    document.removeEventListener('keyup', boundKeyUp, true);
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    window.removeEventListener('beforeunload', cleanup);
    
    // 移除存储监听器
    if (state.storageHandler) {
      chrome.storage.onChanged.removeListener(state.storageHandler);
      state.storageHandler = null;
    }
    
    // 清除定时器
    if (state.hideTimeout) {
      cancelAnimationFrame(state.hideTimeout);
      state.hideTimeout = null;
    }
    
    // 重置状态
    state.isHovering = false;
    state.isKeyPressed = false;
    state.isHidden = false;
    state.initialized = false;
    state.cleanup = null;
    if (activeHoverHideCleanup === cleanup) {
      activeHoverHideCleanup = null;
    }
    
    // 显示按钮
    showButtons();
  };
  
  // 页面卸载时清理
  window.addEventListener('beforeunload', cleanup);
  state.cleanup = cleanup;
  activeHoverHideCleanup = cleanup;
  
  // 页面隐藏时重置状态
  document.addEventListener('visibilitychange', handleVisibilityChange);
}

// 更新按钮位置
function updateButtonPosition() {
  const buttonContainer = getButtonContainer();
  if (!buttonContainer) return;
  
  // 获取边缘距离，默认为20px
  const edgeDistance = buttonSettings.edgeDistance !== undefined ? buttonSettings.edgeDistance : 8;
  
  // 水平位置
  if (buttonSettings.horizontalPosition === 'left') {
    buttonContainer.style.left = edgeDistance + 'px';
    buttonContainer.style.right = 'auto';
  } else {
    buttonContainer.style.right = edgeDistance + 'px';
    buttonContainer.style.left = 'auto';
  }
  
  // 垂直对齐
  if (buttonSettings.verticalAlignment === 'top') {
    buttonContainer.style.top = edgeDistance + 'px';
    buttonContainer.style.bottom = 'auto';
    buttonContainer.style.transform = 'none';
  } else if (buttonSettings.verticalAlignment === 'bottom') {
    buttonContainer.style.bottom = edgeDistance + 'px';
    buttonContainer.style.top = 'auto';
    buttonContainer.style.transform = 'none';
  } else {
    buttonContainer.style.top = '50%';
    buttonContainer.style.bottom = 'auto';
    buttonContainer.style.transform = 'translateY(-50%)';
  }

  updateReadingToolPosition();
}

function getMainButtonGroupHeight() {
  const buttonSize = clampNumber(buttonSettings.buttonSize, 10, 120, 40);
  const spacing = Math.max(0, Number(buttonSettings.buttonSpacing) || 0);
  const hasVerticalProgress = advancedSettings.progressBar.enabled && advancedSettings.progressBar.mode === 'verticalButton';
  const screenNavigationCount = advancedSettings.screenNavigation.enabled ? 2 : 0;
  const middleFeatureCount = [
    advancedSettings.autoScroll.enabled && advancedSettings.autoScroll.buttonPosition === 'pageMiddle',
    isScrollBookmarkToolEnabled() && advancedSettings.scrollBookmarks.buttonPosition === 'pageMiddle',
    isOutlineToolEnabled() && advancedSettings.outlineNavigation.buttonPosition === 'pageMiddle'
  ].filter(Boolean).length;
  const progressHeight = hasVerticalProgress
    ? clampNumber(advancedSettings.progressBar.verticalHeight, 40, MAX_PROGRESS_VERTICAL_HEIGHT, DEFAULT_PROGRESS_VERTICAL_HEIGHT)
    : 0;
  const baseHeight = hasVerticalProgress
    ? (buttonSize * 2) + progressHeight + (spacing * 2)
    : (buttonSize * 2) + spacing;
  return baseHeight +
    ((screenNavigationCount + middleFeatureCount) * (buttonSize + spacing));
}

function updateReadingToolPosition() {
  const root = getScrollRoot();
  if (!root) return;

  const edgeDistance = buttonSettings.edgeDistance !== undefined ? buttonSettings.edgeDistance : 8;
  const spacing = Math.max(0, Number(buttonSettings.buttonSpacing) || 0);
  const buttonSize = clampNumber(buttonSettings.buttonSize, 10, 120, 40);
  const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0;
  const tools = [
    {
      container: root.getElementById(AUTO_SCROLL_TOOL_CONTAINER_ID),
      enabled: advancedSettings.autoScroll.enabled,
      settings: advancedSettings.autoScroll
    },
    {
      container: root.getElementById(BOOKMARK_TOOL_CONTAINER_ID),
      enabled: isScrollBookmarkToolEnabled(),
      settings: advancedSettings.scrollBookmarks
    },
    {
      container: root.getElementById(OUTLINE_TOOL_CONTAINER_ID),
      enabled: isOutlineToolEnabled(),
      settings: advancedSettings.outlineNavigation
    }
  ];

  ['pageTop', 'pageBottom'].forEach((position) => {
    const positionedTools = tools.filter((tool) => tool.enabled && tool.settings.buttonPosition === position);
    positionedTools.forEach((tool, index) => {
      const standalone = tool.container;
      if (!standalone) return;
      const baseOffset = buttonSettings.verticalAlignment === (position === 'pageTop' ? 'top' : 'bottom')
        ? edgeDistance + getMainButtonGroupHeight() + spacing
        : edgeDistance;
      const stackIndex = position === 'pageBottom' ? positionedTools.length - index - 1 : index;
      const offset = baseOffset + (stackIndex * (buttonSize + spacing));

      standalone.style.left = buttonSettings.horizontalPosition === 'left' ? edgeDistance + 'px' : 'auto';
      standalone.style.right = buttonSettings.horizontalPosition === 'left' ? 'auto' : edgeDistance + 'px';
      standalone.style.transform = 'none';
      standalone.style.top = position === 'pageTop' ? offset + 'px' : 'auto';
      standalone.style.bottom = position === 'pageBottom' ? offset + 'px' : 'auto';
      standalone.style.display = buttonSettings.showButton ? 'flex' : 'none';
      standalone.style.visibility = viewportHeight && offset + buttonSize > viewportHeight ? 'hidden' : 'visible';
    });
  });
}

// 更新按钮可见性
function updateButtonVisibility() {
  const buttonContainer = getButtonContainer();
  if (!buttonContainer) return;
  const root = getScrollRoot();
  const featureToolContainers = root
    ? [
        root.getElementById(AUTO_SCROLL_TOOL_CONTAINER_ID),
        root.getElementById(BOOKMARK_TOOL_CONTAINER_ID),
        root.getElementById(OUTLINE_TOOL_CONTAINER_ID)
      ].filter(Boolean)
    : [];
  
  if (buttonSettings.showButton) {
    buttonContainer.style.display = 'flex';
    updateReadingToolPosition();
  } else {
    buttonContainer.style.display = 'none';
    featureToolContainers.forEach((container) => {
      container.style.display = 'none';
    });
  }
}

// 颜色验证函数 - 确保颜色值有效
function validateColor(color) {
  // 检查是否为有效的十六进制颜色
  const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
  if (hexRegex.test(color)) {
    return color;
  }
  // 返回默认颜色
  return DEFAULT_BUTTON_COLOR;
}

// 更新按钮样式
function updateButtonStyle() {
  const {
    root,
    topButton,
    previousScreenButton,
    progressButton,
    nextScreenButton,
    bottomButton,
    autoScrollButton,
    bookmarkButton,
    outlineButton
  } = getButtonElements();
  if (!topButton || !bottomButton) return;
  const screenNavigationButtons = [previousScreenButton, nextScreenButton].filter(Boolean);
  const featureButtons = [autoScrollButton, bookmarkButton, outlineButton].filter(Boolean);
  
  // 更新按钮尺寸
  const size = buttonSettings.buttonSize + buttonSettings.buttonSizeUnit;
  topButton.style.width = size;
  topButton.style.height = size;
  bottomButton.style.width = size;
  bottomButton.style.height = size;
  screenNavigationButtons.forEach((button) => {
    button.style.width = size;
    button.style.height = size;
  });
  if (progressButton) {
    progressButton.style.width = size;
    progressButton.style.height = clampNumber(advancedSettings.progressBar.verticalHeight, 40, MAX_PROGRESS_VERTICAL_HEIGHT, DEFAULT_PROGRESS_VERTICAL_HEIGHT) + 'px';
  }
  featureButtons.forEach((button) => {
    button.style.width = size;
    button.style.height = size;
  });
  
  // 更新按钮形状
  const shape = buttonSettings.buttonShape || 'round';
  const borderRadius = shape === 'square' ? '4px' : '50%';
  const progressBorderRadius = shape === 'square' ? '4px' : '999px';
  topButton.style.borderRadius = borderRadius;
  bottomButton.style.borderRadius = borderRadius;
  screenNavigationButtons.forEach((button) => {
    button.style.borderRadius = borderRadius;
  });
  if (progressButton) {
    progressButton.style.borderRadius = progressBorderRadius;
  }
  featureButtons.forEach((button) => {
    button.style.borderRadius = borderRadius;
  });
  
  // 更新SVG图标大小（根据按钮尺寸自动调整）
  applyIconSizing();
  
  // 更新按钮颜色 - 使用用户设置的颜色（带验证）
  const topColor = validateColor(buttonSettings.topButtonColor);
  const bottomColor = validateColor(buttonSettings.bottomButtonColor);
  topButton.style.backgroundColor = topColor;
  bottomButton.style.backgroundColor = bottomColor;
  if (previousScreenButton) {
    previousScreenButton.style.backgroundColor = advancedSettings.screenNavigation.previousScreenButtonColor;
  }
  if (nextScreenButton) {
    nextScreenButton.style.backgroundColor = advancedSettings.screenNavigation.nextScreenButtonColor;
  }
  if (progressButton) {
    progressButton.style.backgroundColor = getProgressColor();
  }
  if (bookmarkButton) bookmarkButton.style.backgroundColor = getBookmarkToolColor();
  if (outlineButton) outlineButton.style.backgroundColor = getOutlineToolColor();
  if (autoScrollButton) autoScrollButton.style.backgroundColor = advancedSettings.autoScroll.buttonColor;

  const iconColor = getActiveIconColor();
  topButton.style.color = iconColor;
  bottomButton.style.color = iconColor;
  screenNavigationButtons.forEach((button) => {
    button.style.color = DEFAULT_ICON_COLOR;
  });
  if (progressButton) {
    progressButton.style.color = iconColor;
  }
  featureButtons.forEach((button) => {
    button.style.color = iconColor;
  });
  
  // 动态应用间距到容器
  const buttonContainer = getButtonContainer();
  if (buttonContainer) {
    buttonContainer.style.gap = buttonSettings.buttonSpacing + 'px';
  }
  
  // 更新透明度
  const opacity = buttonSettings.opacity / 100;
  topButton.style.opacity = opacity;
  bottomButton.style.opacity = opacity;
  screenNavigationButtons.forEach((button) => {
    button.style.opacity = opacity;
  });
  if (progressButton) {
    progressButton.style.opacity = opacity;
  }
  featureButtons.forEach((button) => {
    button.style.opacity = opacity;
  });
  
  // 更新悬停效果颜色 - 使用用户设置的颜色
  const styleElement = root.getElementById(DYNAMIC_STYLE_ID);
  if (styleElement) {
    styleElement.remove();
  }
  
  const newStyle = document.createElement('style');
  newStyle.id = DYNAMIC_STYLE_ID;
  newStyle.textContent = `
    .psm-scroll-top:hover {
      background-color: ${adjustColorBrightness(topColor, -10)};
    }
    .psm-scroll-bottom:hover {
      background-color: ${adjustColorBrightness(bottomColor, -10)};
    }
    .psm-screen-previous:hover {
      background-color: ${adjustColorBrightness(advancedSettings.screenNavigation.previousScreenButtonColor, -10)};
    }
    .psm-screen-next:hover {
      background-color: ${adjustColorBrightness(advancedSettings.screenNavigation.nextScreenButtonColor, -10)};
    }
    .psm-progress-button:hover {
      background-color: ${adjustColorBrightness(getProgressColor(), -25)};
    }
    .psm-bookmark-tool-button:hover {
      background-color: ${adjustColorBrightness(getBookmarkToolColor(), -10)};
    }
    .psm-outline-tool-button:hover {
      background-color: ${adjustColorBrightness(getOutlineToolColor(), -10)};
    }
    .psm-auto-scroll-button:hover {
      background-color: ${adjustColorBrightness(advancedSettings.autoScroll.buttonColor, -10)};
    }
  `;
  root.appendChild(newStyle);
  updateProgressBar();
  updateReadingToolPosition();
}

// 调整颜色亮度
function adjustColorBrightness(color, percent) {
  const num = parseInt(color.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) + amt;
  const G = (num >> 8 & 0x00FF) + amt;
  const B = (num & 0x0000FF) + amt;
  return '#' + (0x1000000 + (R<255?R<1?0:R:255)*0x10000 + (G<255?G<1?0:G:255)*0x100 + (B<255?B<1?0:B:255)).toString(16).slice(1);
}

// 初始化按钮
function initializeButton() {
  if (!hasLoadedExtensionEnabledState || !isExtensionEnabled) {
    return;
  }

  currentScrollContainer = resolveScrollContainer();
  const buttonCreated = createScrollButton();

  if (buttonCreated) {
    fullscreenManager.buttonContainer = getButtonContainer();
    fullscreenManager.init();
    updateButtonStyle();
    ensureProgressControls();
    ensureReadingToolControls();
    fullscreenManager.handleFullscreenChange();

    if (!spaDetectionState.isInitialized) {
      spaDetectionState.isInitialized = true;
      setupSpaDetection();
    }
  } else {
    // body 未准备好，延迟重试
    console.warn('[Page Scroll Master] Button creation failed, will retry...');
    if (initializationRetryTimer) return;
    initializationRetryTimer = setTimeout(() => {
      initializationRetryTimer = null;
      if (isExtensionEnabled && !document.getElementById(HOST_ID)) {
        initializeButton();
      }
    }, 200);
  }
}

// SPA 页面动态加载检测 - 解决首次加载时滚动容器未就绪的问题
function setupSpaDetection() {
  setupOutlineRouteChangeDetection();

  // 延迟检测，给 SPA 应用足够的渲染时间
  spaDetectionState.initialTimer = setTimeout(() => {
    spaDetectionState.initialTimer = null;
    detectAndUpdateScrollContainer();
  }, SPA_DETECTION_CONFIG.initialDelay);
  
  // 使用 MutationObserver 监听 DOM 变化，检测动态加载的内容
  if (typeof MutationObserver !== 'undefined') {
    spaDetectionState.observer = new MutationObserver((mutations) => {
      // 检查是否有实质性的 DOM 变化（不仅仅是属性变化）
      const hasSignificantChanges = mutations.some(mutation => 
        mutation.type === 'childList' && 
        (mutation.addedNodes.length > 0 || mutation.removedNodes.length > 0)
      );
      
      if (!hasSignificantChanges) return;
      const shouldRefreshContainer = shouldReevaluateScrollContainer(mutations);
      
      // 防抖处理，避免频繁检测
      if (spaDetectionState.debounceTimer) {
        clearTimeout(spaDetectionState.debounceTimer);
      }
      
      spaDetectionState.debounceTimer = setTimeout(() => {
        if (shouldRefreshContainer) {
          detectAndUpdateScrollContainer();
        }
        handleOutlineDomChange();
      }, SPA_DETECTION_CONFIG.mutationDebounceDelay);
    });
    
    // 监听 document.body 的子节点变化
    if (document.body) {
      spaDetectionState.observer.observe(document.body, {
        childList: true,
        subtree: true
      });
    } else {
      // 如果 body 还不存在，等待 DOMContentLoaded
      spaDetectionState.domReadyHandler = () => {
        document.removeEventListener('DOMContentLoaded', spaDetectionState.domReadyHandler);
        spaDetectionState.domReadyHandler = null;
        if (spaDetectionState.observer && document.body) {
          spaDetectionState.observer.observe(document.body, {
            childList: true,
            subtree: true
          });
        }
      };
      document.addEventListener('DOMContentLoaded', spaDetectionState.domReadyHandler);
    }
  }
}

// 检测并更新滚动容器
function detectAndUpdateScrollContainer() {
  const strategy = getEffectiveContainerStrategy();
  const oldContainer = currentScrollContainer;
  const oldStrategy = currentScrollContainerStrategy;
  const newContainer = findScrollContainer(strategy, {
    preferredContainer: oldContainer
  });

  // 新算法已排除嵌套子滚动组件，只要容器不同就需要更新
  if (newContainer !== oldContainer || strategy !== oldStrategy) {
    setCurrentScrollContainer(newContainer, strategy);

    // 如果按钮已存在，更新滚动事件绑定
    const { root, topButton, bottomButton } = getButtonElements();
    if (topButton && bottomButton && root) {
      // 移除旧的事件监听器（通过克隆节点实现）
      const newTopButton = topButton.cloneNode(true);
      const newBottomButton = bottomButton.cloneNode(true);

      topButton.parentNode.replaceChild(newTopButton, topButton);
      bottomButton.parentNode.replaceChild(newBottomButton, bottomButton);

      // 重新绑定点击事件
      newTopButton.addEventListener('click', () => {
        recordAnalyticsAction('floatingTopClicks');
        scrollToTop();
      });
      newBottomButton.addEventListener('click', () => {
        recordAnalyticsAction('floatingBottomClicks');
        scrollToBottom();
      });
      applyButtonIcons();
      ensureScreenNavigationControls();

      // 重新设置悬停隐藏功能 - 先重置初始化状态
      const buttonContainer = getButtonContainer();
      if (buttonContainer) {
        const state = hoverHideStateMap.get(buttonContainer);
        if (state) {
          if (state.cleanup) {
            state.cleanup();
          }
          hoverHideStateMap.delete(buttonContainer);
        }
        setupHoverHideFunctionality(buttonContainer, newTopButton, newBottomButton);
      }
    }
  }

  if (advancedSettings.progressBar.enabled) {
    bindProgressToContainer(newContainer || resolveScrollContainer());
  }

  if (spaDetectionState.retryTimer) {
    clearTimeout(spaDetectionState.retryTimer);
    spaDetectionState.retryTimer = null;
  }

  // 页面早期或 SPA 首屏渲染期间短时间轮询；后续变化由 MutationObserver 继续驱动。
  if (spaDetectionState.retryCount < SPA_DETECTION_CONFIG.maxRetries) {
    spaDetectionState.retryCount++;
    spaDetectionState.retryTimer = setTimeout(() => {
      detectAndUpdateScrollContainer();
    }, SPA_DETECTION_CONFIG.retryInterval);
  }
}

// 监听来自popup的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'scrollToTop') {
    if (!isExtensionEnabled) return;
    scrollToTop();
  } else if (message.action === 'scrollToBottom') {
    if (!isExtensionEnabled) return;
    scrollToBottom();
  } else if (message.action === 'updateSpeed') {
    scrollSpeed = message.speed;
  } else if (message.action === 'updateButtonSettings') {
    buttonSettings = { ...buttonSettings, ...message.settings };
    updateButtonPosition();
    updateButtonVisibility();
    updateButtonStyle();
  } else if (message.action === 'updateAdvancedSettings') {
    applyAdvancedSettingsUpdate(message.settings);
  } else if (message.action === 'updateDomainFeatureState') {
    if (!message.domainKey || message.domainKey === currentDomainKey) {
      applyDomainFeatureState(message.state);
    }
  }
});

// 监听存储变化
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (changes.scrollSpeed) {
    scrollSpeed = changes.scrollSpeed.newValue;
  }
  if (changes.buttonSettings) {
    buttonSettings = { ...buttonSettings, ...changes.buttonSettings.newValue };
    updateButtonPosition();
    updateButtonVisibility();
    updateButtonStyle();
  }
  if (namespace === 'sync' && changes.advancedSettings) {
    applyAdvancedSettingsUpdate(changes.advancedSettings.newValue);
  }
  if (namespace === 'local' && changes[DOMAIN_STORAGE_KEYS.defaults]) {
    domainFeatureDefaults = domainUtils.normalizeDefaults(
      changes[DOMAIN_STORAGE_KEYS.defaults].newValue
    );
  }
  if (namespace === 'local' && changes[DOMAIN_STORAGE_KEYS.states]) {
    domainFeatureStates = domainUtils.normalizeStates(
      changes[DOMAIN_STORAGE_KEYS.states].newValue,
      domainFeatureDefaults
    );
  }
  if (namespace === 'local' &&
      (changes[DOMAIN_STORAGE_KEYS.defaults] || changes[DOMAIN_STORAGE_KEYS.states])) {
    applyDomainFeatureState(
      domainUtils.getState(domainFeatureStates, currentDomainKey, domainFeatureDefaults)
    );
  }
});

// 全屏模式检测和管理
const fullscreenManager = {
  isFullscreen: false,
  buttonContainer: null,
  initialized: false,
  events: [
    'fullscreenchange',
    'webkitfullscreenchange',
    'mozfullscreenchange',
    'MSFullscreenChange'
  ],
  boundHandler: null,
  
  // 检测当前是否处于全屏模式
  checkFullscreen() {
    return !!(document.fullscreenElement || 
              document.webkitFullscreenElement || 
              document.mozFullScreenElement || 
              document.msFullscreenElement);
  },
  
  // 处理全屏状态变化
  handleFullscreenChange() {
    const wasFullscreen = this.isFullscreen;
    this.isFullscreen = this.checkFullscreen();
    
    if (!this.buttonContainer) {
      this.buttonContainer = getButtonContainer();
    }
    
    if (this.buttonContainer) {
      if (this.isFullscreen) {
        // 进入全屏模式，隐藏按钮
        this.buttonContainer.classList.add('psm-fullscreen-hidden');
      } else {
        // 退出全屏模式，显示按钮
        this.buttonContainer.classList.remove('psm-fullscreen-hidden');
      }
    }

    const root = getScrollRoot();
    const horizontalProgress = root ? root.getElementById(HORIZONTAL_PROGRESS_ID) : null;
    const featureElements = root
      ? [
          root.getElementById(AUTO_SCROLL_TOOL_CONTAINER_ID),
          root.getElementById(BOOKMARK_TOOL_CONTAINER_ID),
          root.getElementById(OUTLINE_TOOL_CONTAINER_ID),
          root.getElementById(BOOKMARK_MENU_ID),
          root.getElementById(OUTLINE_MENU_ID),
          root.getElementById(BOOKMARK_TOAST_ID)
        ]
      : [];
    if (horizontalProgress) {
      if (this.isFullscreen) {
        horizontalProgress.classList.add('psm-fullscreen-hidden');
      } else {
        horizontalProgress.classList.remove('psm-fullscreen-hidden');
      }
    }
    if (this.isFullscreen && advancedSettings.autoScroll.pauseOnFullscreen) {
      pauseAutoScroll();
    }
    featureElements.forEach((element) => {
      if (!element) return;
      if (this.isFullscreen) {
        element.classList.add('psm-fullscreen-hidden');
      } else {
        element.classList.remove('psm-fullscreen-hidden');
      }
    });
  },
  
  // 初始化全屏检测
  init() {
    if (this.initialized) return;
    this.initialized = true;
    this.boundHandler = () => this.handleFullscreenChange();
    this.events.forEach(event => {
      document.addEventListener(event, this.boundHandler, false);
    });
    this.handleFullscreenChange();
  },

  cleanup() {
    if (!this.initialized) return;
    if (typeof document.removeEventListener === 'function') {
      this.events.forEach(event => {
        document.removeEventListener(event, this.boundHandler, false);
      });
    }
    this.initialized = false;
    this.boundHandler = null;
    this.isFullscreen = false;
    this.buttonContainer = null;
  }
};

// 安全的初始化函数 - 确保 document.body 存在后再执行
function safeInitialize() {
  if (!document.body) {
    // body 不存在，延迟重试
    setTimeout(safeInitialize, 100);
    return;
  }
  loadSettings();
}

// 页面加载完成后初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    safeInitialize();
  });
} else {
  safeInitialize();
}

// 备选：监听 window load 事件，处理资源加载完成后的初始化
window.addEventListener('load', () => {
  // 如果按钮仍未创建，尝试重新初始化
  if (hasLoadedExtensionEnabledState && isExtensionEnabled && !document.getElementById(HOST_ID)) {
    console.log('[Page Scroll Master] Retrying initialization after window load');
    initializeButton();
  }
});

// 监听页面可见性变化 - 处理 SPA 路由切换和页面重新激活的情况
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    // 页面重新可见时，重置检测状态并重新检测滚动容器
    // 这对于处理 SPA 路由切换非常有用
    if (spaDetectionState.isInitialized) {
      spaDetectionState.retryCount = 0;
      if (spaDetectionState.retryTimer) {
        clearTimeout(spaDetectionState.retryTimer);
        spaDetectionState.retryTimer = null;
      }
      // 使用 requestAnimationFrame 确保页面已经渲染完成
      requestAnimationFrame(() => {
        detectAndUpdateScrollContainer();
      });
    }
  }
});
