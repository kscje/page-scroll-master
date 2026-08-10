const fs = require('fs');
const path = require('path');
const { execFileSync, execSync } = require('child_process');

const ROOT = __dirname;
const BUILD_DIR = path.join(ROOT, 'dist', 'build');
const PACKAGE_DIR = path.join(ROOT, 'dist');
const TEST_DIR = path.join(ROOT, 'tests');

const MANIFEST = require('./manifest.json');

const INCLUDED_FILES = [
  'manifest.json',
  'background.js',
  'feedback.js',
  'rating.js',
  'domain-utils.js',
  'content.js',
  'popup.html',
  'popup.js',
  'options.html',
  'options.js',
  'icons/icon16.png',
  'icons/icon32.png',
  'icons/icon48.png',
  'icons/icon128.png',
  '_locales/en/messages.json',
  '_locales/zh_CN/messages.json',
  '_locales/zh_TW/messages.json',
  '_locales/es/messages.json',
  '_locales/ja/messages.json',
  '_locales/de/messages.json',
  '_locales/fr/messages.json',
  '_locales/pt_BR/messages.json',
  '_locales/ko/messages.json',
  '_locales/it/messages.json',
  '_locales/ru/messages.json',
  '_locales/tr/messages.json',
  '_locales/id/messages.json',
  'vendor/tldts.umd.min.js',
  'vendor/TLDTS_LICENSE.txt',
];

const INCLUDED_DIRS = [];
const SKIP_MINIFY_FILES = new Set([
  'vendor/tldts.umd.min.js',
]);

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function cleanBuildDir() {
  if (fs.existsSync(BUILD_DIR)) {
    fs.rmSync(BUILD_DIR, { recursive: true });
  }
  ensureDir(BUILD_DIR);
}

function validateManifest() {
  const requiredFields = ['manifest_version', 'name', 'version', 'description'];
  const errors = [];

  for (const key of requiredFields) {
    if (!MANIFEST[key]) {
      errors.push(`Missing required field: ${key}`);
    }
  }

  if (MANIFEST.manifest_version !== 3) {
    errors.push('manifest_version must be 3');
  }

  const versionRegex = /^\d+\.\d+\.\d+$/;
  if (!versionRegex.test(MANIFEST.version)) {
    errors.push('version must follow semver (e.g. 1.3.0)');
  }

  if (MANIFEST.name && MANIFEST.name.length > 75) {
    errors.push('name exceeds 75 character limit');
  }

  if (MANIFEST.description && MANIFEST.description.length > 132) {
    errors.push('description exceeds 132 character limit');
  }

  if (!MANIFEST.options_page && !MANIFEST.options_ui) {
    errors.push('Missing options_page or options_ui field');
  }

  if (MANIFEST.permissions) {
    for (const perm of MANIFEST.permissions) {
      if (perm === 'activeTab' && MANIFEST.permissions.includes('tabs')) {
        errors.push('Consider removing redundant permissions');
      }
    }
  }

  return errors;
}

function copyFile(src, dest) {
  const srcPath = path.join(ROOT, src);
  const destPath = path.join(BUILD_DIR, dest || src);

  if (!fs.existsSync(srcPath)) {
    throw new Error(`Source file not found: ${srcPath}`);
  }

  ensureDir(path.dirname(destPath));
  fs.copyFileSync(srcPath, destPath);
  return destPath;
}

function copyDir(src, dest) {
  const srcPath = path.join(ROOT, src);
  const destPath = path.join(BUILD_DIR, dest || src);

  if (!fs.existsSync(srcPath)) {
    throw new Error(`Source directory not found: ${srcPath}`);
  }

  ensureDir(destPath);
  fs.cpSync(srcPath, destPath, { recursive: true });
  return destPath;
}

function minifyHTML(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');

  content = content.replace(/<!--[\s\S]*?-->/g, '');

  content = content.replace(/<!DOCTYPE[^>]*>/gi, '');

  const preservedBlocks = [];
  const blockPlaceholder = '___PRESERVED_BLOCK_';

  content = content.replace(
    /<(style|script)\b([^>]*)>([\s\S]*?)<\/\1>/gi,
    (match, tag, attrs, body) => {
      const index = preservedBlocks.length;
      let minifiedBody = body;

      if (tag.toLowerCase() === 'style') {
        minifiedBody = minifyCSSContent(body);
      } else if (tag.toLowerCase() === 'script') {
        minifiedBody = minifyScriptContent(body);
      }

      preservedBlocks.push(`<${tag}${attrs}>${minifiedBody}</${tag}>`);
      return `${blockPlaceholder}${index}___`;
    }
  );

  content = content.replace(/>\s+</g, '><');
  content = content.replace(/\s{2,}/g, ' ');
  content = content.replace(/^\s+|\s+$/gm, '');

  content = content.replace(/\n/g, '');
  content = content.replace(/\r/g, '');

  preservedBlocks.forEach((block, index) => {
    content = content.replace(`${blockPlaceholder}${index}___`, block);
  });

  content = '<!DOCTYPE html>\n' + content.trim() + '\n';

  fs.writeFileSync(filePath, content, 'utf-8');
}

function minifyCSSContent(css) {
  css = css.replace(/\/\*[\s\S]*?\*\//g, '');
  css = css.replace(/\s+/g, ' ');
  css = css.replace(/\s*([{};:,>])\s*/g, '$1');
  css = css.replace(/;\}/g, '}');
  css = css.replace(/^\s+|\s+$/g, '');
  return css;
}

function minifyScriptContent(js) {
  return js.trim();
}

function minifyJS(filePath) {
  const terserBin = resolveLocalTerser();

  try {
    console.log(`  Minifying: ${path.basename(filePath)}`);
    if (!terserBin) {
      console.warn(`  ⚠ Terser not installed, using basic minification for ${path.basename(filePath)}`);
      basicMinifyJS(filePath);
      return;
    }

    execFileSync(process.execPath, [terserBin, filePath, '--compress', '--mangle', '--output', filePath], {
      cwd: ROOT,
      stdio: 'pipe',
    });
  } catch (err) {
    console.warn(`  ⚠ Terser failed, using basic minification for ${path.basename(filePath)}`);
    basicMinifyJS(filePath);
  }
}

function resolveLocalTerser() {
  try {
    return require.resolve('terser/bin/terser');
  } catch (err) {
    return null;
  }
}

function basicMinifyJS(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  fs.writeFileSync(filePath, content.trim() + '\n', 'utf-8');
}

function createPackage() {
  const version = MANIFEST.version;
  const zipName = `page-scroll-master-v${version}.zip`;
  const zipPath = path.join(PACKAGE_DIR, zipName);

  if (fs.existsSync(zipPath)) {
    fs.unlinkSync(zipPath);
  }

  console.log(`\nCleaning .DS_Store files from build directory...`);
  execSync(`find "${BUILD_DIR}" -name '.DS_Store' -delete`, { stdio: 'pipe' });

  console.log(`\nCreating package: ${zipName}`);
  execSync(`cd "${BUILD_DIR}" && zip -r "${zipPath}" .`, {
    stdio: 'pipe',
  });

  const stats = fs.statSync(zipPath);
  const sizeKB = (stats.size / 1024).toFixed(2);
  const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);

  console.log(`\n═══ Package Summary ═══`);
  console.log(`  File:     ${zipName}`);
  console.log(`  Size:     ${sizeKB} KB (${sizeMB} MB)`);
  console.log(`  Version:  ${version}`);
  console.log(`  Path:     ${zipPath}`);

  if (stats.size > 2 * 1024 * 1024) {
    console.warn(`  ⚠ WARNING: Package exceeds 2MB recommended limit`);
  } else {
    console.log(`  ✅ Size within recommended limit (< 2MB)`);
  }

  return { zipPath, zipName, sizeKB, sizeMB };
}

function listPackageContents(zipPath) {
  console.log(`\n═══ Package Contents ═══`);
  const output = execSync(`unzip -l "${zipPath}"`, { encoding: 'utf-8' });
  console.log(output);
}

function verifyBuildOutput() {
  console.log('\n[Verification] Checking build output...');
  let ok = true;

  const htmlFiles = INCLUDED_FILES.filter(f => f.endsWith('.html'));
  for (const file of htmlFiles) {
    const destPath = path.join(BUILD_DIR, file);
    if (!fs.existsSync(destPath)) {
      console.error(`  ✗ Missing: ${file}`);
      ok = false;
      continue;
    }
    const content = fs.readFileSync(destPath, 'utf-8');
    if (!content.includes('<!DOCTYPE html>')) {
      console.error(`  ✗ ${file}: missing DOCTYPE`);
      ok = false;
    }
    if (file === 'options.html') {
      const hasPreviewTop = content.includes('previewTopButton');
      const hasPreviewBottom = content.includes('previewBottomButton');
      const hasScript = content.includes('options.js');
      if (!hasPreviewTop) {
        console.error(`  ✗ options.html: missing previewTopButton element`);
        ok = false;
      }
      if (!hasPreviewBottom) {
        console.error(`  ✗ options.html: missing previewBottomButton element`);
        ok = false;
      }
      if (!hasScript) {
        console.error(`  ✗ options.html: missing options.js script reference`);
        ok = false;
      }
    }
    console.log(`  ✓ ${file} verified`);
  }

  const jsFiles = INCLUDED_FILES.filter(f => f.endsWith('.js'));
  for (const file of jsFiles) {
    const destPath = path.join(BUILD_DIR, file);
    if (!fs.existsSync(destPath)) {
      console.error(`  ✗ Missing: ${file}`);
      ok = false;
      continue;
    }
    const content = fs.readFileSync(destPath, 'utf-8');
    if (file === 'options.js') {
      if (!content.includes('updatePreviewButtons')) {
        console.error(`  ✗ options.js: missing updatePreviewButtons function (may have been mangled/removed)`);
        ok = false;
      }
      if (!content.includes('getElementById')) {
        console.error(`  ✗ options.js: missing getElementById calls (may have been corrupted)`);
        ok = false;
      }
    }
    if (file === 'content.js') {
      if (!content.includes('createScrollButton')) {
        console.error(`  ✗ content.js: missing createScrollButton function`);
        ok = false;
      }
    }
    console.log(`  ✓ ${file} verified`);
  }

  if (!ok) {
    console.error('\n  ✗ Build verification FAILED');
    process.exit(1);
  }
  console.log('  ✓ All build output files verified successfully');
}

function runRegressionTests() {
  console.log('\n[Regression] Running packaged settings tests...');

  execFileSync(process.execPath, ['--check', path.join(BUILD_DIR, 'options.js')], {
    cwd: ROOT,
    stdio: 'inherit',
  });
  execFileSync(process.execPath, ['--check', path.join(BUILD_DIR, 'content.js')], {
    cwd: ROOT,
    stdio: 'inherit',
  });
  execFileSync(process.execPath, [path.join(TEST_DIR, 'test-background-lifecycle.js')], {
    cwd: ROOT,
    stdio: 'inherit',
  });
  execFileSync(process.execPath, [path.join(TEST_DIR, 'test-background-install-lifecycle.js')], {
    cwd: ROOT,
    stdio: 'inherit',
  });
  execFileSync(process.execPath, [path.join(TEST_DIR, 'test-feedback-client.js')], {
    cwd: ROOT,
    stdio: 'inherit',
  });
  execFileSync(process.execPath, [path.join(TEST_DIR, 'test-feedback-worker.js')], {
    cwd: ROOT,
    stdio: 'inherit',
  });
  execFileSync(process.execPath, [path.join(TEST_DIR, 'test-toggle-state.js')], {
    cwd: ROOT,
    stdio: 'inherit',
  });
  execFileSync(process.execPath, [path.join(TEST_DIR, 'test-content-enable-state.js')], {
    cwd: ROOT,
    stdio: 'inherit',
  });
  execFileSync(process.execPath, [path.join(TEST_DIR, 'test-scroll-container-detection.js')], {
    cwd: ROOT,
    stdio: 'inherit',
  });
  execFileSync(process.execPath, [path.join(TEST_DIR, 'test-scroll-animation-performance.js')], {
    cwd: ROOT,
    stdio: 'inherit',
  });
  execFileSync(process.execPath, [path.join(TEST_DIR, 'test-spa-loading.js')], {
    cwd: ROOT,
    stdio: 'inherit',
  });
  execFileSync(process.execPath, [path.join(TEST_DIR, 'test-options-page.js')], {
    cwd: ROOT,
    stdio: 'inherit',
  });
  execFileSync(process.execPath, [path.join(TEST_DIR, 'test-progress-bar.js')], {
    cwd: ROOT,
    stdio: 'inherit',
  });
  execFileSync(process.execPath, [path.join(TEST_DIR, 'test-outline-navigation.js')], {
    cwd: ROOT,
    stdio: 'inherit',
  });
  execFileSync(process.execPath, [path.join(TEST_DIR, 'test-icon-customization.js')], {
    cwd: ROOT,
    stdio: 'inherit',
  });
  execFileSync(process.execPath, [path.join(TEST_DIR, 'test-domain-management.js')], {
    cwd: ROOT,
    stdio: 'inherit',
  });
  execFileSync(process.execPath, [path.join(TEST_DIR, 'test-language-normalization.js')], {
    cwd: ROOT,
    stdio: 'inherit',
  });
  execFileSync(process.execPath, [path.join(TEST_DIR, 'test-options-page.js')], {
    cwd: ROOT,
    env: {
      ...process.env,
      OPTIONS_SOURCE: path.join(BUILD_DIR, 'options.js'),
    },
    stdio: 'inherit',
  });
  execFileSync(process.execPath, [path.join(TEST_DIR, 'test-progress-bar.js')], {
    cwd: ROOT,
    env: {
      ...process.env,
      CONTENT_SOURCE: path.join(BUILD_DIR, 'content.js'),
    },
    stdio: 'inherit',
  });
  execFileSync(process.execPath, [path.join(TEST_DIR, 'test-outline-navigation.js')], {
    cwd: ROOT,
    env: {
      ...process.env,
      CONTENT_SOURCE: path.join(BUILD_DIR, 'content.js'),
    },
    stdio: 'inherit',
  });
  execFileSync(process.execPath, [path.join(TEST_DIR, 'test-icon-customization.js')], {
    cwd: ROOT,
    env: {
      ...process.env,
      CONTENT_SOURCE: path.join(BUILD_DIR, 'content.js'),
    },
    stdio: 'inherit',
  });
  execFileSync(process.execPath, [path.join(TEST_DIR, 'test-background-lifecycle.js')], {
    cwd: ROOT,
    env: {
      ...process.env,
      BACKGROUND_SOURCE: path.join(BUILD_DIR, 'background.js'),
    },
    stdio: 'inherit',
  });
  execFileSync(process.execPath, [path.join(TEST_DIR, 'test-background-install-lifecycle.js')], {
    cwd: ROOT,
    env: {
      ...process.env,
      BACKGROUND_SOURCE: path.join(BUILD_DIR, 'background.js'),
    },
    stdio: 'inherit',
  });

  console.log('  ✓ Regression tests passed');
}

function main() {
  console.log('═══ Smart Scroll Navigator — Production Build ═══\n');

  console.log('[1/7] Validating manifest.json...');
  const errors = validateManifest();
  if (errors.length > 0) {
    console.error('  ✗ Manifest validation failed:');
    errors.forEach(e => console.error(`    - ${e}`));
    process.exit(1);
  }
  console.log('  ✓ Manifest validation passed');

  console.log('\n[2/7] Preparing build directory...');
  cleanBuildDir();
  console.log(`  ✓ Build directory: ${BUILD_DIR}`);

  console.log('\n[3/7] Copying files...');
  for (const file of INCLUDED_FILES) {
    copyFile(file);
    console.log(`  ✓ ${file}`);
  }
  for (const dir of INCLUDED_DIRS) {
    copyDir(dir);
    console.log(`  ✓ ${dir}/`);
  }

  console.log('\n[4/7] Minifying files...');
  for (const file of INCLUDED_FILES) {
    const ext = path.extname(file);
    const destPath = path.join(BUILD_DIR, file);

    if (ext === '.js') {
      if (SKIP_MINIFY_FILES.has(file) || path.basename(file).endsWith('.min.js')) {
        console.log(`  Skipping minification: ${file}`);
        continue;
      }
      minifyJS(destPath);
    } else if (ext === '.html') {
      minifyHTML(destPath);
    }
  }

  verifyBuildOutput();
  runRegressionTests();

  console.log('\n[6/7] Creating ZIP package...');
  const result = createPackage();

  console.log('\n[7/7] Verifying ZIP contents...');
  listPackageContents(result.zipPath);

  console.log('\n═══ Build Complete ═══');
  console.log(`\nReady for Chrome Web Store submission: ${result.zipName}`);
}

main();
