// 监听快捷键命令
chrome.commands.onCommand.addListener((command) => {
  const actionMap = {
    'scroll-to-top': 'scrollToTop',
    'scroll-to-bottom': 'scrollToBottom'
  };
  const action = actionMap[command];
  if (!action) {
    return;
  }

  chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
    const tab = tabs[0];
    if (!tab || !tab.id) {
      return;
    }

    chrome.tabs.sendMessage(tab.id, {action}, () => {
      // Ignore pages where content scripts cannot run, such as chrome:// pages.
      if (chrome.runtime.lastError) {
        return;
      }
    });
  });
});
