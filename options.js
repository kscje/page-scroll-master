// 多语言翻译数据
const translations = {
  'zh-CN': {
    'settings.title': '智能页面滚动导航器',
    'settings.subtitle': '配置滚动按钮、阅读进度和网站启用状态。',
    'settings.tab.basic': '基础设置',
    'settings.tab.advanced': '高级功能',
    'settings.tab.domains': '域名管理',
    'settings.tab.feedback': '建议&反馈',
    'settings.basicIntro': '调整滚动速度、按钮位置、外观图标和快捷键。',
    'settings.advancedIntro': '配置页面进度条的显示方式和交互行为。',
    'settings.domainIntro': '管理不同网站中滚动按钮的启用或禁用状态。',
    'settings.scrollBehavior': '滚动行为',
    'settings.buttonIcons': '按钮图标',
    'settings.progressBar': '页面进度条',
    'settings.aboutDescription': '智能页面滚动导航器用于在网页中快速跳转到顶部或底部，并支持阅读进度、进度跳转与站点启用状态配置。',
    'settings.versionLabel': '当前版本：',
    'settings.authorLabel': '插件作者：',
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
    'settings.edgeDistance': '边缘距离(px)',
    'settings.edgeDistanceError': '边缘距离必须在0px至200px之间',
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
    'settings.title': 'Smart Scroll Navigator',
    'settings.subtitle': 'Configure scroll buttons, reading progress, and site enable status.',
    'settings.tab.basic': 'Basic Settings',
    'settings.tab.advanced': 'Advanced Features',
    'settings.tab.domains': 'Domain Management',
    'settings.tab.feedback': 'Suggestions & Feedback',
    'settings.basicIntro': 'Adjust scroll speed, button position, appearance, icons, and shortcuts.',
    'settings.advancedIntro': 'Configure page progress display and interaction behavior.',
    'settings.domainIntro': 'Manage whether scroll buttons are enabled or disabled on specific sites.',
    'settings.scrollBehavior': 'Scroll Behavior',
    'settings.buttonIcons': 'Button Icons',
    'settings.progressBar': 'Page Progress Bar',
    'settings.aboutDescription': 'Smart Scroll Navigator helps you jump to the top or bottom of pages, track reading progress, and manage per-site enable settings.',
    'settings.versionLabel': 'Version: ',
    'settings.authorLabel': 'Author: ',
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
    'settings.edgeDistance': 'Distance from Edge(px)',
    'settings.edgeDistanceError': 'Distance from edge must be between 0px and 200px',
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

Object.assign(translations['zh-CN'], {
  'settings.advancedFeatures': '高级功能',
  'settings.progressBarEnabled': '启用页面进度条',
  'settings.progressBarMode': '显示样式',
  'settings.progressBarMode.verticalButton': '纵向进度按钮',
  'settings.progressBarMode.horizontalBar': '横向页面边缘进度条',
  'settings.progressVerticalHeight': '纵向高度(px)',
  'settings.progressHorizontalPosition': '横向位置',
  'settings.progressHorizontalPosition.top': '顶部',
  'settings.progressHorizontalPosition.bottom': '底部',
  'settings.progressThickness': '横向粗细(px)',
  'settings.progressColorMode': '进度颜色',
  'settings.progressColorMode.followTopButton': '跟随顶部按钮',
  'settings.progressColorMode.followBottomButton': '跟随底部按钮',
  'settings.progressColorMode.custom': '自定义',
  'settings.progressCustomColor': '自定义进度颜色',
  'settings.progressClickToJump': '点击进度条跳转',
  'settings.progressShowPercentage': '显示百分比',
  'settings.progressShowRemainingTime': '显示剩余阅读时间',
  'settings.progressInfiniteNote': '无限滚动页面中进度可能随着内容加载而变化。',
  'settings.iconSet': '图标样式',
  'settings.iconSet.defaultArrow': '默认箭头',
  'settings.iconSet.triangle': '三角形',
  'settings.iconSet.chevron': '折线箭头',
  'settings.iconSet.doubleArrow': '双箭头',
  'settings.iconColor': '图标颜色',
  'settings.customIconComingSoon': '上传自定义图标 Coming soon。',
  'settings.siteManagement': '网站启用状态',
  'settings.domainSearch': '搜索域名',
  'settings.domainInput': 'example.com 或 https://example.com/page',
  'settings.domainEnabled': '启用',
  'settings.domainDisabled': '禁用',
  'settings.domainEmpty': '暂无手动设置的网站。',
  'settings.addDomain': '添加域名',
  'settings.clearDisabledSites': '清除已关闭站点',
  'settings.restoreAllSites': '恢复全部启用',
  'settings.deleteDomain': '删除',
  'settings.invalidDomain': '请输入有效的 http/https 网站域名。',
  'settings.verticalHeightError': '纵向高度必须在40px至400px之间'
});

Object.assign(translations['en-US'], {
  'settings.advancedFeatures': 'Advanced Features',
  'settings.progressBarEnabled': 'Enable page progress bar',
  'settings.progressBarMode': 'Display style',
  'settings.progressBarMode.verticalButton': 'Vertical progress button',
  'settings.progressBarMode.horizontalBar': 'Horizontal page edge bar',
  'settings.progressVerticalHeight': 'Vertical height(px)',
  'settings.progressHorizontalPosition': 'Horizontal position',
  'settings.progressHorizontalPosition.top': 'Top',
  'settings.progressHorizontalPosition.bottom': 'Bottom',
  'settings.progressThickness': 'Horizontal thickness(px)',
  'settings.progressColorMode': 'Progress color',
  'settings.progressColorMode.followTopButton': 'Follow top button',
  'settings.progressColorMode.followBottomButton': 'Follow bottom button',
  'settings.progressColorMode.custom': 'Custom',
  'settings.progressCustomColor': 'Custom progress color',
  'settings.progressClickToJump': 'Click progress bar to jump',
  'settings.progressShowPercentage': 'Show percentage',
  'settings.progressShowRemainingTime': 'Show remaining reading time',
  'settings.progressInfiniteNote': 'On infinite scrolling pages, progress may change as new content loads.',
  'settings.iconSet': 'Icon style',
  'settings.iconSet.defaultArrow': 'Default arrow',
  'settings.iconSet.triangle': 'Triangle',
  'settings.iconSet.chevron': 'Chevron',
  'settings.iconSet.doubleArrow': 'Double arrow',
  'settings.iconColor': 'Icon color',
  'settings.customIconComingSoon': 'Custom icon upload Coming soon.',
  'settings.siteManagement': 'Site Enable Status',
  'settings.domainSearch': 'Search domains',
  'settings.domainInput': 'example.com or https://example.com/page',
  'settings.domainEnabled': 'Enabled',
  'settings.domainDisabled': 'Disabled',
  'settings.domainEmpty': 'No manually configured sites yet.',
  'settings.addDomain': 'Add domain',
  'settings.clearDisabledSites': 'Clear disabled sites',
  'settings.restoreAllSites': 'Restore all enabled',
  'settings.deleteDomain': 'Delete',
  'settings.invalidDomain': 'Enter a valid http/https website hostname.',
  'settings.verticalHeightError': 'Vertical height must be between 40px and 400px'
});

translations['es-ES'] = Object.assign({}, translations['en-US'], {
  'settings.title': 'Navegador Scroll Inteligente',
  'settings.subtitle': 'Configura botones de desplazamiento, progreso de lectura y estado por sitio.',
  'settings.tab.basic': 'Basico',
  'settings.tab.advanced': 'Avanzado',
  'settings.tab.domains': 'Dominios',
  'settings.tab.feedback': 'Sugerencias',
  'settings.basicIntro': 'Ajusta velocidad, posicion, apariencia, iconos y atajos.',
  'settings.advancedIntro': 'Configura la visualizacion e interaccion del progreso de lectura.',
  'settings.domainIntro': 'Gestiona si los botones estan activos o inactivos en sitios concretos.',
  'settings.scrollBehavior': 'Desplazamiento',
  'settings.buttonIcons': 'Iconos de botones',
  'settings.progressBar': 'Barra de progreso de pagina',
  'settings.aboutDescription': 'Navegador Scroll Inteligente te ayuda a ir al inicio o final, ver el progreso de lectura y gestionar ajustes por sitio.',
  'settings.versionLabel': 'Version: ',
  'settings.authorLabel': 'Autor: ',
  'settings.language': 'Idioma',
  'settings.scrollSpeed': 'Velocidad de desplazamiento',
  'settings.buttonPosition': 'Posicion del boton',
  'settings.horizontalPosition': 'Posicion horizontal',
  'settings.verticalAlignment': 'Alineacion vertical',
  'settings.position.right': 'Borde derecho',
  'settings.position.left': 'Borde izquierdo',
  'settings.alignment.center': 'Centro',
  'settings.alignment.top': 'Arriba',
  'settings.alignment.bottom': 'Abajo',
  'settings.buttonStyle': 'Estilo del boton',
  'settings.buttonShape': 'Forma del boton',
  'settings.buttonShape.round': 'Redondo',
  'settings.buttonShape.square': 'Cuadrado',
  'settings.buttonSize': 'Tamano del boton(px)',
  'settings.buttonSpacing': 'Espaciado de botones(px)',
  'settings.edgeDistance': 'Distancia al borde(px)',
  'settings.opacity': 'Opacidad',
  'settings.shortcutSettings': 'Atajos',
  'settings.enableHoverHide': 'Ocultar botones al pasar el cursor + atajo',
  'settings.hoverHideKey': 'Tecla de atajo',
  'settings.preview': 'Vista previa',
  'settings.about': 'Acerca de',
  'settings.feedback': 'Para sugerencias o comentarios, contacta al desarrollador:',
  'settings.saveButton': 'Guardar',
  'settings.saveSuccess': 'Guardado correctamente!',
  'settings.advancedFeatures': 'Funciones avanzadas',
  'settings.progressBarEnabled': 'Activar barra de progreso de pagina',
  'settings.progressBarMode.verticalButton': 'Boton vertical de progreso',
  'settings.progressBarMode.horizontalBar': 'Barra horizontal en el borde',
  'settings.siteManagement': 'Estado por sitio',
  'settings.domainEnabled': 'Activado',
  'settings.domainDisabled': 'Desactivado',
  'settings.addDomain': 'Agregar dominio',
  'settings.deleteDomain': 'Eliminar'
});

translations['ja-JP'] = Object.assign({}, translations['en-US'], {
  'settings.title': 'スマートスクロールナビ',
  'settings.subtitle': 'スクロールボタン、読書進捗、サイトごとの有効状態を設定します。',
  'settings.tab.basic': '基本設定',
  'settings.tab.advanced': '高度な機能',
  'settings.tab.domains': 'ドメイン管理',
  'settings.tab.feedback': '提案とフィードバック',
  'settings.basicIntro': 'スクロール速度、ボタン位置、外観、アイコン、ショートカットを調整します。',
  'settings.advancedIntro': '読書進捗バーの表示と操作を設定します。',
  'settings.domainIntro': 'サイトごとのスクロールボタンの有効・無効を管理します。',
  'settings.scrollBehavior': 'スクロール動作',
  'settings.buttonIcons': 'ボタンアイコン',
  'settings.progressBar': 'ページ進捗バー',
  'settings.aboutDescription': 'スマートスクロールナビは、ページの先頭や末尾への移動、読書進捗の表示、サイト別の有効設定をサポートします。',
  'settings.versionLabel': '現在のバージョン：',
  'settings.authorLabel': '作者：',
  'settings.language': '言語',
  'settings.scrollSpeed': 'スクロール速度',
  'settings.buttonPosition': 'ボタン位置',
  'settings.horizontalPosition': '水平位置',
  'settings.verticalAlignment': '垂直位置',
  'settings.position.right': '右端',
  'settings.position.left': '左端',
  'settings.alignment.center': '中央',
  'settings.alignment.top': '上',
  'settings.alignment.bottom': '下',
  'settings.buttonStyle': 'ボタンスタイル',
  'settings.buttonShape': 'ボタン形状',
  'settings.buttonShape.round': '丸',
  'settings.buttonShape.square': '四角',
  'settings.buttonSize': 'ボタンサイズ(px)',
  'settings.buttonSpacing': 'ボタン間隔(px)',
  'settings.edgeDistance': '端からの距離(px)',
  'settings.opacity': '透明度',
  'settings.shortcutSettings': 'ショートカット設定',
  'settings.enableHoverHide': 'ホバー + ショートカットでボタンを隠す',
  'settings.hoverHideKey': 'ショートカットキー',
  'settings.preview': 'ライブプレビュー',
  'settings.about': '拡張機能について',
  'settings.feedback': 'ご意見やフィードバックはこちらへ:',
  'settings.saveButton': '保存',
  'settings.saveSuccess': '保存しました!',
  'settings.advancedFeatures': '高度な機能',
  'settings.progressBarEnabled': 'ページ進捗バーを有効化',
  'settings.progressBarMode.verticalButton': '縦型進捗ボタン',
  'settings.progressBarMode.horizontalBar': '画面端の横型バー',
  'settings.siteManagement': 'サイトごとの有効状態',
  'settings.domainEnabled': '有効',
  'settings.domainDisabled': '無効',
  'settings.addDomain': 'ドメインを追加',
  'settings.deleteDomain': '削除'
});

const DEFAULT_ADVANCED_SETTINGS = {
  progressBar: {
    enabled: false,
    mode: 'verticalButton',
    horizontalPosition: 'top',
    colorMode: 'followTopButton',
    customColor: '#4A9EDD',
    thickness: 4,
    verticalHeight: 120,
    clickToJump: true,
    showPercentage: true,
    showRemainingTime: false
  },
  iconCustomization: {
    enabled: true,
    iconSet: 'defaultArrow',
    iconColor: '#FFFFFF',
    customIcon: {
      enabled: false,
      topIconDataUrl: '',
      bottomIconDataUrl: ''
    }
  }
};

let advancedSettingsState = mergeAdvancedSettings();
let enableStates = {};
let domainSearchText = '';

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

function normalizeLanguage(browserLang) {
  const lang = (browserLang || '').toLowerCase();
  if (lang.startsWith('zh')) return 'zh-CN';
  if (lang.startsWith('es')) return 'es-ES';
  if (lang.startsWith('ja')) return 'ja-JP';
  return 'en-US';
}

function isPlainObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value);
}

function deepMergeDefaults(defaults, saved) {
  const result = {};
  Object.keys(defaults).forEach((key) => {
    const defaultValue = defaults[key];
    const savedValue = isPlainObject(saved) ? saved[key] : undefined;
    result[key] = isPlainObject(defaultValue)
      ? deepMergeDefaults(defaultValue, savedValue)
      : (savedValue === undefined ? defaultValue : savedValue);
  });
  return result;
}

function validateHexColor(color, fallback) {
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color || '') ? color : fallback;
}

function hexToRgb(color) {
  const hex = validateHexColor(color, '#4A9EDD').slice(1);
  const normalized = hex.length === 3
    ? hex.split('').map((char) => char + char).join('')
    : hex;
  const value = parseInt(normalized, 16);
  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255
  };
}

function getProgressFillColor(color) {
  const rgb = hexToRgb(color);
  const shade = 0.72;
  const r = Math.round(rgb.r * shade);
  const g = Math.round(rgb.g * shade);
  const b = Math.round(rgb.b * shade);
  return `rgb(${r}, ${g}, ${b})`;
}

function clampNumber(value, min, max, fallback) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.max(min, Math.min(max, number));
}

function normalizeProgressThickness(value) {
  const number = Number(value);
  return [2, 3, 4, 6, 8, 12, 16].includes(number) ? number : 4;
}

function normalizeIconSet(value) {
  return ['defaultArrow', 'triangle', 'chevron', 'doubleArrow'].includes(value)
    ? value
    : 'defaultArrow';
}

function mergeAdvancedSettings(savedSettings) {
  const merged = deepMergeDefaults(DEFAULT_ADVANCED_SETTINGS, savedSettings);
  merged.progressBar.customColor = validateHexColor(merged.progressBar.customColor, '#4A9EDD');
  merged.progressBar.thickness = normalizeProgressThickness(merged.progressBar.thickness);
  merged.progressBar.verticalHeight = clampNumber(merged.progressBar.verticalHeight, 40, 400, 120);
  merged.iconCustomization.enabled = true;
  merged.iconCustomization.iconSet = normalizeIconSet(merged.iconCustomization.iconSet);
  merged.iconCustomization.iconColor = validateHexColor(merged.iconCustomization.iconColor, '#FFFFFF');
  return merged;
}

function getIconSvg(direction, iconSet) {
  const isTop = direction === 'top';
  const icons = {
    defaultArrow: {
      top: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg>',
      bottom: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12l7 7 7-7"/></svg>'
    },
    triangle: {
      top: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 5l8 12H4z"/></svg>',
      bottom: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 19L4 7h16z"/></svg>'
    },
    chevron: {
      top: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 15l7-7 7 7"/></svg>',
      bottom: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 9l7 7 7-7"/></svg>'
    },
    doubleArrow: {
      top: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.7" stroke-linecap="round" stroke-linejoin="round"><path d="M7 13l5-5 5 5M7 19l5-5 5 5"/></svg>',
      bottom: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.7" stroke-linecap="round" stroke-linejoin="round"><path d="M7 5l5 5 5-5M7 11l5 5 5-5"/></svg>'
    }
  };
  const set = icons[iconSet] || icons.defaultArrow;
  return isTop ? set.top : set.bottom;
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
        resolve(normalizeLanguage(browserLang));
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

  document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
    const key = element.getAttribute('data-i18n-placeholder');
    if (translations[lang] && translations[lang][key]) {
      element.setAttribute('placeholder', translations[lang][key]);
    }
  });
}

// 统一的间距规范（像素）
const BUTTON_GAP = 8; // 按钮之间的标准间距
const PREVIEW_PROGRESS_RATIO = 0.46;

function getPreviewProgressColor(topButtonColor, bottomButtonColor) {
  const colorMode = document.getElementById('progressColorMode')?.value || 'followTopButton';
  if (colorMode === 'followBottomButton') {
    return validateHexColor(bottomButtonColor, '#4A9EDD');
  }
  if (colorMode === 'custom') {
    return validateHexColor(document.getElementById('progressCustomColor')?.value, '#4A9EDD');
  }
  return validateHexColor(topButtonColor, '#4A9EDD');
}

// 更新预览按钮样式和位置 - 预览按钮直接显示在设置页面上
function updatePreviewButtons() {
  const topButton = document.getElementById('previewTopButton');
  const bottomButton = document.getElementById('previewBottomButton');
  const progressButton = document.getElementById('previewProgressButton');
  const horizontalProgress = document.getElementById('previewHorizontalProgress');
  if (!topButton || !bottomButton) return;
  
  // 获取当前设置
  const buttonSize = parseInt(document.getElementById('buttonSize').value);
  const buttonShape = document.getElementById('buttonShape').value;
  const buttonSpacing = parseInt(document.getElementById('buttonSpacing').value);
  const edgeDistance = parseInt(document.getElementById('edgeDistance').value);
  const topButtonColor = document.getElementById('topButtonColor').value;
  const bottomButtonColor = document.getElementById('bottomButtonColor').value;
  const opacity = parseInt(document.getElementById('opacity').value) / 100;
  const horizontalPosition = document.getElementById('horizontalPosition').value;
  const verticalAlignment = document.getElementById('verticalAlignment').value;
  const iconSet = normalizeIconSet(document.getElementById('iconSet').value);
  const iconColor = validateHexColor(document.getElementById('iconColor').value, '#FFFFFF');
  const progressEnabled = document.getElementById('progressBarEnabled')?.checked === true;
  const progressMode = document.getElementById('progressBarMode')?.value || 'verticalButton';
  const showProgressPercentage = document.getElementById('progressShowPercentage')?.checked === true;
  const progressHorizontalPosition = document.getElementById('progressHorizontalPosition')?.value || 'top';
  const progressThickness = normalizeProgressThickness(document.getElementById('progressThickness')?.value);
  const progressColor = getPreviewProgressColor(topButtonColor, bottomButtonColor);
  
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

  const displayProgressHeight = clampNumber(
    document.getElementById('progressVerticalHeight')?.value,
    40,
    400,
    120
  );
  const isVerticalProgressPreview = progressEnabled && progressMode === 'verticalButton';
  const isHorizontalProgressPreview = progressEnabled && progressMode === 'horizontalBar';
  
  // 验证并调整边缘距离
  let displayEdgeDistance = edgeDistance;
  if (isNaN(displayEdgeDistance)) {
    displayEdgeDistance = 20;
  } else if (displayEdgeDistance < 0) {
    displayEdgeDistance = 0;
  } else if (displayEdgeDistance > 200) {
    displayEdgeDistance = 200;
  }

  // 计算按钮位置 - 使用fixed定位直接显示在设置页面上
  let leftPos, rightPos;
  
  // 水平位置
  if (horizontalPosition === 'left') {
    leftPos = displayEdgeDistance + 'px';
    rightPos = 'auto';
  } else {
    // right (默认)
    leftPos = 'auto';
    rightPos = displayEdgeDistance + 'px';
  }
  
  // 强制设置按钮尺寸
  const size = displaySize + 'px';
  
  // 计算按钮组的总高度
  const totalGroupHeight = isVerticalProgressPreview
    ? (displaySize * 2) + displayProgressHeight + (displaySpacing * 2)
    : (displaySize * 2) + displaySpacing;
  
  // 顶部按钮位置计算
  let topButtonTop, topButtonBottom;
  if (verticalAlignment === 'center') {
    // 居中模式：按钮组整体居中，不使用transform避免弹跳
    // 计算从视口顶部到按钮组顶部的距离
    const groupTopOffset = `calc(50% - ${totalGroupHeight / 2}px)`;
    topButtonTop = groupTopOffset;
    topButtonBottom = 'auto';
  } else if (verticalAlignment === 'top') {
    topButtonTop = displayEdgeDistance + 'px';
    topButtonBottom = 'auto';
  } else {
    // bottom
    topButtonTop = 'auto';
    topButtonBottom = isVerticalProgressPreview
      ? `calc(${displayEdgeDistance}px + ${displaySize + displaySpacing + displayProgressHeight + displaySpacing}px)`
      : `calc(${displayEdgeDistance}px + ${displaySize + displaySpacing}px)`;
  }
  
  // 底部按钮位置计算
  let bottomButtonTop, bottomButtonBottom;
  if (verticalAlignment === 'center') {
    // 居中模式：底部按钮在顶部按钮下方固定间距
    const groupTopOffset = `calc(50% - ${totalGroupHeight / 2}px)`;
    bottomButtonTop = isVerticalProgressPreview
      ? `calc(${groupTopOffset} + ${displaySize + displaySpacing + displayProgressHeight + displaySpacing}px)`
      : `calc(${groupTopOffset} + ${displaySize + displaySpacing}px)`;
    bottomButtonBottom = 'auto';
  } else if (verticalAlignment === 'top') {
    bottomButtonTop = isVerticalProgressPreview
      ? `calc(${displayEdgeDistance}px + ${displaySize + displaySpacing + displayProgressHeight + displaySpacing}px)`
      : `calc(${displayEdgeDistance}px + ${displaySize + displaySpacing}px)`;
    bottomButtonBottom = 'auto';
  } else {
    // bottom
    bottomButtonTop = 'auto';
    bottomButtonBottom = displayEdgeDistance + 'px';
  }

  let progressButtonTop = 'auto';
  let progressButtonBottom = 'auto';
  if (verticalAlignment === 'center') {
    const groupTopOffset = `calc(50% - ${totalGroupHeight / 2}px)`;
    progressButtonTop = `calc(${groupTopOffset} + ${displaySize + displaySpacing}px)`;
  } else if (verticalAlignment === 'top') {
    progressButtonTop = `calc(${displayEdgeDistance}px + ${displaySize + displaySpacing}px)`;
  } else {
    progressButtonBottom = `calc(${displayEdgeDistance}px + ${displaySize + displaySpacing}px)`;
  }
  
  // 使用 requestAnimationFrame 确保流畅更新，避免弹跳
  requestAnimationFrame(() => {
    // 设置顶部按钮样式 - 使用fixed定位
    topButton.innerHTML = getIconSvg('top', iconSet);
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
    topButton.style.color = iconColor;
    
    // 设置底部按钮样式 - 使用fixed定位
    bottomButton.innerHTML = getIconSvg('bottom', iconSet);
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
    bottomButton.style.color = iconColor;
    
    // 更新SVG图标样式 - 确保与实际页面完全一致
    const topIcon = topButton.querySelector('svg');
    const bottomIcon = bottomButton.querySelector('svg');
    
    // 计算图标大小（与实际页面一致）
    const iconSize = Math.max(40, Math.min(70, displaySize * 0.6)) + '%';
    
    if (topIcon) {
      topIcon.style.width = iconSize;
      topIcon.style.height = iconSize;
      topIcon.style.display = 'block';
    }
    
    if (bottomIcon) {
      bottomIcon.style.width = iconSize;
      bottomIcon.style.height = iconSize;
      bottomIcon.style.display = 'block';
    }

    if (progressButton) {
      progressButton.classList.toggle('hidden', !isVerticalProgressPreview);
      progressButton.style.display = isVerticalProgressPreview ? 'flex' : 'none';
      progressButton.style.width = size;
      progressButton.style.height = displayProgressHeight + 'px';
      progressButton.style.borderRadius = buttonShape === 'square' ? '4px' : '999px';
      progressButton.style.backgroundColor = progressColor;
      progressButton.style.opacity = opacity;
      progressButton.style.left = leftPos;
      progressButton.style.right = rightPos;
      progressButton.style.top = progressButtonTop;
      progressButton.style.bottom = progressButtonBottom;
      progressButton.style.transform = 'none';
      progressButton.style.willChange = 'top, bottom, width, height';
      progressButton.style.color = iconColor;

      const fill = progressButton.querySelector('.preview-progress-fill');
      const label = progressButton.querySelector('.preview-progress-label');
      if (fill) {
        fill.style.height = (PREVIEW_PROGRESS_RATIO * 100) + '%';
        fill.style.backgroundColor = getProgressFillColor(progressColor);
      }
      if (label) {
        label.textContent = showProgressPercentage ? `${Math.round(PREVIEW_PROGRESS_RATIO * 100)}%` : '';
        label.style.display = showProgressPercentage ? 'block' : 'none';
        label.style.color = iconColor;
      }
    }

    if (horizontalProgress) {
      horizontalProgress.classList.toggle('hidden', !isHorizontalProgressPreview);
      horizontalProgress.classList.toggle('is-bottom', progressHorizontalPosition === 'bottom');
      horizontalProgress.style.display = isHorizontalProgressPreview ? 'block' : 'none';
      horizontalProgress.style.top = progressHorizontalPosition === 'bottom' ? 'auto' : '0';
      horizontalProgress.style.bottom = progressHorizontalPosition === 'bottom' ? '0' : 'auto';
      horizontalProgress.style.height = progressThickness + 'px';
      horizontalProgress.style.backgroundColor = progressColor;

      const fill = horizontalProgress.querySelector('.preview-horizontal-progress-fill');
      const label = horizontalProgress.querySelector('.preview-horizontal-progress-label');
      if (fill) {
        fill.style.width = (PREVIEW_PROGRESS_RATIO * 100) + '%';
        fill.style.backgroundColor = getProgressFillColor(progressColor);
      }
      if (label) {
        label.textContent = `${Math.round(PREVIEW_PROGRESS_RATIO * 100)}%`;
        label.style.display = showProgressPercentage ? 'block' : 'none';
        label.style.color = iconColor;
      }
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

function updateAdvancedVisibility() {
  const progressSettings = document.getElementById('progressBarSettings');
  const verticalSettings = document.getElementById('verticalProgressSettings');
  const horizontalSettings = document.getElementById('horizontalProgressSettings');
  const customColorSettings = document.getElementById('progressCustomColorContainer');
  const progressEnabled = document.getElementById('progressBarEnabled');
  const progressMode = document.getElementById('progressBarMode');
  const colorMode = document.getElementById('progressColorMode');

  if (progressSettings && progressEnabled) {
    progressSettings.style.display = progressEnabled.checked ? 'block' : 'none';
  }
  if (verticalSettings && progressMode) {
    verticalSettings.style.display = progressMode.value === 'verticalButton' ? 'block' : 'none';
  }
  if (horizontalSettings && progressMode) {
    horizontalSettings.style.display = progressMode.value === 'horizontalBar' ? 'block' : 'none';
  }
  if (customColorSettings && colorMode) {
    customColorSettings.style.display = colorMode.value === 'custom' ? 'block' : 'none';
  }
}

function updateAdvancedPreviewControls() {
  updateAdvancedVisibility();
  updatePreviewButtons();
}

function setAdvancedSettingsControls(settings) {
  advancedSettingsState = mergeAdvancedSettings(settings);
  const progress = advancedSettingsState.progressBar;
  const icons = advancedSettingsState.iconCustomization;

  document.getElementById('progressBarEnabled').checked = progress.enabled;
  document.getElementById('progressBarMode').value = progress.mode;
  document.getElementById('progressHorizontalPosition').value = progress.horizontalPosition;
  document.getElementById('progressColorMode').value = progress.colorMode;
  document.getElementById('progressCustomColor').value = progress.customColor;
  document.getElementById('progressCustomColorHex').value = progress.customColor;
  document.getElementById('progressThickness').value = String(progress.thickness);
  document.getElementById('progressVerticalHeight').value = progress.verticalHeight;
  document.getElementById('progressClickToJump').checked = progress.clickToJump !== false;
  document.getElementById('progressShowPercentage').checked = Boolean(progress.showPercentage);
  document.getElementById('progressShowRemainingTime').checked = Boolean(progress.showRemainingTime);

  document.getElementById('iconSet').value = normalizeIconSet(icons.iconSet);
  document.getElementById('iconColor').value = icons.iconColor;
  document.getElementById('iconColorHex').value = icons.iconColor;

  updateAdvancedVisibility();
  updatePreviewButtons();
}

function getAdvancedSettingsFromControls() {
  const verticalHeight = clampNumber(document.getElementById('progressVerticalHeight').value, 40, 400, 120);
  const customColor = validateHexColor(document.getElementById('progressCustomColor').value, '#4A9EDD');
  const iconColor = validateHexColor(document.getElementById('iconColor').value, '#FFFFFF');

  return mergeAdvancedSettings({
    progressBar: {
      enabled: document.getElementById('progressBarEnabled').checked,
      mode: document.getElementById('progressBarMode').value,
      horizontalPosition: document.getElementById('progressHorizontalPosition').value,
      colorMode: document.getElementById('progressColorMode').value,
      customColor,
      thickness: normalizeProgressThickness(document.getElementById('progressThickness').value),
      verticalHeight,
      clickToJump: document.getElementById('progressClickToJump').checked,
      showPercentage: document.getElementById('progressShowPercentage').checked,
      showRemainingTime: document.getElementById('progressShowRemainingTime').checked
    },
    iconCustomization: {
      enabled: true,
      iconSet: normalizeIconSet(document.getElementById('iconSet').value),
      iconColor,
      customIcon: {
        enabled: false,
        topIconDataUrl: '',
        bottomIconDataUrl: ''
      }
    }
  });
}

function normalizeEnableStates(states) {
  return states && typeof states === 'object' && !Array.isArray(states) ? states : {};
}

function parseHostnameInput(value) {
  const trimmed = (value || '').trim();
  if (!trimmed) return '';

  const candidates = [trimmed];
  if (!new RegExp('^[a-z][a-z0-9+.-]*://', 'i').test(trimmed)) {
    candidates.push('https://' + trimmed);
  }

  for (const candidate of candidates) {
    try {
      const parsed = new URL(candidate);
      if ((parsed.protocol === 'http:' || parsed.protocol === 'https:') && parsed.hostname) {
        return parsed.hostname.toLowerCase();
      }
    } catch (err) {
      // Try the next candidate.
    }
  }
  return '';
}

function saveEnableStates(nextStates, callback) {
  enableStates = normalizeEnableStates(nextStates);
  chrome.storage.local.set({ enableStates }, () => {
    renderEnableStatesList();
    if (callback) callback();
  });
}

function saveEnableState(hostname, enabled) {
  const nextStates = { ...enableStates, [hostname]: Boolean(enabled) };
  saveEnableStates(nextStates);
}

function removeEnableState(hostname) {
  const nextStates = { ...enableStates };
  delete nextStates[hostname];
  saveEnableStates(nextStates);
}

function clearDisabledSites() {
  const nextStates = {};
  Object.keys(enableStates).forEach((hostname) => {
    if (enableStates[hostname] !== false) {
      nextStates[hostname] = enableStates[hostname];
    }
  });
  saveEnableStates(nextStates);
  return nextStates;
}

function restoreAllSitesEnabled() {
  saveEnableStates({});
  return {};
}

function showDomainError(message) {
  const error = document.getElementById('domainError');
  if (!error) return;
  error.textContent = message || '';
  error.style.display = message ? 'block' : 'none';
}

function renderEnableStatesList() {
  const list = document.getElementById('domainList');
  const empty = document.getElementById('domainEmpty');
  if (!list || !empty) return;
  list.innerHTML = '';

  const lang = document.getElementById('languageSelector')?.value === 'auto'
    ? normalizeLanguage(navigator.language || navigator.userLanguage)
    : document.getElementById('languageSelector')?.value || 'en-US';
  const query = domainSearchText.toLowerCase();
  const hostnames = Object.keys(enableStates).sort().filter((hostname) => hostname.toLowerCase().includes(query));

  empty.style.display = hostnames.length === 0 ? 'block' : 'none';
  hostnames.forEach((hostname) => {
    const row = document.createElement('div');
    row.className = 'domain-row';

    const name = document.createElement('span');
    name.className = 'domain-name';
    name.textContent = hostname;

    const toggleLabel = document.createElement('label');
    toggleLabel.className = 'checkbox-container';
    toggleLabel.style.marginBottom = '0';
    const toggle = document.createElement('input');
    toggle.type = 'checkbox';
    toggle.checked = enableStates[hostname] !== false;
    const toggleText = document.createElement('span');
    toggleText.textContent = toggle.checked
      ? (translations[lang]?.['settings.domainEnabled'] || 'Enabled')
      : (translations[lang]?.['settings.domainDisabled'] || 'Disabled');
    toggle.addEventListener('change', () => saveEnableState(hostname, toggle.checked));
    toggleLabel.appendChild(toggle);
    toggleLabel.appendChild(toggleText);

    const deleteButton = document.createElement('button');
    deleteButton.type = 'button';
    deleteButton.textContent = translations[lang]?.['settings.deleteDomain'] || 'Delete';
    deleteButton.addEventListener('click', () => removeEnableState(hostname));

    row.appendChild(name);
    row.appendChild(toggleLabel);
    row.appendChild(deleteButton);
    list.appendChild(row);
  });
}

function loadEnableStates() {
  chrome.storage.local.get(['enableStates'], (result) => {
    enableStates = normalizeEnableStates(result.enableStates);
    renderEnableStatesList();
  });
}

function setupTabs() {
  const tabButtons = document.querySelectorAll('.tab-button');
  const tabPanels = document.querySelectorAll('.tab-panel');

  tabButtons.forEach((button) => {
    button.setAttribute('aria-selected', String(button.classList.contains('is-active')));
    button.addEventListener('click', () => {
      const targetTab = button.getAttribute('data-tab');
      tabButtons.forEach((item) => {
        const isActive = item === button;
        item.classList.toggle('is-active', isActive);
        item.setAttribute('aria-selected', String(isActive));
      });
      tabPanels.forEach((panel) => {
        panel.classList.toggle('is-active', panel.getAttribute('data-tab-panel') === targetTab);
      });
    });
  });
}

function setManifestVersion() {
  const versionElement = document.getElementById('manifestVersion');
  if (!versionElement || typeof chrome === 'undefined' || !chrome.runtime?.getManifest) return;
  versionElement.textContent = chrome.runtime.getManifest().version || versionElement.textContent;
}

// 加载保存的设置
function loadSettings() {
  chrome.storage.sync.get(['scrollSpeed', 'buttonSettings', 'language', 'advancedSettings'], (result) => {
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
      document.getElementById('edgeDistance').value = buttonSettings.edgeDistance !== undefined ? buttonSettings.edgeDistance : 8;
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

    setAdvancedSettingsControls(result.advancedSettings);
    
    // 应用语言设置
    getCurrentLanguage().then(lang => {
      applyTranslation(lang);
      renderEnableStatesList();
    });
  });
}



// 保存设置
function saveSettings() {
  const scrollSpeed = parseInt(document.getElementById('scrollSpeed').value);
  const buttonSize = parseInt(document.getElementById('buttonSize').value);
  const buttonSpacing = parseInt(document.getElementById('buttonSpacing').value);
  const edgeDistance = parseInt(document.getElementById('edgeDistance').value);
  
  // 验证按钮尺寸 - 由于实时输入限制，这里可以简化验证
  if (isNaN(buttonSize) || buttonSize < 10 || buttonSize > 120) {
    return;
  }
  
  // 验证按钮间距
  if (isNaN(buttonSpacing) || buttonSpacing < 0 || buttonSpacing > 800) {
    return;
  }
  
  // 验证边缘距离
  if (isNaN(edgeDistance) || edgeDistance < 0 || edgeDistance > 200) {
    return;
  }
  
  // 颜色验证函数
  function validateHexColor(color) {
    const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    return hexRegex.test(color) ? color : '#4A9EDD';
  }

  const verticalHeight = parseInt(document.getElementById('progressVerticalHeight').value);
  if (isNaN(verticalHeight) || verticalHeight < 40 || verticalHeight > 400) {
    return;
  }
  
  const buttonSettings = {
    showButton: true, // 始终显示按钮
    horizontalPosition: document.getElementById('horizontalPosition').value,
    verticalAlignment: document.getElementById('verticalAlignment').value,
    buttonSize: buttonSize,
    buttonSizeUnit: 'px', // 固定为px单位
    buttonShape: document.getElementById('buttonShape').value,
    buttonSpacing: buttonSpacing,
    edgeDistance: edgeDistance,
    topButtonColor: validateHexColor(document.getElementById('topButtonColor').value),
    bottomButtonColor: validateHexColor(document.getElementById('bottomButtonColor').value),
    opacity: parseInt(document.getElementById('opacity').value),
    enableHoverHide: document.getElementById('enableHoverHide').checked,
    hoverHideKey: document.getElementById('hoverHideKey').value
  };
  const language = document.getElementById('languageSelector').value;
  const advancedSettings = getAdvancedSettingsFromControls();
  
  chrome.storage.sync.set({scrollSpeed: scrollSpeed, buttonSettings: buttonSettings, advancedSettings: advancedSettings, language: language}, () => {
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
      chrome.tabs.sendMessage(tab.id, {action: 'updateAdvancedSettings', settings: advancedSettings}, () => {
        if (chrome.runtime.lastError) {
          return;
        }
      });
    });
  });
}

// 初始化页面
function init() {
  setupTabs();
  setManifestVersion();
  loadSettings();
  loadEnableStates();
  
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

  document.getElementById('progressBarEnabled').addEventListener('change', updateAdvancedPreviewControls);
  document.getElementById('progressBarMode').addEventListener('change', updateAdvancedPreviewControls);
  document.getElementById('progressHorizontalPosition').addEventListener('change', updatePreviewButtons);
  document.getElementById('progressThickness').addEventListener('change', updatePreviewButtons);
  document.getElementById('progressVerticalHeight').addEventListener('input', updatePreviewButtons);
  document.getElementById('progressColorMode').addEventListener('change', updateAdvancedPreviewControls);
  document.getElementById('progressShowPercentage').addEventListener('change', updatePreviewButtons);

  document.getElementById('progressCustomColor').addEventListener('input', (e) => {
    document.getElementById('progressCustomColorHex').value = e.target.value;
    updatePreviewButtons();
  });
  document.getElementById('progressCustomColorHex').addEventListener('input', (e) => {
    const colorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    if (colorRegex.test(e.target.value)) {
      document.getElementById('progressCustomColor').value = e.target.value;
      updatePreviewButtons();
    }
  });

  document.getElementById('iconSet').addEventListener('change', updatePreviewButtons);
  document.getElementById('iconColor').addEventListener('input', (e) => {
    document.getElementById('iconColorHex').value = e.target.value;
    updatePreviewButtons();
  });
  document.getElementById('iconColorHex').addEventListener('input', (e) => {
    const colorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    if (colorRegex.test(e.target.value)) {
      document.getElementById('iconColor').value = e.target.value;
      updatePreviewButtons();
    }
  });

  document.getElementById('domainSearch').addEventListener('input', (e) => {
    domainSearchText = e.target.value || '';
    renderEnableStatesList();
  });
  document.getElementById('addDomainButton').addEventListener('click', () => {
    const input = document.getElementById('domainInput');
    const hostname = parseHostnameInput(input.value);
    if (!hostname) {
      getCurrentLanguage().then(lang => {
        showDomainError(translations[lang]?.['settings.invalidDomain'] || 'Enter a valid http/https website hostname.');
      });
      return;
    }
    showDomainError('');
    saveEnableState(hostname, document.getElementById('domainInitialState').value === 'true');
    input.value = '';
  });
  document.getElementById('clearDisabledSitesButton').addEventListener('click', clearDisabledSites);
  document.getElementById('restoreAllSitesButton').addEventListener('click', restoreAllSitesEnabled);
  
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
  
  // 监听边缘距离变化
  const edgeDistanceInput = document.getElementById('edgeDistance');
  const edgeDistanceError = document.getElementById('edgeDistanceError');
  
  edgeDistanceInput.addEventListener('input', (e) => {
    const value = e.target.value;
    if (value === '') {
      edgeDistanceError.style.display = 'none';
      updatePreviewButtons();
      return;
    }
    
    const numValue = parseInt(value);
    if (isNaN(numValue)) {
      edgeDistanceError.style.display = 'none';
    } else if (numValue < 0 || numValue > 200) {
      getCurrentLanguage().then(lang => {
        const errorText = translations[lang] && translations[lang]['settings.edgeDistanceError'] || 'Distance from edge must be between 0px and 200px';
        edgeDistanceError.textContent = errorText;
        edgeDistanceError.style.display = 'block';
      });
    } else {
      edgeDistanceError.style.display = 'none';
    }
    updatePreviewButtons();
  });
  
  edgeDistanceInput.addEventListener('blur', (e) => {
    const value = e.target.value;
    if (value === '') {
      edgeDistanceError.style.display = 'none';
      return;
    }
    
    const numValue = parseInt(value);
    if (numValue < 0 || numValue > 200) {
      getCurrentLanguage().then(lang => {
        const errorText = translations[lang] && translations[lang]['settings.edgeDistanceError'] || 'Distance from edge must be between 0px and 200px';
        edgeDistanceError.textContent = errorText;
        edgeDistanceError.style.display = 'block';
      });
    } else {
      edgeDistanceError.style.display = 'none';
    }
  });
  
  edgeDistanceInput.addEventListener('focus', () => {
    edgeDistanceError.style.display = 'none';
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
        renderEnableStatesList();
      });
    } else {
      applyTranslation(lang);
      renderEnableStatesList();
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
