(function (global) {
  'use strict';

  var STORAGE_KEYS = {
    states: 'domainFeatureStates',
    defaults: 'domainFeatureDefaults',
    migrationVersion: 'domainFeatureMigrationVersion',
    legacyStates: 'enableStates'
  };
  var MIGRATION_VERSION = 1;
  var FEATURE_KEYS = ['autoScroll', 'progressBar', 'screenNavigation', 'scrollBookmarks', 'outlineNavigation'];
  var CONTAINER_STRATEGIES = ['auto', 'page'];
  var DEFAULT_CONTAINER_STRATEGY = 'auto';
  var DEFAULT_FEATURES = {
    autoScroll: false,
    progressBar: false,
    screenNavigation: false,
    scrollBookmarks: false,
    outlineNavigation: false
  };

  function isPlainObject(value) {
    return value && typeof value === 'object' && !Array.isArray(value);
  }

  function normalizeBoolean(value, fallback) {
    return typeof value === 'boolean' ? value : fallback;
  }

  function normalizeContainerStrategy(value) {
    return CONTAINER_STRATEGIES.indexOf(value) !== -1 ? value : DEFAULT_CONTAINER_STRATEGY;
  }

  function normalizeHostname(value) {
    var trimmed = String(value || '').trim();
    if (!trimmed) return '';
    var URLConstructor = global.URL || (typeof URL !== 'undefined' ? URL : null);
    if (!URLConstructor && !trimmed.includes('://')) {
      return trimmed.toLowerCase().replace(/\.$/, '');
    }

    var candidates = [trimmed];
    if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed)) {
      candidates.push('https://' + trimmed);
    }

    for (var index = 0; index < candidates.length; index++) {
      try {
        var parsed = new URLConstructor(candidates[index]);
        if ((parsed.protocol === 'http:' || parsed.protocol === 'https:') && parsed.hostname) {
          return parsed.hostname.toLowerCase().replace(/\.$/, '');
        }
      } catch (error) {
        // Try the next candidate.
      }
    }
    return '';
  }

  function getDomainKey(value) {
    var hostname = normalizeHostname(value);
    if (!hostname) return '';
    if (global.tldts && typeof global.tldts.getDomain === 'function') {
      var registrableDomain = global.tldts.getDomain(hostname, { allowPrivateDomains: true });
      if (registrableDomain) {
        return registrableDomain.toLowerCase();
      }
    }
    return hostname;
  }

  function normalizeFeatures(features, fallbackFeatures) {
    var source = isPlainObject(features) ? features : {};
    var fallback = isPlainObject(fallbackFeatures) ? fallbackFeatures : DEFAULT_FEATURES;
    var normalized = {};
    FEATURE_KEYS.forEach(function (key) {
      normalized[key] = normalizeBoolean(source[key], normalizeBoolean(fallback[key], false));
    });
    return normalized;
  }

  function normalizeDefaults(defaults) {
    var source = isPlainObject(defaults) ? defaults : {};
    return {
      extensionEnabled: normalizeBoolean(source.extensionEnabled, true),
      containerStrategy: normalizeContainerStrategy(source.containerStrategy),
      features: normalizeFeatures(source.features, DEFAULT_FEATURES)
    };
  }

  function normalizeState(state, defaults) {
    var source = isPlainObject(state) ? state : {};
    var normalizedDefaults = normalizeDefaults(defaults);
    return {
      extensionEnabled: normalizeBoolean(source.extensionEnabled, normalizedDefaults.extensionEnabled),
      containerStrategy: normalizeContainerStrategy(source.containerStrategy || normalizedDefaults.containerStrategy),
      features: normalizeFeatures(source.features, normalizedDefaults.features)
    };
  }

  function normalizeStates(states, defaults) {
    var source = isPlainObject(states) ? states : {};
    var normalized = {};
    Object.keys(source).forEach(function (domainKey) {
      var normalizedKey = getDomainKey(domainKey);
      if (!normalizedKey) return;
      normalized[normalizedKey] = normalizeState(source[domainKey], defaults);
    });
    return normalized;
  }

  function getLegacyFeatureDefaults(advancedSettings) {
    var settings = isPlainObject(advancedSettings) ? advancedSettings : {};
    var readingTools = isPlainObject(settings.readingTools) ? settings.readingTools : {};
    var readingFeatures = isPlainObject(readingTools.features) ? readingTools.features : {};
    var scrollBookmarks = isPlainObject(settings.scrollBookmarks) ? settings.scrollBookmarks : {};
    var outlineNavigation = isPlainObject(settings.outlineNavigation) ? settings.outlineNavigation : {};
    var progressBar = isPlainObject(settings.progressBar) ? settings.progressBar : {};
    var screenNavigation = isPlainObject(settings.screenNavigation) ? settings.screenNavigation : {};
    var autoScroll = isPlainObject(settings.autoScroll) ? settings.autoScroll : {};
    var legacyBookmarkEnabled = readingTools.enabled === true && readingFeatures.scrollBookmarks !== false;

    return normalizeDefaults({
      extensionEnabled: true,
      features: {
        autoScroll: autoScroll.enabled === true,
        progressBar: progressBar.enabled === true,
        screenNavigation: screenNavigation.enabled === true,
        scrollBookmarks: typeof scrollBookmarks.enabled === 'boolean'
          ? scrollBookmarks.enabled
          : legacyBookmarkEnabled,
        outlineNavigation: typeof outlineNavigation.enabled === 'boolean'
          ? outlineNavigation.enabled
          : readingFeatures.outlineNavigation === true
      }
    });
  }

  function mergeLegacyExtensionState(existingState, legacyEnabled, defaults) {
    var state = normalizeState(existingState, defaults);
    if (legacyEnabled === false) {
      state.extensionEnabled = false;
    } else if (!existingState) {
      state.extensionEnabled = true;
    }
    return state;
  }

  function migrateStorage(localData, advancedSettings) {
    var source = isPlainObject(localData) ? localData : {};
    var alreadyMigrated = Number(source[STORAGE_KEYS.migrationVersion]) >= MIGRATION_VERSION;
    var defaults = alreadyMigrated
      ? normalizeDefaults(source[STORAGE_KEYS.defaults])
      : getLegacyFeatureDefaults(advancedSettings);
    var states = normalizeStates(source[STORAGE_KEYS.states], defaults);

    if (!alreadyMigrated) {
      var legacyStates = isPlainObject(source[STORAGE_KEYS.legacyStates])
        ? source[STORAGE_KEYS.legacyStates]
        : {};
      Object.keys(legacyStates).forEach(function (hostname) {
        var domainKey = getDomainKey(hostname);
        if (!domainKey) return;
        states[domainKey] = mergeLegacyExtensionState(
          states[domainKey],
          legacyStates[hostname],
          defaults
        );
      });
    }

    return {
      states: states,
      defaults: defaults,
      migrationVersion: MIGRATION_VERSION,
      needsWrite: !alreadyMigrated ||
        !isPlainObject(source[STORAGE_KEYS.states]) ||
        !isPlainObject(source[STORAGE_KEYS.defaults])
    };
  }

  function getState(states, domainKey, defaults) {
    var normalizedDefaults = normalizeDefaults(defaults);
    if (!domainKey) return normalizedDefaults;
    var source = isPlainObject(states) ? states[domainKey] : null;
    return normalizeState(source, normalizedDefaults);
  }

  function updateState(states, domainKey, updater, defaults) {
    var nextStates = normalizeStates(states, defaults);
    if (!domainKey) return nextStates;
    var current = getState(nextStates, domainKey, defaults);
    var next = typeof updater === 'function' ? updater(current) : updater;
    nextStates[domainKey] = normalizeState(next, defaults);
    return nextStates;
  }

  function toStorageData(migration) {
    var data = {};
    data[STORAGE_KEYS.states] = migration.states;
    data[STORAGE_KEYS.defaults] = migration.defaults;
    data[STORAGE_KEYS.migrationVersion] = migration.migrationVersion;
    return data;
  }

  function stripLegacyEnabled(settings) {
    var clone = isPlainObject(settings) ? JSON.parse(JSON.stringify(settings)) : {};
    FEATURE_KEYS.forEach(function (key) {
      if (isPlainObject(clone[key])) {
        delete clone[key].enabled;
      }
    });
    delete clone.readingTools;
    return clone;
  }

  global.PageScrollMasterDomain = {
    STORAGE_KEYS: STORAGE_KEYS,
    MIGRATION_VERSION: MIGRATION_VERSION,
    FEATURE_KEYS: FEATURE_KEYS.slice(),
    CONTAINER_STRATEGIES: CONTAINER_STRATEGIES.slice(),
    DEFAULT_CONTAINER_STRATEGY: DEFAULT_CONTAINER_STRATEGY,
    getDomainKey: getDomainKey,
    normalizeHostname: normalizeHostname,
    normalizeContainerStrategy: normalizeContainerStrategy,
    normalizeDefaults: normalizeDefaults,
    normalizeState: normalizeState,
    normalizeStates: normalizeStates,
    getLegacyFeatureDefaults: getLegacyFeatureDefaults,
    migrateStorage: migrateStorage,
    getState: getState,
    updateState: updateState,
    toStorageData: toStorageData,
    stripLegacyEnabled: stripLegacyEnabled
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
