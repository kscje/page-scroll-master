const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(ROOT, 'options.html'), 'utf8');
const source = fs.readFileSync(path.join(ROOT, 'options.js'), 'utf8');
const backgroundSource = fs.readFileSync(path.join(ROOT, 'background.js'), 'utf8');
const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'manifest.json'), 'utf8'));

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

console.log('=== Page Scroll Master analytics settings tests ===');

assert(html.includes('id="analyticsEnabled"'), 'options page contains an analytics consent control');
assert(!/id="analyticsEnabled"[^>]*checked/.test(html), 'analytics consent is not enabled in HTML');
assert(html.includes('id="analyticsPreviewData"'), 'options page exposes the pending payload preview');
assert(
  html.indexOf('analytics.js') < html.indexOf('options.js'),
  'analytics allowlist loads before options logic'
);

[
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
].forEach((locale) => {
  assert(source.includes(`'${locale}': {`), `${locale} has analytics copy`);
});

assert(!JSON.stringify(manifest).includes('<analytics-domain>'), 'manifest has no placeholder analytics domain');
assert(!manifest.host_permissions, 'no analytics host permission is declared before endpoint confirmation');
assert(
  manifest.optional_host_permissions.includes(
    'https://page-scroll-master-analytics.kscje-apps.workers.dev/*'
  ),
  'analytics uses one fixed optional host permission'
);
assert(
  JSON.stringify(manifest.optional_permissions) === JSON.stringify(['alarms']),
  'analytics scheduling is an optional permission'
);
assert(/\bfetch\s*\(/.test(backgroundSource), 'background owns the analytics network request');
assert(/chrome\.alarms/.test(backgroundSource), 'background owns analytics scheduling');
assert(!manifest.permissions.includes('alarms'), 'analytics scheduling is not a required permission');

console.log('analytics settings tests passed');
