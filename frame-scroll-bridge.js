(() => {
  'use strict';

  const MESSAGE_ACTION = 'embeddedFrameScroll';
  const ACTIONS = new Set(['scrollToTop', 'scrollToBottom']);
  const SCROLLABLE_OVERFLOW_VALUES = new Set(['auto', 'scroll', 'overlay']);
  let activeAnimationFrame = null;

  // This script is injected into all frames, but only child frames need to respond.
  if (window.top === window) return;

  function getScrollRange(element) {
    if (!element) return 0;
    return Math.max(0, (element.scrollHeight || 0) - (element.clientHeight || 0));
  }

  function getViewportMetrics(element) {
    if (!element || typeof element.getBoundingClientRect !== 'function') {
      return { areaRatio: 0, widthRatio: 0, heightRatio: 0 };
    }
    const rect = element.getBoundingClientRect();
    const width = window.innerWidth || document.documentElement.clientWidth || 0;
    const height = window.innerHeight || document.documentElement.clientHeight || 0;
    if (!width || !height || rect.width <= 0 || rect.height <= 0) {
      return { areaRatio: 0, widthRatio: 0, heightRatio: 0 };
    }
    const visibleWidth = Math.max(0, Math.min(rect.right, width) - Math.max(rect.left, 0));
    const visibleHeight = Math.max(0, Math.min(rect.bottom, height) - Math.max(rect.top, 0));
    return {
      areaRatio: (visibleWidth * visibleHeight) / (width * height),
      widthRatio: visibleWidth / width,
      heightRatio: visibleHeight / height
    };
  }

  function isScrollableCandidate(element) {
    const range = getScrollRange(element);
    if (range <= 1) return false;
    if (element === document.scrollingElement || element === document.documentElement || element === document.body) {
      return true;
    }
    const style = window.getComputedStyle(element);
    return style.display !== 'none' &&
      style.visibility !== 'hidden' &&
      SCROLLABLE_OVERFLOW_VALUES.has(style.overflowY);
  }

  function scoreScrollContainer(element) {
    const metrics = getViewportMetrics(element);
    const tagName = element.tagName ? element.tagName.toLowerCase() : '';
    const role = element.getAttribute ? (element.getAttribute('role') || '').toLowerCase() : '';
    const className = typeof element.className === 'string' ? element.className : '';
    const id = element.id || '';
    const signature = `${tagName} ${role} ${id} ${className}`;
    let score = Math.min(getScrollRange(element), 3000) + (metrics.areaRatio * 2200);

    if (['main', 'article'].includes(tagName)) score += 700;
    if (['main', 'document'].includes(role)) score += 600;
    if (/content|document|doc|article|editor|reader|view|viewport|scroll|container/i.test(signature)) score += 350;
    if (metrics.widthRatio >= 0.6) score += 600;
    if (metrics.heightRatio >= 0.55) score += 500;
    if (metrics.widthRatio < 0.36 && metrics.heightRatio > 0.45) score -= 2200;
    if (['nav', 'aside', 'header', 'footer'].includes(tagName)) score -= 1800;
    if (['navigation', 'complementary', 'banner', 'contentinfo', 'dialog'].includes(role)) score -= 1800;
    return score;
  }

  function findScrollContainer() {
    const pointTarget = document.elementFromPoint(
      Math.round((window.innerWidth || 0) * 0.5),
      Math.round((window.innerHeight || 0) * 0.55)
    );
    const candidates = [document.scrollingElement, document.documentElement, document.body];
    let current = pointTarget;
    while (current) {
      candidates.push(current);
      if (current === document.body || current === document.documentElement) break;
      current = current.parentElement;
    }
    candidates.push(...Array.from(document.querySelectorAll('div, main, article, section, [role="main"], [role="document"]')).slice(0, 160));

    const seen = new Set();
    let best = null;
    let bestScore = -Infinity;
    candidates.forEach((element) => {
      if (!element || seen.has(element) || !isScrollableCandidate(element)) return;
      seen.add(element);
      const metrics = getViewportMetrics(element);
      if (element !== document.scrollingElement && (metrics.widthRatio < 0.45 || metrics.heightRatio < 0.35)) return;
      const score = scoreScrollContainer(element);
      if (score > bestScore) {
        best = element;
        bestScore = score;
      }
    });
    return best;
  }

  function cancelActiveAnimation() {
    if (activeAnimationFrame !== null) {
      cancelAnimationFrame(activeAnimationFrame);
      activeAnimationFrame = null;
    }
  }

  function setScrollTop(element, top) {
    if (typeof element.scrollTo === 'function') {
      element.scrollTo({ top, left: element.scrollLeft || 0, behavior: 'auto' });
      return;
    }
    element.scrollTop = top;
  }

  function animateCustomScroll(element, targetTop, duration) {
    const startTop = element.scrollTop || 0;
    const startedAt = performance.now();
    const tick = (now) => {
      const progress = Math.min(1, Math.max(0, (now - startedAt) / duration));
      const eased = 1 - Math.pow(1 - progress, 3);
      setScrollTop(element, startTop + ((targetTop - startTop) * eased));
      if (progress < 1) {
        activeAnimationFrame = requestAnimationFrame(tick);
      } else {
        activeAnimationFrame = null;
      }
    };
    activeAnimationFrame = requestAnimationFrame(tick);
  }

  function scrollToPosition(element, targetTop, scrollMode, scrollSpeed) {
    cancelActiveAnimation();
    if (scrollMode === 'smooth' && typeof element.scrollTo === 'function') {
      element.scrollTo({ top: targetTop, left: element.scrollLeft || 0, behavior: 'smooth' });
      return;
    }
    if (scrollMode === 'custom') {
      const duration = Math.max(10, Math.min(2000, Number.parseInt(scrollSpeed, 10) || 100));
      animateCustomScroll(element, targetTop, duration);
      return;
    }
    setScrollTop(element, targetTop);
  }

  chrome.runtime.onMessage.addListener((message) => {
    if (!message || message.action !== MESSAGE_ACTION) return;
    if (!message.frameName || message.frameName !== window.name) return;
    if (!ACTIONS.has(message.scrollAction)) return;
    const container = findScrollContainer();
    if (!container) return;
    const targetTop = message.scrollAction === 'scrollToTop' ? 0 : getScrollRange(container);
    scrollToPosition(container, targetTop, message.scrollMode, message.scrollSpeed);
  });
})();
