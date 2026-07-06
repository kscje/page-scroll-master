const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const contentSource = fs.readFileSync(path.join(ROOT, 'content.js'), 'utf8');
const optionsSource = fs.readFileSync(path.join(ROOT, 'options.js'), 'utf8');
const optionsHtml = fs.readFileSync(path.join(ROOT, 'options.html'), 'utf8');
const optionsTestSource = fs.readFileSync(path.join(ROOT, 'tests', 'test-options-page.js'), 'utf8');

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function extractNumber(source, pattern, label) {
  const match = source.match(pattern);
  if (!match) {
    throw new Error(`Missing ${label}`);
  }
  return Number(match[1]);
}

function extractBoolean(source, pattern, label) {
  const match = source.match(pattern);
  if (!match) {
    throw new Error(`Missing ${label}`);
  }
  return match[1] === 'true';
}

function extractInputAttributes(id) {
  const match = optionsHtml.match(new RegExp(`<input[^>]+id="${id}"[^>]*>`));
  if (!match) {
    throw new Error(`Missing #${id} input`);
  }

  const input = match[0];
  const getAttr = (name) => {
    const attrMatch = input.match(new RegExp(`${name}="([^"]+)"`));
    return attrMatch ? attrMatch[1] : undefined;
  };

  return {
    min: Number(getAttr('min')),
    max: Number(getAttr('max')),
    value: Number(getAttr('value'))
  };
}

function assertNumberParity(label, expected, values) {
  Object.entries(values).forEach(([source, value]) => {
    assert(value === expected, `${label} ${source} should be ${expected}, got ${value}`);
  });
}

function assertRange(label, expected, actual) {
  assert(
    actual.min === expected.min && actual.max === expected.max,
    `${label} range should be ${expected.min}-${expected.max}, got ${actual.min}-${actual.max}`
  );
}

const buttonSizeInput = extractInputAttributes('buttonSize');
const buttonSpacingInput = extractInputAttributes('buttonSpacing');
const edgeDistanceInput = extractInputAttributes('edgeDistance');
const progressVerticalHeightInput = extractInputAttributes('progressVerticalHeight');

assertNumberParity('button size default', 40, {
  content: extractNumber(contentSource, /buttonSize:\s*(\d+)/, 'content buttonSize default'),
  options: extractNumber(optionsSource, /buttonSize:\s*(\d+)/, 'options buttonSize default'),
  html: buttonSizeInput.value,
  testFixture: extractNumber(optionsTestSource, /buttonSize:\s*createElement\('buttonSize',\s*\{\s*value:\s*'(\d+)'/, 'test buttonSize fixture')
});
assertRange('button size', { min: 10, max: 120 }, buttonSizeInput);

assertNumberParity('button spacing default', 8, {
  content: extractNumber(contentSource, /buttonSpacing:\s*(\d+)/, 'content buttonSpacing default'),
  options: extractNumber(optionsSource, /buttonSpacing:\s*(\d+)/, 'options buttonSpacing default'),
  html: buttonSpacingInput.value,
  testFixture: extractNumber(optionsTestSource, /buttonSpacing:\s*createElement\('buttonSpacing',\s*\{\s*value:\s*'(\d+)'/, 'test buttonSpacing fixture')
});
assertRange('button spacing', { min: 0, max: 800 }, buttonSpacingInput);

assertNumberParity('edge distance default', 8, {
  content: extractNumber(contentSource, /edgeDistance:\s*(\d+)/, 'content edgeDistance default'),
  options: extractNumber(optionsSource, /edgeDistance:\s*(\d+)/, 'options edgeDistance default'),
  html: edgeDistanceInput.value,
  testFixture: extractNumber(optionsTestSource, /edgeDistance:\s*createElement\('edgeDistance',\s*\{\s*value:\s*'(\d+)'/, 'test edgeDistance fixture')
});
assertRange('edge distance', { min: 0, max: 200 }, edgeDistanceInput);

assertNumberParity('vertical progress height default', 80, {
  contentConstant: extractNumber(contentSource, /const DEFAULT_PROGRESS_VERTICAL_HEIGHT = (\d+);/, 'content vertical progress constant'),
  options: extractNumber(optionsSource, /verticalHeight:\s*(\d+)/, 'options vertical progress default'),
  html: progressVerticalHeightInput.value,
  testFixture: extractNumber(optionsTestSource, /progressVerticalHeight:\s*createElement\('progressVerticalHeight',\s*\{\s*value:\s*'(\d+)'/, 'test vertical progress fixture')
});
assertRange('vertical progress height', { min: 40, max: 400 }, progressVerticalHeightInput);

assertNumberParity('horizontal progress thickness default', 4, {
  content: extractNumber(contentSource, /thickness:\s*(\d+)/, 'content horizontal progress thickness'),
  options: extractNumber(optionsSource, /thickness:\s*(\d+)/, 'options horizontal progress thickness')
});

assert(
  extractBoolean(contentSource, /progressBar:\s*\{[\s\S]*?enabled:\s*(true|false)/, 'content progress default') === false,
  'content progress bar default should be disabled'
);
assert(
  extractBoolean(optionsSource, /progressBar:\s*\{[\s\S]*?enabled:\s*(true|false)/, 'options progress default') === false,
  'options progress bar default should be disabled'
);

console.log('default parity tests passed');
