const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const context = {};
vm.runInNewContext(
  fs.readFileSync(path.join(ROOT, 'analytics.js'), 'utf8'),
  context,
  { filename: 'analytics.js' }
);

const analytics = context.PageScrollMasterAnalytics;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

console.log('=== Page Scroll Master analytics queue tests ===');

let aggregates = {};
aggregates = analytics.incrementAction(aggregates, 'floatingTopClicks', '2026-06-12');
aggregates = analytics.incrementAction(aggregates, 'floatingTopClicks', '2026-06-12');
aggregates = analytics.incrementAction(aggregates, 'popupTopClicks', '2026-06-12');
aggregates = analytics.incrementToggle(
  aggregates,
  'progressBar',
  true,
  'popup',
  '2026-06-12'
);
aggregates = analytics.incrementToggle(
  aggregates,
  'progressBar',
  false,
  'domainManager',
  '2026-06-12'
);
aggregates = analytics.setSettingsSnapshot(aggregates, {
  locale: 'en-US',
  extensionVersion: '2.1.0',
  buttonSizeBucket: 'medium',
  buttonSpacingBucket: 'normal',
  edgeDistanceBucket: 'standard',
  opacityBucket: 'solid'
}, '2026-06-12');

assert(aggregates['2026-06-12'].actions.floatingTopClicks === 2, 'actions aggregate by UTC day');
assert(
  !Object.prototype.hasOwnProperty.call(aggregates['2026-06-12'].actions, 'popupTopClicks'),
  'nonexistent popup scroll actions are rejected'
);
assert(
  aggregates['2026-06-12'].toggles.progressBar.popup.enabled === 1,
  'popup enable operations aggregate without a domain'
);
assert(
  aggregates['2026-06-12'].toggles.progressBar.domainManager.disabled === 1,
  'domain manager disable operations aggregate without a domain'
);

aggregates['2026-06-12'].actions.floatingBottomClicks = analytics.MAX_COUNTER_VALUE;
aggregates = analytics.incrementAction(aggregates, 'floatingBottomClicks', '2026-06-12');
assert(
  aggregates['2026-06-12'].actions.floatingBottomClicks === analytics.MAX_COUNTER_VALUE,
  'action counters stop at the fixed upper limit'
);
aggregates['2026-06-12'].toggles.progressBar.popup.enabled = analytics.MAX_COUNTER_VALUE;
aggregates = analytics.incrementToggle(
  aggregates,
  'progressBar',
  true,
  'popup',
  '2026-06-12'
);
assert(
  aggregates['2026-06-12'].toggles.progressBar.popup.enabled === analytics.MAX_COUNTER_VALUE,
  'toggle counters stop at the fixed upper limit'
);

aggregates['2026-06-05'] = aggregates['2026-06-12'];
aggregates['2026-06-06'] = aggregates['2026-06-12'];
aggregates['not-a-date'] = {
  pageUrl: 'https://private.example'
};
const pruned = analytics.pruneAggregates(aggregates, '2026-06-12');
assert(!pruned['2026-06-05'], 'records older than seven UTC days are removed');
assert(Boolean(pruned['2026-06-06']), 'the seven-day boundary is retained');
assert(!pruned['not-a-date'], 'invalid aggregate dates are removed');
assert(
  Object.keys(pruned).length <= analytics.RETENTION_DAYS,
  'the aggregate store cannot exceed the fixed UTC-day retention limit'
);

const invalidDateUpdate = analytics.incrementAction(pruned, 'floatingTopClicks', '2026-02-31');
assert(!invalidDateUpdate['2026-02-31'], 'invalid event dates cannot create aggregate buckets');

const events = analytics.buildEvents(pruned, '2026-06-12');
assert(events.some((event) => event.eventName === 'daily_action_counts'), 'action aggregate becomes one daily event');
assert(events.some((event) => event.eventName === 'daily_toggle_counts'), 'toggle aggregate becomes one daily event');
assert(events.some((event) => event.eventName === 'settings_snapshot'), 'settings snapshot becomes one daily event');
assert(events.every((event) => analytics.isPayloadSafe(event.payload)), 'all generated payloads pass the safety audit');
assert(
  events.find((event) => event.eventName === 'daily_toggle_counts').payload.changes
    .some((change) => change.source === 'domainManager'),
  'domain manager remains a fixed source enum rather than a site value'
);
assert(
  events.every((event) => Object.values(analytics.EVENT_NAMES).includes(event.eventName)),
  'generated events use only the event-name allowlist'
);

console.log('analytics queue tests passed');
