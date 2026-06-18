const fs = require('fs');
const path = require('path');

function resolveRuntimeRoot(projectRoot, targetSourcePath) {
  const targetRoot = path.dirname(targetSourcePath);
  return fs.existsSync(path.join(targetRoot, 'domain-utils.js')) ? targetRoot : projectRoot;
}

function getSharedRuntimeSource(projectRoot, targetSourcePath) {
  const runtimeRoot = resolveRuntimeRoot(projectRoot, targetSourcePath);
  return [
    fs.readFileSync(path.join(runtimeRoot, 'vendor', 'tldts.umd.min.js'), 'utf8'),
    fs.readFileSync(path.join(runtimeRoot, 'domain-utils.js'), 'utf8'),
    fs.readFileSync(path.join(runtimeRoot, 'analytics.js'), 'utf8'),
    fs.readFileSync(path.join(runtimeRoot, 'feedback.js'), 'utf8'),
    fs.readFileSync(path.join(runtimeRoot, 'rating.js'), 'utf8')
  ].join('\n');
}

module.exports = {
  getSharedRuntimeSource
};
