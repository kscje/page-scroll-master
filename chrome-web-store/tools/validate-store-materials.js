const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const STORE_ROOT = path.join(ROOT, 'chrome-web-store');
const PROMO_LOCALES = ['en', 'zh-CN', 'zh-TW', 'es', 'ja', 'de', 'fr', 'pt', 'ko', 'it'];
const SCREENSHOT_LOCALES = ['en', 'zh-CN', 'zh-TW', 'es', 'ja', 'de', 'fr', 'pt', 'ko', 'it', 'ru', 'tr', 'id'];
const PRIVACY_FILES = ['en', 'zh-CN', 'zh-TW', 'es', 'ja', 'de', 'fr', 'pt-BR', 'ko', 'it'];
const SCREENSHOTS = [
  '01-overview.png',
  '02-domain-control.png',
  '03-reading-tools.png'
];

function fail(message) {
  throw new Error(message);
}

function requireFile(relativePath) {
  const absolutePath = path.join(STORE_ROOT, relativePath);
  if (!fs.existsSync(absolutePath) || !fs.statSync(absolutePath).isFile()) {
    fail(`Missing store material: ${relativePath}`);
  }
  return absolutePath;
}

function readPngDimensions(filePath) {
  const buffer = fs.readFileSync(filePath);
  if (buffer.length < 24 || buffer.toString('hex', 0, 8) !== '89504e470d0a1a0a') {
    fail(`Invalid PNG: ${path.relative(STORE_ROOT, filePath)}`);
  }
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20)
  };
}

function requirePng(relativePath, width, height) {
  const filePath = requireFile(relativePath);
  const dimensions = readPngDimensions(filePath);
  if (dimensions.width !== width || dimensions.height !== height) {
    fail(`${relativePath} must be ${width}x${height}, got ${dimensions.width}x${dimensions.height}`);
  }
}

function sha256(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

requireFile('README.md');
requireFile('listing-content.md');
requireFile('publish-checklist.md');
requireFile('publish-guide.md');

for (const locale of PRIVACY_FILES) {
  const filePath = requireFile(`privacy/${locale}.md`);
  const content = fs.readFileSync(filePath, 'utf8');
  for (const requiredText of [
    'chrome.storage.sync',
    'chrome.storage.local',
    'https://page-scroll-master-analytics.kscje-apps.workers.dev/v1/events',
    'https://developer.chrome.com/docs/webstore/program-policies/limited-use',
    'kscj.ty@gmail.com'
  ]) {
    if (!content.includes(requiredText)) {
      fail(`privacy/${locale}.md is missing required disclosure: ${requiredText}`);
    }
  }
}

requirePng('assets/icon/icon128.png', 128, 128);
requirePng('assets/promotional/generic/small-promo-440x280.png', 440, 280);
requirePng('assets/promotional/generic/marquee-promo-1400x560.png', 1400, 560);

for (const locale of PROMO_LOCALES) {
  requirePng(`assets/promotional/localized/${locale}/small-promo-440x280.png`, 440, 280);
  requirePng(`assets/promotional/localized/${locale}/marquee-promo-1400x560.png`, 1400, 560);
}

for (const locale of SCREENSHOT_LOCALES) {
  for (const screenshot of SCREENSHOTS) {
    requirePng(`assets/screenshots/${locale}/${screenshot}`, 1280, 800);
  }
}

const sourceIcon = path.join(ROOT, 'icons', 'icon128.png');
const storeIcon = path.join(STORE_ROOT, 'assets', 'icon', 'icon128.png');
if (sha256(sourceIcon) !== sha256(storeIcon)) {
  fail('Store icon does not match icons/icon128.png');
}

console.log('Chrome Web Store materials validation passed.');
