const fs = require('fs');
const path = require('path');
const sharp = require('/Users/gemingming/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/.pnpm/sharp@0.34.5/node_modules/sharp');

const ROOT = path.resolve(__dirname, '..', '..');
const SOURCE_DIR = path.join(ROOT, 'store-assets', 'sources');
const OUT_DIR = path.join(ROOT, 'store-assets', 'promotional');
const ICON_DATA = fs.readFileSync(path.join(ROOT, 'icons', 'icon128.png')).toString('base64');

fs.mkdirSync(SOURCE_DIR, { recursive: true });
fs.mkdirSync(OUT_DIR, { recursive: true });

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="440" height="280" viewBox="0 0 440 280">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#edf8ff"/>
      <stop offset="0.58" stop-color="#ecf8f0"/>
      <stop offset="1" stop-color="#fff7e7"/>
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="12" stdDeviation="12" flood-color="#24415d" flood-opacity="0.18"/>
    </filter>
  </defs>
  <rect width="440" height="280" fill="url(#bg)"/>
  <circle cx="376" cy="36" r="96" fill="#4a9edd" opacity="0.11"/>
  <circle cx="32" cy="256" r="108" fill="#25a967" opacity="0.11"/>
  <g filter="url(#shadow)">
    <rect x="142" y="42" width="250" height="184" rx="18" fill="#ffffff"/>
    <rect x="142" y="42" width="250" height="34" rx="18" fill="#eef5fb"/>
    <rect x="142" y="64" width="250" height="12" fill="#eef5fb"/>
    <circle cx="162" cy="59" r="4.5" fill="#ff6b6b"/>
    <circle cx="177" cy="59" r="4.5" fill="#ffc857"/>
    <circle cx="192" cy="59" r="4.5" fill="#4cc38a"/>
    <rect x="166" y="94" width="104" height="8" rx="4" fill="#2a3c52"/>
    <rect x="166" y="118" width="176" height="7" rx="3.5" fill="#d8e8f2"/>
    <rect x="166" y="138" width="196" height="7" rx="3.5" fill="#d8e8f2"/>
    <rect x="166" y="158" width="152" height="7" rx="3.5" fill="#d8e8f2"/>
    <rect x="166" y="178" width="186" height="7" rx="3.5" fill="#d8e8f2"/>
    <rect x="166" y="198" width="128" height="7" rx="3.5" fill="#d8e8f2"/>
  </g>
  <g filter="url(#shadow)">
    <rect x="62" y="70" width="112" height="112" rx="24" fill="#ffffff"/>
    <image x="84" y="92" width="68" height="68" href="data:image/png;base64,${ICON_DATA}"/>
  </g>
  <g filter="url(#shadow)">
    <rect x="314" y="106" width="48" height="104" rx="24" fill="#f4fbff" stroke="#c9dfea" stroke-width="1.5"/>
    <circle cx="338" cy="132" r="22" fill="#4a9edd"/>
    <path d="M338 118 L326 136 H333 V146 H343 V136 H350 Z" fill="#ffffff"/>
    <circle cx="338" cy="184" r="22" fill="#25a967"/>
    <path d="M338 198 L326 180 H333 V170 H343 V180 H350 Z" fill="#ffffff"/>
  </g>
</svg>`;

const sourcePath = path.join(SOURCE_DIR, 'small-promo-440x280.svg');
const outputPath = path.join(OUT_DIR, 'small-promo-440x280.png');

fs.writeFileSync(sourcePath, svg, 'utf8');

sharp(Buffer.from(svg))
  .png()
  .toFile(outputPath)
  .then(() => console.log(outputPath))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
