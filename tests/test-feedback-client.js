const assert = require('assert');
const feedback = require('../feedback.js');

console.log('=== Page Scroll Master feedback client tests ===');

assert.strictEqual(feedback.isConfigured(), true, 'feedback endpoint is a fixed HTTPS endpoint');
assert.strictEqual(
  feedback.CONFIG.endpoint,
  'https://page-scroll-master-feedback.kscje-apps.workers.dev/v1/feedback',
  'client uses the dedicated feedback Worker'
);

const valid = feedback.validateSubmission({
  type: 'feature',
  message: 'Please add a compact reading mode.',
  contact: 'reader@example.com',
  files: [
    { name: 'screen.png', type: 'image/png', size: 1024 }
  ]
});
assert.strictEqual(valid.ok, true, 'valid feedback passes client validation');
assert.strictEqual(valid.value.message, 'Please add a compact reading mode.', 'message is normalized');

assert.strictEqual(
  feedback.validateSubmission({ type: 'unknown', message: 'Long enough message', files: [] }).reason,
  'invalidType',
  'unknown feedback types are rejected'
);
assert.strictEqual(
  feedback.validateSubmission({ type: 'bug', message: 'short', files: [] }).reason,
  'messageTooShort',
  'short messages are rejected'
);
assert.strictEqual(
  feedback.validateSubmission({
    type: 'bug',
    message: 'This message is long enough.',
    contact: 'a\nb',
    files: []
  }).reason,
  'invalidContact',
  'multi-line contact fields are rejected'
);
assert.strictEqual(
  feedback.validateSubmission({
    type: 'bug',
    message: 'This message is long enough.',
    files: [
      { type: 'image/png', size: 1 },
      { type: 'image/png', size: 1 },
      { type: 'image/png', size: 1 },
      { type: 'image/png', size: 1 }
    ]
  }).reason,
  'tooManyImages',
  'more than three images are rejected'
);
assert.strictEqual(
  feedback.validateSubmission({
    type: 'bug',
    message: 'This message is long enough.',
    files: [{ type: 'image/svg+xml', size: 100 }]
  }).reason,
  'invalidImageType',
  'active image formats such as SVG are rejected'
);
assert.strictEqual(
  feedback.validateSubmission({
    type: 'bug',
    message: 'This message is long enough.',
    files: [{ type: 'image/png', size: feedback.MAX_IMAGE_BYTES + 1 }]
  }).reason,
  'imageTooLarge',
  'images over five megabytes are rejected'
);

console.log('feedback client tests passed');
