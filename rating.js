var PageScrollMasterRating = (function () {
  'use strict';

  var STORAGE_KEY = 'ratingPromptState';
  var STORE_REVIEW_URL = 'https://chromewebstore.google.com/detail/smart-scroll-navigator-%E2%80%93/ikdlbildhneobjlinadkkhnbeonkjbfm/reviews';
  var MIN_VERSION = '2.4.0';
  var MIN_INSTALL_AGE_MS = 7 * 24 * 60 * 60 * 1000;
  var REMIND_LATER_MS = 30 * 24 * 60 * 60 * 1000;
  var MIN_POPUP_OPEN_COUNT = 10;
  var MAX_TOTAL_SHOWN_COUNT = 2;

  function isPlainObject(value) {
    return value && typeof value === 'object' && !Array.isArray(value);
  }

  function compareVersions(left, right) {
    var leftParts = String(left || '').split('.').map(function (part) {
      return Number(part) || 0;
    });
    var rightParts = String(right || '').split('.').map(function (part) {
      return Number(part) || 0;
    });
    var length = Math.max(leftParts.length, rightParts.length);
    for (var index = 0; index < length; index++) {
      var difference = (leftParts[index] || 0) - (rightParts[index] || 0);
      if (difference !== 0) return difference;
    }
    return 0;
  }

  function getManifestVersion() {
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getManifest) {
      return chrome.runtime.getManifest().version || '0.0.0';
    }
    return '0.0.0';
  }

  function createDefaultState(now) {
    return {
      installedAt: now,
      popupOpenCount: 0,
      totalShownCount: 0,
      shownVersions: {},
      dismissedUntil: 0,
      neverAsk: false,
      ratedClicked: false
    };
  }

  function normalizeState(savedState, now) {
    var state = createDefaultState(now);
    if (savedState === undefined || savedState === null) {
      return { state: state, valid: true };
    }
    if (!isPlainObject(savedState)) {
      return { state: state, valid: false };
    }

    var shownVersions = isPlainObject(savedState.shownVersions)
      ? savedState.shownVersions
      : {};
    state.installedAt = Number.isFinite(savedState.installedAt) && savedState.installedAt > 0
      ? savedState.installedAt
      : now;
    state.popupOpenCount = Number.isFinite(savedState.popupOpenCount) && savedState.popupOpenCount >= 0
      ? Math.floor(savedState.popupOpenCount)
      : 0;
    state.totalShownCount = Number.isFinite(savedState.totalShownCount) && savedState.totalShownCount >= 0
      ? Math.floor(savedState.totalShownCount)
      : 0;
    state.shownVersions = Object.keys(shownVersions).reduce(function (result, version) {
      if (shownVersions[version] === true) result[version] = true;
      return result;
    }, {});
    state.dismissedUntil = Number.isFinite(savedState.dismissedUntil) && savedState.dismissedUntil > 0
      ? savedState.dismissedUntil
      : 0;
    state.neverAsk = savedState.neverAsk === true;
    state.ratedClicked = savedState.ratedClicked === true;

    return { state: state, valid: true };
  }

  function getState(callback) {
    var now = Date.now();
    chrome.storage.local.get([STORAGE_KEY], function (result) {
      callback(normalizeState(result[STORAGE_KEY], now), now);
    });
  }

  function setState(state, callback) {
    var data = {};
    data[STORAGE_KEY] = state;
    chrome.storage.local.set(data, function () {
      if (callback) callback();
    });
  }

  function shouldShowPrompt(state, options) {
    var now = options.now;
    var version = options.version || getManifestVersion();
    if (compareVersions(version, MIN_VERSION) < 0) return false;
    if (!options.domainEnabled) return false;
    if (state.neverAsk || state.ratedClicked) return false;
    if (state.dismissedUntil && state.dismissedUntil > now) return false;
    if (now - state.installedAt < MIN_INSTALL_AGE_MS) return false;
    if (state.popupOpenCount <= MIN_POPUP_OPEN_COUNT) return false;
    if (state.totalShownCount >= MAX_TOTAL_SHOWN_COUNT) return false;
    if (state.shownVersions[version] === true) return false;
    return true;
  }

  function recordPopupOpen(domainEnabled, callback) {
    getState(function (normalized, now) {
      var state = normalized.state;
      state.popupOpenCount += 1;
      var shouldShow = normalized.valid && shouldShowPrompt(state, {
        now: now,
        version: getManifestVersion(),
        domainEnabled: domainEnabled === true
      });
      setState(state, function () {
        callback({
          state: state,
          shouldShow: shouldShow,
          now: now,
          version: getManifestVersion()
        });
      });
    });
  }

  function recordShown(state, version, callback) {
    var nextState = normalizeState(state, Date.now()).state;
    nextState.totalShownCount += 1;
    nextState.shownVersions[version || getManifestVersion()] = true;
    setState(nextState, callback);
  }

  function remindLater(callback) {
    getState(function (normalized, now) {
      var state = normalized.state;
      state.dismissedUntil = now + REMIND_LATER_MS;
      setState(state, callback);
    });
  }

  function neverAsk(callback) {
    getState(function (normalized) {
      var state = normalized.state;
      state.neverAsk = true;
      setState(state, callback);
    });
  }

  function recordRatedClicked(callback) {
    getState(function (normalized) {
      var state = normalized.state;
      state.ratedClicked = true;
      setState(state, callback);
    });
  }

  return {
    STORAGE_KEY: STORAGE_KEY,
    STORE_REVIEW_URL: STORE_REVIEW_URL,
    MIN_INSTALL_AGE_MS: MIN_INSTALL_AGE_MS,
    REMIND_LATER_MS: REMIND_LATER_MS,
    normalizeState: normalizeState,
    shouldShowPrompt: shouldShowPrompt,
    recordPopupOpen: recordPopupOpen,
    recordShown: recordShown,
    remindLater: remindLater,
    neverAsk: neverAsk,
    recordRatedClicked: recordRatedClicked
  };
})();
