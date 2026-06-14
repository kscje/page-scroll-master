const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');

function clone(value) {
  return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
}

function createBackground(initialLocalData = {}) {
  const localData = clone(initialLocalData);
  let messageListener = null;
  let installedListener = null;
  const alarms = new Map();
  let context;

  const sandbox = {
    console,
    Promise,
    Object,
    Date,
    setTimeout,
    clearTimeout,
    chrome: {
      storage: {
        local: {
          get(keys, callback) {
            const result = {};
            keys.forEach((key) => {
              if (Object.prototype.hasOwnProperty.call(localData, key)) {
                result[key] = clone(localData[key]);
              }
            });
            callback(result);
          },
          set(data, callback) {
            Object.assign(localData, clone(data));
            if (callback) callback();
          },
          remove(keys, callback) {
            const list = Array.isArray(keys) ? keys : [keys];
            list.forEach((key) => delete localData[key]);
            if (callback) callback();
          }
        }
      },
      runtime: {
        lastError: null,
        onInstalled: {
          addListener(listener) {
            installedListener = listener;
          }
        },
        onMessage: {
          addListener(listener) {
            messageListener = listener;
          }
        },
        openOptionsPage(callback) {
          if (callback) callback();
        }
      },
      permissions: {
        contains(options, callback) {
          callback(true);
        },
        remove(options, callback) {
          callback(true);
        }
      },
      alarms: {
        create(name, info) {
          alarms.set(name, clone(info));
        },
        get(name, callback) {
          callback(alarms.has(name) ? { name, ...alarms.get(name) } : null);
        },
        clear(name, callback) {
          const removed = alarms.delete(name);
          if (callback) callback(removed);
        },
        onAlarm: {
          addListener() {}
        }
      },
      commands: {
        onCommand: {
          addListener() {}
        }
      },
      tabs: {
        query() {},
        sendMessage() {}
      }
    }
  };

  context = vm.createContext(sandbox);
  sandbox.importScripts = (...files) => {
    files.forEach((file) => {
      vm.runInContext(
        fs.readFileSync(path.join(ROOT, file), 'utf8'),
        context,
        { filename: file }
      );
    });
  };
  vm.runInContext(
    fs.readFileSync(path.join(ROOT, 'background.js'), 'utf8'),
    context,
    { filename: 'background.js' }
  );

  function send(message) {
    return new Promise((resolve) => {
      const keepChannelOpen = messageListener(message, {}, resolve);
      if (keepChannelOpen !== true) {
        resolve(undefined);
      }
    });
  }

  return {
    localData,
    send,
    installedListener
  };
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

(async () => {
  console.log('=== Page Scroll Master analytics consent tests ===');

  const background = createBackground();
  assert(typeof background.installedListener === 'function', 'existing install lifecycle remains registered');

  let response = await background.send({
    action: 'analytics:recordAction',
    actionKey: 'floatingTopClicks'
  });
  assert(response.reason === 'consent_disabled', 'events are rejected before consent');
  assert(!background.localData.analyticsDailyAggregates, 'no queue is created before consent');

  response = await background.send({
    action: 'analytics:setConsent',
    enabled: true
  });
  assert(response.ok === true, 'explicit consent enables analytics after optional permission is granted');
  assert(background.localData.analyticsConsent.enabled === true, 'enabled consent persists in local storage');
  response = await background.send({
    action: 'analytics:recordAction',
    actionKey: 'floatingTopClicks'
  });
  assert(response.ok === true, 'allowed action is stored after consent');
  const dates = Object.keys(background.localData.analyticsDailyAggregates);
  assert(dates.length === 1, 'one UTC aggregate day is created');
  assert(
    background.localData.analyticsDailyAggregates[dates[0]].actions.floatingTopClicks === 1,
    'the allowed action counter increments'
  );
  response = await background.send({ action: 'analytics:getState' });
  assert(response.state.configured === true, 'upload is configured for the dedicated endpoint');
  assert(
    response.state.events.some((event) => event.eventName === 'daily_action_counts'),
    'consented local aggregates are available for preview'
  );

  response = await background.send({
    action: 'analytics:setConsent',
    enabled: false
  });
  assert(response.ok === true, 'consent can be disabled');
  assert(background.localData.analyticsConsent.enabled === false, 'disabled consent persists locally');
  assert(!background.localData.analyticsDailyAggregates, 'disabling consent clears pending analytics');

  const disabledWithResidue = createBackground({
    analyticsConsent: {
      enabled: false,
      policyVersion: 2
    },
    analyticsDailyAggregates: {
      '2026-06-12': {
        actions: {
          floatingTopClicks: 5
        }
      }
    }
  });
  response = await disabledWithResidue.send({ action: 'analytics:getState' });
  assert(response.state.events.length === 0, 'disabled consent never exposes residual events');
  assert(
    !disabledWithResidue.localData.analyticsDailyAggregates,
    'disabled consent removes residual aggregates'
  );

  const outdated = createBackground({
    analyticsConsent: {
      enabled: true,
      policyVersion: 0
    },
    analyticsDailyAggregates: {
      '2026-06-12': {
        actions: {
          floatingTopClicks: 5
        }
      }
    }
  });
  response = await outdated.send({ action: 'analytics:getState' });
  assert(response.state.consent.enabled === false, 'an outdated policy version invalidates consent');
  assert(!outdated.localData.analyticsDailyAggregates, 'policy invalidation clears pending aggregates');

  const today = new Date().toISOString().slice(0, 10);
  const unpruned = createBackground({
    analyticsConsent: {
      enabled: true,
      policyVersion: 2
    },
    analyticsDailyAggregates: {
      '2000-01-01': {
        actions: {
          floatingTopClicks: 3
        }
      },
      [today]: {
        actions: {
          floatingBottomClicks: 2,
          pageTitle: 'Private title'
        },
        pageUrl: 'https://private.example/article'
      }
    }
  });
  response = await unpruned.send({ action: 'analytics:getState' });
  assert(
    Object.keys(unpruned.localData.analyticsDailyAggregates).length === 1,
    'state reads persist the seven-day retention cleanup'
  );
  assert(
    !JSON.stringify(unpruned.localData.analyticsDailyAggregates).includes('Private'),
    'state reads persist the fixed aggregate schema'
  );
  assert(
    response.state.events.every((event) => !JSON.stringify(event).includes('private.example')),
    'preview events exclude injected browsing context'
  );

  console.log('analytics consent tests passed');
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
