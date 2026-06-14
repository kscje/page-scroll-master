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

console.log('=== Page Scroll Master analytics payload sanitization tests ===');

const payload = analytics.buildSettingsSnapshotPayload({
  locale: 'zh-CN',
  extensionVersion: '2.1.0',
  url: 'https://private.example/article',
  domainFeatureStates: {
    'private.example': {
      extensionEnabled: true
    }
  },
  buttonSettings: {
    horizontalPosition: 'left',
    verticalAlignment: 'bottom',
    buttonShape: 'square',
    buttonSize: 88,
    buttonSpacing: 600,
    edgeDistance: 80,
    opacity: 33,
    topButtonColor: '#123456',
    bottomButtonColor: '#4A9EDD',
    enableHoverHide: false
  },
  advancedSettings: {
    progressBar: {
      mode: 'horizontalBar',
      horizontalPosition: 'bottom',
      colorMode: 'custom',
      customColor: '#ABCDEF',
      clickToJump: true,
      showPercentage: true,
      showRemainingTime: true
    },
    iconCustomization: {
      iconSet: 'doubleArrow',
      iconColor: '#654321'
    },
    scrollBookmarks: {
      buttonPosition: 'betweenScrollButtons',
      buttonColorMode: 'custom',
      buttonCustomColor: '#FEDCBA',
      restoreMode: 'manual',
      perDomainLimit: 3
    },
    outlineNavigation: {
      buttonPosition: 'pageTop',
      buttonColorMode: 'followBottomButton',
      sources: {
        h1: true,
        h2: false,
        h3: true,
        idBlocks: false
      },
      maxItems: 47,
      filterShortHeadings: false,
      highlightCurrentSection: false
    }
  }
});

assert(payload.buttonSizeBucket === 'extraLarge', 'button size is bucketed');
assert(payload.buttonSpacingBucket === 'loose', 'button spacing is bucketed');
assert(payload.edgeDistanceBucket === 'far', 'edge distance is bucketed');
assert(payload.opacityBucket === 'low', 'opacity is bucketed');
assert(payload.buttonColorMode === 'mixed', 'button colors become a mode');
assert(payload.outlineSources === 'h1+h3', 'outline sources become a fixed enum combination');

const serialized = JSON.stringify(payload);
[
  'private.example',
  'https://private.example/article',
  '#123456',
  '#ABCDEF',
  '#654321',
  '#FEDCBA',
  'domainFeatureStates',
  'url'
].forEach((forbidden) => {
  assert(!serialized.includes(forbidden), `payload excludes ${forbidden}`);
});

const sanitized = analytics.sanitizeSettingsSnapshotPayload({
  ...payload,
  hostname: 'secret.example',
  title: 'Private title',
  text: 'Private page text'
});
const sanitizedJson = JSON.stringify(sanitized);
assert(!sanitizedJson.includes('secret.example'), 'sanitizer drops injected hostnames');
assert(!sanitizedJson.includes('Private title'), 'sanitizer drops injected titles');
assert(!sanitizedJson.includes('Private page text'), 'sanitizer drops injected text');
assert(analytics.isPayloadSafe(sanitized), 'sanitized settings payload passes the recursive safety audit');
assert(!analytics.isPayloadSafe({ url: 'https://private.example' }), 'unsafe keys and URL values fail the audit');
assert(!analytics.isPayloadSafe({ pageTitle: 'Private title' }), 'compound page-title keys fail the audit');
assert(!analytics.isPayloadSafe({ bookmarkContent: 'Private bookmark' }), 'bookmark content keys fail the audit');
assert(!analytics.isPayloadSafe({ value: 'private.example/path' }), 'domain-like string values fail the audit');
assert(
  analytics.buildSettingsSnapshotPayload({
    extensionVersion: '1'.repeat(1000) + '.0.0'
  }).extensionVersion === 'unknown',
  'unbounded extension-version strings are rejected'
);
assert(analytics.isUploadConfigured() === true, 'upload is configured only for the fixed HTTPS endpoint');
assert(
  analytics.CONFIG.endpoint ===
    'https://page-scroll-master-analytics.kscje-apps.workers.dev/v1/events',
  'upload endpoint is fixed to the dedicated Worker'
);

console.log('analytics payload sanitization tests passed');
