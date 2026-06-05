// 默认设置
let scrollSpeed = 100; // 默认滚动速度为100ms
let isExtensionEnabled = false; // 当前网站插件启用状态
let hasLoadedExtensionEnabledState = false; // 站点启用状态加载完成前不初始化按钮
const currentHostname = window.location.hostname; // 当前页面域名
let currentScrollContainer = null; // 当前页面的滚动容器
const DEFAULT_BUTTON_COLOR = '#4A9EDD'; // 默认按钮颜色
const DEFAULT_ICON_COLOR = '#FFFFFF';
const DEFAULT_PROGRESS_VERTICAL_HEIGHT = 120;
const MAX_PROGRESS_VERTICAL_HEIGHT = 400;
const READING_SPEED_CJK_CHARS_PER_MINUTE = 500;
const READING_SPEED_LATIN_WORDS_PER_MINUTE = 225;
const READING_ESTIMATE_CACHE_MS = 5000;
const HOST_ID = 'page-scroll-master-host';
const CONTAINER_ID = 'page-scroll-master-button';
const DYNAMIC_STYLE_ID = 'page-scroll-master-dynamic-styles';
const HORIZONTAL_PROGRESS_ID = 'page-scroll-master-horizontal-progress';
const READING_TOOL_CONTAINER_ID = 'page-scroll-master-reading-tool';
const READING_TOOL_MENU_ID = 'page-scroll-master-reading-menu';
const READING_TOOL_TOAST_ID = 'page-scroll-master-reading-toast';
const BOOKMARKS_STORAGE_KEY = 'bookmarks';
const LABEL_SCROLL_TOP = chrome.i18n.getMessage('popupScrollTop') || 'Scroll to Top';
const LABEL_SCROLL_BOTTOM = chrome.i18n.getMessage('popupScrollBottom') || 'Scroll to Bottom';
const DEFAULT_ADVANCED_SETTINGS = {
  progressBar: {
    enabled: false,
    mode: 'verticalButton',
    horizontalPosition: 'top',
    colorMode: 'followTopButton',
    customColor: DEFAULT_BUTTON_COLOR,
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
  readingTools: {
    enabled: false,
    buttonPosition: 'pageBottom',
    buttonColorMode: 'followProgressBar',
    buttonCustomColor: DEFAULT_BUTTON_COLOR,
    features: {
      scrollBookmarks: true,
      outlineNavigation: false
    }
  },
  scrollBookmarks: {
    matchMode: 'exact',
    perDomainLimit: 1,
    globalLimit: 300,
    restorePromptEnabled: true
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
  debounceTimer: null,
  retryTimer: null,
  isInitialized: false
};
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
let readingEstimateCache = {
  target: null,
  calculatedAt: 0,
  textLength: 0,
  seconds: 0
};
let restorePromptShownForKey = '';

const SCROLLABLE_OVERFLOW_VALUES = new Set(['auto', 'scroll', 'overlay']);

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
  merged.progressBar.customColor = validateHexColor(merged.progressBar.customColor, DEFAULT_BUTTON_COLOR);
  merged.progressBar.thickness = normalizeProgressThickness(merged.progressBar.thickness);
  merged.progressBar.verticalHeight = clampNumber(merged.progressBar.verticalHeight, 40, MAX_PROGRESS_VERTICAL_HEIGHT, DEFAULT_PROGRESS_VERTICAL_HEIGHT);
  merged.iconCustomization.enabled = true;
  merged.iconCustomization.iconSet = normalizeIconSet(merged.iconCustomization.iconSet);
  merged.iconCustomization.iconColor = validateHexColor(merged.iconCustomization.iconColor, DEFAULT_ICON_COLOR);
  merged.readingTools.buttonPosition = normalizeReadingToolPosition(merged.readingTools.buttonPosition);
  merged.readingTools.buttonColorMode = normalizeReadingToolColorMode(merged.readingTools.buttonColorMode);
  merged.readingTools.buttonCustomColor = validateHexColor(merged.readingTools.buttonCustomColor, DEFAULT_BUTTON_COLOR);
  merged.readingTools.features.scrollBookmarks = merged.readingTools.features.scrollBookmarks !== false;
  merged.readingTools.features.outlineNavigation = false;
  merged.scrollBookmarks.matchMode = 'exact';
  merged.scrollBookmarks.perDomainLimit = normalizePerDomainLimit(merged.scrollBookmarks.perDomainLimit);
  merged.scrollBookmarks.globalLimit = clampNumber(merged.scrollBookmarks.globalLimit, 1, 300, 300);
  merged.scrollBookmarks.restorePromptEnabled = merged.scrollBookmarks.restorePromptEnabled !== false;
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
  return ['pageTop', 'pageBottom', 'betweenScrollButtons'].includes(value)
    ? value
    : 'pageBottom';
}

function normalizeReadingToolColorMode(value) {
  return ['followTopButton', 'followBottomButton', 'followProgressBar', 'custom'].includes(value)
    ? value
    : 'followProgressBar';
}

function normalizePerDomainLimit(value) {
  return Number(value) === 3 ? 3 : 1;
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

function canScrollVertically(element) {
  if (!element || getElementScrollRange(element) <= 1) return false;
  if (isRootScrollElement(element)) return true;

  const overflowY = window.getComputedStyle(element).overflowY;
  return SCROLLABLE_OVERFLOW_VALUES.has(overflowY);
}

function getElementViewportScore(element) {
  if (!element || typeof element.getBoundingClientRect !== 'function') return 0;

  const rect = element.getBoundingClientRect();
  const viewportWidth = window.innerWidth || document.documentElement.clientWidth || 0;
  const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0;
  if (!viewportWidth || !viewportHeight || rect.width <= 0 || rect.height <= 0) return 0;

  const visibleWidth = Math.max(0, Math.min(rect.right, viewportWidth) - Math.max(rect.left, 0));
  const visibleHeight = Math.max(0, Math.min(rect.bottom, viewportHeight) - Math.max(rect.top, 0));
  const visibleArea = visibleWidth * visibleHeight;
  const viewportArea = viewportWidth * viewportHeight;
  return visibleArea / viewportArea;
}

function scoreScrollContainer(element) {
  const range = getElementScrollRange(element);
  const viewportScore = getElementViewportScore(element);
  const tagName = element.tagName ? element.tagName.toLowerCase() : '';
  const role = element.getAttribute ? (element.getAttribute('role') || '').toLowerCase() : '';
  let score = range;

  score += viewportScore * 2000;

  if (isRootScrollElement(element)) score += 1000;
  if (['main', 'article', 'section', 'body', 'html'].includes(tagName)) score += 500;
  if (['main', 'document'].includes(role)) score += 400;
  if (tagName === 'pre' || tagName === 'code') score -= 1500;
  if (viewportScore < 0.08) score -= 1200;

  return score;
}

// 自动检测页面的滚动容器
// 策略：综合根滚动元素和常见内容容器，优先选择可见面积大、滚动范围大、语义更接近主内容的容器
function findScrollContainer() {
  const fallback = document.scrollingElement || document.documentElement;
  const candidates = [
    document.scrollingElement,
    document.documentElement,
    document.body,
    ...document.querySelectorAll('div, section, main, article, aside, nav, pre, code, [role="main"], [role="document"]')
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

function resolveScrollContainer() {
  const latestContainer = findScrollContainer();
  if (latestContainer && latestContainer !== currentScrollContainer) {
    currentScrollContainer = latestContainer;
  }

  return currentScrollContainer || document.scrollingElement || document.documentElement;
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
  if (!root) {
    return { root: null, topButton: null, progressButton: null, bottomButton: null, readingToolButton: null };
  }

  return {
    root,
    topButton: root.querySelector('.psm-scroll-top'),
    progressButton: root.querySelector('.psm-progress-button'),
    bottomButton: root.querySelector('.psm-scroll-bottom'),
    readingToolButton: root.querySelector('.psm-reading-tool-button')
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
    loadExtensionEnabledState();
  });
}

function loadExtensionEnabledState() {
  chrome.storage.local.get(['enableStates'], function (result) {
    var states = normalizeEnableStates(result.enableStates);
    isExtensionEnabled = states[currentHostname] !== false;
    hasLoadedExtensionEnabledState = true;
    if (isExtensionEnabled) {
      initializeButton();
    } else {
      removeButton();
    }
  });
}

function normalizeEnableStates(states) {
  return states && typeof states === 'object' && !Array.isArray(states) ? states : {};
}

function smoothScrollTo(container, targetTop) {
  if (!container) return;
  const start = getScrollTop(container);
  const range = getElementScrollRange(container);
  const end = clampNumber(targetTop, 0, range, 0);
  const startTime = performance.now();

  function scroll(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / scrollSpeed, 1);
    const easeProgress = easeInOutCubic(progress);

    setScrollTop(container, start + (end - start) * easeProgress);

    if (progress < 1) {
      requestAnimationFrame(scroll);
    } else {
      requestProgressUpdate();
    }
  }

  requestAnimationFrame(scroll);
}

// 平滑滚动到顶部
function scrollToTop() {
  const container = resolveScrollContainer();
  smoothScrollTo(container, 0);
}

// 平滑滚动到底部
function scrollToBottom() {
  const container = resolveScrollContainer();
  smoothScrollTo(container, getElementScrollRange(container));
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

function getReadingToolIconSvg() {
  return '<svg class="scroll-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 4.5A2.5 2.5 0 0 1 8.5 2h7A2.5 2.5 0 0 1 18 4.5V21l-6-3.5L6 21V4.5z"/></svg>';
}

function getActiveIconSet() {
  return normalizeIconSet(advancedSettings.iconCustomization.iconSet);
}

function getActiveIconColor() {
  return validateHexColor(advancedSettings.iconCustomization.iconColor, DEFAULT_ICON_COLOR);
}

function applyButtonIcons() {
  const { topButton, bottomButton, readingToolButton } = getButtonElements();
  if (!topButton || !bottomButton) return;
  const iconSet = getActiveIconSet();
  topButton.innerHTML = getIconSvg('top', iconSet);
  bottomButton.innerHTML = getIconSvg('bottom', iconSet);
  if (readingToolButton) {
    readingToolButton.innerHTML = getReadingToolIconSvg();
  }
}

function getProgressColor() {
  const progressSettings = advancedSettings.progressBar;
  if (progressSettings.colorMode === 'followBottomButton') {
    return validateHexColor(buttonSettings.bottomButtonColor, DEFAULT_BUTTON_COLOR);
  }
  if (progressSettings.colorMode === 'custom') {
    return validateHexColor(progressSettings.customColor, DEFAULT_BUTTON_COLOR);
  }
  return validateHexColor(buttonSettings.topButtonColor, DEFAULT_BUTTON_COLOR);
}

function isReadingToolEnabled() {
  const tools = advancedSettings.readingTools;
  return Boolean(
    tools.enabled &&
    (tools.features.scrollBookmarks || tools.features.outlineNavigation)
  );
}

function getReadingToolColor() {
  const tools = advancedSettings.readingTools;
  if (tools.buttonColorMode === 'followBottomButton') {
    return validateHexColor(buttonSettings.bottomButtonColor, DEFAULT_BUTTON_COLOR);
  }
  if (tools.buttonColorMode === 'custom') {
    return validateHexColor(tools.buttonCustomColor, DEFAULT_BUTTON_COLOR);
  }
  if (tools.buttonColorMode === 'followProgressBar' && advancedSettings.progressBar.enabled) {
    return getProgressColor();
  }
  return validateHexColor(buttonSettings.topButtonColor, DEFAULT_BUTTON_COLOR);
}

function createReadingToolButton() {
  const button = document.createElement('button');
  button.className = 'psm-scroll-button psm-reading-tool-button';
  button.type = 'button';
  button.title = '阅读工具';
  button.setAttribute('aria-label', '阅读工具');
  button.innerHTML = getReadingToolIconSvg();
  button.addEventListener('click', handleReadingToolClick);
  return button;
}

function getReadingToolMenu(root) {
  if (!root) return null;
  let menu = root.getElementById(READING_TOOL_MENU_ID);
  if (menu) return menu;

  menu = document.createElement('div');
  menu.id = READING_TOOL_MENU_ID;
  menu.className = 'psm-reading-menu';
  menu.innerHTML = '<button type="button" data-action="save-bookmark">保存当前位置</button><button type="button" data-action="manage-bookmarks">查看已保存位置</button>';
  menu.addEventListener('click', (event) => {
    event.stopPropagation();
    const action = event.target && event.target.getAttribute ? event.target.getAttribute('data-action') : '';
    if (action === 'save-bookmark') {
      hideReadingToolMenu();
      saveScrollBookmark();
    } else if (action === 'manage-bookmarks') {
      hideReadingToolMenu();
      if (chrome.runtime && chrome.runtime.openOptionsPage) {
        chrome.runtime.openOptionsPage();
      }
    }
  });
  root.appendChild(menu);
  return menu;
}

function positionReadingToolMenu(button, menu) {
  if (!button || !menu || typeof button.getBoundingClientRect !== 'function') return;
  const rect = button.getBoundingClientRect();
  const width = 168;
  const spacing = Math.max(8, Number(buttonSettings.buttonSpacing) || 8);
  const viewportWidth = window.innerWidth || document.documentElement.clientWidth || 0;
  const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0;
  const opensLeft = buttonSettings.horizontalPosition !== 'left';
  let left = opensLeft ? rect.left - width - spacing : rect.right + spacing;

  if (left < 8) left = Math.min(rect.left, 8);
  if (viewportWidth && left + width > viewportWidth - 8) left = Math.max(8, viewportWidth - width - 8);

  const menuHeight = 92;
  let top = rect.top + (rect.height / 2) - (menuHeight / 2);
  if (top < 8) top = 8;
  if (viewportHeight && top + menuHeight > viewportHeight - 8) top = Math.max(8, viewportHeight - menuHeight - 8);

  menu.style.left = `${left}px`;
  menu.style.top = `${top}px`;
}

function handleReadingToolClick(event) {
  event.stopPropagation();
  const { root, readingToolButton } = getButtonElements();
  const menu = getReadingToolMenu(root);
  if (!menu || !readingToolButton) return;
  const willOpen = !menu.classList.contains('psm-open');
  if (willOpen) {
    menu.classList.add('psm-open');
    positionReadingToolMenu(readingToolButton, menu);
  } else {
    hideReadingToolMenu();
  }
}

function hideReadingToolMenu() {
  const root = getScrollRoot();
  const menu = root ? root.getElementById(READING_TOOL_MENU_ID) : null;
  if (menu) {
    menu.classList.remove('psm-open');
  }
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
}

function handleVerticalProgressClick(event) {
  if (!advancedSettings.progressBar.clickToJump) return;
  const rect = event.currentTarget.getBoundingClientRect();
  const ratio = rect.height <= 0 ? 0 : (event.clientY - rect.top) / rect.height;
  const container = resolveScrollContainer();
  smoothScrollTo(container, getElementScrollRange(container) * clamp(ratio, 0, 1));
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

function removeReadingToolControls() {
  const { root, readingToolButton } = getButtonElements();
  if (readingToolButton) {
    readingToolButton.remove();
  }
  const standalone = root ? root.getElementById(READING_TOOL_CONTAINER_ID) : null;
  if (standalone) {
    standalone.remove();
  }
  const menu = root ? root.getElementById(READING_TOOL_MENU_ID) : null;
  if (menu) {
    menu.remove();
  }
}

function getOrCreateReadingToolButton() {
  const { root, readingToolButton } = getButtonElements();
  if (!root) return null;
  return readingToolButton || createReadingToolButton();
}

function getOrCreateReadingToolContainer(root) {
  if (!root) return null;
  let container = root.getElementById(READING_TOOL_CONTAINER_ID);
  if (container) return container;
  container = document.createElement('div');
  container.id = READING_TOOL_CONTAINER_ID;
  container.className = 'psm-reading-tool-container';
  root.appendChild(container);
  return container;
}

function ensureReadingToolControls() {
  const { root, bottomButton } = getButtonElements();
  if (!root || !bottomButton) return;

  if (!isReadingToolEnabled()) {
    removeReadingToolControls();
    return;
  }

  const button = getOrCreateReadingToolButton();
  if (!button) return;

  const standalone = getOrCreateReadingToolContainer(root);
  const position = advancedSettings.readingTools.buttonPosition;
  if (position === 'betweenScrollButtons') {
    if (standalone) {
      standalone.remove();
    }
    if (button.parentNode !== bottomButton.parentNode) {
      bottomButton.parentNode.insertBefore(button, bottomButton);
    } else if (button.nextSibling !== bottomButton) {
      button.parentNode.insertBefore(button, bottomButton);
    }
  } else if (standalone) {
    if (button.parentNode !== standalone) {
      standalone.appendChild(button);
    }
  }

  getReadingToolMenu(root);
  updateReadingToolPosition();
  updateButtonStyle();
  checkRestorePrompt();
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
  if (!advancedSettings.readingTools.enabled || !advancedSettings.readingTools.features.scrollBookmarks) {
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
  let toast = root.getElementById(READING_TOOL_TOAST_ID);
  if (!toast) {
    toast = document.createElement('div');
    toast.id = READING_TOOL_TOAST_ID;
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

function checkRestorePrompt() {
  if (!advancedSettings.readingTools.enabled ||
      !advancedSettings.readingTools.features.scrollBookmarks ||
      !advancedSettings.scrollBookmarks.restorePromptEnabled) {
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
    restorePromptShownForKey = key;
    const percent = Math.round(clamp(bookmark.scrollPct, 0, 1) * 100);
    showReadingToast(`从大约 ${percent}% 处继续？`, [
      {
        label: '继续',
        handler: () => {
          const container = resolveScrollContainer();
          smoothScrollTo(container, getElementScrollRange(container) * clamp(bookmark.scrollPct, 0, 1));
        }
      },
      {
        label: '忽略',
        handler: () => {}
      }
    ]);
  });
}

function applyAdvancedSettings() {
  advancedSettings = mergeAdvancedSettings(advancedSettings);
  applyButtonIcons();
  ensureProgressControls();
  ensureReadingToolControls();
  updateButtonStyle();
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
  if (advancedSettings.progressBar.enabled && advancedSettings.progressBar.mode === 'verticalButton') {
    buttonContainer.appendChild(createVerticalProgressButton());
  }
  if (isReadingToolEnabled() && advancedSettings.readingTools.buttonPosition === 'betweenScrollButtons') {
    buttonContainer.appendChild(createReadingToolButton());
  }
  buttonContainer.appendChild(bottomButton);

  // 添加到页面，Shadow DOM 隔离扩展样式和网页样式
  root.appendChild(buttonContainer);
  document.body.appendChild(host);
  if (advancedSettings.progressBar.enabled && advancedSettings.progressBar.mode === 'horizontalBar') {
    createHorizontalProgressBar(root);
  }

  // 添加事件监听器
  topButton.addEventListener('click', scrollToTop);
  bottomButton.addEventListener('click', scrollToBottom);
  document.addEventListener('click', hideReadingToolMenu, true);

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
  if (!host) return;
  unbindProgressContainer();

  const root = host.shadowRoot;
  if (root) {
    const state = hoverHideStateMap.get(root.getElementById(CONTAINER_ID));
    if (state && state.cleanup) {
      state.cleanup();
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
      padding: 0;
      margin: 0;
      line-height: 1;
    }
    
    .psm-scroll-button .scroll-icon {
      width: 60%;
      height: 60%;
      color: currentColor;
      stroke: currentColor;
      stroke-width: 3;
      display: block;
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

    .psm-reading-tool-container {
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
      width: 168px;
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

    .psm-reading-menu button:hover {
      background: rgba(255, 255, 255, 0.12);
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
    
    .psm-container.psm-fullscreen-hidden {
      opacity: 0 !important;
      pointer-events: none !important;
      transform: scale(0.8) !important;
      transition: opacity 0.2s ease, transform 0.2s ease !important;
    }

    .psm-horizontal-progress.psm-fullscreen-hidden,
    .psm-reading-tool-container.psm-fullscreen-hidden,
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
    
    // 使用CSS类切换，避免直接操作style
    if (!buttonContainer.classList.contains('psm-hidden')) {
      buttonContainer.classList.add('psm-hidden');
    }
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
    
    // 使用CSS类切换
    if (buttonContainer.classList.contains('psm-hidden')) {
      buttonContainer.classList.remove('psm-hidden');
    }
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
  
  // 鼠标事件 - 使用mouseenter/mouseleave，更精确且不冒泡
  topButton.addEventListener('mouseenter', boundMouseEnter);
  topButton.addEventListener('mouseleave', boundMouseLeave);
  bottomButton.addEventListener('mouseenter', boundMouseEnter);
  bottomButton.addEventListener('mouseleave', boundMouseLeave);
  
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
  
  // 页面卸载时清理
  const cleanup = () => {
    // 移除事件监听器
    topButton.removeEventListener('mouseenter', boundMouseEnter);
    topButton.removeEventListener('mouseleave', boundMouseLeave);
    bottomButton.removeEventListener('mouseenter', boundMouseEnter);
    bottomButton.removeEventListener('mouseleave', boundMouseLeave);
    
    document.removeEventListener('keydown', boundKeyDown, true);
    document.removeEventListener('keyup', boundKeyUp, true);
    
    // 移除存储监听器
    if (state.storageHandler) {
      chrome.storage.onChanged.removeListener(state.storageHandler);
    }
    
    // 清除定时器
    if (state.hideTimeout) {
      cancelAnimationFrame(state.hideTimeout);
    }
    
    // 重置状态
    state.isHovering = false;
    state.isKeyPressed = false;
    state.isHidden = false;
    state.initialized = false;
    
    // 显示按钮
    showButtons();
  };
  
  // 页面卸载时清理
  window.addEventListener('beforeunload', cleanup);
  state.cleanup = cleanup;
  
  // 页面隐藏时重置状态
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      state.isKeyPressed = false;
      state.isHovering = false;
      state.isHidden = false;
      showButtons();
    }
  });
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
  const progressHeight = hasVerticalProgress
    ? clampNumber(advancedSettings.progressBar.verticalHeight, 40, MAX_PROGRESS_VERTICAL_HEIGHT, DEFAULT_PROGRESS_VERTICAL_HEIGHT)
    : 0;
  return hasVerticalProgress
    ? (buttonSize * 2) + progressHeight + (spacing * 2)
    : (buttonSize * 2) + spacing;
}

function updateReadingToolPosition() {
  const root = getScrollRoot();
  const standalone = root ? root.getElementById(READING_TOOL_CONTAINER_ID) : null;
  if (!standalone) return;

  const edgeDistance = buttonSettings.edgeDistance !== undefined ? buttonSettings.edgeDistance : 8;
  const spacing = Math.max(0, Number(buttonSettings.buttonSpacing) || 0);
  const buttonSize = clampNumber(buttonSettings.buttonSize, 10, 120, 40);
  const position = advancedSettings.readingTools.buttonPosition;

  standalone.style.left = buttonSettings.horizontalPosition === 'left' ? edgeDistance + 'px' : 'auto';
  standalone.style.right = buttonSettings.horizontalPosition === 'left' ? 'auto' : edgeDistance + 'px';
  standalone.style.transform = 'none';
  standalone.style.top = 'auto';
  standalone.style.bottom = 'auto';
  standalone.style.display = isReadingToolEnabled() && position !== 'betweenScrollButtons' ? 'flex' : 'none';

  if (position === 'pageTop') {
    const offset = buttonSettings.verticalAlignment === 'top'
      ? edgeDistance + getMainButtonGroupHeight() + spacing
      : edgeDistance;
    standalone.style.top = offset + 'px';
  } else {
    const offset = buttonSettings.verticalAlignment === 'bottom'
      ? edgeDistance + getMainButtonGroupHeight() + spacing
      : edgeDistance;
    standalone.style.bottom = offset + 'px';
  }

  const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0;
  const requestedOffset = parseFloat(position === 'pageTop' ? standalone.style.top : standalone.style.bottom) || 0;
  standalone.style.visibility = viewportHeight && requestedOffset + buttonSize > viewportHeight ? 'hidden' : 'visible';
}

// 更新按钮可见性
function updateButtonVisibility() {
  const buttonContainer = getButtonContainer();
  if (!buttonContainer) return;
  const root = getScrollRoot();
  const readingToolContainer = root ? root.getElementById(READING_TOOL_CONTAINER_ID) : null;
  
  if (buttonSettings.showButton) {
    buttonContainer.style.display = 'flex';
    if (readingToolContainer && advancedSettings.readingTools.buttonPosition !== 'betweenScrollButtons' && isReadingToolEnabled()) {
      readingToolContainer.style.display = 'flex';
    }
  } else {
    buttonContainer.style.display = 'none';
    if (readingToolContainer) {
      readingToolContainer.style.display = 'none';
    }
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
  const { root, topButton, progressButton, bottomButton, readingToolButton } = getButtonElements();
  if (!topButton || !bottomButton) return;
  
  // 更新按钮尺寸
  const size = buttonSettings.buttonSize + buttonSettings.buttonSizeUnit;
  topButton.style.width = size;
  topButton.style.height = size;
  bottomButton.style.width = size;
  bottomButton.style.height = size;
  if (progressButton) {
    progressButton.style.width = size;
    progressButton.style.height = clampNumber(advancedSettings.progressBar.verticalHeight, 40, MAX_PROGRESS_VERTICAL_HEIGHT, DEFAULT_PROGRESS_VERTICAL_HEIGHT) + 'px';
  }
  if (readingToolButton) {
    readingToolButton.style.width = size;
    readingToolButton.style.height = size;
  }
  
  // 更新按钮形状
  const shape = buttonSettings.buttonShape || 'round';
  const borderRadius = shape === 'square' ? '4px' : '50%';
  const progressBorderRadius = shape === 'square' ? '4px' : '999px';
  topButton.style.borderRadius = borderRadius;
  bottomButton.style.borderRadius = borderRadius;
  if (progressButton) {
    progressButton.style.borderRadius = progressBorderRadius;
  }
  if (readingToolButton) {
    readingToolButton.style.borderRadius = borderRadius;
  }
  
  // 更新SVG图标大小（根据按钮尺寸自动调整）
  const iconSize = Math.max(40, Math.min(70, parseInt(buttonSettings.buttonSize) * 0.6)) + '%';
  const topIcon = topButton.querySelector('.scroll-icon');
  const bottomIcon = bottomButton.querySelector('.scroll-icon');
  const readingToolIcon = readingToolButton ? readingToolButton.querySelector('.scroll-icon') : null;
  if (topIcon) {
    topIcon.style.width = iconSize;
    topIcon.style.height = iconSize;
  }
  if (bottomIcon) {
    bottomIcon.style.width = iconSize;
    bottomIcon.style.height = iconSize;
  }
  if (readingToolIcon) {
    readingToolIcon.style.width = iconSize;
    readingToolIcon.style.height = iconSize;
  }
  
  // 更新按钮颜色 - 使用用户设置的颜色（带验证）
  const topColor = validateColor(buttonSettings.topButtonColor);
  const bottomColor = validateColor(buttonSettings.bottomButtonColor);
  topButton.style.backgroundColor = topColor;
  bottomButton.style.backgroundColor = bottomColor;
  if (progressButton) {
    progressButton.style.backgroundColor = getProgressColor();
  }
  if (readingToolButton) {
    readingToolButton.style.backgroundColor = getReadingToolColor();
  }

  const iconColor = getActiveIconColor();
  topButton.style.color = iconColor;
  bottomButton.style.color = iconColor;
  if (progressButton) {
    progressButton.style.color = iconColor;
  }
  if (readingToolButton) {
    readingToolButton.style.color = iconColor;
  }
  
  // 动态应用间距到容器
  const buttonContainer = getButtonContainer();
  if (buttonContainer) {
    buttonContainer.style.gap = buttonSettings.buttonSpacing + 'px';
  }
  
  // 更新透明度
  const opacity = buttonSettings.opacity / 100;
  topButton.style.opacity = opacity;
  bottomButton.style.opacity = opacity;
  if (progressButton) {
    progressButton.style.opacity = opacity;
  }
  if (readingToolButton) {
    readingToolButton.style.opacity = opacity;
  }
  
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
    .psm-progress-button:hover {
      background-color: ${adjustColorBrightness(getProgressColor(), -25)};
    }
    .psm-reading-tool-button:hover {
      background-color: ${adjustColorBrightness(getReadingToolColor(), -10)};
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
    setTimeout(() => {
      if (isExtensionEnabled && !document.getElementById(HOST_ID)) {
        initializeButton();
      }
    }, 200);
  }
}

// SPA 页面动态加载检测 - 解决首次加载时滚动容器未就绪的问题
function setupSpaDetection() {
  // 延迟检测，给 SPA 应用足够的渲染时间
  setTimeout(() => {
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
      
      // 防抖处理，避免频繁检测
      if (spaDetectionState.debounceTimer) {
        clearTimeout(spaDetectionState.debounceTimer);
      }
      
      spaDetectionState.debounceTimer = setTimeout(() => {
        detectAndUpdateScrollContainer();
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
      document.addEventListener('DOMContentLoaded', () => {
        if (spaDetectionState.observer && document.body) {
          spaDetectionState.observer.observe(document.body, {
            childList: true,
            subtree: true
          });
        }
      });
    }
  }
}

// 检测并更新滚动容器
function detectAndUpdateScrollContainer() {
  const newContainer = findScrollContainer();
  const oldContainer = currentScrollContainer;

  // 新算法已排除嵌套子滚动组件，只要容器不同就需要更新
  if (newContainer !== oldContainer) {
    currentScrollContainer = newContainer;

    // 如果按钮已存在，更新滚动事件绑定
    const { root, topButton, bottomButton } = getButtonElements();
    if (topButton && bottomButton && root) {
      // 移除旧的事件监听器（通过克隆节点实现）
      const newTopButton = topButton.cloneNode(true);
      const newBottomButton = bottomButton.cloneNode(true);

      topButton.parentNode.replaceChild(newTopButton, topButton);
      bottomButton.parentNode.replaceChild(newBottomButton, bottomButton);

      // 重新绑定点击事件
      newTopButton.addEventListener('click', scrollToTop);
      newBottomButton.addEventListener('click', scrollToBottom);
      applyButtonIcons();

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
    advancedSettings = mergeAdvancedSettings(message.settings);
    applyAdvancedSettings();
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
    advancedSettings = mergeAdvancedSettings(changes.advancedSettings.newValue);
    applyAdvancedSettings();
  }
  if (namespace === 'local' && changes.enableStates) {
    var newStates = normalizeEnableStates(changes.enableStates.newValue);
    var newEnabled = newStates[currentHostname] !== false;

    if (newEnabled !== isExtensionEnabled) {
      isExtensionEnabled = newEnabled;
      if (isExtensionEnabled) {
        if (!document.getElementById(HOST_ID)) {
          initializeButton();
        }
      } else {
        removeButton();
      }
    } else if (!newEnabled) {
      removeButton();
    }
  }
});

// 全屏模式检测和管理
const fullscreenManager = {
  isFullscreen: false,
  buttonContainer: null,
  
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
    const readingToolContainer = root ? root.getElementById(READING_TOOL_CONTAINER_ID) : null;
    const readingToolMenu = root ? root.getElementById(READING_TOOL_MENU_ID) : null;
    const readingToast = root ? root.getElementById(READING_TOOL_TOAST_ID) : null;
    if (horizontalProgress) {
      if (this.isFullscreen) {
        horizontalProgress.classList.add('psm-fullscreen-hidden');
      } else {
        horizontalProgress.classList.remove('psm-fullscreen-hidden');
      }
    }
    [readingToolContainer, readingToolMenu, readingToast].forEach((element) => {
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
    // 监听各种浏览器的全屏变化事件
    const fullscreenEvents = [
      'fullscreenchange',
      'webkitfullscreenchange',
      'mozfullscreenchange',
      'MSFullscreenChange'
    ];
    
    fullscreenEvents.forEach(event => {
      document.addEventListener(event, () => this.handleFullscreenChange(), false);
    });
    
    // 初始检查
    this.handleFullscreenChange();
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
  fullscreenManager.init();
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
