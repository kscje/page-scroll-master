const fs = require('fs');
const path = require('path');
const sharp = require('/Users/gemingming/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/.pnpm/sharp@0.34.5/node_modules/sharp');

const ROOT = path.resolve(__dirname, '..', '..');
const SOURCE_DIR = path.join(ROOT, 'store-assets', 'sources');
const OUT_DIR = path.join(ROOT, 'store-assets', 'screenshots');

const items = [
  'zh-CN-01-overview',
  'zh-CN-02-settings',
  'en-01-overview',
  'en-02-settings',
];

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  for (const name of items) {
    const inputPath = path.join(SOURCE_DIR, `${name}.svg`);
    const outputPath = path.join(OUT_DIR, `${name}.png`);
    const svg = fs.readFileSync(inputPath);

    await sharp(svg, { density: 192 })
      .resize(1280, 800, { fit: 'fill' })
      .png()
      .toFile(outputPath);

    console.log(outputPath);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
