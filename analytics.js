(function (global) {
  'use strict';

  var POLICY_VERSION = 2;
  var RETENTION_DAYS = 7;
  var MAX_COUNTER_VALUE = 1000000;
  var MAX_REQUEST_BYTES = 16384;
  var STORAGE_KEYS = {
    consent: 'analyticsConsent',
    aggregates: 'analyticsDailyAggregates',
    pendingBatch: 'analyticsPendingBatch'
  };
  var MESSAGE_ACTIONS = {
    getState: 'analytics:getState',
    setConsent: 'analytics:setConsent',
    recordAction: 'analytics:recordAction',
    recordToggle: 'analytics:recordToggle',
    recordSettingsSnapshot: 'analytics:recordSettingsSnapshot'
  };
  var EVENT_NAMES = {
    settingsSnapshot: 'settings_snapshot',
    dailyActionCounts: 'daily_action_counts',
    dailyToggleCounts: 'daily_toggle_counts'
  };
  var ACTION_KEYS = [
    'floatingTopClicks',
    'floatingBottomClicks',
    'keyboardTopCommands',
    'keyboardBottomCommands',
    'progressJumpClicks',
    'bookmarkSaveClicks',
    'bookmarkRestoreClicks',
    'outlineOpenClicks',
    'outlineJumpClicks'
  ];
  var TOGGLE_FEATURES = [
    'extension',
    'progressBar',
    'scrollBookmarks',
    'outlineNavigation'
  ];
  var TOGGLE_SOURCES = ['popup', 'domainManager'];
  var SUPPORTED_LOCALES = [
    'zh-CN',
    'zh-TW',
    'en-US',
    'es-ES',
    'ja-JP',
    'de-DE',
    'fr-FR',
    'pt-BR',
    'ko-KR',
    'it-IT'
  ];
  var CONFIG = {
    endpoint: 'https://page-scroll-master-analytics.kscje-apps.workers.dev/v1/events',
    permissionOrigin: 'https://page-scroll-master-analytics.kscje-apps.workers.dev/*'
  };

  function isPlainObject(value) {
    return value && typeof value === 'object' && !Array.isArray(value);
  }

  function pickEnum(value, allowed, fallback) {
    return allowed.indexOf(value) >= 0 ? value : fallback;
  }

  function clampCount(value) {
    var count = Number(value);
    if (!Number.isFinite(count) || count <= 0) return 0;
    return Math.min(Math.floor(count), MAX_COUNTER_VALUE);
  }

  function getUtcDate(timestamp) {
    var date = timestamp instanceof Date ? timestamp : new Date(timestamp === undefined ? Date.now() : timestamp);
    return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10);
  }

  function normalizeEventDate(value) {
    if (value === undefined) return getUtcDate();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value))) return '';
    return getUtcDate(String(value) + 'T00:00:00.000Z') === value ? value : '';
  }

  function normalizeConsent(value) {
    var source = isPlainObject(value) ? value : {};
    return {
      enabled: source.enabled === true && source.policyVersion === POLICY_VERSION,
      policyVersion: POLICY_VERSION
    };
  }

  function isUploadConfigured() {
    return /^https:\/\/[^/]+\/.+/.test(CONFIG.endpoint) &&
      /^https:\/\/[^/]+\/\*$/.test(CONFIG.permissionOrigin);
  }

  function bucketButtonSize(value) {
    var number = Number(value);
    if (!Number.isFinite(number)) return 'medium';
    if (number <= 32) return 'small';
    if (number <= 48) return 'medium';
    if (number <= 72) return 'large';
    return 'extraLarge';
  }

  function bucketSpacing(value) {
    var number = Number(value);
    if (!Number.isFinite(number)) return 'normal';
    if (number <= 4) return 'compact';
    if (number <= 12) return 'normal';
    return 'loose';
  }

  function bucketEdgeDistance(value) {
    var number = Number(value);
    if (!Number.isFinite(number)) return 'standard';
    if (number <= 4) return 'near';
    if (number <= 16) return 'standard';
    return 'far';
  }

  function bucketOpacity(value) {
    var number = Number(value);
    if (!Number.isFinite(number)) return 'solid';
    if (number <= 40) return 'low';
    if (number <= 75) return 'medium';
    if (number < 100) return 'high';
    return 'solid';
  }

  function bucketOutlineItems(value) {
    var number = Number(value);
    if (!Number.isFinite(number)) return 'medium';
    if (number <= 20) return 'small';
    if (number <= 35) return 'medium';
    return 'large';
  }

  function getButtonColorMode(topColor, bottomColor) {
    var defaultColor = '#4A9EDD';
    var topIsDefault = String(topColor || '').toUpperCase() === defaultColor.toUpperCase();
    var bottomIsDefault = String(bottomColor || '').toUpperCase() === defaultColor.toUpperCase();
    if (topIsDefault && bottomIsDefault) return 'default';
    if (!topIsDefault && !bottomIsDefault) return 'custom';
    return 'mixed';
  }

  function getOutlineSources(value) {
    var sources = isPlainObject(value) ? value : {};
    var enabled = [];
    ['h1', 'h2', 'h3', 'idBlocks'].forEach(function (key) {
      if (sources[key] === true) enabled.push(key);
    });
    return enabled.length ? enabled.join('+') : 'none';
  }

  function buildSettingsSnapshotPayload(input) {
    var source = isPlainObject(input) ? input : {};
    var buttons = isPlainObject(source.buttonSettings) ? source.buttonSettings : {};
    var advanced = isPlainObject(source.advancedSettings) ? source.advancedSettings : {};
    var progress = isPlainObject(advanced.progressBar) ? advanced.progressBar : {};
    var icons = isPlainObject(advanced.iconCustomization) ? advanced.iconCustomization : {};
    var bookmarks = isPlainObject(advanced.scrollBookmarks) ? advanced.scrollBookmarks : {};
    var outline = isPlainObject(advanced.outlineNavigation) ? advanced.outlineNavigation : {};

    return {
      locale: pickEnum(source.locale, SUPPORTED_LOCALES, 'en-US'),
      extensionVersion: /^\d{1,6}\.\d{1,6}\.\d{1,6}$/.test(source.extensionVersion || '')
        ? source.extensionVersion
        : 'unknown',
      buttonHorizontalPosition: pickEnum(buttons.horizontalPosition, ['left', 'right'], 'right'),
      buttonVerticalAlignment: pickEnum(buttons.verticalAlignment, ['top', 'center', 'bottom'], 'center'),
      buttonShape: pickEnum(buttons.buttonShape, ['round', 'square'], 'round'),
      buttonSizeBucket: bucketButtonSize(buttons.buttonSize),
      buttonSpacingBucket: bucketSpacing(buttons.buttonSpacing),
      edgeDistanceBucket: bucketEdgeDistance(buttons.edgeDistance),
      opacityBucket: bucketOpacity(buttons.opacity),
      buttonColorMode: getButtonColorMode(buttons.topButtonColor, buttons.bottomButtonColor),
      hoverHideEnabled: buttons.enableHoverHide !== false,
      iconSet: pickEnum(icons.iconSet, ['defaultArrow', 'triangle', 'chevron', 'doubleArrow'], 'defaultArrow'),
      iconColorCustomized: String(icons.iconColor || '').toUpperCase() !== '#FFFFFF',
      progressBarMode: pickEnum(progress.mode, ['verticalButton', 'horizontalBar'], 'verticalButton'),
      progressBarHorizontalPosition: pickEnum(progress.horizontalPosition, ['top', 'bottom'], 'top'),
      progressBarColorMode: pickEnum(
        progress.colorMode,
        ['followTopButton', 'followBottomButton', 'custom'],
        'followTopButton'
      ),
      progressBarClickToJump: progress.clickToJump !== false,
      progressBarShowPercentage: progress.showPercentage === true,
      progressBarShowRemainingTime: progress.showRemainingTime === true,
      bookmarkButtonPosition: pickEnum(
        bookmarks.buttonPosition,
        ['pageTop', 'pageBottom', 'betweenScrollButtons'],
        'pageBottom'
      ),
      bookmarkButtonColorMode: pickEnum(
        bookmarks.buttonColorMode,
        ['followTopButton', 'followBottomButton', 'custom'],
        'followTopButton'
      ),
      bookmarkRestoreMode: pickEnum(bookmarks.restoreMode, ['auto', 'prompt', 'manual'], 'prompt'),
      bookmarkRetentionLimit: pickEnum(Number(bookmarks.perDomainLimit), [1, 2, 3], 1),
      outlineButtonPosition: pickEnum(
        outline.buttonPosition,
        ['pageTop', 'pageBottom', 'betweenScrollButtons'],
        'pageBottom'
      ),
      outlineButtonColorMode: pickEnum(
        outline.buttonColorMode,
        ['followTopButton', 'followBottomButton', 'custom'],
        'followTopButton'
      ),
      outlineSources: getOutlineSources(outline.sources),
      outlineItemsBucket: bucketOutlineItems(outline.maxItems),
      outlineFilterShortHeadings: outline.filterShortHeadings !== false,
      outlineHighlightCurrentSection: outline.highlightCurrentSection !== false
    };
  }

  function sanitizeSettingsSnapshotPayload(payload) {
    return buildSettingsSnapshotPayload({
      locale: payload && payload.locale,
      extensionVersion: payload && payload.extensionVersion,
      buttonSettings: {
        horizontalPosition: payload && payload.buttonHorizontalPosition,
        verticalAlignment: payload && payload.buttonVerticalAlignment,
        buttonShape: payload && payload.buttonShape,
        buttonSize: {
          small: 24,
          medium: 40,
          large: 64,
          extraLarge: 96
        }[payload && payload.buttonSizeBucket],
        buttonSpacing: {
          compact: 4,
          normal: 8,
          loose: 24
        }[payload && payload.buttonSpacingBucket],
        edgeDistance: {
          near: 4,
          standard: 8,
          far: 24
        }[payload && payload.edgeDistanceBucket],
        opacity: {
          low: 40,
          medium: 70,
          high: 90,
          solid: 100
        }[payload && payload.opacityBucket],
        topButtonColor: payload && payload.buttonColorMode === 'default' ? '#4A9EDD' : '#000000',
        bottomButtonColor: payload && payload.buttonColorMode === 'mixed'
          ? '#4A9EDD'
          : (payload && payload.buttonColorMode === 'default' ? '#4A9EDD' : '#000000'),
        enableHoverHide: payload && payload.hoverHideEnabled
      },
      advancedSettings: {
        iconCustomization: {
          iconSet: payload && payload.iconSet,
          iconColor: payload && payload.iconColorCustomized ? '#000000' : '#FFFFFF'
        },
        progressBar: {
          mode: payload && payload.progressBarMode,
          horizontalPosition: payload && payload.progressBarHorizontalPosition,
          colorMode: payload && payload.progressBarColorMode,
          clickToJump: payload && payload.progressBarClickToJump,
          showPercentage: payload && payload.progressBarShowPercentage,
          showRemainingTime: payload && payload.progressBarShowRemainingTime
        },
        scrollBookmarks: {
          buttonPosition: payload && payload.bookmarkButtonPosition,
          buttonColorMode: payload && payload.bookmarkButtonColorMode,
          restoreMode: payload && payload.bookmarkRestoreMode,
          perDomainLimit: payload && payload.bookmarkRetentionLimit
        },
        outlineNavigation: {
          buttonPosition: payload && payload.outlineButtonPosition,
          buttonColorMode: payload && payload.outlineButtonColorMode,
          sources: String(payload && payload.outlineSources || '').split('+').reduce(function (result, key) {
            if (['h1', 'h2', 'h3', 'idBlocks'].indexOf(key) >= 0) result[key] = true;
            return result;
          }, {}),
          maxItems: {
            small: 20,
            medium: 30,
            large: 50
          }[payload && payload.outlineItemsBucket],
          filterShortHeadings: payload && payload.outlineFilterShortHeadings,
          highlightCurrentSection: payload && payload.outlineHighlightCurrentSection
        }
      }
    });
  }

  function createEmptyDay() {
    var actions = {};
    ACTION_KEYS.forEach(function (key) {
      actions[key] = 0;
    });
    return {
      actions: actions,
      toggles: {},
      settingsSnapshot: null
    };
  }

  function normalizeDay(value) {
    var source = isPlainObject(value) ? value : {};
    var day = createEmptyDay();
    ACTION_KEYS.forEach(function (key) {
      day.actions[key] = clampCount(source.actions && source.actions[key]);
    });
    TOGGLE_FEATURES.forEach(function (feature) {
      var sourceFeature = source.toggles && source.toggles[feature];
      if (!isPlainObject(sourceFeature)) return;
      TOGGLE_SOURCES.forEach(function (toggleSource) {
        var sourceCounts = sourceFeature[toggleSource];
        if (!isPlainObject(sourceCounts)) return;
        var enabled = clampCount(sourceCounts.enabled);
        var disabled = clampCount(sourceCounts.disabled);
        if (!enabled && !disabled) return;
        day.toggles[feature] = day.toggles[feature] || {};
        day.toggles[feature][toggleSource] = { enabled: enabled, disabled: disabled };
      });
    });
    if (isPlainObject(source.settingsSnapshot)) {
      day.settingsSnapshot = sanitizeSettingsSnapshotPayload(source.settingsSnapshot);
    }
    return day;
  }

  function pruneAggregates(aggregates, today) {
    var source = isPlainObject(aggregates) ? aggregates : {};
    var normalizedToday = normalizeEventDate(today);
    if (!normalizedToday) return {};
    var todayDate = new Date(normalizedToday + 'T00:00:00.000Z');
    var minimum = new Date(todayDate.getTime() - ((RETENTION_DAYS - 1) * 86400000));
    var minimumDate = getUtcDate(minimum);
    var result = {};
    Object.keys(source).sort().forEach(function (date) {
      if (normalizeEventDate(date) && date >= minimumDate && date <= normalizedToday) {
        result[date] = normalizeDay(source[date]);
      }
    });
    return result;
  }

  function incrementAction(aggregates, actionKey, date) {
    var eventDate = normalizeEventDate(date);
    if (!eventDate) return pruneAggregates(aggregates);
    var result = pruneAggregates(aggregates, eventDate);
    if (ACTION_KEYS.indexOf(actionKey) < 0) return result;
    var day = result[eventDate] || createEmptyDay();
    day.actions[actionKey] = clampCount(clampCount(day.actions[actionKey]) + 1);
    result[eventDate] = day;
    return result;
  }

  function incrementToggle(aggregates, feature, enabled, source, date) {
    var eventDate = normalizeEventDate(date);
    if (!eventDate) return pruneAggregates(aggregates);
    var result = pruneAggregates(aggregates, eventDate);
    if (TOGGLE_FEATURES.indexOf(feature) < 0 || TOGGLE_SOURCES.indexOf(source) < 0) return result;
    var day = result[eventDate] || createEmptyDay();
    day.toggles[feature] = day.toggles[feature] || {};
    day.toggles[feature][source] = day.toggles[feature][source] || { enabled: 0, disabled: 0 };
    var key = enabled === true ? 'enabled' : 'disabled';
    day.toggles[feature][source][key] = clampCount(
      clampCount(day.toggles[feature][source][key]) + 1
    );
    result[eventDate] = day;
    return result;
  }

  function setSettingsSnapshot(aggregates, payload, date) {
    var eventDate = normalizeEventDate(date);
    if (!eventDate) return pruneAggregates(aggregates);
    var result = pruneAggregates(aggregates, eventDate);
    var day = result[eventDate] || createEmptyDay();
    day.settingsSnapshot = sanitizeSettingsSnapshotPayload(payload);
    result[eventDate] = day;
    return result;
  }

  function isPayloadSafe(value) {
    var forbiddenKeyPart = /(?:url|uri|origin|host|domain|title|referrer|text|html|selector|query|hash|pathname|pagecontent|body|bookmarkcontent|selectedtext|searchterm|formvalue|inputvalue)/i;
    var unsafeValue = /(?:https?:\/\/|www\.|(?:^|[\s@])(?:[a-z0-9-]+\.)+[a-z]{2,}(?:$|[\s/:]))/i;

    function inspect(current) {
      if (typeof current === 'string') return !unsafeValue.test(current);
      if (Array.isArray(current)) return current.every(inspect);
      if (!isPlainObject(current)) return true;
      return Object.keys(current).every(function (key) {
        return !forbiddenKeyPart.test(key) && inspect(current[key]);
      });
    }

    return inspect(value);
  }

  function buildEvents(aggregates, today) {
    var events = [];
    var source = pruneAggregates(aggregates, today);
    Object.keys(source).sort().forEach(function (eventDate) {
      var day = source[eventDate];
      var actionPayload = {};
      ACTION_KEYS.forEach(function (key) {
        if (day.actions[key] > 0) actionPayload[key] = day.actions[key];
      });
      if (Object.keys(actionPayload).length) {
        events.push({
          eventName: EVENT_NAMES.dailyActionCounts,
          eventDate: eventDate,
          payload: actionPayload
        });
      }
      if (Object.keys(day.toggles).length) {
        var toggleChanges = [];
        TOGGLE_FEATURES.forEach(function (feature) {
          TOGGLE_SOURCES.forEach(function (toggleSource) {
            var counts = day.toggles[feature] && day.toggles[feature][toggleSource];
            if (!counts || (!counts.enabled && !counts.disabled)) return;
            toggleChanges.push({
              feature: feature,
              source: toggleSource,
              enabledCount: counts.enabled,
              disabledCount: counts.disabled
            });
          });
        });
        if (toggleChanges.length) {
          events.push({
            eventName: EVENT_NAMES.dailyToggleCounts,
            eventDate: eventDate,
            payload: {
              changes: toggleChanges
            }
          });
        }
      }
      if (day.settingsSnapshot) {
        events.push({
          eventName: EVENT_NAMES.settingsSnapshot,
          eventDate: eventDate,
          payload: day.settingsSnapshot
        });
      }
    });
    return events;
  }

  function getUtf8Size(value) {
    var serialized = typeof value === 'string' ? value : JSON.stringify(value);
    if (typeof TextEncoder !== 'undefined') {
      return new TextEncoder().encode(serialized).byteLength;
    }
    return unescape(encodeURIComponent(serialized)).length;
  }

  function createUploadBatch(events, batchId) {
    var source = Array.isArray(events) ? events : [];
    var accepted = [];
    var normalizedBatchId = /^[0-9a-f-]{36}$/i.test(batchId || '') ? batchId : '';
    for (var index = 0; index < source.length; index += 1) {
      var candidate = {
        schemaVersion: 1,
        batchId: normalizedBatchId,
        events: accepted.concat([source[index]])
      };
      if (getUtf8Size(candidate) > MAX_REQUEST_BYTES) break;
      accepted.push(source[index]);
    }
    return accepted.length ? {
      schemaVersion: 1,
      batchId: normalizedBatchId,
      events: accepted
    } : null;
  }

  function subtractEvents(aggregates, events, today) {
    var result = pruneAggregates(aggregates, today);
    (Array.isArray(events) ? events : []).forEach(function (event) {
      var day = result[event.eventDate];
      if (!day) return;
      if (event.eventName === EVENT_NAMES.dailyActionCounts) {
        Object.keys(event.payload || {}).forEach(function (key) {
          if (ACTION_KEYS.indexOf(key) < 0) return;
          day.actions[key] = Math.max(0, clampCount(day.actions[key]) - clampCount(event.payload[key]));
        });
      } else if (event.eventName === EVENT_NAMES.dailyToggleCounts) {
        (event.payload && event.payload.changes || []).forEach(function (change) {
          var counts = day.toggles[change.feature] && day.toggles[change.feature][change.source];
          if (!counts) return;
          counts.enabled = Math.max(0, clampCount(counts.enabled) - clampCount(change.enabledCount));
          counts.disabled = Math.max(0, clampCount(counts.disabled) - clampCount(change.disabledCount));
          if (!counts.enabled && !counts.disabled) {
            delete day.toggles[change.feature][change.source];
            if (!Object.keys(day.toggles[change.feature]).length) delete day.toggles[change.feature];
          }
        });
      } else if (event.eventName === EVENT_NAMES.settingsSnapshot &&
                 JSON.stringify(day.settingsSnapshot) === JSON.stringify(event.payload)) {
        day.settingsSnapshot = null;
      }
    });

    Object.keys(result).forEach(function (date) {
      var day = result[date];
      var hasActions = ACTION_KEYS.some(function (key) {
        return day.actions[key] > 0;
      });
      if (!hasActions && !Object.keys(day.toggles).length && !day.settingsSnapshot) {
        delete result[date];
      }
    });
    return result;
  }

  global.PageScrollMasterAnalytics = {
    POLICY_VERSION: POLICY_VERSION,
    RETENTION_DAYS: RETENTION_DAYS,
    MAX_COUNTER_VALUE: MAX_COUNTER_VALUE,
    MAX_REQUEST_BYTES: MAX_REQUEST_BYTES,
    STORAGE_KEYS: STORAGE_KEYS,
    MESSAGE_ACTIONS: MESSAGE_ACTIONS,
    EVENT_NAMES: EVENT_NAMES,
    ACTION_KEYS: ACTION_KEYS.slice(),
    TOGGLE_FEATURES: TOGGLE_FEATURES.slice(),
    TOGGLE_SOURCES: TOGGLE_SOURCES.slice(),
    CONFIG: CONFIG,
    getUtcDate: getUtcDate,
    normalizeConsent: normalizeConsent,
    isUploadConfigured: isUploadConfigured,
    buildSettingsSnapshotPayload: buildSettingsSnapshotPayload,
    sanitizeSettingsSnapshotPayload: sanitizeSettingsSnapshotPayload,
    pruneAggregates: pruneAggregates,
    incrementAction: incrementAction,
    incrementToggle: incrementToggle,
    setSettingsSnapshot: setSettingsSnapshot,
    isPayloadSafe: isPayloadSafe,
    buildEvents: buildEvents,
    getUtf8Size: getUtf8Size,
    createUploadBatch: createUploadBatch,
    subtractEvents: subtractEvents
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
