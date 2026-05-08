function applyPopupTranslations() {
  document.querySelectorAll('[data-i18n]').forEach((element) => {
    const message = chrome.i18n.getMessage(element.dataset.i18n);
    if (message) {
      element.textContent = message;
    }
  });
}

function sendActionToActiveTab(action) {
  chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
    const tab = tabs[0];
    if (!tab || !tab.id) {
      return;
    }

    chrome.tabs.sendMessage(tab.id, {action}, () => {
      // Some pages, such as chrome:// or the Web Store, cannot receive content-script messages.
      if (chrome.runtime.lastError) {
        return;
      }
    });
  });
}

applyPopupTranslations();

document.getElementById('scrollTop').addEventListener('click', () => {
  sendActionToActiveTab('scrollToTop');
});

document.getElementById('scrollBottom').addEventListener('click', () => {
  sendActionToActiveTab('scrollToBottom');
});

document.getElementById('openSettings').addEventListener('click', () => {
  chrome.runtime.openOptionsPage();
});
