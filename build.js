const fs = require('fs');
const path = require('path');
const { execFileSync, execSync } = require('child_process');

const ROOT = __dirname;
const BUILD_DIR = path.join(ROOT, 'dist', 'build');
const PACKAGE_DIR = path.join(ROOT, 'dist');

const MANIFEST = require('./manifest.json');

const INCLUDED_FILES = [
  'manifest.json',
  'background.js',
  'content.js',
  'popup.html',
  'popup.js',
  'options.html',
  'options.js',
];

const INCLUDED_DIRS = [
  'icons',
  '_locales',
];

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
  const required = ['manifest_version', 'name', 'version', 'description'];
  const errors = [];

  for (const key of required) {
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

  if (MANIFEST.name && MANIFEST.name.length > 45) {
    errors.push('name exceeds 45 character limit');
  }

  if (MANIFEST.description && MANIFEST.description.length > 132) {
    errors.push('description exceeds 132 character limit');
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

  content = content.replace(/\s+/g, ' ');
  content = content.replace(/>\s+</g, '><');

  content = content.replace(/\s*([{};:,>])\s*/g, '$1');

  content = content.replace(
    /<(style|script)\b[^>]*>([\s\S]*?)<\/\1>/g,
    (match, tag, body) => {
      const trimmed = body.replace(/^\s+|\s+$/g, '');
      return `<${tag}>${trimmed}</${tag}>`;
    }
  );

  content = content.replace(/\n/g, '');
  content = content.replace(/\r/g, '');

  content = '<!DOCTYPE html>\n' + content.trim() + '\n';

  fs.writeFileSync(filePath, content, 'utf-8');
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
  let content = fs.readFileSync(filePath, 'utf-8');

  content = content.replace(/\/\/.*$/gm, '');
  content = content.replace(/\/\*[\s\S]*?\*\//g, '');
  content = content.replace(/^\s*[\r\n]/gm, '');
  content = content.replace(/[ \t]+/g, ' ');

  fs.writeFileSync(filePath, content, 'utf-8');
}

function createPackage() {
  const version = MANIFEST.version;
  const zipName = `page-scroll-master-v${version}.zip`;
  const zipPath = path.join(PACKAGE_DIR, zipName);

  if (fs.existsSync(zipPath)) {
    fs.unlinkSync(zipPath);
  }

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

function main() {
  console.log('═══ Page Scroll Master — Production Build ═══\n');

  console.log('[1/5] Validating manifest.json...');
  const errors = validateManifest();
  if (errors.length > 0) {
    console.error('  ✗ Manifest validation failed:');
    errors.forEach(e => console.error(`    - ${e}`));
    process.exit(1);
  }
  console.log('  ✓ Manifest validation passed');

  console.log('\n[2/5] Preparing build directory...');
  cleanBuildDir();
  console.log(`  ✓ Build directory: ${BUILD_DIR}`);

  console.log('\n[3/5] Copying files...');
  for (const file of INCLUDED_FILES) {
    const dest = copyFile(file);
    console.log(`  ✓ ${file}`);
  }
  for (const dir of INCLUDED_DIRS) {
    copyDir(dir);
    console.log(`  ✓ ${dir}/`);
  }

  console.log('\n[4/5] Minifying files...');
  for (const file of INCLUDED_FILES) {
    const ext = path.extname(file);
    const destPath = path.join(BUILD_DIR, file);

    if (ext === '.js') {
      minifyJS(destPath);
    } else if (ext === '.html') {
      minifyHTML(destPath);
    }
  }

  console.log('\n[5/5] Creating ZIP package...');
  const result = createPackage();
  listPackageContents(result.zipPath);

  console.log('\n═══ Build Complete ═══');
  console.log(`\nReady for Chrome Web Store submission: ${result.zipName}`);
}

main();
