(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }
  root.PageScrollMasterFeedback = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const CONFIG = Object.freeze({
    endpoint: 'https://page-scroll-master-feedback.kscje-apps.workers.dev/v1/feedback',
    permissionOrigin: 'https://page-scroll-master-feedback.kscje-apps.workers.dev/*'
  });
  const TYPES = Object.freeze(['feature', 'bug', 'compatibility', 'translation', 'other']);
  const ALLOWED_IMAGE_TYPES = Object.freeze(['image/jpeg', 'image/png', 'image/webp']);
  const MAX_IMAGES = 3;
  const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
  const MIN_MESSAGE_LENGTH = 10;
  const MAX_MESSAGE_LENGTH = 5000;
  const MAX_CONTACT_LENGTH = 200;

  function normalizeText(value) {
    return typeof value === 'string' ? value.trim() : '';
  }

  function validateFiles(files) {
    const list = Array.from(files || []);
    if (list.length > MAX_IMAGES) return { ok: false, reason: 'tooManyImages' };
    for (const file of list) {
      if (!file || !ALLOWED_IMAGE_TYPES.includes(file.type)) {
        return { ok: false, reason: 'invalidImageType' };
      }
      if (!Number.isFinite(file.size) || file.size <= 0 || file.size > MAX_IMAGE_BYTES) {
        return { ok: false, reason: 'imageTooLarge' };
      }
    }
    return { ok: true, files: list };
  }

  function validateSubmission(input) {
    const type = normalizeText(input && input.type);
    const message = normalizeText(input && input.message);
    const contact = normalizeText(input && input.contact);
    if (!TYPES.includes(type)) return { ok: false, reason: 'invalidType' };
    if (message.length < MIN_MESSAGE_LENGTH) return { ok: false, reason: 'messageTooShort' };
    if (message.length > MAX_MESSAGE_LENGTH) return { ok: false, reason: 'messageTooLong' };
    if (contact.length > MAX_CONTACT_LENGTH || /[\r\n]/.test(contact)) {
      return { ok: false, reason: 'invalidContact' };
    }
    const fileResult = validateFiles(input && input.files);
    if (!fileResult.ok) return fileResult;
    return {
      ok: true,
      value: {
        type,
        message,
        contact,
        files: fileResult.files
      }
    };
  }

  function isConfigured() {
    try {
      const endpoint = new URL(CONFIG.endpoint);
      const permissionOrigin = new URL(CONFIG.permissionOrigin.replace(/\*$/, ''));
      return endpoint.protocol === 'https:' &&
        permissionOrigin.protocol === 'https:' &&
        endpoint.origin === permissionOrigin.origin;
    } catch {
      return false;
    }
  }

  return Object.freeze({
    CONFIG,
    TYPES,
    ALLOWED_IMAGE_TYPES,
    MAX_IMAGES,
    MAX_IMAGE_BYTES,
    MIN_MESSAGE_LENGTH,
    MAX_MESSAGE_LENGTH,
    MAX_CONTACT_LENGTH,
    normalizeText,
    validateFiles,
    validateSubmission,
    isConfigured
  });
});
