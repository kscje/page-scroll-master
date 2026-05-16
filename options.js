// 多语言翻译数据
const translations = {
  'zh-CN': {
    'settings.title': '页面滚动助手',
    'settings.language': '语言',
    'settings.scrollSpeed': '滚动速度',
    'settings.buttonPosition': '按钮位置',
    'settings.horizontalPosition': '水平位置',
    'settings.verticalAlignment': '垂直对齐方式',
    'settings.position.right': '右侧边缘',
    'settings.position.left': '左侧边缘',
    'settings.alignment.center': '居中显示',
    'settings.alignment.top': '顶部对齐',
    'settings.alignment.bottom': '底部对齐',
    'settings.buttonStyle': '按钮样式',
    'settings.buttonShape': '按钮形状',
    'settings.buttonShape.round': '圆形',
    'settings.buttonShape.square': '正方形',
    'settings.buttonSize': '按钮尺寸(px)',
    'settings.buttonSpacing': '按钮间距(px)',
    'settings.spacingError': '按钮间距必须在0px至800px之间',
    'settings.topButtonColor': '顶部按钮颜色',
    'settings.bottomButtonColor': '底部按钮颜色',
    'settings.opacity': '透明度',
    'settings.shortcutSettings': '快捷键设置',
    'settings.enableHoverHide': '启用鼠标悬停+快捷键隐藏按钮',
    'settings.hoverHideKey': '快捷键组合',
    'settings.hoverHideHint': '提示：当鼠标悬停在按钮上并按住所选快捷键时，按钮将平滑隐藏',
    'settings.preview': '实时预览',
    'settings.about': '关于插件',
    'settings.feedback': '如有任何建议或反馈，请联系插件制作者：',
    'settings.saveButton': '保存',
    'settings.saveSuccess': '保存成功!',
    'settings.sizeError': '按钮尺寸必须在10px至120px之间',
    'settings.colorNote': '默认颜色为 #4A9EDD，可点击上方选择器自定义',
    'settings.key.Alt': 'Alt',
    'settings.key.Ctrl': 'Ctrl',
    'settings.key.Shift': 'Shift',
    'settings.key.macAlt': 'Option (⌥)',
    'settings.key.macCtrl': 'Command (⌘)',
    'settings.key.macShift': 'Shift (⇧)'
  },
  'en-US': {
    'settings.title': 'Page Scroll Master',
    'settings.language': 'Language',
    'settings.scrollSpeed': 'Scroll Speed',
    'settings.buttonPosition': 'Button Position',
    'settings.horizontalPosition': 'Horizontal Position',
    'settings.verticalAlignment': 'Vertical Alignment',
    'settings.position.right': 'Right Edge',
    'settings.position.left': 'Left Edge',
    'settings.alignment.center': 'Center',
    'settings.alignment.top': 'Top',
    'settings.alignment.bottom': 'Bottom',
    'settings.buttonStyle': 'Button Style',
    'settings.buttonShape': 'Button Shape',
    'settings.buttonShape.round': 'Round',
    'settings.buttonShape.square': 'Square',
    'settings.buttonSize': 'Button Size(px)',
    'settings.buttonSpacing': 'Button Spacing(px)',
    'settings.spacingError': 'Button spacing must be between 0px and 800px',
    'settings.topButtonColor': 'Top Button Color',
    'settings.bottomButtonColor': 'Bottom Button Color',
    'settings.opacity': 'Opacity',
    'settings.shortcutSettings': 'Shortcut Settings',
    'settings.enableHoverHide': 'Enable hover + shortcut to hide buttons',
    'settings.hoverHideKey': 'Shortcut key',
    'settings.hoverHideHint': 'Hint: When hovering over buttons and pressing the selected shortcut key, buttons will smoothly hide',
    'settings.preview': 'Live Preview',
    'settings.about': 'About Plugin',
    'settings.feedback': 'For any suggestions or feedback, please contact the plugin developer:',
    'settings.saveButton': 'Save',
    'settings.saveSuccess': 'Saved successfully!',
    'settings.sizeError': 'Button size must be between 10px and 120px',
    'settings.colorNote': 'Default color is #4A9EDD, click the selector above to customize',
    'settings.key.Alt': 'Alt',
    'settings.key.Ctrl': 'Ctrl',
    'settings.key.Shift': 'Shift',
    'settings.key.macAlt': 'Option (⌥)',
    'settings.key.macCtrl': 'Command (⌘)',
    'settings.key.macShift': 'Shift (⇧)'
  }
};

// 检测操作系统平台
function detectPlatform() {
  const platform = navigator.platform.toLowerCase();
  const userAgent = navigator.userAgent.toLowerCase();
  
  if (platform.indexOf('mac') >= 0 || userAgent.indexOf('mac') >= 0) {
    return 'macos';
  } else if (platform.indexOf('linux') >= 0 || userAgent.indexOf('linux') >= 0) {
    return 'linux';
  } else {
    return 'windows';
  }
}

// 获取平台特定的快捷键显示名称（支持多语言）
function getPlatformKeyName(key, platform, lang) {
  const isMac = platform === 'macos';
  const translationKey = isMac ? `settings.key.mac${key}` : `settings.key.${key}`;
  
  // 优先使用翻译，如果没有则使用默认值
  if (translations[lang] && translations[lang][translationKey]) {
    return translations[lang][translationKey];
  }
  
  // 默认回退值
  const defaultNames = {
    'windows': {
      'Alt': 'Alt',
      'Ctrl': 'Ctrl',
      'Shift': 'Shift'
    },
    'macos': {
      'Alt': 'Option (⌥)',
      'Ctrl': 'Command (⌘)',
      'Shift': 'Shift (⇧)'
    },
    'linux': {
      'Alt': 'Alt',
      'Ctrl': 'Ctrl',
      'Shift': 'Shift'
    }
  };
  
  return defaultNames[platform]?.[key] || key;
}

// 更新快捷键下拉选项的显示文本
async function updateShortcutKeyDisplay() {
  const platform = detectPlatform();
  const lang = await getCurrentLanguage();
  const select = document.getElementById('hoverHideKey');
  if (!select) return;
  
  const options = select.querySelectorAll('option');
  options.forEach(option => {
    const key = option.value;
    option.textContent = getPlatformKeyName(key, platform, lang);
  });
}

// 获取当前语言
function getCurrentLanguage() {
  return new Promise((resolve) => {
    chrome.storage.sync.get('language', (result) => {
      if (result.language && result.language !== 'auto') {
        resolve(result.language);
      } else {
        // 自动检测语言
        const browserLang = navigator.language || navigator.userLanguage;
        const lang = browserLang.startsWith('zh') ? 'zh-CN' : 'en-US';
        resolve(lang);
      }
    });
  });
}

// 应用翻译
function applyTranslation(lang) {
  const elements = document.querySelectorAll('[data-i18n]');
  elements.forEach(element => {
    const key = element.getAttribute('data-i18n');
    if (translations[lang] && translations[lang][key]) {
      element.textContent = translations[lang][key];
    }
  });
}

// 统一的间距规范（像素）
const BUTTON_GAP = 8; // 按钮之间的标准间距
const EDGE_OFFSET = 10; // 距离边缘的标准偏移

// 更新预览按钮样式和位置 - 预览按钮直接显示在设置页面上
function updatePreviewButtons() {
  const topButton = document.getElementById('previewTopButton');
  const bottomButton = document.getElementById('previewBottomButton');
  if (!topButton || !bottomButton) return;
  
  // 获取当前设置
  const buttonSize = parseInt(document.getElementById('buttonSize').value);
  const buttonShape = document.getElementById('buttonShape').value;
  const buttonSpacing = parseInt(document.getElementById('buttonSpacing').value);
  const topButtonColor = document.getElementById('topButtonColor').value;
  const bottomButtonColor = document.getElementById('bottomButtonColor').value;
  const opacity = parseInt(document.getElementById('opacity').value) / 100;
  const horizontalPosition = document.getElementById('horizontalPosition').value;
  const verticalAlignment = document.getElementById('verticalAlignment').value;
  
  // 验证并调整按钮尺寸（允许10-120px范围）
  let displaySize = buttonSize;
  if (isNaN(displaySize)) {
    displaySize = 40; // 默认值
  } else if (displaySize < 10) {
    displaySize = 10;
  } else if (displaySize > 120) {
    displaySize = 120;
  }
  
  // 验证并调整按钮间距
  let displaySpacing = buttonSpacing;
  if (isNaN(displaySpacing)) {
    displaySpacing = 8;
  } else if (displaySpacing < 0) {
    displaySpacing = 0;
  } else if (displaySpacing > 800) {
    displaySpacing = 800;
  }
  
  // 计算按钮位置 - 使用fixed定位直接显示在设置页面上
  let leftPos, rightPos;
  
  // 水平位置
  if (horizontalPosition === 'left') {
    leftPos = EDGE_OFFSET + 'px';
    rightPos = 'auto';
  } else {
    // right (默认)
    leftPos = 'auto';
    rightPos = EDGE_OFFSET + 'px';
  }
  
  // 强制设置按钮尺寸
  const size = displaySize + 'px';
  
  // 计算按钮组的总高度（两个按钮 + 间距）
  const totalGroupHeight = (displaySize * 2) + displaySpacing;
  
  // 顶部按钮位置计算
  let topButtonTop, topButtonBottom;
  if (verticalAlignment === 'center') {
    // 居中模式：按钮组整体居中，不使用transform避免弹跳
    // 计算从视口顶部到按钮组顶部的距离
    const groupTopOffset = `calc(50% - ${totalGroupHeight / 2}px)`;
    topButtonTop = groupTopOffset;
    topButtonBottom = 'auto';
  } else if (verticalAlignment === 'top') {
    topButtonTop = EDGE_OFFSET + 'px';
    topButtonBottom = 'auto';
  } else {
    // bottom
    topButtonTop = 'auto';
    topButtonBottom = `calc(${EDGE_OFFSET}px + ${displaySize + displaySpacing}px)`;
  }
  
  // 底部按钮位置计算
  let bottomButtonTop, bottomButtonBottom;
  if (verticalAlignment === 'center') {
    // 居中模式：底部按钮在顶部按钮下方固定间距
    const groupTopOffset = `calc(50% - ${totalGroupHeight / 2}px)`;
    bottomButtonTop = `calc(${groupTopOffset} + ${displaySize + displaySpacing}px)`;
    bottomButtonBottom = 'auto';
  } else if (verticalAlignment === 'top') {
    bottomButtonTop = `calc(${EDGE_OFFSET}px + ${displaySize + displaySpacing}px)`;
    bottomButtonBottom = 'auto';
  } else {
    // bottom
    bottomButtonTop = 'auto';
    bottomButtonBottom = EDGE_OFFSET + 'px';
  }
  
  // 使用 requestAnimationFrame 确保流畅更新，避免弹跳
  requestAnimationFrame(() => {
    // 设置顶部按钮样式 - 使用fixed定位
    topButton.style.width = size;
    topButton.style.height = size;
    topButton.style.borderRadius = buttonShape === 'square' ? '4px' : '50%';
    topButton.style.backgroundColor = topButtonColor;
    topButton.style.opacity = opacity;
    topButton.style.left = leftPos;
    topButton.style.right = rightPos;
    topButton.style.top = topButtonTop;
    topButton.style.bottom = topButtonBottom;
    // 移除transform，使用精确计算的位置避免弹跳
    topButton.style.transform = 'none';
    topButton.style.willChange = 'top, bottom, width, height';
    
    // 设置底部按钮样式 - 使用fixed定位
    bottomButton.style.width = size;
    bottomButton.style.height = size;
    bottomButton.style.borderRadius = buttonShape === 'square' ? '4px' : '50%';
    bottomButton.style.backgroundColor = bottomButtonColor;
    bottomButton.style.opacity = opacity;
    bottomButton.style.left = leftPos;
    bottomButton.style.right = rightPos;
    bottomButton.style.top = bottomButtonTop;
    bottomButton.style.bottom = bottomButtonBottom;
    // 移除transform，使用精确计算的位置避免弹跳
    bottomButton.style.transform = 'none';
    bottomButton.style.willChange = 'top, bottom, width, height';
    
    // 更新SVG图标样式 - 确保与实际页面完全一致
    const topIcon = topButton.querySelector('svg');
    const bottomIcon = bottomButton.querySelector('svg');
    
    // 计算图标大小（与实际页面一致）
    const iconSize = Math.max(40, Math.min(70, displaySize * 0.6)) + '%';
    
    if (topIcon) {
      topIcon.style.width = iconSize;
      topIcon.style.height = iconSize;
      topIcon.style.stroke = 'white';
      topIcon.style.strokeWidth = 3;
      topIcon.style.display = 'block';
      topIcon.style.fill = 'none';
      topIcon.style.strokeLinecap = 'round';
      topIcon.style.strokeLinejoin = 'round';
    }
    
    if (bottomIcon) {
      bottomIcon.style.width = iconSize;
      bottomIcon.style.height = iconSize;
      bottomIcon.style.stroke = 'white';
      bottomIcon.style.strokeWidth = 3;
      bottomIcon.style.display = 'block';
      bottomIcon.style.fill = 'none';
      bottomIcon.style.strokeLinecap = 'round';
      bottomIcon.style.strokeLinejoin = 'round';
    }
  });
  
  // 更新悬停效果颜色
  const styleElement = document.getElementById('preview-button-styles');
  if (styleElement) {
    styleElement.remove();
  }
  
  const newStyle = document.createElement('style');
  newStyle.id = 'preview-button-styles';
  newStyle.textContent = `
    #previewTopButton:hover {
      background-color: ${adjustColorBrightness(topButtonColor, -10)} !important;
      transform: scale(1.1) !important;
    }
    #previewTopButton:active {
      transform: scale(0.95) !important;
    }
    #previewBottomButton:hover {
      background-color: ${adjustColorBrightness(bottomButtonColor, -10)} !important;
      transform: scale(1.1) !important;
    }
    #previewBottomButton:active {
      transform: scale(0.95) !important;
    }
  `;
  document.head.appendChild(newStyle);
}

// 预览按钮点击事件处理
function setupPreviewButtonInteractions() {
  const topButton = document.getElementById('previewTopButton');
  const bottomButton = document.getElementById('previewBottomButton');
  if (!topButton || !bottomButton) return;
  
  // 获取滚动速度设置
  function getScrollSpeed() {
    const speedInput = document.getElementById('scrollSpeed');
    return speedInput ? parseInt(speedInput.value) : 100;
  }
  
  // 平滑滚动到顶部
  topButton.addEventListener('click', () => {
    const speed = getScrollSpeed();
    window.scrollTo({
      top: 0,
      behavior: speed < 100 ? 'auto' : 'smooth'
    });
  });
  
  // 平滑滚动到底部
  bottomButton.addEventListener('click', () => {
    const speed = getScrollSpeed();
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: speed < 100 ? 'auto' : 'smooth'
    });
  });
}

// 调整颜色亮度
function adjustColorBrightness(color, percent) {
  const num = parseInt(color.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) + amt;
  const G = (num >> 8 & 0x00FF) + amt;
  const B = (num & 0x0000FF) + amt;
  return '#' + (0x1000000 + (R<255?R<1?0:R:255)*0x10000 + (G<255?G<1?0:G:255)*0x100 + (B<255?B<1?0:B:255)).toString(16).slice(1);
}

// 加载保存的设置
function loadSettings() {
  chrome.storage.sync.get(['scrollSpeed', 'buttonSettings', 'language'], (result) => {
    if (result.scrollSpeed) {
      document.getElementById('scrollSpeed').value = result.scrollSpeed;
      document.getElementById('speedValue').textContent = result.scrollSpeed + 'ms';
    }
    
    if (result.buttonSettings) {
      const buttonSettings = result.buttonSettings;
      document.getElementById('horizontalPosition').value = buttonSettings.horizontalPosition || 'right';
      document.getElementById('verticalAlignment').value = buttonSettings.verticalAlignment || 'center';
      document.getElementById('buttonSize').value = buttonSettings.buttonSize || 40;
      document.getElementById('buttonShape').value = buttonSettings.buttonShape || 'round';
      document.getElementById('buttonSpacing').value = buttonSettings.buttonSpacing || 8;
      // 使用用户保存的颜色或默认颜色 #4A9EDD
      const defaultColor = '#4A9EDD';
      const topColor = buttonSettings.topButtonColor || defaultColor;
      const bottomColor = buttonSettings.bottomButtonColor || defaultColor;
      document.getElementById('topButtonColor').value = topColor;
      document.getElementById('topButtonColorHex').value = topColor;
      document.getElementById('bottomButtonColor').value = bottomColor;
      document.getElementById('bottomButtonColorHex').value = bottomColor;
      document.getElementById('opacity').value = buttonSettings.opacity || 100;
      document.getElementById('opacityValue').textContent = (buttonSettings.opacity || 100) + '%';
      document.getElementById('enableHoverHide').checked = buttonSettings.enableHoverHide !== false;
      document.getElementById('hoverHideKey').value = buttonSettings.hoverHideKey || 'Ctrl';
    }
    
    // 初始化预览按钮
    updatePreviewButtons();
    
    if (result.language) {
      document.getElementById('languageSelector').value = result.language;
    }
    
    // 应用语言设置
    getCurrentLanguage().then(lang => {
      applyTranslation(lang);
    });
  });
}



// 保存设置
function saveSettings() {
  const scrollSpeed = parseInt(document.getElementById('scrollSpeed').value);
  const buttonSize = parseInt(document.getElementById('buttonSize').value);
  const buttonSpacing = parseInt(document.getElementById('buttonSpacing').value);
  
  // 验证按钮尺寸 - 由于实时输入限制，这里可以简化验证
  if (isNaN(buttonSize) || buttonSize < 10 || buttonSize > 120) {
    return;
  }
  
  // 验证按钮间距
  if (isNaN(buttonSpacing) || buttonSpacing < 0 || buttonSpacing > 800) {
    return;
  }
  
  // 颜色验证函数
  function validateHexColor(color) {
    const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    return hexRegex.test(color) ? color : '#4A9EDD';
  }
  
  const buttonSettings = {
    showButton: true, // 始终显示按钮
    horizontalPosition: document.getElementById('horizontalPosition').value,
    verticalAlignment: document.getElementById('verticalAlignment').value,
    buttonSize: buttonSize,
    buttonSizeUnit: 'px', // 固定为px单位
    buttonShape: document.getElementById('buttonShape').value,
    buttonSpacing: buttonSpacing,
    topButtonColor: validateHexColor(document.getElementById('topButtonColor').value),
    bottomButtonColor: validateHexColor(document.getElementById('bottomButtonColor').value),
    opacity: parseInt(document.getElementById('opacity').value),
    enableHoverHide: document.getElementById('enableHoverHide').checked,
    hoverHideKey: document.getElementById('hoverHideKey').value
  };
  const language = document.getElementById('languageSelector').value;
  
  chrome.storage.sync.set({scrollSpeed: scrollSpeed, buttonSettings: buttonSettings, language: language}, () => {
    // 显示保存成功提示
    const saveButton = document.getElementById('saveButton');
    const originalText = saveButton.textContent;
    
    getCurrentLanguage().then(lang => {
      const successText = translations[lang] && translations[lang]['settings.saveSuccess'] || 'Saved successfully!';
      saveButton.textContent = successText;
      saveButton.style.backgroundColor = '#4CAF50';
      
      setTimeout(() => {
        saveButton.textContent = originalText;
        saveButton.style.backgroundColor = '';
      }, 1500);
    });
    
    // 通知所有标签页更新设置
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      const tab = tabs[0];
      if (!tab || !tab.id) {
        return;
      }

      chrome.tabs.sendMessage(tab.id, {action: 'updateSpeed', speed: scrollSpeed}, () => {
        if (chrome.runtime.lastError) {
          return;
        }
      });
      chrome.tabs.sendMessage(tab.id, {action: 'updateButtonSettings', settings: buttonSettings}, () => {
        if (chrome.runtime.lastError) {
          return;
        }
      });
    });
  });
}

// 初始化页面
function init() {
  loadSettings();
  
  // 更新快捷键显示（根据操作系统平台）
  updateShortcutKeyDisplay();
  
  // 监听滚动速度变化
  document.getElementById('scrollSpeed').addEventListener('input', (e) => {
    document.getElementById('speedValue').textContent = e.target.value + 'ms';
  });
  
  // 监听颜色选择器变化
  document.getElementById('topButtonColor').addEventListener('input', (e) => {
    document.getElementById('topButtonColorHex').value = e.target.value;
    updatePreviewButtons();
  });
  
  document.getElementById('topButtonColorHex').addEventListener('input', (e) => {
    // 验证颜色格式
    const colorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    if (colorRegex.test(e.target.value)) {
      document.getElementById('topButtonColor').value = e.target.value;
      updatePreviewButtons();
    }
  });
  
  document.getElementById('bottomButtonColor').addEventListener('input', (e) => {
    document.getElementById('bottomButtonColorHex').value = e.target.value;
    updatePreviewButtons();
  });
  
  document.getElementById('bottomButtonColorHex').addEventListener('input', (e) => {
    // 验证颜色格式
    const colorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    if (colorRegex.test(e.target.value)) {
      document.getElementById('bottomButtonColor').value = e.target.value;
      updatePreviewButtons();
    }
  });
  
  // 监听按钮尺寸变化
  const buttonSizeInput = document.getElementById('buttonSize');
  const sizeError = document.getElementById('sizeError');
  
  // 实时输入限制
  buttonSizeInput.addEventListener('input', (e) => {
    const value = e.target.value;
    // 允许清空输入
    if (value === '') {
      sizeError.style.display = 'none';
      updatePreviewButtons();
      return;
    }
    
    const numValue = parseInt(value);
    if (isNaN(numValue)) {
      sizeError.style.display = 'none';
    } else if (numValue < 10 || numValue > 120) {
      getCurrentLanguage().then(lang => {
        const errorText = translations[lang] && translations[lang]['settings.sizeError'] || 'Button size must be between 10px and 120px';
        sizeError.textContent = errorText;
        sizeError.style.display = 'block';
      });
    } else {
      sizeError.style.display = 'none';
    }
    updatePreviewButtons();
  });
  
  // 鼠标移出时显示错误提示
  buttonSizeInput.addEventListener('blur', (e) => {
    const value = e.target.value;
    if (value === '') {
      sizeError.style.display = 'none';
      return;
    }
    
    const numValue = parseInt(value);
    if (numValue < 10 || numValue > 120) {
      getCurrentLanguage().then(lang => {
        const errorText = translations[lang] && translations[lang]['settings.sizeError'] || 'Button size must be between 10px and 120px';
        sizeError.textContent = errorText;
        sizeError.style.display = 'block';
      });
    } else {
      sizeError.style.display = 'none';
    }
  });
  
  // 鼠标移入时隐藏错误提示
  buttonSizeInput.addEventListener('focus', () => {
    sizeError.style.display = 'none';
  });
  
  // 监听按钮间距变化
  const buttonSpacingInput = document.getElementById('buttonSpacing');
  const spacingError = document.getElementById('spacingError');
  
  buttonSpacingInput.addEventListener('input', (e) => {
    const value = e.target.value;
    if (value === '') {
      spacingError.style.display = 'none';
      updatePreviewButtons();
      return;
    }
    
    const numValue = parseInt(value);
    if (isNaN(numValue)) {
      spacingError.style.display = 'none';
    } else if (numValue < 0 || numValue > 800) {
      getCurrentLanguage().then(lang => {
        const errorText = translations[lang] && translations[lang]['settings.spacingError'] || 'Button spacing must be between 0px and 800px';
        spacingError.textContent = errorText;
        spacingError.style.display = 'block';
      });
    } else {
      spacingError.style.display = 'none';
    }
    updatePreviewButtons();
  });
  
  buttonSpacingInput.addEventListener('blur', (e) => {
    const value = e.target.value;
    if (value === '') {
      spacingError.style.display = 'none';
      return;
    }
    
    const numValue = parseInt(value);
    if (numValue < 0 || numValue > 800) {
      getCurrentLanguage().then(lang => {
        const errorText = translations[lang] && translations[lang]['settings.spacingError'] || 'Button spacing must be between 0px and 800px';
        spacingError.textContent = errorText;
        spacingError.style.display = 'block';
      });
    } else {
      spacingError.style.display = 'none';
    }
  });
  
  buttonSpacingInput.addEventListener('focus', () => {
    spacingError.style.display = 'none';
  });
  
  // 监听透明度变化
  document.getElementById('opacity').addEventListener('input', (e) => {
    document.getElementById('opacityValue').textContent = e.target.value + '%';
    updatePreviewButtons();
  });
  
  // 监听水平位置变化
  document.getElementById('horizontalPosition').addEventListener('change', () => {
    updatePreviewButtons();
  });
  
  // 监听垂直对齐方式变化
  document.getElementById('verticalAlignment').addEventListener('change', () => {
    updatePreviewButtons();
  });
  
  // 监听按钮形状变化
  document.getElementById('buttonShape').addEventListener('change', () => {
    updatePreviewButtons();
  });
  
  // 监听语言选择变化
  document.getElementById('languageSelector').addEventListener('change', (e) => {
    const lang = e.target.value;
    if (lang === 'auto') {
      getCurrentLanguage().then(detectedLang => {
        applyTranslation(detectedLang);
      });
    } else {
      applyTranslation(lang);
    }
  });
  
  // 保存按钮点击事件
  document.getElementById('saveButton').addEventListener('click', saveSettings);
  
  // 设置预览按钮交互
  setupPreviewButtonInteractions();
  
  // 监听窗口大小变化，确保预览效果在不同屏幕尺寸下保持准确
  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      updatePreviewButtons();
    }, 100); // 防抖处理，100ms后更新
  });
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', init);
