const domainUtils = PageScrollMasterDomain;
const DOMAIN_STORAGE_KEYS = domainUtils.STORAGE_KEYS;
const analyticsUtils = PageScrollMasterAnalytics;
let analyticsRuntimeState = {
  configured: false,
  permissionOrigin: '',
  consent: analyticsUtils.normalizeConsent(),
  events: []
};
let analyticsStatusKey = 'disabled';

// 多语言翻译数据
const translations = {
  'zh-CN': {
    'settings.title': '智能页面滚动导航器',
    'settings.subtitle': '配置滚动按钮、阅读进度和网站启用状态。',
    'settings.tab.basic': '基础设置',
    'settings.tab.advanced': '高级功能',
    'settings.tab.domains': '域名管理',
    'settings.tab.feedback': '建议&关于插件',
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
    'settings.tab.feedback': 'Suggestions & About',
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
  'settings.screenNavigation': '按屏跳转',
  'settings.screenNavigationIntro': '按当前可视区域高度跳转上一屏或下一屏，并保留阅读上下文。',
  'settings.screenStepRatio': '每次滚动距离（可视区域百分比）',
  'settings.previousScreenButtonColor': '上一屏按钮颜色',
  'settings.nextScreenButtonColor': '下一屏按钮颜色',
  'settings.progressBarIntro': '显示当前页面阅读进度，并可点击快速跳转到指定位置。',
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
  'settings.readingTools': '阅读工具',
  'settings.readingToolsEnabled': '启用阅读工具按钮',
  'settings.readingToolsIntro': '阅读工具按钮默认关闭，启用后可使用已开启的阅读功能。',
  'settings.readingToolPosition': '按钮位置',
  'settings.readingToolPosition.pageTop': '页面顶部',
  'settings.readingToolPosition.pageBottom': '页面底部',
  'settings.readingToolPosition.betweenScrollButtons': '上/下按钮之间',
  'settings.readingToolColorMode': '按钮颜色',
  'settings.readingToolColorMode.followTopButton': '跟随顶部按钮',
  'settings.readingToolColorMode.followBottomButton': '跟随底部按钮',
  'settings.readingToolColorMode.custom': '自定义',
  'settings.readingToolCustomColor': '自定义阅读工具颜色',
  'settings.scrollBookmarksEnabled': '启用滚动位置书签',
  'settings.scrollBookmarksIntro': '保存当前阅读位置，方便稍后返回并继续阅读。',
  'settings.outlineNavigationEnabled': '启用智能段落跳转',
  'settings.outlineNavigationIntro': '识别页面标题结构，快速查看目录并跳转到上一段或下一段。',
  'settings.outlineSources': '目录来源',
  'settings.outlineSourceH1': 'H1 来源',
  'settings.outlineSourceH2': 'H2 来源',
  'settings.outlineSourceH3': 'H3 来源',
  'settings.outlineSourceIdBlocks': '带 id 的区块',
  'settings.outlineSourcesReset': '至少保留一个目录来源，已恢复 H1 + H2。',
  'settings.outlineMaxItems': '每批加载目录项',
  'settings.outlineMaxItemsError': '每批加载目录项必须在 10-50 之间。',
  'settings.outlineFilterShortHeadings': '自动过滤过短标题',
  'settings.outlineHighlightCurrentSection': '当前章节高亮',
  'settings.scrollBookmarkPerDomainLimit': '每域名保留位置',
  'settings.scrollBookmarkPerDomainLimit.one': '最近 1 条',
  'settings.scrollBookmarkPerDomainLimit.three': '最近 3 条',
  'settings.savedScrollBookmarks': '已保存位置',
  'settings.savedBookmarksEmpty': '暂无已保存的阅读位置。',
  'settings.openBookmark': '打开',
  'settings.deleteBookmark': '删除',
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
  'settings.screenNavigation': 'Previous/Next Screen',
  'settings.screenNavigationIntro': 'Move by the current viewport height while preserving reading context.',
  'settings.screenStepRatio': 'Scroll distance (% of viewport)',
  'settings.previousScreenButtonColor': 'Previous screen button color',
  'settings.nextScreenButtonColor': 'Next screen button color',
  'settings.progressBarIntro': 'Show page progress and click to jump to a specific position.',
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
  'settings.readingTools': 'Reading Tools',
  'settings.readingToolsEnabled': 'Enable reading tools button',
  'settings.readingToolsIntro': 'The reading tools button is off by default. Turn it on to use enabled reading features.',
  'settings.readingToolPosition': 'Button position',
  'settings.readingToolPosition.pageTop': 'Page top',
  'settings.readingToolPosition.pageBottom': 'Page bottom',
  'settings.readingToolPosition.betweenScrollButtons': 'Between scroll buttons',
  'settings.readingToolColorMode': 'Button color',
  'settings.readingToolColorMode.followTopButton': 'Follow top button',
  'settings.readingToolColorMode.followBottomButton': 'Follow bottom button',
  'settings.readingToolColorMode.custom': 'Custom',
  'settings.readingToolCustomColor': 'Custom reading tools color',
  'settings.scrollBookmarksEnabled': 'Enable scroll position bookmarks',
  'settings.scrollBookmarksIntro': 'Save your current reading position and continue later.',
  'settings.outlineNavigationEnabled': 'Enable smart section navigation',
  'settings.outlineNavigationIntro': 'Detect page headings to browse the outline and jump between sections.',
  'settings.outlineSources': 'Outline sources',
  'settings.outlineSourceH1': 'H1 source',
  'settings.outlineSourceH2': 'H2 source',
  'settings.outlineSourceH3': 'H3 source',
  'settings.outlineSourceIdBlocks': 'Blocks with an id',
  'settings.outlineSourcesReset': 'At least one outline source is required. H1 + H2 were restored.',
  'settings.outlineMaxItems': 'Outline items per batch',
  'settings.outlineMaxItemsError': 'Outline items per batch must be between 10 and 50.',
  'settings.outlineFilterShortHeadings': 'Automatically filter short headings',
  'settings.outlineHighlightCurrentSection': 'Highlight current section',
  'settings.scrollBookmarkPerDomainLimit': 'Saved positions per domain',
  'settings.scrollBookmarkPerDomainLimit.one': 'Latest 1',
  'settings.scrollBookmarkPerDomainLimit.three': 'Latest 3',
  'settings.savedScrollBookmarks': 'Saved Positions',
  'settings.savedBookmarksEmpty': 'No saved reading positions yet.',
  'settings.openBookmark': 'Open',
  'settings.deleteBookmark': 'Delete',
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
  'settings.tab.feedback': 'Sugerencias y acerca de',
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
  'settings.readingToolsIntro': 'El boton de herramientas de lectura esta desactivado por defecto. Activalo para usar las funciones de lectura habilitadas.',
  'settings.outlineNavigationEnabled': 'Activar navegacion inteligente por secciones',
  'settings.outlineSources': 'Fuentes del indice',
  'settings.outlineSourceH1': 'Fuente H1',
  'settings.outlineSourceH2': 'Fuente H2',
  'settings.outlineSourceH3': 'Fuente H3',
  'settings.outlineSourceIdBlocks': 'Bloques con id',
  'settings.outlineSourcesReset': 'Se requiere al menos una fuente. Se restauraron H1 + H2.',
  'settings.outlineMaxItems': 'Elementos del indice por lote',
  'settings.outlineMaxItemsError': 'Los elementos por lote deben estar entre 10 y 50.',
  'settings.outlineFilterShortHeadings': 'Filtrar automaticamente titulos cortos',
  'settings.outlineHighlightCurrentSection': 'Resaltar la seccion actual',
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
  'settings.tab.feedback': 'ご意見・拡張機能について',
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
  'settings.readingToolsIntro': '読書ツールボタンは初期状態ではオフです。有効にした読書機能を利用できます。',
  'settings.outlineNavigationEnabled': 'スマートセクション移動を有効にする',
  'settings.outlineSources': '目次の対象',
  'settings.outlineSourceH1': 'H1 を対象にする',
  'settings.outlineSourceH2': 'H2 を対象にする',
  'settings.outlineSourceH3': 'H3 を対象にする',
  'settings.outlineSourceIdBlocks': 'id 付きブロック',
  'settings.outlineSourcesReset': '目次の対象が必要です。H1 + H2 を復元しました。',
  'settings.outlineMaxItems': '1回に読み込む目次項目数',
  'settings.outlineMaxItemsError': '1回に読み込む目次項目数は 10 から 50 の範囲で指定してください。',
  'settings.outlineFilterShortHeadings': '短い見出しを自動的に除外',
  'settings.outlineHighlightCurrentSection': '現在のセクションを強調表示',
  'settings.siteManagement': 'サイトごとの有効状態',
  'settings.domainEnabled': '有効',
  'settings.domainDisabled': '無効',
  'settings.addDomain': 'ドメインを追加',
  'settings.deleteDomain': '削除'
});

translations['zh-TW'] = Object.assign({}, translations['zh-CN'], {
  'settings.title': '智慧頁面捲動導覽器',
  'settings.subtitle': '設定捲動按鈕、閱讀進度和網站啟用狀態。',
  'settings.tab.basic': '基本設定',
  'settings.tab.advanced': '進階功能',
  'settings.tab.domains': '網域管理',
  'settings.tab.feedback': '建議與關於外掛',
  'settings.basicIntro': '調整捲動速度、按鈕位置、外觀圖示和快捷鍵。',
  'settings.advancedIntro': '設定頁面進度條的顯示方式和互動行為。',
  'settings.domainIntro': '管理不同網站中捲動按鈕的啟用或停用狀態。',
  'settings.scrollBehavior': '捲動行為',
  'settings.buttonIcons': '按鈕圖示',
  'settings.progressBar': '頁面進度條',
  'settings.aboutDescription': '智慧頁面捲動導覽器可協助你快速跳到網頁頂部或底部，並支援閱讀進度、進度跳轉與網站啟用狀態設定。',
  'settings.versionLabel': '目前版本：',
  'settings.authorLabel': '外掛作者：',
  'settings.language': '語言',
  'settings.scrollSpeed': '捲動速度',
  'settings.buttonPosition': '按鈕位置',
  'settings.horizontalPosition': '水平位置',
  'settings.verticalAlignment': '垂直對齊方式',
  'settings.position.right': '右側邊緣',
  'settings.position.left': '左側邊緣',
  'settings.alignment.center': '置中顯示',
  'settings.alignment.top': '頂部對齊',
  'settings.alignment.bottom': '底部對齊',
  'settings.buttonStyle': '按鈕樣式',
  'settings.buttonShape': '按鈕形狀',
  'settings.buttonShape.round': '圓形',
  'settings.buttonShape.square': '正方形',
  'settings.buttonSize': '按鈕尺寸(px)',
  'settings.buttonSpacing': '按鈕間距(px)',
  'settings.spacingError': '按鈕間距必須介於0px至800px之間',
  'settings.edgeDistance': '邊緣距離(px)',
  'settings.edgeDistanceError': '邊緣距離必須介於0px至200px之間',
  'settings.topButtonColor': '頂部按鈕顏色',
  'settings.bottomButtonColor': '底部按鈕顏色',
  'settings.opacity': '透明度',
  'settings.shortcutSettings': '快捷鍵設定',
  'settings.enableHoverHide': '啟用滑鼠懸停+快捷鍵隱藏按鈕',
  'settings.hoverHideKey': '快捷鍵組合',
  'settings.hoverHideHint': '提示：當滑鼠懸停在按鈕上並按住所選快捷鍵時，按鈕會平滑隱藏',
  'settings.preview': '即時預覽',
  'settings.about': '關於外掛',
  'settings.feedback': '如有任何建議或回饋，請聯絡外掛製作者：',
  'settings.saveButton': '儲存',
  'settings.saveSuccess': '儲存成功!',
  'settings.sizeError': '按鈕尺寸必須介於10px至120px之間',
  'settings.colorNote': '預設顏色為 #4A9EDD，可點選上方選擇器自訂',
  'settings.advancedFeatures': '進階功能',
  'settings.progressBarEnabled': '啟用頁面進度條',
  'settings.progressBarMode': '顯示樣式',
  'settings.progressBarMode.verticalButton': '垂直進度按鈕',
  'settings.progressBarMode.horizontalBar': '水平頁面邊緣進度條',
  'settings.progressVerticalHeight': '垂直高度(px)',
  'settings.progressHorizontalPosition': '水平位置',
  'settings.progressHorizontalPosition.top': '頂部',
  'settings.progressHorizontalPosition.bottom': '底部',
  'settings.progressThickness': '水平粗細(px)',
  'settings.progressColorMode': '進度顏色',
  'settings.progressColorMode.followTopButton': '跟隨頂部按鈕',
  'settings.progressColorMode.followBottomButton': '跟隨底部按鈕',
  'settings.progressColorMode.custom': '自訂',
  'settings.progressCustomColor': '自訂進度顏色',
  'settings.progressClickToJump': '點擊進度條跳轉',
  'settings.progressShowPercentage': '顯示百分比',
  'settings.progressShowRemainingTime': '顯示剩餘閱讀時間',
  'settings.progressInfiniteNote': '無限捲動頁面中，進度可能會隨內容載入而改變。',
  'settings.readingTools': '閱讀工具',
  'settings.readingToolsEnabled': '啟用閱讀工具按鈕',
  'settings.readingToolsIntro': '閱讀工具按鈕預設關閉，啟用後可使用已開啟的閱讀功能。',
  'settings.readingToolPosition': '按鈕位置',
  'settings.readingToolPosition.pageTop': '頁面頂部',
  'settings.readingToolPosition.pageBottom': '頁面底部',
  'settings.readingToolPosition.betweenScrollButtons': '上/下按鈕之間',
  'settings.readingToolColorMode': '按鈕顏色',
  'settings.readingToolColorMode.followTopButton': '跟隨頂部按鈕',
  'settings.readingToolColorMode.followBottomButton': '跟隨底部按鈕',
  'settings.readingToolColorMode.custom': '自訂',
  'settings.readingToolCustomColor': '自訂閱讀工具顏色',
  'settings.scrollBookmarksEnabled': '啟用捲動位置書籤',
  'settings.outlineNavigationEnabled': '啟用智慧段落跳轉',
  'settings.outlineSources': '目錄來源',
  'settings.outlineSourceH1': 'H1 來源',
  'settings.outlineSourceH2': 'H2 來源',
  'settings.outlineSourceH3': 'H3 來源',
  'settings.outlineSourceIdBlocks': '帶 id 的區塊',
  'settings.outlineSourcesReset': '至少保留一個目錄來源，已恢復 H1 + H2。',
  'settings.outlineMaxItems': '每批載入目錄項目',
  'settings.outlineMaxItemsError': '每批載入目錄項目必須介於 10 到 50 之間。',
  'settings.outlineFilterShortHeadings': '自動過濾過短標題',
  'settings.outlineHighlightCurrentSection': '醒目提示目前章節',
  'settings.scrollBookmarkPerDomainLimit': '每個網域保留位置',
  'settings.scrollBookmarkPerDomainLimit.one': '最近 1 筆',
  'settings.scrollBookmarkPerDomainLimit.three': '最近 3 筆',
  'settings.savedScrollBookmarks': '已儲存位置',
  'settings.savedBookmarksEmpty': '尚無已儲存的閱讀位置。',
  'settings.openBookmark': '開啟',
  'settings.deleteBookmark': '刪除',
  'settings.iconSet': '圖示樣式',
  'settings.iconSet.defaultArrow': '預設箭頭',
  'settings.iconSet.triangle': '三角形',
  'settings.iconSet.chevron': '折線箭頭',
  'settings.iconSet.doubleArrow': '雙箭頭',
  'settings.iconColor': '圖示顏色',
  'settings.customIconComingSoon': '上傳自訂圖示 Coming soon。',
  'settings.siteManagement': '網站啟用狀態',
  'settings.domainSearch': '搜尋網域',
  'settings.domainInput': 'example.com 或 https://example.com/page',
  'settings.domainEnabled': '啟用',
  'settings.domainDisabled': '停用',
  'settings.domainEmpty': '尚無手動設定的網站。',
  'settings.addDomain': '新增網域',
  'settings.clearDisabledSites': '清除已關閉網站',
  'settings.restoreAllSites': '恢復全部啟用',
  'settings.deleteDomain': '刪除',
  'settings.invalidDomain': '請輸入有效的 http/https 網站網域。',
  'settings.verticalHeightError': '垂直高度必須介於40px至400px之間'
});

translations['de-DE'] = Object.assign({}, translations['en-US'], {
  'settings.title': 'Smart Scroll Navigator',
  'settings.subtitle': 'Konfigurieren Sie Scroll-Schaltflächen, Lesefortschritt und Aktivierungsstatus pro Website.',
  'settings.tab.basic': 'Grundeinstellungen',
  'settings.tab.advanced': 'Erweiterte Funktionen',
  'settings.tab.domains': 'Domainverwaltung',
  'settings.tab.feedback': 'Vorschläge & Info',
  'settings.basicIntro': 'Scrollgeschwindigkeit, Schaltflächenposition, Darstellung, Symbole und Tastenkürzel anpassen.',
  'settings.advancedIntro': 'Anzeige und Interaktion der Seitenfortschrittsleiste konfigurieren.',
  'settings.domainIntro': 'Verwalten Sie, ob Scroll-Schaltflächen auf bestimmten Websites aktiviert sind.',
  'settings.scrollBehavior': 'Scrollverhalten',
  'settings.buttonIcons': 'Schaltflächensymbole',
  'settings.progressBar': 'Seitenfortschrittsleiste',
  'settings.aboutDescription': 'Smart Scroll Navigator hilft beim Springen zum Seitenanfang oder -ende, zeigt den Lesefortschritt und verwaltet Website-Einstellungen.',
  'settings.versionLabel': 'Version: ',
  'settings.authorLabel': 'Autor: ',
  'settings.language': 'Sprache',
  'settings.scrollSpeed': 'Scrollgeschwindigkeit',
  'settings.buttonPosition': 'Schaltflächenposition',
  'settings.horizontalPosition': 'Horizontale Position',
  'settings.verticalAlignment': 'Vertikale Ausrichtung',
  'settings.position.right': 'Rechter Rand',
  'settings.position.left': 'Linker Rand',
  'settings.alignment.center': 'Zentriert',
  'settings.alignment.top': 'Oben',
  'settings.alignment.bottom': 'Unten',
  'settings.buttonStyle': 'Schaltflächenstil',
  'settings.buttonShape': 'Schaltflächenform',
  'settings.buttonShape.round': 'Rund',
  'settings.buttonShape.square': 'Quadratisch',
  'settings.buttonSize': 'Schaltflächengröße(px)',
  'settings.buttonSpacing': 'Schaltflächenabstand(px)',
  'settings.spacingError': 'Der Schaltflächenabstand muss zwischen 0px und 800px liegen',
  'settings.edgeDistance': 'Abstand zum Rand(px)',
  'settings.edgeDistanceError': 'Der Abstand zum Rand muss zwischen 0px und 200px liegen',
  'settings.topButtonColor': 'Farbe der oberen Schaltfläche',
  'settings.bottomButtonColor': 'Farbe der unteren Schaltfläche',
  'settings.opacity': 'Deckkraft',
  'settings.shortcutSettings': 'Tastenkürzel',
  'settings.enableHoverHide': 'Schaltflächen per Hover + Tastenkürzel ausblenden',
  'settings.hoverHideKey': 'Tastenkürzel',
  'settings.hoverHideHint': 'Hinweis: Beim Überfahren der Schaltflächen und Drücken des gewählten Kürzels werden sie sanft ausgeblendet',
  'settings.preview': 'Live-Vorschau',
  'settings.about': 'Über die Erweiterung',
  'settings.feedback': 'Für Vorschläge oder Feedback kontaktieren Sie bitte den Entwickler:',
  'settings.saveButton': 'Speichern',
  'settings.saveSuccess': 'Erfolgreich gespeichert!',
  'settings.sizeError': 'Die Schaltflächengröße muss zwischen 10px und 120px liegen',
  'settings.colorNote': 'Standardfarbe ist #4A9EDD, klicken Sie oben auf den Wähler zum Anpassen',
  'settings.key.macAlt': 'Option (⌥)',
  'settings.key.macCtrl': 'Command (⌘)',
  'settings.key.macShift': 'Shift (⇧)',
  'settings.advancedFeatures': 'Erweiterte Funktionen',
  'settings.progressBarEnabled': 'Seitenfortschrittsleiste aktivieren',
  'settings.progressBarMode': 'Anzeigestil',
  'settings.progressBarMode.verticalButton': 'Vertikale Fortschrittsschaltfläche',
  'settings.progressBarMode.horizontalBar': 'Horizontale Leiste am Seitenrand',
  'settings.progressVerticalHeight': 'Vertikale Höhe(px)',
  'settings.progressHorizontalPosition': 'Horizontale Position',
  'settings.progressHorizontalPosition.top': 'Oben',
  'settings.progressHorizontalPosition.bottom': 'Unten',
  'settings.progressThickness': 'Horizontale Stärke(px)',
  'settings.progressColorMode': 'Fortschrittsfarbe',
  'settings.progressColorMode.followTopButton': 'Oberer Schaltfläche folgen',
  'settings.progressColorMode.followBottomButton': 'Unterer Schaltfläche folgen',
  'settings.progressColorMode.custom': 'Benutzerdefiniert',
  'settings.progressCustomColor': 'Benutzerdefinierte Fortschrittsfarbe',
  'settings.progressClickToJump': 'Klicken zum Springen aktivieren',
  'settings.progressShowPercentage': 'Prozent anzeigen',
  'settings.progressShowRemainingTime': 'Verbleibende Lesezeit anzeigen',
  'settings.progressInfiniteNote': 'Auf Seiten mit unendlichem Scrollen kann sich der Fortschritt beim Laden neuer Inhalte ändern.',
  'settings.readingTools': 'Lesewerkzeuge',
  'settings.readingToolsEnabled': 'Lesewerkzeug-Schaltfläche aktivieren',
  'settings.readingToolsIntro': 'Die Lesewerkzeug-Schaltfläche ist standardmäßig aus. Aktivieren Sie sie, um freigeschaltete Lesefunktionen zu verwenden.',
  'settings.readingToolPosition': 'Schaltflächenposition',
  'settings.readingToolPosition.pageTop': 'Seitenanfang',
  'settings.readingToolPosition.pageBottom': 'Seitenende',
  'settings.readingToolPosition.betweenScrollButtons': 'Zwischen Scroll-Schaltflächen',
  'settings.readingToolColorMode': 'Schaltflächenfarbe',
  'settings.readingToolColorMode.followTopButton': 'Oberer Schaltfläche folgen',
  'settings.readingToolColorMode.followBottomButton': 'Unterer Schaltfläche folgen',
  'settings.readingToolColorMode.custom': 'Benutzerdefiniert',
  'settings.readingToolCustomColor': 'Benutzerdefinierte Lesewerkzeugfarbe',
  'settings.scrollBookmarksEnabled': 'Scrollpositions-Lesezeichen aktivieren',
  'settings.outlineNavigationEnabled': 'Intelligente Abschnittsnavigation aktivieren',
  'settings.outlineSources': 'Gliederungsquellen',
  'settings.outlineSourceH1': 'H1-Quelle',
  'settings.outlineSourceH2': 'H2-Quelle',
  'settings.outlineSourceH3': 'H3-Quelle',
  'settings.outlineSourceIdBlocks': 'Blöcke mit id',
  'settings.outlineSourcesReset': 'Mindestens eine Gliederungsquelle ist erforderlich. H1 + H2 wurden wiederhergestellt.',
  'settings.outlineMaxItems': 'Gliederungspunkte pro Ladung',
  'settings.outlineMaxItemsError': 'Die Anzahl pro Ladung muss zwischen 10 und 50 liegen.',
  'settings.outlineFilterShortHeadings': 'Kurze Überschriften automatisch filtern',
  'settings.outlineHighlightCurrentSection': 'Aktuellen Abschnitt hervorheben',
  'settings.scrollBookmarkPerDomainLimit': 'Gespeicherte Positionen pro Domain',
  'settings.scrollBookmarkPerDomainLimit.one': 'Neueste 1',
  'settings.scrollBookmarkPerDomainLimit.three': 'Neueste 3',
  'settings.savedScrollBookmarks': 'Gespeicherte Positionen',
  'settings.savedBookmarksEmpty': 'Noch keine Lesepositionen gespeichert.',
  'settings.openBookmark': 'Öffnen',
  'settings.deleteBookmark': 'Löschen',
  'settings.iconSet': 'Symbolstil',
  'settings.iconSet.defaultArrow': 'Standardpfeil',
  'settings.iconSet.triangle': 'Dreieck',
  'settings.iconSet.chevron': 'Chevron',
  'settings.iconSet.doubleArrow': 'Doppelpfeil',
  'settings.iconColor': 'Symbolfarbe',
  'settings.customIconComingSoon': 'Upload eigener Symbole demnächst verfügbar.',
  'settings.siteManagement': 'Website-Aktivierungsstatus',
  'settings.domainSearch': 'Domains suchen',
  'settings.domainInput': 'example.com oder https://example.com/page',
  'settings.domainEnabled': 'Aktiviert',
  'settings.domainDisabled': 'Deaktiviert',
  'settings.domainEmpty': 'Noch keine manuell konfigurierten Websites.',
  'settings.addDomain': 'Domain hinzufügen',
  'settings.clearDisabledSites': 'Deaktivierte Websites löschen',
  'settings.restoreAllSites': 'Alle aktivieren',
  'settings.deleteDomain': 'Löschen',
  'settings.invalidDomain': 'Geben Sie einen gültigen http/https-Hostnamen ein.',
  'settings.verticalHeightError': 'Die vertikale Höhe muss zwischen 40px und 400px liegen'
});

translations['fr-FR'] = Object.assign({}, translations['en-US'], {
  'settings.title': 'Smart Scroll Navigator',
  'settings.subtitle': 'Configurez les boutons de défilement, la progression de lecture et l’état d’activation par site.',
  'settings.tab.basic': 'Réglages de base',
  'settings.tab.advanced': 'Fonctions avancées',
  'settings.tab.domains': 'Gestion des domaines',
  'settings.tab.feedback': 'Suggestions et à propos',
  'settings.basicIntro': 'Ajustez la vitesse de défilement, la position, l’apparence, les icônes et les raccourcis.',
  'settings.advancedIntro': 'Configurez l’affichage et les interactions de la barre de progression.',
  'settings.domainIntro': 'Gérez l’activation des boutons de défilement sur des sites précis.',
  'settings.scrollBehavior': 'Comportement du défilement',
  'settings.buttonIcons': 'Icônes des boutons',
  'settings.progressBar': 'Barre de progression de page',
  'settings.aboutDescription': 'Smart Scroll Navigator vous aide à aller en haut ou en bas des pages, suivre la progression de lecture et gérer l’activation par site.',
  'settings.versionLabel': 'Version : ',
  'settings.authorLabel': 'Auteur : ',
  'settings.language': 'Langue',
  'settings.scrollSpeed': 'Vitesse de défilement',
  'settings.buttonPosition': 'Position des boutons',
  'settings.horizontalPosition': 'Position horizontale',
  'settings.verticalAlignment': 'Alignement vertical',
  'settings.position.right': 'Bord droit',
  'settings.position.left': 'Bord gauche',
  'settings.alignment.center': 'Centre',
  'settings.alignment.top': 'Haut',
  'settings.alignment.bottom': 'Bas',
  'settings.buttonStyle': 'Style des boutons',
  'settings.buttonShape': 'Forme des boutons',
  'settings.buttonShape.round': 'Rond',
  'settings.buttonShape.square': 'Carré',
  'settings.buttonSize': 'Taille du bouton(px)',
  'settings.buttonSpacing': 'Espacement des boutons(px)',
  'settings.spacingError': 'L’espacement des boutons doit être compris entre 0px et 800px',
  'settings.edgeDistance': 'Distance du bord(px)',
  'settings.edgeDistanceError': 'La distance du bord doit être comprise entre 0px et 200px',
  'settings.topButtonColor': 'Couleur du bouton haut',
  'settings.bottomButtonColor': 'Couleur du bouton bas',
  'settings.opacity': 'Opacité',
  'settings.shortcutSettings': 'Raccourcis',
  'settings.enableHoverHide': 'Masquer les boutons au survol + raccourci',
  'settings.hoverHideKey': 'Touche de raccourci',
  'settings.hoverHideHint': 'Astuce : au survol des boutons, maintenez le raccourci choisi pour les masquer en douceur',
  'settings.preview': 'Aperçu en direct',
  'settings.about': 'À propos de l’extension',
  'settings.feedback': 'Pour toute suggestion ou remarque, contactez le développeur :',
  'settings.saveButton': 'Enregistrer',
  'settings.saveSuccess': 'Enregistré avec succès !',
  'settings.sizeError': 'La taille du bouton doit être comprise entre 10px et 120px',
  'settings.colorNote': 'La couleur par défaut est #4A9EDD, cliquez sur le sélecteur ci-dessus pour la personnaliser',
  'settings.key.macAlt': 'Option (⌥)',
  'settings.key.macCtrl': 'Command (⌘)',
  'settings.key.macShift': 'Shift (⇧)',
  'settings.advancedFeatures': 'Fonctions avancées',
  'settings.progressBarEnabled': 'Activer la barre de progression',
  'settings.progressBarMode': 'Style d’affichage',
  'settings.progressBarMode.verticalButton': 'Bouton de progression vertical',
  'settings.progressBarMode.horizontalBar': 'Barre horizontale au bord de la page',
  'settings.progressVerticalHeight': 'Hauteur verticale(px)',
  'settings.progressHorizontalPosition': 'Position horizontale',
  'settings.progressHorizontalPosition.top': 'Haut',
  'settings.progressHorizontalPosition.bottom': 'Bas',
  'settings.progressThickness': 'Épaisseur horizontale(px)',
  'settings.progressColorMode': 'Couleur de progression',
  'settings.progressColorMode.followTopButton': 'Suivre le bouton haut',
  'settings.progressColorMode.followBottomButton': 'Suivre le bouton bas',
  'settings.progressColorMode.custom': 'Personnalisée',
  'settings.progressCustomColor': 'Couleur de progression personnalisée',
  'settings.progressClickToJump': 'Cliquer sur la progression pour sauter',
  'settings.progressShowPercentage': 'Afficher le pourcentage',
  'settings.progressShowRemainingTime': 'Afficher le temps de lecture restant',
  'settings.progressInfiniteNote': 'Sur les pages à défilement infini, la progression peut changer lorsque du contenu se charge.',
  'settings.readingTools': 'Outils de lecture',
  'settings.readingToolsEnabled': 'Activer le bouton des outils de lecture',
  'settings.readingToolsIntro': 'Le bouton des outils de lecture est désactivé par défaut. Activez-le pour utiliser les fonctions de lecture sélectionnées.',
  'settings.readingToolPosition': 'Position du bouton',
  'settings.readingToolPosition.pageTop': 'Haut de page',
  'settings.readingToolPosition.pageBottom': 'Bas de page',
  'settings.readingToolPosition.betweenScrollButtons': 'Entre les boutons de défilement',
  'settings.readingToolColorMode': 'Couleur du bouton',
  'settings.readingToolColorMode.followTopButton': 'Suivre le bouton haut',
  'settings.readingToolColorMode.followBottomButton': 'Suivre le bouton bas',
  'settings.readingToolColorMode.custom': 'Personnalisée',
  'settings.readingToolCustomColor': 'Couleur personnalisée des outils de lecture',
  'settings.scrollBookmarksEnabled': 'Activer les marque-pages de position',
  'settings.outlineNavigationEnabled': 'Activer la navigation intelligente par sections',
  'settings.outlineSources': 'Sources du plan',
  'settings.outlineSourceH1': 'Source H1',
  'settings.outlineSourceH2': 'Source H2',
  'settings.outlineSourceH3': 'Source H3',
  'settings.outlineSourceIdBlocks': 'Blocs avec un id',
  'settings.outlineSourcesReset': 'Au moins une source est requise. H1 + H2 ont été restaurés.',
  'settings.outlineMaxItems': 'Éléments chargés par lot',
  'settings.outlineMaxItemsError': 'Le nombre d’éléments par lot doit être compris entre 10 et 50.',
  'settings.outlineFilterShortHeadings': 'Filtrer automatiquement les titres courts',
  'settings.outlineHighlightCurrentSection': 'Mettre en évidence la section actuelle',
  'settings.scrollBookmarkPerDomainLimit': 'Positions enregistrées par domaine',
  'settings.scrollBookmarkPerDomainLimit.one': 'Dernière 1',
  'settings.scrollBookmarkPerDomainLimit.three': 'Dernières 3',
  'settings.savedScrollBookmarks': 'Positions enregistrées',
  'settings.savedBookmarksEmpty': 'Aucune position de lecture enregistrée.',
  'settings.openBookmark': 'Ouvrir',
  'settings.deleteBookmark': 'Supprimer',
  'settings.iconSet': 'Style d’icône',
  'settings.iconSet.defaultArrow': 'Flèche par défaut',
  'settings.iconSet.triangle': 'Triangle',
  'settings.iconSet.chevron': 'Chevron',
  'settings.iconSet.doubleArrow': 'Double flèche',
  'settings.iconColor': 'Couleur de l’icône',
  'settings.customIconComingSoon': 'Import d’icône personnalisée bientôt disponible.',
  'settings.siteManagement': 'État d’activation des sites',
  'settings.domainSearch': 'Rechercher des domaines',
  'settings.domainInput': 'example.com ou https://example.com/page',
  'settings.domainEnabled': 'Activé',
  'settings.domainDisabled': 'Désactivé',
  'settings.domainEmpty': 'Aucun site configuré manuellement.',
  'settings.addDomain': 'Ajouter un domaine',
  'settings.clearDisabledSites': 'Effacer les sites désactivés',
  'settings.restoreAllSites': 'Tout réactiver',
  'settings.deleteDomain': 'Supprimer',
  'settings.invalidDomain': 'Saisissez un nom d’hôte http/https valide.',
  'settings.verticalHeightError': 'La hauteur verticale doit être comprise entre 40px et 400px'
});

translations['pt-BR'] = Object.assign({}, translations['en-US'], {
  'settings.title': 'Smart Scroll Navigator',
  'settings.subtitle': 'Configure botões de rolagem, progresso de leitura e status por site.',
  'settings.tab.basic': 'Configurações básicas',
  'settings.tab.advanced': 'Recursos avançados',
  'settings.tab.domains': 'Gerenciamento de domínios',
  'settings.tab.feedback': 'Sugestões e sobre',
  'settings.basicIntro': 'Ajuste velocidade de rolagem, posição, aparência, ícones e atalhos.',
  'settings.advancedIntro': 'Configure a exibição e a interação da barra de progresso da página.',
  'settings.domainIntro': 'Gerencie se os botões de rolagem ficam ativados em sites específicos.',
  'settings.scrollBehavior': 'Comportamento de rolagem',
  'settings.buttonIcons': 'Ícones dos botões',
  'settings.progressBar': 'Barra de progresso da página',
  'settings.aboutDescription': 'Smart Scroll Navigator ajuda a ir ao topo ou ao fim das páginas, acompanhar o progresso de leitura e gerenciar configurações por site.',
  'settings.versionLabel': 'Versão: ',
  'settings.authorLabel': 'Autor: ',
  'settings.language': 'Idioma',
  'settings.scrollSpeed': 'Velocidade de rolagem',
  'settings.buttonPosition': 'Posição dos botões',
  'settings.horizontalPosition': 'Posição horizontal',
  'settings.verticalAlignment': 'Alinhamento vertical',
  'settings.position.right': 'Borda direita',
  'settings.position.left': 'Borda esquerda',
  'settings.alignment.center': 'Centro',
  'settings.alignment.top': 'Topo',
  'settings.alignment.bottom': 'Parte inferior',
  'settings.buttonStyle': 'Estilo dos botões',
  'settings.buttonShape': 'Formato dos botões',
  'settings.buttonShape.round': 'Redondo',
  'settings.buttonShape.square': 'Quadrado',
  'settings.buttonSize': 'Tamanho do botão(px)',
  'settings.buttonSpacing': 'Espaçamento dos botões(px)',
  'settings.spacingError': 'O espaçamento dos botões deve ficar entre 0px e 800px',
  'settings.edgeDistance': 'Distância da borda(px)',
  'settings.edgeDistanceError': 'A distância da borda deve ficar entre 0px e 200px',
  'settings.topButtonColor': 'Cor do botão superior',
  'settings.bottomButtonColor': 'Cor do botão inferior',
  'settings.opacity': 'Opacidade',
  'settings.shortcutSettings': 'Atalhos',
  'settings.enableHoverHide': 'Ocultar botões com hover + atalho',
  'settings.hoverHideKey': 'Tecla de atalho',
  'settings.hoverHideHint': 'Dica: ao passar o mouse sobre os botões e pressionar o atalho escolhido, eles serão ocultados suavemente',
  'settings.preview': 'Prévia ao vivo',
  'settings.about': 'Sobre a extensão',
  'settings.feedback': 'Para sugestões ou feedback, entre em contato com o desenvolvedor:',
  'settings.saveButton': 'Salvar',
  'settings.saveSuccess': 'Salvo com sucesso!',
  'settings.sizeError': 'O tamanho do botão deve ficar entre 10px e 120px',
  'settings.colorNote': 'A cor padrão é #4A9EDD; clique no seletor acima para personalizar',
  'settings.key.macAlt': 'Option (⌥)',
  'settings.key.macCtrl': 'Command (⌘)',
  'settings.key.macShift': 'Shift (⇧)',
  'settings.advancedFeatures': 'Recursos avançados',
  'settings.progressBarEnabled': 'Ativar barra de progresso da página',
  'settings.progressBarMode': 'Estilo de exibição',
  'settings.progressBarMode.verticalButton': 'Botão vertical de progresso',
  'settings.progressBarMode.horizontalBar': 'Barra horizontal na borda da página',
  'settings.progressVerticalHeight': 'Altura vertical(px)',
  'settings.progressHorizontalPosition': 'Posição horizontal',
  'settings.progressHorizontalPosition.top': 'Topo',
  'settings.progressHorizontalPosition.bottom': 'Parte inferior',
  'settings.progressThickness': 'Espessura horizontal(px)',
  'settings.progressColorMode': 'Cor do progresso',
  'settings.progressColorMode.followTopButton': 'Seguir botão superior',
  'settings.progressColorMode.followBottomButton': 'Seguir botão inferior',
  'settings.progressColorMode.custom': 'Personalizada',
  'settings.progressCustomColor': 'Cor de progresso personalizada',
  'settings.progressClickToJump': 'Clicar na barra para saltar',
  'settings.progressShowPercentage': 'Mostrar porcentagem',
  'settings.progressShowRemainingTime': 'Mostrar tempo de leitura restante',
  'settings.progressInfiniteNote': 'Em páginas de rolagem infinita, o progresso pode mudar conforme novo conteúdo carrega.',
  'settings.readingTools': 'Ferramentas de leitura',
  'settings.readingToolsEnabled': 'Ativar botão de ferramentas de leitura',
  'settings.readingToolsIntro': 'O botão de ferramentas de leitura fica desativado por padrão. Ative para usar os recursos de leitura habilitados.',
  'settings.readingToolPosition': 'Posição do botão',
  'settings.readingToolPosition.pageTop': 'Topo da página',
  'settings.readingToolPosition.pageBottom': 'Fim da página',
  'settings.readingToolPosition.betweenScrollButtons': 'Entre botões de rolagem',
  'settings.readingToolColorMode': 'Cor do botão',
  'settings.readingToolColorMode.followTopButton': 'Seguir botão superior',
  'settings.readingToolColorMode.followBottomButton': 'Seguir botão inferior',
  'settings.readingToolColorMode.custom': 'Personalizada',
  'settings.readingToolCustomColor': 'Cor personalizada das ferramentas de leitura',
  'settings.scrollBookmarksEnabled': 'Ativar favoritos de posição de rolagem',
  'settings.outlineNavigationEnabled': 'Ativar navegação inteligente por seções',
  'settings.outlineSources': 'Fontes do sumário',
  'settings.outlineSourceH1': 'Fonte H1',
  'settings.outlineSourceH2': 'Fonte H2',
  'settings.outlineSourceH3': 'Fonte H3',
  'settings.outlineSourceIdBlocks': 'Blocos com id',
  'settings.outlineSourcesReset': 'É necessária ao menos uma fonte. H1 + H2 foram restaurados.',
  'settings.outlineMaxItems': 'Itens do sumário por lote',
  'settings.outlineMaxItemsError': 'Os itens por lote devem ficar entre 10 e 50.',
  'settings.outlineFilterShortHeadings': 'Filtrar títulos curtos automaticamente',
  'settings.outlineHighlightCurrentSection': 'Destacar a seção atual',
  'settings.scrollBookmarkPerDomainLimit': 'Posições salvas por domínio',
  'settings.scrollBookmarkPerDomainLimit.one': 'Última 1',
  'settings.scrollBookmarkPerDomainLimit.three': 'Últimas 3',
  'settings.savedScrollBookmarks': 'Posições salvas',
  'settings.savedBookmarksEmpty': 'Nenhuma posição de leitura salva ainda.',
  'settings.openBookmark': 'Abrir',
  'settings.deleteBookmark': 'Excluir',
  'settings.iconSet': 'Estilo do ícone',
  'settings.iconSet.defaultArrow': 'Seta padrão',
  'settings.iconSet.triangle': 'Triângulo',
  'settings.iconSet.chevron': 'Chevron',
  'settings.iconSet.doubleArrow': 'Seta dupla',
  'settings.iconColor': 'Cor do ícone',
  'settings.customIconComingSoon': 'Upload de ícone personalizado em breve.',
  'settings.siteManagement': 'Status de ativação do site',
  'settings.domainSearch': 'Pesquisar domínios',
  'settings.domainInput': 'example.com ou https://example.com/page',
  'settings.domainEnabled': 'Ativado',
  'settings.domainDisabled': 'Desativado',
  'settings.domainEmpty': 'Nenhum site configurado manualmente.',
  'settings.addDomain': 'Adicionar domínio',
  'settings.clearDisabledSites': 'Limpar sites desativados',
  'settings.restoreAllSites': 'Restaurar todos ativados',
  'settings.deleteDomain': 'Excluir',
  'settings.invalidDomain': 'Digite um hostname http/https válido.',
  'settings.verticalHeightError': 'A altura vertical deve ficar entre 40px e 400px'
});

translations['ko-KR'] = Object.assign({}, translations['en-US'], {
  'settings.title': 'Smart Scroll Navigator',
  'settings.subtitle': '스크롤 버튼, 읽기 진행률, 사이트별 사용 상태를 설정합니다.',
  'settings.tab.basic': '기본 설정',
  'settings.tab.advanced': '고급 기능',
  'settings.tab.domains': '도메인 관리',
  'settings.tab.feedback': '제안 및 확장 프로그램 정보',
  'settings.basicIntro': '스크롤 속도, 버튼 위치, 모양, 아이콘, 단축키를 조정합니다.',
  'settings.advancedIntro': '페이지 진행률 표시와 상호작용 방식을 설정합니다.',
  'settings.domainIntro': '특정 사이트에서 스크롤 버튼 사용 여부를 관리합니다.',
  'settings.scrollBehavior': '스크롤 동작',
  'settings.buttonIcons': '버튼 아이콘',
  'settings.progressBar': '페이지 진행률 표시줄',
  'settings.aboutDescription': 'Smart Scroll Navigator는 페이지 상단/하단 이동, 읽기 진행률 확인, 사이트별 사용 설정을 도와줍니다.',
  'settings.versionLabel': '버전: ',
  'settings.authorLabel': '제작자: ',
  'settings.language': '언어',
  'settings.scrollSpeed': '스크롤 속도',
  'settings.buttonPosition': '버튼 위치',
  'settings.horizontalPosition': '가로 위치',
  'settings.verticalAlignment': '세로 정렬',
  'settings.position.right': '오른쪽 가장자리',
  'settings.position.left': '왼쪽 가장자리',
  'settings.alignment.center': '가운데',
  'settings.alignment.top': '위',
  'settings.alignment.bottom': '아래',
  'settings.buttonStyle': '버튼 스타일',
  'settings.buttonShape': '버튼 모양',
  'settings.buttonShape.round': '원형',
  'settings.buttonShape.square': '사각형',
  'settings.buttonSize': '버튼 크기(px)',
  'settings.buttonSpacing': '버튼 간격(px)',
  'settings.spacingError': '버튼 간격은 0px에서 800px 사이여야 합니다',
  'settings.edgeDistance': '가장자리 거리(px)',
  'settings.edgeDistanceError': '가장자리 거리는 0px에서 200px 사이여야 합니다',
  'settings.topButtonColor': '상단 버튼 색상',
  'settings.bottomButtonColor': '하단 버튼 색상',
  'settings.opacity': '투명도',
  'settings.shortcutSettings': '단축키 설정',
  'settings.enableHoverHide': '마우스 오버 + 단축키로 버튼 숨기기',
  'settings.hoverHideKey': '단축키',
  'settings.hoverHideHint': '팁: 버튼 위에 마우스를 올리고 선택한 단축키를 누르면 버튼이 부드럽게 숨겨집니다',
  'settings.preview': '실시간 미리보기',
  'settings.about': '확장 프로그램 정보',
  'settings.feedback': '제안이나 피드백은 개발자에게 문의하세요:',
  'settings.saveButton': '저장',
  'settings.saveSuccess': '저장되었습니다!',
  'settings.sizeError': '버튼 크기는 10px에서 120px 사이여야 합니다',
  'settings.colorNote': '기본 색상은 #4A9EDD이며 위 선택기에서 변경할 수 있습니다',
  'settings.key.macAlt': 'Option (⌥)',
  'settings.key.macCtrl': 'Command (⌘)',
  'settings.key.macShift': 'Shift (⇧)',
  'settings.advancedFeatures': '고급 기능',
  'settings.progressBarEnabled': '페이지 진행률 표시줄 사용',
  'settings.progressBarMode': '표시 스타일',
  'settings.progressBarMode.verticalButton': '세로 진행률 버튼',
  'settings.progressBarMode.horizontalBar': '가로 페이지 가장자리 표시줄',
  'settings.progressVerticalHeight': '세로 높이(px)',
  'settings.progressHorizontalPosition': '가로 위치',
  'settings.progressHorizontalPosition.top': '위',
  'settings.progressHorizontalPosition.bottom': '아래',
  'settings.progressThickness': '가로 두께(px)',
  'settings.progressColorMode': '진행률 색상',
  'settings.progressColorMode.followTopButton': '상단 버튼 따르기',
  'settings.progressColorMode.followBottomButton': '하단 버튼 따르기',
  'settings.progressColorMode.custom': '사용자 지정',
  'settings.progressCustomColor': '사용자 지정 진행률 색상',
  'settings.progressClickToJump': '진행률 표시줄 클릭으로 이동',
  'settings.progressShowPercentage': '백분율 표시',
  'settings.progressShowRemainingTime': '남은 읽기 시간 표시',
  'settings.progressInfiniteNote': '무한 스크롤 페이지에서는 새 콘텐츠가 로드되며 진행률이 바뀔 수 있습니다.',
  'settings.readingTools': '읽기 도구',
  'settings.readingToolsEnabled': '읽기 도구 버튼 사용',
  'settings.readingToolsIntro': '읽기 도구 버튼은 기본적으로 꺼져 있습니다. 켜면 활성화된 읽기 기능을 사용할 수 있습니다.',
  'settings.readingToolPosition': '버튼 위치',
  'settings.readingToolPosition.pageTop': '페이지 상단',
  'settings.readingToolPosition.pageBottom': '페이지 하단',
  'settings.readingToolPosition.betweenScrollButtons': '스크롤 버튼 사이',
  'settings.readingToolColorMode': '버튼 색상',
  'settings.readingToolColorMode.followTopButton': '상단 버튼 따르기',
  'settings.readingToolColorMode.followBottomButton': '하단 버튼 따르기',
  'settings.readingToolColorMode.custom': '사용자 지정',
  'settings.readingToolCustomColor': '사용자 지정 읽기 도구 색상',
  'settings.scrollBookmarksEnabled': '스크롤 위치 북마크 사용',
  'settings.outlineNavigationEnabled': '스마트 구간 이동 사용',
  'settings.outlineSources': '목차 소스',
  'settings.outlineSourceH1': 'H1 소스',
  'settings.outlineSourceH2': 'H2 소스',
  'settings.outlineSourceH3': 'H3 소스',
  'settings.outlineSourceIdBlocks': 'id가 있는 블록',
  'settings.outlineSourcesReset': '목차 소스가 하나 이상 필요합니다. H1 + H2를 복원했습니다.',
  'settings.outlineMaxItems': '배치당 목차 항목',
  'settings.outlineMaxItemsError': '배치당 목차 항목은 10에서 50 사이여야 합니다.',
  'settings.outlineFilterShortHeadings': '짧은 제목 자동 필터링',
  'settings.outlineHighlightCurrentSection': '현재 구간 강조',
  'settings.scrollBookmarkPerDomainLimit': '도메인별 저장 위치',
  'settings.scrollBookmarkPerDomainLimit.one': '최근 1개',
  'settings.scrollBookmarkPerDomainLimit.three': '최근 3개',
  'settings.savedScrollBookmarks': '저장된 위치',
  'settings.savedBookmarksEmpty': '저장된 읽기 위치가 없습니다.',
  'settings.openBookmark': '열기',
  'settings.deleteBookmark': '삭제',
  'settings.iconSet': '아이콘 스타일',
  'settings.iconSet.defaultArrow': '기본 화살표',
  'settings.iconSet.triangle': '삼각형',
  'settings.iconSet.chevron': '꺾쇠',
  'settings.iconSet.doubleArrow': '이중 화살표',
  'settings.iconColor': '아이콘 색상',
  'settings.customIconComingSoon': '사용자 지정 아이콘 업로드는 곧 제공됩니다.',
  'settings.siteManagement': '사이트 사용 상태',
  'settings.domainSearch': '도메인 검색',
  'settings.domainInput': 'example.com 또는 https://example.com/page',
  'settings.domainEnabled': '사용',
  'settings.domainDisabled': '사용 안 함',
  'settings.domainEmpty': '수동 설정된 사이트가 없습니다.',
  'settings.addDomain': '도메인 추가',
  'settings.clearDisabledSites': '비활성 사이트 지우기',
  'settings.restoreAllSites': '모두 사용으로 복원',
  'settings.deleteDomain': '삭제',
  'settings.invalidDomain': '유효한 http/https 웹사이트 호스트 이름을 입력하세요.',
  'settings.verticalHeightError': '세로 높이는 40px에서 400px 사이여야 합니다'
});

translations['it-IT'] = Object.assign({}, translations['en-US'], {
  'settings.title': 'Smart Scroll Navigator',
  'settings.subtitle': 'Configura i pulsanti di scorrimento, il progresso di lettura e lo stato per sito.',
  'settings.tab.basic': 'Impostazioni base',
  'settings.tab.advanced': 'Funzioni avanzate',
  'settings.tab.domains': 'Gestione domini',
  'settings.tab.feedback': 'Suggerimenti e informazioni',
  'settings.basicIntro': 'Regola velocità di scorrimento, posizione, aspetto, icone e scorciatoie.',
  'settings.advancedIntro': 'Configura visualizzazione e interazioni della barra di progresso.',
  'settings.domainIntro': 'Gestisci se i pulsanti di scorrimento sono attivi su siti specifici.',
  'settings.scrollBehavior': 'Comportamento di scorrimento',
  'settings.buttonIcons': 'Icone dei pulsanti',
  'settings.progressBar': 'Barra di progresso pagina',
  'settings.aboutDescription': 'Smart Scroll Navigator aiuta a saltare in cima o in fondo alle pagine, seguire il progresso di lettura e gestire le impostazioni per sito.',
  'settings.versionLabel': 'Versione: ',
  'settings.authorLabel': 'Autore: ',
  'settings.language': 'Lingua',
  'settings.scrollSpeed': 'Velocità di scorrimento',
  'settings.buttonPosition': 'Posizione pulsanti',
  'settings.horizontalPosition': 'Posizione orizzontale',
  'settings.verticalAlignment': 'Allineamento verticale',
  'settings.position.right': 'Bordo destro',
  'settings.position.left': 'Bordo sinistro',
  'settings.alignment.center': 'Centro',
  'settings.alignment.top': 'Alto',
  'settings.alignment.bottom': 'Basso',
  'settings.buttonStyle': 'Stile pulsanti',
  'settings.buttonShape': 'Forma pulsanti',
  'settings.buttonShape.round': 'Rotondo',
  'settings.buttonShape.square': 'Quadrato',
  'settings.buttonSize': 'Dimensione pulsante(px)',
  'settings.buttonSpacing': 'Spaziatura pulsanti(px)',
  'settings.spacingError': 'La spaziatura dei pulsanti deve essere tra 0px e 800px',
  'settings.edgeDistance': 'Distanza dal bordo(px)',
  'settings.edgeDistanceError': 'La distanza dal bordo deve essere tra 0px e 200px',
  'settings.topButtonColor': 'Colore pulsante superiore',
  'settings.bottomButtonColor': 'Colore pulsante inferiore',
  'settings.opacity': 'Opacità',
  'settings.shortcutSettings': 'Scorciatoie',
  'settings.enableHoverHide': 'Nascondi pulsanti con hover + scorciatoia',
  'settings.hoverHideKey': 'Tasto scorciatoia',
  'settings.hoverHideHint': 'Suggerimento: passando sui pulsanti e premendo la scorciatoia scelta, i pulsanti si nascondono gradualmente',
  'settings.preview': 'Anteprima live',
  'settings.about': 'Informazioni sull’estensione',
  'settings.feedback': 'Per suggerimenti o feedback, contatta lo sviluppatore:',
  'settings.saveButton': 'Salva',
  'settings.saveSuccess': 'Salvato con successo!',
  'settings.sizeError': 'La dimensione del pulsante deve essere tra 10px e 120px',
  'settings.colorNote': 'Il colore predefinito è #4A9EDD; fai clic sul selettore sopra per personalizzarlo',
  'settings.key.macAlt': 'Option (⌥)',
  'settings.key.macCtrl': 'Command (⌘)',
  'settings.key.macShift': 'Shift (⇧)',
  'settings.advancedFeatures': 'Funzioni avanzate',
  'settings.progressBarEnabled': 'Attiva barra di progresso pagina',
  'settings.progressBarMode': 'Stile di visualizzazione',
  'settings.progressBarMode.verticalButton': 'Pulsante progresso verticale',
  'settings.progressBarMode.horizontalBar': 'Barra orizzontale sul bordo pagina',
  'settings.progressVerticalHeight': 'Altezza verticale(px)',
  'settings.progressHorizontalPosition': 'Posizione orizzontale',
  'settings.progressHorizontalPosition.top': 'Alto',
  'settings.progressHorizontalPosition.bottom': 'Basso',
  'settings.progressThickness': 'Spessore orizzontale(px)',
  'settings.progressColorMode': 'Colore progresso',
  'settings.progressColorMode.followTopButton': 'Segui pulsante superiore',
  'settings.progressColorMode.followBottomButton': 'Segui pulsante inferiore',
  'settings.progressColorMode.custom': 'Personalizzato',
  'settings.progressCustomColor': 'Colore progresso personalizzato',
  'settings.progressClickToJump': 'Clicca sulla barra per saltare',
  'settings.progressShowPercentage': 'Mostra percentuale',
  'settings.progressShowRemainingTime': 'Mostra tempo di lettura restante',
  'settings.progressInfiniteNote': 'Nelle pagine a scorrimento infinito, il progresso può cambiare mentre vengono caricati nuovi contenuti.',
  'settings.readingTools': 'Strumenti di lettura',
  'settings.readingToolsEnabled': 'Attiva pulsante strumenti di lettura',
  'settings.readingToolsIntro': 'Il pulsante degli strumenti di lettura è disattivato per impostazione predefinita. Attivalo per usare le funzioni di lettura abilitate.',
  'settings.readingToolPosition': 'Posizione pulsante',
  'settings.readingToolPosition.pageTop': 'Inizio pagina',
  'settings.readingToolPosition.pageBottom': 'Fine pagina',
  'settings.readingToolPosition.betweenScrollButtons': 'Tra i pulsanti di scorrimento',
  'settings.readingToolColorMode': 'Colore pulsante',
  'settings.readingToolColorMode.followTopButton': 'Segui pulsante superiore',
  'settings.readingToolColorMode.followBottomButton': 'Segui pulsante inferiore',
  'settings.readingToolColorMode.custom': 'Personalizzato',
  'settings.readingToolCustomColor': 'Colore strumenti di lettura personalizzato',
  'settings.scrollBookmarksEnabled': 'Attiva segnalibri posizione di scorrimento',
  'settings.outlineNavigationEnabled': 'Attiva navigazione intelligente delle sezioni',
  'settings.outlineSources': 'Fonti dell’indice',
  'settings.outlineSourceH1': 'Fonte H1',
  'settings.outlineSourceH2': 'Fonte H2',
  'settings.outlineSourceH3': 'Fonte H3',
  'settings.outlineSourceIdBlocks': 'Blocchi con id',
  'settings.outlineSourcesReset': 'È necessaria almeno una fonte. H1 + H2 sono stati ripristinati.',
  'settings.outlineMaxItems': 'Voci per caricamento',
  'settings.outlineMaxItemsError': 'Le voci per caricamento devono essere comprese tra 10 e 50.',
  'settings.outlineFilterShortHeadings': 'Filtra automaticamente i titoli brevi',
  'settings.outlineHighlightCurrentSection': 'Evidenzia la sezione corrente',
  'settings.scrollBookmarkPerDomainLimit': 'Posizioni salvate per dominio',
  'settings.scrollBookmarkPerDomainLimit.one': 'Ultima 1',
  'settings.scrollBookmarkPerDomainLimit.three': 'Ultime 3',
  'settings.savedScrollBookmarks': 'Posizioni salvate',
  'settings.savedBookmarksEmpty': 'Nessuna posizione di lettura salvata.',
  'settings.openBookmark': 'Apri',
  'settings.deleteBookmark': 'Elimina',
  'settings.iconSet': 'Stile icona',
  'settings.iconSet.defaultArrow': 'Freccia predefinita',
  'settings.iconSet.triangle': 'Triangolo',
  'settings.iconSet.chevron': 'Chevron',
  'settings.iconSet.doubleArrow': 'Doppia freccia',
  'settings.iconColor': 'Colore icona',
  'settings.customIconComingSoon': 'Caricamento icone personalizzate in arrivo.',
  'settings.siteManagement': 'Stato attivazione sito',
  'settings.domainSearch': 'Cerca domini',
  'settings.domainInput': 'example.com o https://example.com/page',
  'settings.domainEnabled': 'Attivo',
  'settings.domainDisabled': 'Disattivato',
  'settings.domainEmpty': 'Nessun sito configurato manualmente.',
  'settings.addDomain': 'Aggiungi dominio',
  'settings.clearDisabledSites': 'Cancella siti disattivati',
  'settings.restoreAllSites': 'Ripristina tutti attivi',
  'settings.deleteDomain': 'Elimina',
  'settings.invalidDomain': 'Inserisci un hostname http/https valido.',
  'settings.verticalHeightError': 'L’altezza verticale deve essere tra 40px e 400px'
});

Object.keys(translations).forEach((lang) => {
  const t = translations[lang];
  const perDomainLimitTwoTranslations = {
    'zh-CN': '最近 2 条',
    'zh-TW': '最近 2 筆',
    'en-US': 'Latest 2',
    'es-ES': 'Últimas 2',
    'ja-JP': '最新 2 件',
    'de-DE': 'Neueste 2',
    'fr-FR': 'Dernières 2',
    'pt-BR': 'Últimas 2',
    'ko-KR': '최근 2개',
    'it-IT': 'Ultime 2'
  };
  const restoreModeTranslations = {
    'zh-CN': ['再次打开页面时', '自动加载到最新书签位置', '仅提示恢复到书签位置', '手动加载'],
    'zh-TW': ['再次開啟頁面時', '自動載入最新書籤位置', '僅提示還原到書籤位置', '手動載入'],
    'en-US': ['When reopening a page', 'Automatically load the latest bookmark', 'Only prompt to restore the bookmark', 'Load manually'],
    'es-ES': ['Al volver a abrir una página', 'Cargar automáticamente el marcador más reciente', 'Solo preguntar si se restaura el marcador', 'Cargar manualmente'],
    'ja-JP': ['ページを再度開いたとき', '最新のブックマーク位置を自動で読み込む', 'ブックマーク位置への復元のみ確認する', '手動で読み込む'],
    'de-DE': ['Beim erneuten Öffnen einer Seite', 'Neueste Lesezeichenposition automatisch laden', 'Nur zur Wiederherstellung auffordern', 'Manuell laden'],
    'fr-FR': ['Lors de la réouverture d’une page', 'Charger automatiquement le dernier marque-page', 'Proposer uniquement de restaurer le marque-page', 'Charger manuellement'],
    'pt-BR': ['Ao reabrir uma página', 'Carregar automaticamente o favorito mais recente', 'Apenas perguntar se deseja restaurar o favorito', 'Carregar manualmente'],
    'ko-KR': ['페이지를 다시 열 때', '최신 북마크 위치 자동 불러오기', '북마크 위치 복원 여부만 묻기', '수동으로 불러오기'],
    'it-IT': ['Quando riapri una pagina', 'Carica automaticamente il segnalibro più recente', 'Chiedi solo se ripristinare il segnalibro', 'Carica manualmente']
  }[lang] || [];
  const buttonColorTranslations = {
    'zh-CN': '按钮颜色',
    'zh-TW': '按鈕顏色',
    'en-US': 'Button color',
    'es-ES': 'Color del botón',
    'ja-JP': 'ボタンの色',
    'de-DE': 'Schaltflächenfarbe',
    'fr-FR': 'Couleur du bouton',
    'pt-BR': 'Cor do botão',
    'ko-KR': '버튼 색상',
    'it-IT': 'Colore del pulsante'
  }[lang];
  const domainFeatureTranslations = {
    'zh-CN': ['是否启用由工具栏 Popup 按当前主域名控制，此处只配置详细参数。', '插件', '页面进度条', '按屏跳转', '滚动位置书签', '智能段落跳转', '清除全部主域名记录', '配置高级功能的显示、位置和交互参数。', '按主域名管理插件和高级功能的启用状态。', '主域名', '操作'],
    'zh-TW': ['是否啟用由工具列 Popup 依目前主網域控制，此處只設定詳細參數。', '外掛', '頁面進度條', '上一屏／下一屏', '捲動位置書籤', '智慧段落跳轉', '清除全部主網域記錄', '設定進階功能的顯示、位置和互動參數。', '依主網域管理外掛和進階功能的啟用狀態。', '主網域', '操作'],
    'en-US': ['Enable these features per domain from the toolbar popup. Configure details here.', 'Extension', 'Progress bar', 'Screen navigation', 'Scroll bookmarks', 'Section navigation', 'Clear all domain records', 'Configure display, position, and interaction details for advanced features.', 'Manage the extension and advanced features by registrable domain.', 'Domain', 'Actions'],
    'es-ES': ['Activa estas funciones por dominio desde el popup. Configura aquí sus detalles.', 'Extensión', 'Progreso', 'Pantallas', 'Marcadores', 'Navegación', 'Borrar todos los dominios', 'Configura la visualización, posición e interacción de las funciones avanzadas.', 'Gestiona la extensión y sus funciones por dominio principal.', 'Dominio', 'Acciones'],
    'ja-JP': ['有効化はツールバーのポップアップでドメインごとに設定します。ここでは詳細のみ設定します。', '拡張機能', '進捗バー', '画面移動', '位置ブックマーク', 'セクション移動', '全ドメイン記録を消去', '高度な機能の表示、位置、操作を設定します。', '登録可能なドメインごとに拡張機能を管理します。', 'ドメイン', '操作'],
    'de-DE': ['Aktivierung pro Domain im Toolbar-Popup; hier werden nur Details konfiguriert.', 'Erweiterung', 'Fortschritt', 'Bildschirmnavigation', 'Lesezeichen', 'Navigation', 'Alle Domain-Einträge löschen', 'Anzeige, Position und Interaktion der erweiterten Funktionen konfigurieren.', 'Erweiterung und Funktionen nach registrierbarer Domain verwalten.', 'Domain', 'Aktionen'],
    'fr-FR': ['Activez ces fonctions par domaine dans le popup. Configurez les détails ici.', 'Extension', 'Progression', 'Navigation écran', 'Marque-pages', 'Navigation', 'Effacer tous les domaines', 'Configurer l’affichage, la position et les interactions des fonctions avancées.', 'Gérer l’extension et ses fonctions par domaine principal.', 'Domaine', 'Actions'],
    'pt-BR': ['Ative por domínio no popup da barra de ferramentas. Configure os detalhes aqui.', 'Extensão', 'Progresso', 'Navegação de tela', 'Favoritos', 'Navegação', 'Limpar todos os domínios', 'Configure exibição, posição e interação dos recursos avançados.', 'Gerencie a extensão e os recursos por domínio registrável.', 'Domínio', 'Ações'],
    'ko-KR': ['사용 여부는 도구 모음 팝업에서 도메인별로 설정하고 여기서는 세부 옵션만 구성합니다.', '확장 프로그램', '진행률', '화면 이동', '위치 북마크', '구간 이동', '모든 도메인 기록 지우기', '고급 기능의 표시, 위치 및 상호작용을 설정합니다.', '등록 가능한 도메인별로 확장 프로그램과 기능을 관리합니다.', '도메인', '작업'],
    'it-IT': ['Attiva le funzioni per dominio dal popup. Configura qui solo i dettagli.', 'Estensione', 'Progresso', 'Navigazione schermata', 'Segnalibri', 'Navigazione', 'Cancella tutti i domini', 'Configura visualizzazione, posizione e interazione delle funzioni avanzate.', 'Gestisci estensione e funzioni per dominio registrabile.', 'Dominio', 'Azioni']
  }[lang] || [];
  const advancedIntroTranslations = {
    'zh-CN': [
      '按当前可视区域高度跳转上一屏或下一屏，并保留阅读上下文。',
      '显示当前页面阅读进度，并可点击快速跳转到指定位置。',
      '保存当前阅读位置，方便稍后返回并继续阅读。',
      '识别页面标题结构，快速查看目录并跳转到上一段或下一段。'
    ],
    'zh-TW': [
      '依目前可視區域高度跳轉上一屏或下一屏，並保留閱讀脈絡。',
      '顯示目前頁面閱讀進度，並可點擊快速跳轉到指定位置。',
      '儲存目前閱讀位置，方便稍後返回並繼續閱讀。',
      '辨識頁面標題結構，快速查看目錄並跳轉到上一段或下一段。'
    ],
    'en-US': [
      'Move by the current viewport height while preserving reading context.',
      'Show page progress and click to jump to a specific position.',
      'Save your current reading position and continue later.',
      'Detect page headings to browse the outline and jump between sections.'
    ],
    'es-ES': [
      'Avanza o retrocede según la altura visible y conserva el contexto de lectura.',
      'Muestra el progreso de la página y permite saltar a una posición.',
      'Guarda la posición de lectura para continuar más tarde.',
      'Detecta los títulos para explorar el índice y saltar entre secciones.'
    ],
    'ja-JP': [
      '現在の表示領域の高さを基準に前後の画面へ移動し、読書の文脈を保ちます。',
      'ページの進捗を表示し、クリックして指定位置へ移動できます。',
      '現在の読書位置を保存し、後で続きから再開できます。',
      'ページ見出しを検出し、目次の確認や前後のセクション移動ができます。'
    ],
    'de-DE': [
      'Navigiert anhand der sichtbaren Höhe vor oder zurück und erhält den Lesekontext.',
      'Zeigt den Seitenfortschritt und ermöglicht Sprünge zu einer Position.',
      'Speichert die aktuelle Leseposition, um später fortzufahren.',
      'Erkennt Überschriften für Gliederung und Abschnittsnavigation.'
    ],
    'fr-FR': [
      'Navigue selon la hauteur visible tout en conservant le contexte de lecture.',
      'Affiche la progression et permet de rejoindre une position précise.',
      'Enregistre la position de lecture pour reprendre plus tard.',
      'Détecte les titres pour parcourir le plan et changer de section.'
    ],
    'pt-BR': [
      'Avança ou retorna pela altura visível mantendo o contexto de leitura.',
      'Mostra o progresso da página e permite saltar para uma posição.',
      'Salva a posição de leitura para continuar mais tarde.',
      'Detecta títulos para navegar pelo sumário e entre seções.'
    ],
    'ko-KR': [
      '현재 보이는 영역 높이만큼 이전 또는 다음 화면으로 이동해 읽기 맥락을 유지합니다.',
      '페이지 진행률을 표시하고 원하는 위치로 빠르게 이동합니다.',
      '현재 읽기 위치를 저장해 나중에 이어서 읽습니다.',
      '페이지 제목 구조를 감지해 목차와 이전·다음 구간으로 이동합니다.'
    ],
    'it-IT': [
      'Avanza o torna indietro in base all’altezza visibile mantenendo il contesto.',
      'Mostra l’avanzamento della pagina e consente di passare a una posizione.',
      'Salva la posizione di lettura per continuare in seguito.',
      'Rileva i titoli per consultare l’indice e spostarsi tra le sezioni.'
    ]
  }[lang];
  const globalShortcutTranslations = {
    'zh-CN': ['全局滚动快捷键', '回到顶部', '回到底部', '自定义快捷键', '快捷键由 Chrome 管理，修改后返回本页即可查看最新绑定。', '未设置', '正在读取...'],
    'zh-TW': ['全域捲動快捷鍵', '回到頂部', '回到底部', '自訂快捷鍵', '快捷鍵由 Chrome 管理，修改後返回本頁即可查看最新綁定。', '未設定', '正在讀取...'],
    'en-US': ['Global scroll shortcuts', 'Scroll to top', 'Scroll to bottom', 'Customize shortcuts', 'Shortcuts are managed by Chrome. Return to this page to see updated bindings.', 'Not set', 'Loading...'],
    'es-ES': ['Atajos globales de desplazamiento', 'Ir al inicio', 'Ir al final', 'Personalizar atajos', 'Chrome administra los atajos. Vuelve a esta página para ver los cambios.', 'Sin asignar', 'Cargando...'],
    'ja-JP': ['グローバルスクロールショートカット', 'ページ先頭へ', 'ページ末尾へ', 'ショートカットをカスタマイズ', 'ショートカットは Chrome で管理されます。変更後、このページに戻ると最新の割り当てが表示されます。', '未設定', '読み込み中...'],
    'de-DE': ['Globale Scroll-Tastenkürzel', 'Zum Seitenanfang', 'Zum Seitenende', 'Tastenkürzel anpassen', 'Tastenkürzel werden von Chrome verwaltet. Kehren Sie nach Änderungen zu dieser Seite zurück.', 'Nicht festgelegt', 'Wird geladen...'],
    'fr-FR': ['Raccourcis globaux de défilement', 'Aller en haut', 'Aller en bas', 'Personnaliser les raccourcis', 'Les raccourcis sont gérés par Chrome. Revenez sur cette page après les avoir modifiés.', 'Non défini', 'Chargement...'],
    'pt-BR': ['Atalhos globais de rolagem', 'Ir para o topo', 'Ir para o fim', 'Personalizar atalhos', 'Os atalhos são gerenciados pelo Chrome. Volte a esta página para ver as alterações.', 'Não definido', 'Carregando...'],
    'ko-KR': ['전역 스크롤 단축키', '페이지 맨 위로', '페이지 맨 아래로', '단축키 맞춤설정', '단축키는 Chrome에서 관리합니다. 변경 후 이 페이지로 돌아오면 최신 설정이 표시됩니다.', '설정 안 됨', '불러오는 중...'],
    'it-IT': ['Scorciatoie globali di scorrimento', 'Vai all’inizio', 'Vai alla fine', 'Personalizza scorciatoie', 'Le scorciatoie sono gestite da Chrome. Torna a questa pagina dopo le modifiche.', 'Non impostata', 'Caricamento...']
  }[lang];
  Object.assign(t, {
    'settings.progressColorMode': buttonColorTranslations,
    'settings.readingToolCustomColor': buttonColorTranslations,
    'settings.scrollBookmarks': domainFeatureTranslations[4],
    'settings.scrollBookmarksIntro': t['settings.scrollBookmarksIntro'] || t['settings.readingToolsIntro'],
    'settings.outlineNavigation': domainFeatureTranslations[5],
    'settings.outlineNavigationIntro': t['settings.outlineNavigationIntro'] || t['settings.readingToolsIntro'],
    'settings.featureButtonPosition': t['settings.featureButtonPosition'] || t['settings.readingToolPosition'],
    'settings.featureButtonPosition.pageTop': t['settings.featureButtonPosition.pageTop'] || t['settings.readingToolPosition.pageTop'],
    'settings.featureButtonPosition.pageBottom': t['settings.featureButtonPosition.pageBottom'] || t['settings.readingToolPosition.pageBottom'],
    'settings.featureButtonPosition.betweenScrollButtons': t['settings.featureButtonPosition.betweenScrollButtons'] || t['settings.readingToolPosition.betweenScrollButtons'],
    'settings.featureButtonColorMode': t['settings.featureButtonColorMode'] || t['settings.readingToolColorMode'],
    'settings.featureButtonColorMode.followTopButton': t['settings.featureButtonColorMode.followTopButton'] || t['settings.readingToolColorMode.followTopButton'],
    'settings.featureButtonColorMode.followBottomButton': t['settings.featureButtonColorMode.followBottomButton'] || t['settings.readingToolColorMode.followBottomButton'],
    'settings.featureButtonColorMode.custom': t['settings.featureButtonColorMode.custom'] || t['settings.readingToolColorMode.custom'],
    'settings.scrollBookmarkButtonCustomColor': t['settings.scrollBookmarkButtonCustomColor'] || t['settings.readingToolCustomColor'],
    'settings.outlineButtonCustomColor': t['settings.outlineButtonCustomColor'] || t['settings.readingToolCustomColor'],
    'settings.scrollBookmarkPerDomainLimit.two': perDomainLimitTwoTranslations[lang],
    'settings.scrollBookmarkRestoreMode': restoreModeTranslations[0],
    'settings.scrollBookmarkRestoreMode.auto': restoreModeTranslations[1],
    'settings.scrollBookmarkRestoreMode.prompt': restoreModeTranslations[2],
    'settings.scrollBookmarkRestoreMode.manual': restoreModeTranslations[3],
    'settings.advancedEnableHint': domainFeatureTranslations[0],
    'settings.domainExtension': domainFeatureTranslations[1],
    'settings.domainProgressBar': domainFeatureTranslations[2],
    'settings.domainScreenNavigation': domainFeatureTranslations[3],
    'settings.domainScrollBookmarks': domainFeatureTranslations[4],
    'settings.domainOutlineNavigation': domainFeatureTranslations[5],
    'settings.clearAllDomainStates': domainFeatureTranslations[6],
    'settings.advancedIntro': domainFeatureTranslations[7],
    'settings.domainIntro': domainFeatureTranslations[8],
    'settings.domainName': domainFeatureTranslations[9],
    'settings.domainActions': domainFeatureTranslations[10],
    'settings.globalScrollShortcuts': globalShortcutTranslations[0],
    'settings.scrollToTopShortcut': globalShortcutTranslations[1],
    'settings.scrollToBottomShortcut': globalShortcutTranslations[2],
    'settings.customizeShortcuts': globalShortcutTranslations[3],
    'settings.globalShortcutsHint': globalShortcutTranslations[4],
    'settings.shortcutUnset': globalShortcutTranslations[5],
    'settings.shortcutLoading': globalShortcutTranslations[6]
  });
  if (advancedIntroTranslations) {
    t['settings.screenNavigationIntro'] = advancedIntroTranslations[0];
    t['settings.progressBarIntro'] = advancedIntroTranslations[1];
    t['settings.scrollBookmarksIntro'] = advancedIntroTranslations[2];
    t['settings.outlineNavigationIntro'] = advancedIntroTranslations[3];
  }
});

const analyticsTranslations = {
  'zh-CN': {
    title: '隐私与统计',
    enabled: '发送匿名使用统计',
    description: '开启后，将发送不含身份标识的设置类别和功能操作汇总，帮助改进默认设置与功能优先级。不会发送访问网址、域名、页面标题、页面内容、书签内容或滚动位置。',
    preview: '查看待发送数据',
    disabled: '匿名统计当前已关闭。',
    enabledStatus: '匿名统计已开启，可在下方检查待发送数据。',
    unavailable: '统计服务尚未配置；待发送汇总仅保存在本机，不会发送。',
    permissionDenied: '未获得统计服务访问权限，匿名统计保持关闭。',
    error: '无法更新匿名统计设置，请稍后重试。'
  },
  'zh-TW': {
    title: '隱私與統計',
    enabled: '傳送匿名使用統計',
    description: '開啟後，將傳送不含身分識別的設定類別與功能操作彙總，用於改善預設設定與功能優先順序。不會傳送網址、網域、頁面標題、頁面內容、書籤內容或捲動位置。',
    preview: '查看待傳送資料',
    disabled: '匿名統計目前已關閉。',
    enabledStatus: '匿名統計已開啟，可在下方檢查待傳送資料。',
    unavailable: '統計服務尚未設定；待傳送彙總只會保留在本機，不會傳送。',
    permissionDenied: '未取得統計服務存取權限，匿名統計維持關閉。',
    error: '無法更新匿名統計設定，請稍後再試。'
  },
  'en-US': {
    title: 'Privacy & Analytics',
    enabled: 'Send anonymous usage analytics',
    description: 'When enabled, the extension sends anonymous setting categories and aggregated feature actions to improve defaults and priorities. It never sends visited URLs, domains, page titles, page content, bookmark content, or scroll positions.',
    preview: 'View pending data',
    disabled: 'Anonymous analytics is currently off.',
    enabledStatus: 'Anonymous analytics is on. You can inspect pending data below.',
    unavailable: 'The analytics service is not configured. Pending aggregates stay on this device and are not sent.',
    permissionDenied: 'Analytics service access was not granted, so analytics remains off.',
    error: 'The analytics setting could not be updated. Please try again.'
  },
  'es-ES': {
    title: 'Privacidad y estadísticas',
    enabled: 'Enviar estadísticas de uso anónimas',
    description: 'Al activarlo, la extensión envía categorías de configuración y acciones agregadas sin identificadores. Nunca envía URLs, dominios, títulos, contenido de páginas, marcadores ni posiciones de desplazamiento.',
    preview: 'Ver datos pendientes',
    disabled: 'Las estadísticas anónimas están desactivadas.',
    enabledStatus: 'Las estadísticas anónimas están activadas. Puedes revisar los datos pendientes abajo.',
    unavailable: 'El servicio no está configurado. Los datos pendientes permanecen en este dispositivo y no se envían.',
    permissionDenied: 'No se concedió acceso al servicio; las estadísticas siguen desactivadas.',
    error: 'No se pudo actualizar la configuración de estadísticas.'
  },
  'ja-JP': {
    title: 'プライバシーと統計',
    enabled: '匿名の利用統計を送信',
    description: '有効にすると、識別子を含まない設定カテゴリと機能操作の集計を送信します。URL、ドメイン、ページタイトル、本文、ブックマーク内容、スクロール位置は送信しません。',
    preview: '送信待ちデータを表示',
    disabled: '匿名統計は現在オフです。',
    enabledStatus: '匿名統計はオンです。下で送信待ちデータを確認できます。',
    unavailable: '統計サービスは未設定です。保留中の集計はこの端末だけに保存され、送信されません。',
    permissionDenied: '統計サービスへのアクセスが許可されなかったため、オフのままです。',
    error: '匿名統計の設定を更新できませんでした。'
  },
  'de-DE': {
    title: 'Datenschutz und Statistik',
    enabled: 'Anonyme Nutzungsstatistiken senden',
    description: 'Wenn aktiviert, sendet die Erweiterung anonyme Einstellungskategorien und zusammengefasste Funktionsaktionen. URLs, Domains, Seitentitel, Seiteninhalte, Lesezeicheninhalte und Scrollpositionen werden nie gesendet.',
    preview: 'Ausstehende Daten anzeigen',
    disabled: 'Anonyme Statistiken sind derzeit deaktiviert.',
    enabledStatus: 'Anonyme Statistiken sind aktiviert. Ausstehende Daten können unten geprüft werden.',
    unavailable: 'Der Statistikdienst ist nicht konfiguriert. Ausstehende Daten bleiben auf diesem Gerät und werden nicht gesendet.',
    permissionDenied: 'Der Zugriff wurde nicht erlaubt; die Statistiken bleiben deaktiviert.',
    error: 'Die Statistik-Einstellung konnte nicht aktualisiert werden.'
  },
  'fr-FR': {
    title: 'Confidentialité et statistiques',
    enabled: 'Envoyer des statistiques d’utilisation anonymes',
    description: 'Une fois activée, l’extension envoie des catégories de réglages et des actions agrégées sans identifiant. Elle n’envoie jamais les URL, domaines, titres, contenus, marque-pages ou positions de défilement.',
    preview: 'Voir les données en attente',
    disabled: 'Les statistiques anonymes sont désactivées.',
    enabledStatus: 'Les statistiques anonymes sont activées. Les données en attente sont visibles ci-dessous.',
    unavailable: 'Le service n’est pas configuré. Les données en attente restent sur cet appareil et ne sont pas envoyées.',
    permissionDenied: 'L’accès au service a été refusé ; les statistiques restent désactivées.',
    error: 'Impossible de mettre à jour le réglage des statistiques.'
  },
  'pt-BR': {
    title: 'Privacidade e estatísticas',
    enabled: 'Enviar estatísticas de uso anônimas',
    description: 'Quando ativada, a extensão envia categorias de configuração e ações agregadas sem identificadores. Nunca envia URLs, domínios, títulos, conteúdo de páginas, conteúdo de favoritos ou posições de rolagem.',
    preview: 'Ver dados pendentes',
    disabled: 'As estatísticas anônimas estão desativadas.',
    enabledStatus: 'As estatísticas anônimas estão ativadas. Confira os dados pendentes abaixo.',
    unavailable: 'O serviço não está configurado. Os dados pendentes ficam neste dispositivo e não são enviados.',
    permissionDenied: 'O acesso ao serviço não foi concedido; as estatísticas continuam desativadas.',
    error: 'Não foi possível atualizar a configuração de estatísticas.'
  },
  'ko-KR': {
    title: '개인정보 및 통계',
    enabled: '익명 사용 통계 보내기',
    description: '사용하면 식별자가 없는 설정 범주와 기능 동작 집계를 전송합니다. 방문 URL, 도메인, 페이지 제목과 내용, 북마크 내용, 스크롤 위치는 전송하지 않습니다.',
    preview: '전송 대기 데이터 보기',
    disabled: '익명 통계가 꺼져 있습니다.',
    enabledStatus: '익명 통계가 켜져 있습니다. 아래에서 전송 대기 데이터를 확인할 수 있습니다.',
    unavailable: '통계 서비스가 구성되지 않았습니다. 대기 중인 집계는 이 기기에만 저장되며 전송되지 않습니다.',
    permissionDenied: '통계 서비스 접근 권한이 없어 통계가 꺼진 상태로 유지됩니다.',
    error: '통계 설정을 업데이트할 수 없습니다.'
  },
  'it-IT': {
    title: 'Privacy e statistiche',
    enabled: 'Invia statistiche di utilizzo anonime',
    description: 'Se attivata, l’estensione invia categorie di impostazioni e azioni aggregate senza identificatori. Non invia URL, domini, titoli, contenuti delle pagine, contenuti dei segnalibri o posizioni di scorrimento.',
    preview: 'Mostra dati in attesa',
    disabled: 'Le statistiche anonime sono disattivate.',
    enabledStatus: 'Le statistiche anonime sono attive. Puoi controllare i dati in attesa qui sotto.',
    unavailable: 'Il servizio non è configurato. I dati in attesa restano su questo dispositivo e non vengono inviati.',
    permissionDenied: 'L’accesso al servizio non è stato concesso; le statistiche restano disattivate.',
    error: 'Impossibile aggiornare l’impostazione delle statistiche.'
  }
};

const onboardingTranslations = {
  'zh-CN': {
    title: '快速开始',
    intro: '先了解页面按钮与工具栏 Popup，再按需要调整下方设置。',
    coreTitle: '使用页面滚动按钮',
    coreDescription: '网页边缘的上、下箭头可快速滚动到页面顶部或底部。',
    popupTitle: '从 Chrome 工具栏打开 Popup',
    popupDescription: '点击 Chrome 工具栏中的扩展图标；若图标未显示，可先在拼图菜单中固定本扩展。',
    siteControlsTitle: '按当前网站控制功能',
    siteControlsDescription: 'Popup 可分别启停整个扩展和三项高级功能，状态对当前主域名生效。',
    featureExtension: '扩展',
    featureProgress: '页面进度条',
    featureBookmarks: '书签',
    featureOutline: '文章大纲',
    privacyTitle: '匿名使用分析由你决定',
    privacyDescription: '匿名使用分析保持关闭，只有你在“建议&关于插件”的“隐私与统计”中主动选择后才会启用。',
    privacyOff: '默认关闭',
    dismiss: '知道了',
    reopen: '查看快速开始'
  },
  'zh-TW': {
    title: '快速開始',
    intro: '先了解頁面按鈕與工具列 Popup，再依需要調整下方設定。',
    coreTitle: '使用頁面捲動按鈕',
    coreDescription: '網頁邊緣的向上、向下箭頭可快速捲動到頁面頂端或底端。',
    popupTitle: '從 Chrome 工具列開啟 Popup',
    popupDescription: '點擊 Chrome 工具列中的擴充功能圖示；若圖示未顯示，可先在拼圖選單中固定本擴充功能。',
    siteControlsTitle: '依目前網站控制功能',
    siteControlsDescription: 'Popup 可分別啟用或停用整個擴充功能與三項進階功能，狀態套用至目前主網域。',
    featureExtension: '擴充功能',
    featureProgress: '頁面進度條',
    featureBookmarks: '書籤',
    featureOutline: '文章大綱',
    privacyTitle: '匿名使用分析由你決定',
    privacyDescription: '匿名使用分析會保持關閉，只有你在「建議與關於外掛」的「隱私與統計」中主動選擇後才會啟用。',
    privacyOff: '預設關閉',
    dismiss: '知道了',
    reopen: '查看快速開始'
  },
  'en-US': {
    title: 'Quick start',
    intro: 'Learn the page buttons and toolbar Popup, then adjust the settings below as needed.',
    coreTitle: 'Use the page scroll buttons',
    coreDescription: 'Use the up and down arrows at the page edge to quickly reach the top or bottom.',
    popupTitle: 'Open the Popup from the Chrome toolbar',
    popupDescription: 'Click the extension icon in the Chrome toolbar. If it is hidden, pin this extension from the puzzle-piece menu.',
    siteControlsTitle: 'Control features for the current site',
    siteControlsDescription: 'The Popup separately turns the extension and its three advanced features on or off for the current main domain.',
    featureExtension: 'Extension',
    featureProgress: 'Page progress',
    featureBookmarks: 'Bookmarks',
    featureOutline: 'Article outline',
    privacyTitle: 'Anonymous analytics is your choice',
    privacyDescription: 'Anonymous usage analytics stays off unless you choose to enable it under Suggestions & About, then Privacy & Analytics.',
    privacyOff: 'Off by default',
    dismiss: 'Got it',
    reopen: 'View quick start'
  },
  'es-ES': {
    title: 'Inicio rápido',
    intro: 'Conoce los botones de la página y el Popup de la barra de herramientas antes de ajustar las opciones.',
    coreTitle: 'Usa los botones de desplazamiento',
    coreDescription: 'Las flechas del borde de la página permiten ir rápidamente al inicio o al final.',
    popupTitle: 'Abre el Popup desde la barra de Chrome',
    popupDescription: 'Haz clic en el icono de la extensión. Si no aparece, fíjalo desde el menú de extensiones con forma de pieza de puzle.',
    siteControlsTitle: 'Controla las funciones del sitio actual',
    siteControlsDescription: 'El Popup activa o desactiva por separado la extensión y sus tres funciones avanzadas para el dominio principal actual.',
    featureExtension: 'Extensión',
    featureProgress: 'Progreso de página',
    featureBookmarks: 'Marcadores',
    featureOutline: 'Esquema del artículo',
    privacyTitle: 'Tú decides sobre las estadísticas anónimas',
    privacyDescription: 'Las estadísticas anónimas permanecen desactivadas hasta que decidas activarlas en Sugerencias y acerca de, dentro de Privacidad y estadísticas.',
    privacyOff: 'Desactivadas por defecto',
    dismiss: 'Entendido',
    reopen: 'Ver inicio rápido'
  },
  'ja-JP': {
    title: 'クイックスタート',
    intro: 'ページ上のボタンとツールバーの Popup を確認してから、必要に応じて下の設定を調整します。',
    coreTitle: 'ページのスクロールボタンを使う',
    coreDescription: 'ページ端の上下矢印で、ページの先頭または末尾へすばやく移動できます。',
    popupTitle: 'Chrome ツールバーから Popup を開く',
    popupDescription: 'Chrome ツールバーの拡張機能アイコンをクリックします。表示されない場合は、パズル形のメニューから固定してください。',
    siteControlsTitle: '現在のサイトごとに機能を制御する',
    siteControlsDescription: 'Popup では、現在のメインドメインに対して拡張機能全体と3つの高度な機能を個別にオン、オフできます。',
    featureExtension: '拡張機能',
    featureProgress: 'ページ進捗',
    featureBookmarks: 'ブックマーク',
    featureOutline: '記事アウトライン',
    privacyTitle: '匿名利用統計は任意です',
    privacyDescription: '匿名利用統計はオフのままです。「ご意見・拡張機能について」の「プライバシーと統計」で選択した場合のみ有効になります。',
    privacyOff: '初期設定はオフ',
    dismiss: '了解',
    reopen: 'クイックスタートを見る'
  },
  'de-DE': {
    title: 'Schnellstart',
    intro: 'Lernen Sie die Seitenschaltflächen und das Toolbar-Popup kennen und passen Sie danach die Einstellungen an.',
    coreTitle: 'Scroll-Schaltflächen der Seite verwenden',
    coreDescription: 'Mit den Pfeilen am Seitenrand springen Sie schnell zum Anfang oder Ende der Seite.',
    popupTitle: 'Popup über die Chrome-Symbolleiste öffnen',
    popupDescription: 'Klicken Sie auf das Erweiterungssymbol in Chrome. Falls es nicht sichtbar ist, heften Sie die Erweiterung über das Puzzle-Menü an.',
    siteControlsTitle: 'Funktionen für die aktuelle Website steuern',
    siteControlsDescription: 'Im Popup lassen sich die Erweiterung und ihre drei erweiterten Funktionen für die aktuelle Hauptdomain getrennt ein- oder ausschalten.',
    featureExtension: 'Erweiterung',
    featureProgress: 'Seitenfortschritt',
    featureBookmarks: 'Lesezeichen',
    featureOutline: 'Artikelgliederung',
    privacyTitle: 'Anonyme Statistiken sind Ihre Entscheidung',
    privacyDescription: 'Anonyme Nutzungsstatistiken bleiben aus und werden nur aktiviert, wenn Sie dies unter Vorschläge & Info bei Datenschutz und Statistik auswählen.',
    privacyOff: 'Standardmäßig aus',
    dismiss: 'Verstanden',
    reopen: 'Schnellstart anzeigen'
  },
  'fr-FR': {
    title: 'Démarrage rapide',
    intro: 'Découvrez les boutons de page et le Popup de la barre d’outils, puis ajustez les réglages ci-dessous.',
    coreTitle: 'Utiliser les boutons de défilement',
    coreDescription: 'Les flèches au bord de la page permettent d’atteindre rapidement le début ou la fin.',
    popupTitle: 'Ouvrir le Popup depuis la barre Chrome',
    popupDescription: 'Cliquez sur l’icône de l’extension dans Chrome. Si elle est masquée, épinglez-la depuis le menu en forme de pièce de puzzle.',
    siteControlsTitle: 'Contrôler les fonctions du site actuel',
    siteControlsDescription: 'Le Popup active ou désactive séparément l’extension et ses trois fonctions avancées pour le domaine principal actuel.',
    featureExtension: 'Extension',
    featureProgress: 'Progression de page',
    featureBookmarks: 'Marque-pages',
    featureOutline: 'Plan de l’article',
    privacyTitle: 'Les statistiques anonymes restent votre choix',
    privacyDescription: 'Les statistiques d’utilisation anonymes restent désactivées et ne sont activées que si vous les choisissez dans Suggestions et à propos, puis Confidentialité et statistiques.',
    privacyOff: 'Désactivées par défaut',
    dismiss: 'Compris',
    reopen: 'Voir le démarrage rapide'
  },
  'pt-BR': {
    title: 'Início rápido',
    intro: 'Conheça os botões da página e o Popup da barra de ferramentas antes de ajustar as opções abaixo.',
    coreTitle: 'Use os botões de rolagem da página',
    coreDescription: 'As setas na borda da página levam rapidamente ao início ou ao fim.',
    popupTitle: 'Abra o Popup pela barra do Chrome',
    popupDescription: 'Clique no ícone da extensão na barra do Chrome. Se ele estiver oculto, fixe a extensão pelo menu em forma de peça de quebra-cabeça.',
    siteControlsTitle: 'Controle os recursos do site atual',
    siteControlsDescription: 'O Popup ativa ou desativa separadamente a extensão e seus três recursos avançados para o domínio principal atual.',
    featureExtension: 'Extensão',
    featureProgress: 'Progresso da página',
    featureBookmarks: 'Favoritos',
    featureOutline: 'Sumário do artigo',
    privacyTitle: 'As estatísticas anônimas são sua escolha',
    privacyDescription: 'As estatísticas de uso anônimas permanecem desativadas e só são ativadas se você escolher essa opção em Sugestões e sobre, na seção Privacidade e estatísticas.',
    privacyOff: 'Desativadas por padrão',
    dismiss: 'Entendi',
    reopen: 'Ver início rápido'
  },
  'ko-KR': {
    title: '빠른 시작',
    intro: '페이지 버튼과 도구 모음 Popup을 확인한 뒤 필요에 따라 아래 설정을 조정하세요.',
    coreTitle: '페이지 스크롤 버튼 사용',
    coreDescription: '페이지 가장자리의 위쪽 및 아래쪽 화살표로 맨 위나 맨 아래로 빠르게 이동할 수 있습니다.',
    popupTitle: 'Chrome 도구 모음에서 Popup 열기',
    popupDescription: 'Chrome 도구 모음의 확장 프로그램 아이콘을 클릭하세요. 아이콘이 보이지 않으면 퍼즐 메뉴에서 이 확장 프로그램을 고정하세요.',
    siteControlsTitle: '현재 사이트별 기능 제어',
    siteControlsDescription: 'Popup에서 현재 기본 도메인에 대해 확장 프로그램 전체와 세 가지 고급 기능을 각각 켜거나 끌 수 있습니다.',
    featureExtension: '확장 프로그램',
    featureProgress: '페이지 진행률',
    featureBookmarks: '북마크',
    featureOutline: '문서 개요',
    privacyTitle: '익명 사용 통계는 사용자가 선택합니다',
    privacyDescription: '익명 사용 통계는 꺼진 상태로 유지되며, 제안 및 확장 프로그램 정보의 개인정보 및 통계에서 직접 선택한 경우에만 켜집니다.',
    privacyOff: '기본값은 꺼짐',
    dismiss: '확인',
    reopen: '빠른 시작 보기'
  },
  'it-IT': {
    title: 'Avvio rapido',
    intro: 'Scopri i pulsanti della pagina e il Popup della barra degli strumenti, poi regola le impostazioni qui sotto.',
    coreTitle: 'Usa i pulsanti di scorrimento',
    coreDescription: 'Le frecce sul bordo della pagina permettono di raggiungere rapidamente l’inizio o la fine.',
    popupTitle: 'Apri il Popup dalla barra di Chrome',
    popupDescription: 'Fai clic sull’icona dell’estensione in Chrome. Se è nascosta, fissala dal menu con l’icona a forma di puzzle.',
    siteControlsTitle: 'Controlla le funzioni del sito corrente',
    siteControlsDescription: 'Il Popup attiva o disattiva separatamente l’estensione e le tre funzioni avanzate per il dominio principale corrente.',
    featureExtension: 'Estensione',
    featureProgress: 'Avanzamento pagina',
    featureBookmarks: 'Segnalibri',
    featureOutline: 'Struttura articolo',
    privacyTitle: 'Le statistiche anonime sono una tua scelta',
    privacyDescription: 'Le statistiche di utilizzo anonime restano disattivate e si attivano solo se le scegli in Suggerimenti e informazioni, nella sezione Privacy e statistiche.',
    privacyOff: 'Disattivate per impostazione predefinita',
    dismiss: 'Ho capito',
    reopen: 'Mostra avvio rapido'
  }
};

Object.keys(translations).forEach((lang) => {
  const analyticsText = analyticsTranslations[lang] || analyticsTranslations['en-US'];
  const onboardingText = onboardingTranslations[lang] || onboardingTranslations['en-US'];
  Object.assign(translations[lang], {
    'settings.onboardingTitle': onboardingText.title,
    'settings.onboardingIntro': onboardingText.intro,
    'settings.onboardingCoreTitle': onboardingText.coreTitle,
    'settings.onboardingCoreDescription': onboardingText.coreDescription,
    'settings.onboardingPopupTitle': onboardingText.popupTitle,
    'settings.onboardingPopupDescription': onboardingText.popupDescription,
    'settings.onboardingSiteControlsTitle': onboardingText.siteControlsTitle,
    'settings.onboardingSiteControlsDescription': onboardingText.siteControlsDescription,
    'settings.onboardingFeatureExtension': onboardingText.featureExtension,
    'settings.onboardingFeatureProgress': onboardingText.featureProgress,
    'settings.onboardingFeatureBookmarks': onboardingText.featureBookmarks,
    'settings.onboardingFeatureOutline': onboardingText.featureOutline,
    'settings.onboardingPrivacyTitle': onboardingText.privacyTitle,
    'settings.onboardingPrivacyDescription': onboardingText.privacyDescription,
    'settings.onboardingPrivacyOff': onboardingText.privacyOff,
    'settings.onboardingDismiss': onboardingText.dismiss,
    'settings.onboardingReopen': onboardingText.reopen,
    'settings.analyticsTitle': analyticsText.title,
    'settings.analyticsEnabled': analyticsText.enabled,
    'settings.analyticsDescription': analyticsText.description,
    'settings.analyticsPreview': analyticsText.preview,
    'settings.releaseNotes': {
      'zh-CN': '更新记录',
      'zh-TW': '更新記錄',
      'en-US': 'Release Notes',
      'es-ES': 'Novedades',
      'ja-JP': '更新履歴',
      'de-DE': 'Versionshinweise',
      'fr-FR': 'Notes de version',
      'pt-BR': 'Notas da versão',
      'ko-KR': '업데이트 기록',
      'it-IT': 'Note di versione'
    }[lang]
  });
});

const RELEASE_NOTES = [
  {
    version: '2.1.0',
    categories: {
      added: [
        'domainFeatureControls',
        'installOptionsPage',
        'releaseNotes',
        'optionalAnalytics'
      ],
      improved: [
        'advancedFeatureEntry',
        'domainManagement'
      ]
    }
  },
  {
    version: '2.0.0',
    categories: {
      added: [
        'outlineNavigation',
        'outlineSettings'
      ],
      improved: [
        'outlineRecognition',
        'bookmarkRestoreModes'
      ],
      fixed: [
        'manualBookmarkRestore',
        'bookmarkOpenPosition'
      ]
    }
  },
  {
    version: '1.9.0',
    categories: {
      added: [
        'scrollBookmarks',
        'savedBookmarkManagement',
        'additionalLanguages'
      ],
      improved: [
        'bookmarkRetention'
      ]
    }
  },
  {
    version: '1.8.0',
    categories: {
      added: [
        'advancedProgressBar',
        'iconCustomization',
        'siteManagement',
        'spanishJapanese'
      ],
      improved: [
        'scrollJumpConsistency'
      ]
    }
  }
];

const releaseNotesTranslations = {
  'zh-CN': {
    currentVersion: '当前版本',
    categories: { added: '新功能', improved: '功能优化', fixed: 'Bug 修复' },
    items: {
      domainFeatureControls: '新增按主域名控制插件和三项高级功能。',
      installOptionsPage: '全新安装扩展后自动打开设置页。',
      releaseNotes: '新增扩展内更新记录。',
      optionalAnalytics: '新增可选的匿名使用统计。',
      advancedFeatureEntry: '页面进度条、滚动位置书签和智能段落跳转统一在工具栏中按主域名启用。',
      domainManagement: '域名管理现在可以集中查看和调整插件及高级功能状态。',
      outlineNavigation: '新增智能段落跳转和页面大纲导航。',
      outlineSettings: '新增目录来源、加载数量和当前章节高亮设置。',
      outlineRecognition: '优化长页面章节识别、过滤和跳转体验。',
      bookmarkRestoreModes: '滚动位置书签支持自动加载、提示恢复和手动加载。',
      manualBookmarkRestore: '修复重新打开页面后缺少手动恢复入口的问题。',
      bookmarkOpenPosition: '修复从设置页打开书签后停留在页面顶部的问题。',
      scrollBookmarks: '新增滚动位置书签，可保存和恢复阅读位置。',
      savedBookmarkManagement: '新增已保存位置管理，支持打开和删除记录。',
      additionalLanguages: '新增德语、法语、葡萄牙语、繁体中文、韩语和意大利语。',
      bookmarkRetention: '支持按域名保留最近的阅读位置。',
      advancedProgressBar: '新增纵向按钮和页面边缘横向页面进度条。',
      iconCustomization: '新增按钮图标样式和图标颜色自定义。',
      siteManagement: '新增设置页网站启用状态管理。',
      spanishJapanese: '新增西班牙语和日语界面。',
      scrollJumpConsistency: '优化顶部、底部和进度跳转的一致性。'
    }
  },
  'zh-TW': {
    currentVersion: '目前版本',
    categories: { added: '新功能', improved: '功能最佳化', fixed: 'Bug 修正' },
    items: {
      domainFeatureControls: '新增依主網域控制外掛與三項進階功能。',
      installOptionsPage: '全新安裝擴充功能後自動開啟設定頁。',
      releaseNotes: '新增擴充功能內更新記錄。',
      optionalAnalytics: '新增可選的匿名使用統計。',
      advancedFeatureEntry: '頁面進度條、捲動位置書籤與智慧段落跳轉統一在工具列中依主網域啟用。',
      domainManagement: '網域管理現在可集中查看與調整外掛及進階功能狀態。',
      outlineNavigation: '新增智慧段落跳轉與頁面大綱導覽。',
      outlineSettings: '新增目錄來源、載入數量與目前章節醒目提示設定。',
      outlineRecognition: '最佳化長頁面的章節辨識、過濾與跳轉體驗。',
      bookmarkRestoreModes: '捲動位置書籤支援自動載入、提示還原與手動載入。',
      manualBookmarkRestore: '修正重新開啟頁面後缺少手動還原入口的問題。',
      bookmarkOpenPosition: '修正從設定頁開啟書籤後停留在頁面頂部的問題。',
      scrollBookmarks: '新增捲動位置書籤，可儲存與還原閱讀位置。',
      savedBookmarkManagement: '新增已儲存位置管理，支援開啟與刪除記錄。',
      additionalLanguages: '新增德語、法語、葡萄牙語、繁體中文、韓語與義大利語。',
      bookmarkRetention: '支援依網域保留最近的閱讀位置。',
      advancedProgressBar: '新增縱向按鈕與頁面邊緣橫向頁面進度條。',
      iconCustomization: '新增按鈕圖示樣式與圖示顏色自訂。',
      siteManagement: '新增設定頁網站啟用狀態管理。',
      spanishJapanese: '新增西班牙語與日語介面。',
      scrollJumpConsistency: '最佳化頂部、底部與進度跳轉的一致性。'
    }
  },
  'en-US': {
    currentVersion: 'Current version',
    categories: { added: 'New features', improved: 'Feature improvements', fixed: 'Bug fixes' },
    items: {
      domainFeatureControls: 'Added per-domain controls for the extension and its three advanced features.',
      installOptionsPage: 'The settings page now opens automatically after a fresh installation.',
      releaseNotes: 'Added release notes inside the extension.',
      optionalAnalytics: 'Added optional anonymous usage analytics.',
      advancedFeatureEntry: 'Page progress, scroll bookmarks, and section navigation are now enabled per domain from the toolbar.',
      domainManagement: 'Domain management now provides a central view of extension and advanced-feature states.',
      outlineNavigation: 'Added smart section navigation and page outline controls.',
      outlineSettings: 'Added settings for outline sources, item limits, and current-section highlighting.',
      outlineRecognition: 'Improved section detection, filtering, and navigation on long pages.',
      bookmarkRestoreModes: 'Scroll bookmarks now support automatic, prompted, and manual restoration.',
      manualBookmarkRestore: 'Fixed the missing manual restore action after reopening a saved page.',
      bookmarkOpenPosition: 'Fixed bookmarks opened from settings remaining at the top of the page.',
      scrollBookmarks: 'Added scroll bookmarks for saving and restoring reading positions.',
      savedBookmarkManagement: 'Added saved-position management with open and delete actions.',
      additionalLanguages: 'Added German, French, Portuguese, Traditional Chinese, Korean, and Italian.',
      bookmarkRetention: 'Added per-domain retention for recent reading positions.',
      advancedProgressBar: 'Added vertical-button and horizontal page-edge progress bars.',
      iconCustomization: 'Added button icon styles and icon color customization.',
      siteManagement: 'Added site enable-state management to the settings page.',
      spanishJapanese: 'Added Spanish and Japanese interfaces.',
      scrollJumpConsistency: 'Improved consistency across top, bottom, and progress jumps.'
    }
  },
  'es-ES': {
    currentVersion: 'Versión actual',
    categories: { added: 'Nuevas funciones', improved: 'Mejoras de funciones', fixed: 'Correcciones de errores' },
    items: {
      domainFeatureControls: 'Se añadieron controles por dominio para la extensión y sus tres funciones avanzadas.',
      installOptionsPage: 'La página de ajustes ahora se abre automáticamente tras una instalación nueva.',
      releaseNotes: 'Se añadieron novedades dentro de la extensión.',
      optionalAnalytics: 'Se añadieron estadísticas de uso anónimas opcionales.',
      advancedFeatureEntry: 'El progreso, los marcadores y la navegación por secciones se activan por dominio desde la barra de herramientas.',
      domainManagement: 'La gestión de dominios ahora reúne los estados de la extensión y sus funciones avanzadas.',
      outlineNavigation: 'Se añadió navegación inteligente por secciones y esquema de página.',
      outlineSettings: 'Se añadieron ajustes de fuentes, límite de elementos y resaltado de la sección actual.',
      outlineRecognition: 'Se mejoraron la detección, el filtrado y la navegación por secciones en páginas largas.',
      bookmarkRestoreModes: 'Los marcadores admiten restauración automática, con aviso o manual.',
      manualBookmarkRestore: 'Se corrigió la falta de una acción de restauración manual al reabrir una página.',
      bookmarkOpenPosition: 'Se corrigió que los marcadores abiertos desde ajustes quedaran al inicio de la página.',
      scrollBookmarks: 'Se añadieron marcadores para guardar y restaurar posiciones de lectura.',
      savedBookmarkManagement: 'Se añadió la gestión de posiciones guardadas con acciones para abrir y eliminar.',
      additionalLanguages: 'Se añadieron alemán, francés, portugués, chino tradicional, coreano e italiano.',
      bookmarkRetention: 'Se añadió la conservación por dominio de las posiciones de lectura recientes.',
      advancedProgressBar: 'Se añadieron barras de progreso verticales y horizontales en el borde de la página.',
      iconCustomization: 'Se añadieron estilos de iconos y personalización de color.',
      siteManagement: 'Se añadió la gestión del estado de activación de sitios en los ajustes.',
      spanishJapanese: 'Se añadieron las interfaces en español y japonés.',
      scrollJumpConsistency: 'Se mejoró la coherencia de los saltos al inicio, al final y por progreso.'
    }
  },
  'ja-JP': {
    currentVersion: '現在のバージョン',
    categories: { added: '新機能', improved: '機能改善', fixed: '不具合修正' },
    items: {
      domainFeatureControls: 'メインドメインごとに拡張機能と3つの高度な機能を制御できるようになりました。',
      installOptionsPage: '新規インストール後に設定ページを自動で開くようになりました。',
      releaseNotes: '拡張機能内に更新履歴を追加しました。',
      optionalAnalytics: '任意で有効にできる匿名利用統計を追加しました。',
      advancedFeatureEntry: '進捗バー、位置ブックマーク、セクション移動をツールバーからドメインごとに有効化できます。',
      domainManagement: 'ドメイン管理で拡張機能と高度な機能の状態をまとめて確認、変更できます。',
      outlineNavigation: 'スマートセクション移動とページアウトラインを追加しました。',
      outlineSettings: 'アウトライン対象、表示件数、現在セクションの強調設定を追加しました。',
      outlineRecognition: '長いページでのセクション検出、除外、移動を改善しました。',
      bookmarkRestoreModes: '位置ブックマークで自動、確認後、手動の復元方法を選べるようになりました。',
      manualBookmarkRestore: '保存済みページを開き直した際に手動復元操作が表示されない問題を修正しました。',
      bookmarkOpenPosition: '設定からブックマークを開いた際にページ先頭に留まる問題を修正しました。',
      scrollBookmarks: '読書位置を保存、復元できるスクロール位置ブックマークを追加しました。',
      savedBookmarkManagement: '保存位置を開く、削除する管理機能を追加しました。',
      additionalLanguages: 'ドイツ語、フランス語、ポルトガル語、繁体字中国語、韓国語、イタリア語を追加しました。',
      bookmarkRetention: 'ドメインごとに最近の読書位置を保持できるようになりました。',
      advancedProgressBar: '縦型ボタンとページ端の横型進捗バーを追加しました。',
      iconCustomization: 'ボタンのアイコン形式と色を変更できるようになりました。',
      siteManagement: '設定ページにサイトの有効状態管理を追加しました。',
      spanishJapanese: 'スペイン語と日本語の表示を追加しました。',
      scrollJumpConsistency: '先頭、末尾、進捗位置への移動動作を統一しました。'
    }
  },
  'de-DE': {
    currentVersion: 'Aktuelle Version',
    categories: { added: 'Neue Funktionen', improved: 'Funktionsverbesserungen', fixed: 'Fehlerbehebungen' },
    items: {
      domainFeatureControls: 'Steuerung der Erweiterung und ihrer drei erweiterten Funktionen pro Domain hinzugefügt.',
      installOptionsPage: 'Nach einer Neuinstallation wird die Einstellungsseite automatisch geöffnet.',
      releaseNotes: 'Versionshinweise innerhalb der Erweiterung hinzugefügt.',
      optionalAnalytics: 'Optionale anonyme Nutzungsstatistiken hinzugefügt.',
      advancedFeatureEntry: 'Fortschritt, Lesezeichen und Abschnittsnavigation werden jetzt pro Domain über die Symbolleiste aktiviert.',
      domainManagement: 'Die Domainverwaltung zeigt zentral den Status der Erweiterung und ihrer erweiterten Funktionen.',
      outlineNavigation: 'Intelligente Abschnittsnavigation und Seitenübersicht hinzugefügt.',
      outlineSettings: 'Einstellungen für Quellen, Anzahl und Hervorhebung des aktuellen Abschnitts hinzugefügt.',
      outlineRecognition: 'Abschnittserkennung, Filterung und Navigation auf langen Seiten verbessert.',
      bookmarkRestoreModes: 'Lesezeichen unterstützen automatische, bestätigte und manuelle Wiederherstellung.',
      manualBookmarkRestore: 'Fehlende manuelle Wiederherstellung nach erneutem Öffnen einer Seite behoben.',
      bookmarkOpenPosition: 'Behoben, dass aus den Einstellungen geöffnete Lesezeichen am Seitenanfang blieben.',
      scrollBookmarks: 'Scroll-Lesezeichen zum Speichern und Wiederherstellen der Leseposition hinzugefügt.',
      savedBookmarkManagement: 'Verwaltung gespeicherter Positionen mit Öffnen und Löschen hinzugefügt.',
      additionalLanguages: 'Deutsch, Französisch, Portugiesisch, traditionelles Chinesisch, Koreanisch und Italienisch hinzugefügt.',
      bookmarkRetention: 'Aufbewahrung der letzten Lesepositionen pro Domain hinzugefügt.',
      advancedProgressBar: 'Vertikale Schaltfläche und horizontalen Fortschrittsbalken am Seitenrand hinzugefügt.',
      iconCustomization: 'Symbolstile und Anpassung der Symbolfarbe hinzugefügt.',
      siteManagement: 'Verwaltung des Aktivierungsstatus von Websites in den Einstellungen hinzugefügt.',
      spanishJapanese: 'Spanische und japanische Benutzeroberflächen hinzugefügt.',
      scrollJumpConsistency: 'Sprünge nach oben, unten und zum Fortschritt vereinheitlicht.'
    }
  },
  'fr-FR': {
    currentVersion: 'Version actuelle',
    categories: { added: 'Nouvelles fonctions', improved: 'Améliorations', fixed: 'Corrections de bugs' },
    items: {
      domainFeatureControls: 'Ajout du contrôle par domaine de l’extension et de ses trois fonctions avancées.',
      installOptionsPage: 'La page des réglages s’ouvre automatiquement après une nouvelle installation.',
      releaseNotes: 'Ajout des notes de version dans l’extension.',
      optionalAnalytics: 'Ajout de statistiques d’utilisation anonymes et facultatives.',
      advancedFeatureEntry: 'La progression, les marque-pages et la navigation par sections s’activent désormais par domaine depuis la barre d’outils.',
      domainManagement: 'La gestion des domaines centralise les états de l’extension et des fonctions avancées.',
      outlineNavigation: 'Ajout de la navigation intelligente par sections et du plan de page.',
      outlineSettings: 'Ajout des réglages de sources, de nombre d’éléments et de mise en évidence de la section actuelle.',
      outlineRecognition: 'Amélioration de la détection, du filtrage et de la navigation sur les longues pages.',
      bookmarkRestoreModes: 'Les marque-pages prennent en charge la restauration automatique, avec confirmation ou manuelle.',
      manualBookmarkRestore: 'Correction de l’absence d’action de restauration manuelle après la réouverture d’une page.',
      bookmarkOpenPosition: 'Correction des marque-pages ouverts depuis les réglages qui restaient en haut de page.',
      scrollBookmarks: 'Ajout de marque-pages pour enregistrer et restaurer les positions de lecture.',
      savedBookmarkManagement: 'Ajout de la gestion des positions enregistrées avec ouverture et suppression.',
      additionalLanguages: 'Ajout de l’allemand, du français, du portugais, du chinois traditionnel, du coréen et de l’italien.',
      bookmarkRetention: 'Ajout de la conservation des positions récentes par domaine.',
      advancedProgressBar: 'Ajout d’un bouton vertical et d’une barre de progression horizontale en bord de page.',
      iconCustomization: 'Ajout de styles d’icônes et de la personnalisation de leur couleur.',
      siteManagement: 'Ajout de la gestion de l’activation des sites dans les réglages.',
      spanishJapanese: 'Ajout des interfaces en espagnol et en japonais.',
      scrollJumpConsistency: 'Amélioration de la cohérence des sauts vers le haut, le bas et la progression.'
    }
  },
  'pt-BR': {
    currentVersion: 'Versão atual',
    categories: { added: 'Novos recursos', improved: 'Melhorias de recursos', fixed: 'Correções de bugs' },
    items: {
      domainFeatureControls: 'Adicionados controles por domínio para a extensão e seus três recursos avançados.',
      installOptionsPage: 'A página de configurações agora abre automaticamente após uma nova instalação.',
      releaseNotes: 'Adicionadas notas da versão dentro da extensão.',
      optionalAnalytics: 'Adicionadas estatísticas de uso anônimas opcionais.',
      advancedFeatureEntry: 'Progresso, favoritos e navegação por seções agora são ativados por domínio na barra de ferramentas.',
      domainManagement: 'O gerenciamento de domínios agora centraliza os estados da extensão e dos recursos avançados.',
      outlineNavigation: 'Adicionadas navegação inteligente por seções e estrutura da página.',
      outlineSettings: 'Adicionadas configurações de fontes, limite de itens e destaque da seção atual.',
      outlineRecognition: 'Melhoradas a detecção, a filtragem e a navegação em páginas longas.',
      bookmarkRestoreModes: 'Os favoritos agora permitem restauração automática, com aviso ou manual.',
      manualBookmarkRestore: 'Corrigida a ausência da ação de restauração manual ao reabrir uma página.',
      bookmarkOpenPosition: 'Corrigido o problema de favoritos abertos nas configurações permanecerem no topo.',
      scrollBookmarks: 'Adicionados favoritos para salvar e restaurar posições de leitura.',
      savedBookmarkManagement: 'Adicionado gerenciamento de posições salvas com ações de abrir e excluir.',
      additionalLanguages: 'Adicionados alemão, francês, português, chinês tradicional, coreano e italiano.',
      bookmarkRetention: 'Adicionada retenção por domínio das posições de leitura recentes.',
      advancedProgressBar: 'Adicionados botão vertical e barra de progresso horizontal na borda da página.',
      iconCustomization: 'Adicionados estilos e personalização da cor dos ícones.',
      siteManagement: 'Adicionado gerenciamento do estado de ativação dos sites nas configurações.',
      spanishJapanese: 'Adicionadas interfaces em espanhol e japonês.',
      scrollJumpConsistency: 'Melhorada a consistência dos saltos para o topo, o fim e o progresso.'
    }
  },
  'ko-KR': {
    currentVersion: '현재 버전',
    categories: { added: '새 기능', improved: '기능 개선', fixed: '버그 수정' },
    items: {
      domainFeatureControls: '기본 도메인별로 확장 프로그램과 세 가지 고급 기능을 제어할 수 있습니다.',
      installOptionsPage: '새로 설치하면 설정 페이지가 자동으로 열립니다.',
      releaseNotes: '확장 프로그램 안에 업데이트 기록을 추가했습니다.',
      optionalAnalytics: '선택적으로 사용하는 익명 사용 통계를 추가했습니다.',
      advancedFeatureEntry: '페이지 진행률, 위치 북마크, 구간 이동을 도구 모음에서 도메인별로 켤 수 있습니다.',
      domainManagement: '도메인 관리에서 확장 프로그램과 고급 기능 상태를 한곳에서 확인하고 조정할 수 있습니다.',
      outlineNavigation: '스마트 구간 이동과 페이지 개요 탐색을 추가했습니다.',
      outlineSettings: '개요 출처, 항목 수, 현재 구간 강조 설정을 추가했습니다.',
      outlineRecognition: '긴 페이지의 구간 인식, 필터링, 이동 경험을 개선했습니다.',
      bookmarkRestoreModes: '위치 북마크에서 자동, 확인 후, 수동 복원 방식을 선택할 수 있습니다.',
      manualBookmarkRestore: '저장된 페이지를 다시 열었을 때 수동 복원 동작이 없는 문제를 수정했습니다.',
      bookmarkOpenPosition: '설정에서 북마크를 열면 페이지 상단에 머무는 문제를 수정했습니다.',
      scrollBookmarks: '읽던 위치를 저장하고 복원하는 스크롤 위치 북마크를 추가했습니다.',
      savedBookmarkManagement: '저장 위치를 열거나 삭제하는 관리 기능을 추가했습니다.',
      additionalLanguages: '독일어, 프랑스어, 포르투갈어, 번체 중국어, 한국어, 이탈리아어를 추가했습니다.',
      bookmarkRetention: '도메인별로 최근 읽기 위치를 보관할 수 있습니다.',
      advancedProgressBar: '세로 버튼과 페이지 가장자리 가로 진행률 표시줄을 추가했습니다.',
      iconCustomization: '버튼 아이콘 스타일과 아이콘 색상 설정을 추가했습니다.',
      siteManagement: '설정 페이지에 사이트 활성화 상태 관리를 추가했습니다.',
      spanishJapanese: '스페인어와 일본어 인터페이스를 추가했습니다.',
      scrollJumpConsistency: '상단, 하단, 진행 위치 이동 동작의 일관성을 개선했습니다.'
    }
  },
  'it-IT': {
    currentVersion: 'Versione attuale',
    categories: { added: 'Nuove funzioni', improved: 'Miglioramenti', fixed: 'Correzioni di bug' },
    items: {
      domainFeatureControls: 'Aggiunti controlli per dominio per l’estensione e le sue tre funzioni avanzate.',
      installOptionsPage: 'La pagina delle impostazioni si apre automaticamente dopo una nuova installazione.',
      releaseNotes: 'Aggiunte le note di versione all’interno dell’estensione.',
      optionalAnalytics: 'Aggiunte statistiche di utilizzo anonime facoltative.',
      advancedFeatureEntry: 'Progresso, segnalibri e navigazione per sezioni si attivano ora per dominio dalla barra degli strumenti.',
      domainManagement: 'La gestione dei domini riunisce gli stati dell’estensione e delle funzioni avanzate.',
      outlineNavigation: 'Aggiunte la navigazione intelligente per sezioni e la struttura della pagina.',
      outlineSettings: 'Aggiunte impostazioni per fonti, numero di elementi ed evidenziazione della sezione corrente.',
      outlineRecognition: 'Migliorati rilevamento, filtro e navigazione nelle pagine lunghe.',
      bookmarkRestoreModes: 'I segnalibri supportano il ripristino automatico, con richiesta o manuale.',
      manualBookmarkRestore: 'Corretta l’assenza dell’azione di ripristino manuale dopo la riapertura di una pagina.',
      bookmarkOpenPosition: 'Corretto il problema dei segnalibri aperti dalle impostazioni che restavano a inizio pagina.',
      scrollBookmarks: 'Aggiunti segnalibri per salvare e ripristinare le posizioni di lettura.',
      savedBookmarkManagement: 'Aggiunta la gestione delle posizioni salvate con apertura ed eliminazione.',
      additionalLanguages: 'Aggiunti tedesco, francese, portoghese, cinese tradizionale, coreano e italiano.',
      bookmarkRetention: 'Aggiunta la conservazione per dominio delle posizioni di lettura recenti.',
      advancedProgressBar: 'Aggiunti pulsante verticale e barra di avanzamento orizzontale sul bordo della pagina.',
      iconCustomization: 'Aggiunti stili delle icone e personalizzazione del colore.',
      siteManagement: 'Aggiunta la gestione dello stato di attivazione dei siti nelle impostazioni.',
      spanishJapanese: 'Aggiunte le interfacce in spagnolo e giapponese.',
      scrollJumpConsistency: 'Migliorata la coerenza dei salti in alto, in basso e alla posizione di avanzamento.'
    }
  }
};

const DEFAULT_ADVANCED_SETTINGS = {
  screenNavigation: {
    enabled: false,
    screenStepRatio: 0.9,
    previousScreenButtonColor: '#4A9EDD',
    nextScreenButtonColor: '#4A9EDD',
    opacity: 100
  },
  progressBar: {
    enabled: false,
    mode: 'verticalButton',
    horizontalPosition: 'top',
    colorMode: 'followTopButton',
    customColor: '#4a9edd',
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
  },
  scrollBookmarks: {
    enabled: false,
    buttonPosition: 'pageBottom',
    buttonColorMode: 'followTopButton',
    buttonCustomColor: '#4a9edd',
    matchMode: 'exact',
    perDomainLimit: 1,
    globalLimit: 300,
    restoreMode: 'prompt'
  },
  outlineNavigation: {
    enabled: false,
    buttonPosition: 'pageBottom',
    buttonColorMode: 'followTopButton',
    buttonCustomColor: '#4a9edd',
    sources: {
      h1: true,
      h2: true,
      h3: false,
      idBlocks: false
    },
    maxItems: 30,
    filterShortHeadings: true,
    highlightCurrentSection: true
  }
};

let advancedSettingsState = mergeAdvancedSettings();
let domainFeatureStates = {};
let domainFeatureDefaults = domainUtils.normalizeDefaults();
let domainSearchText = '';
let savedBookmarks = {};

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
  if (lang === 'zh-tw' || lang === 'zh-hk' || lang.startsWith('zh-hant')) return 'zh-TW';
  if (lang.startsWith('zh')) return 'zh-CN';
  if (lang.startsWith('en')) return 'en-US';
  if (lang.startsWith('es')) return 'es-ES';
  if (lang.startsWith('ja')) return 'ja-JP';
  if (lang.startsWith('de')) return 'de-DE';
  if (lang.startsWith('fr')) return 'fr-FR';
  if (lang.startsWith('pt')) return 'pt-BR';
  if (lang.startsWith('ko')) return 'ko-KR';
  if (lang.startsWith('it')) return 'it-IT';
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

function normalizeBoolean(value, fallback) {
  return typeof value === 'boolean' ? value : fallback;
}

function normalizeOutlineMaxItems(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return DEFAULT_ADVANCED_SETTINGS.outlineNavigation.maxItems;
  return Math.max(10, Math.min(50, Math.round(number)));
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

function normalizeReadingToolPosition(value) {
  return ['pageTop', 'pageBottom', 'betweenScrollButtons'].includes(value)
    ? value
    : 'pageBottom';
}

function normalizeReadingToolColorMode(value) {
  return ['followTopButton', 'followBottomButton', 'custom'].includes(value)
    ? value
    : 'followTopButton';
}

function normalizeFeatureButtonPosition(value) {
  return normalizeReadingToolPosition(value);
}

function normalizeFeatureButtonColorMode(value) {
  return normalizeReadingToolColorMode(value);
}

function normalizePerDomainLimit(value) {
  const limit = Number(value);
  return [1, 2, 3].includes(limit) ? limit : 1;
}

function normalizeBookmarkRestoreMode(value, legacyRestorePromptEnabled) {
  if (['auto', 'prompt', 'manual'].includes(value)) {
    return value;
  }
  return legacyRestorePromptEnabled === false ? 'manual' : 'prompt';
}

function mergeAdvancedSettings(savedSettings) {
  const merged = deepMergeDefaults(DEFAULT_ADVANCED_SETTINGS, savedSettings);
  const savedOutline = isPlainObject(savedSettings) && isPlainObject(savedSettings.outlineNavigation)
    ? savedSettings.outlineNavigation
    : {};
  const savedScrollBookmarks = isPlainObject(savedSettings) && isPlainObject(savedSettings.scrollBookmarks)
    ? savedSettings.scrollBookmarks
    : {};
  const savedReadingTools = isPlainObject(savedSettings) && isPlainObject(savedSettings.readingTools)
    ? savedSettings.readingTools
    : {};
  const savedFeatures = isPlainObject(savedSettings) &&
    isPlainObject(savedSettings.readingTools) &&
    isPlainObject(savedSettings.readingTools.features)
    ? savedSettings.readingTools.features
    : {};
  merged.progressBar.customColor = validateHexColor(merged.progressBar.customColor, '#4a9edd');
  merged.screenNavigation.screenStepRatio = clampNumber(merged.screenNavigation.screenStepRatio, 0.5, 1, 0.9);
  merged.screenNavigation.previousScreenButtonColor = validateHexColor(
    merged.screenNavigation.previousScreenButtonColor,
    '#4A9EDD'
  );
  merged.screenNavigation.nextScreenButtonColor = validateHexColor(
    merged.screenNavigation.nextScreenButtonColor,
    '#4A9EDD'
  );
  merged.screenNavigation.opacity = clampNumber(merged.screenNavigation.opacity, 0, 100, 100);
  merged.progressBar.thickness = normalizeProgressThickness(merged.progressBar.thickness);
  merged.progressBar.verticalHeight = clampNumber(merged.progressBar.verticalHeight, 40, 400, 120);
  merged.iconCustomization.enabled = true;
  merged.iconCustomization.iconSet = normalizeIconSet(merged.iconCustomization.iconSet);
  merged.iconCustomization.iconColor = validateHexColor(merged.iconCustomization.iconColor, '#FFFFFF');
  const legacyBookmarkEnabled = savedReadingTools.enabled === true && savedFeatures.scrollBookmarks !== false;
  const bookmarkEnabled = typeof savedScrollBookmarks.enabled === 'boolean'
    ? savedScrollBookmarks.enabled
    : legacyBookmarkEnabled;
  const outlineEnabled = typeof savedOutline.enabled === 'boolean'
    ? savedOutline.enabled
    : savedFeatures.outlineNavigation === true;
  merged.scrollBookmarks.enabled = bookmarkEnabled;
  merged.scrollBookmarks.buttonPosition = normalizeFeatureButtonPosition(
    savedScrollBookmarks.buttonPosition === undefined ? savedReadingTools.buttonPosition : merged.scrollBookmarks.buttonPosition
  );
  merged.scrollBookmarks.buttonColorMode = normalizeFeatureButtonColorMode(
    savedScrollBookmarks.buttonColorMode === undefined ? savedReadingTools.buttonColorMode : merged.scrollBookmarks.buttonColorMode
  );
  merged.scrollBookmarks.buttonCustomColor = validateHexColor(
    savedScrollBookmarks.buttonCustomColor === undefined ? savedReadingTools.buttonCustomColor : merged.scrollBookmarks.buttonCustomColor,
    '#4a9edd'
  );
  merged.outlineNavigation.enabled = outlineEnabled;
  merged.outlineNavigation.buttonPosition = normalizeFeatureButtonPosition(
    savedOutline.buttonPosition === undefined ? savedReadingTools.buttonPosition : merged.outlineNavigation.buttonPosition
  );
  merged.outlineNavigation.buttonColorMode = normalizeFeatureButtonColorMode(
    savedOutline.buttonColorMode === undefined ? savedReadingTools.buttonColorMode : merged.outlineNavigation.buttonColorMode
  );
  merged.outlineNavigation.buttonCustomColor = validateHexColor(
    savedOutline.buttonCustomColor === undefined ? savedReadingTools.buttonCustomColor : merged.outlineNavigation.buttonCustomColor,
    '#4a9edd'
  );
  merged.outlineNavigation.sources.h1 = normalizeBoolean(
    merged.outlineNavigation.sources.h1,
    DEFAULT_ADVANCED_SETTINGS.outlineNavigation.sources.h1
  );
  merged.outlineNavigation.sources.h2 = normalizeBoolean(
    merged.outlineNavigation.sources.h2,
    DEFAULT_ADVANCED_SETTINGS.outlineNavigation.sources.h2
  );
  merged.outlineNavigation.sources.h3 = normalizeBoolean(
    merged.outlineNavigation.sources.h3,
    DEFAULT_ADVANCED_SETTINGS.outlineNavigation.sources.h3
  );
  merged.outlineNavigation.sources.idBlocks = normalizeBoolean(
    merged.outlineNavigation.sources.idBlocks,
    DEFAULT_ADVANCED_SETTINGS.outlineNavigation.sources.idBlocks
  );
  if (!Object.values(merged.outlineNavigation.sources).some(Boolean)) {
    merged.outlineNavigation.sources.h1 = true;
    merged.outlineNavigation.sources.h2 = true;
  }
  merged.outlineNavigation.maxItems = normalizeOutlineMaxItems(merged.outlineNavigation.maxItems);
  merged.outlineNavigation.filterShortHeadings = normalizeBoolean(
    merged.outlineNavigation.filterShortHeadings,
    DEFAULT_ADVANCED_SETTINGS.outlineNavigation.filterShortHeadings
  );
  merged.outlineNavigation.highlightCurrentSection = normalizeBoolean(
    merged.outlineNavigation.highlightCurrentSection,
    DEFAULT_ADVANCED_SETTINGS.outlineNavigation.highlightCurrentSection
  );
  merged.scrollBookmarks.matchMode = 'exact';
  merged.scrollBookmarks.perDomainLimit = normalizePerDomainLimit(merged.scrollBookmarks.perDomainLimit);
  merged.scrollBookmarks.globalLimit = clampNumber(merged.scrollBookmarks.globalLimit, 1, 300, 300);
  merged.scrollBookmarks.restoreMode = normalizeBookmarkRestoreMode(
    savedScrollBookmarks.restoreMode,
    savedScrollBookmarks.restorePromptEnabled
  );
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

const GLOBAL_SHORTCUT_COMMANDS = {
  'scroll-to-top': 'globalShortcutTop',
  'scroll-to-bottom': 'globalShortcutBottom'
};

function getSelectedLanguage() {
  const selectedLanguage = document.getElementById('languageSelector')?.value;
  return selectedLanguage && selectedLanguage !== 'auto'
    ? selectedLanguage
    : normalizeLanguage(navigator.language || navigator.userLanguage);
}

function refreshGlobalShortcuts() {
  const lang = getSelectedLanguage();
  const unsetText = translations[lang]?.['settings.shortcutUnset'] || 'Not set';

  Object.values(GLOBAL_SHORTCUT_COMMANDS).forEach((elementId) => {
    const element = document.getElementById(elementId);
    if (element) element.textContent = unsetText;
  });

  if (!chrome.commands || !chrome.commands.getAll) {
    return;
  }

  chrome.commands.getAll((commands) => {
    if (chrome.runtime.lastError || !Array.isArray(commands)) {
      return;
    }

    commands.forEach((command) => {
      const elementId = GLOBAL_SHORTCUT_COMMANDS[command.name];
      const element = elementId && document.getElementById(elementId);
      if (element) {
        element.textContent = command.shortcut || unsetText;
      }
    });
  });
}

function openGlobalShortcutManager() {
  if (!chrome.tabs || !chrome.tabs.create) {
    return;
  }
  chrome.tabs.create({ url: 'chrome://extensions/shortcuts' });
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
  renderReleaseNotes(lang);
  renderAnalyticsState();
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
    return validateHexColor(document.getElementById('progressCustomColor')?.value, '#4a9edd');
  }
  return validateHexColor(topButtonColor, '#4A9EDD');
}

function getPreviewFeatureButtonColor(prefix, topButtonColor, bottomButtonColor) {
  const colorMode = document.getElementById(`${prefix}ButtonColorMode`)?.value || 'followTopButton';
  if (colorMode === 'followBottomButton') {
    return validateHexColor(bottomButtonColor, '#4A9EDD');
  }
  if (colorMode === 'custom') {
    return validateHexColor(document.getElementById(`${prefix}ButtonCustomColor`)?.value, '#4a9edd');
  }
  return validateHexColor(topButtonColor, '#4A9EDD');
}

function getBookmarkIconSvg() {
  return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 4.5A2.5 2.5 0 0 1 8.5 2h7A2.5 2.5 0 0 1 18 4.5V21l-6-3.5L6 21V4.5z"/></svg>';
}

function getOutlineIconSvg() {
  return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h10"/></svg>';
}

function getScreenNavigationIconSvg(direction) {
  const arrowPath = direction === 'previous'
    ? '<path d="M12 17V8M8.5 11.5 12 8l3.5 3.5"/>'
    : '<path d="M12 7v9m-3.5-3.5L12 16l3.5-3.5"/>';
  return `<svg class="psm-screen-navigation-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="3.5" width="16" height="17" rx="2"/>${arrowPath}</svg>`;
}

// 更新预览按钮样式和位置 - 预览按钮直接显示在设置页面上
function updatePreviewButtons() {
  const topButton = document.getElementById('previewTopButton');
  const previousScreenButton = document.getElementById('previewPreviousScreenButton');
  const bottomButton = document.getElementById('previewBottomButton');
  const nextScreenButton = document.getElementById('previewNextScreenButton');
  const progressButton = document.getElementById('previewProgressButton');
  const bookmarkButton = document.getElementById('previewBookmarkButton');
  const outlineButton = document.getElementById('previewOutlineButton');
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
  const progressEnabled = true;
  const progressMode = document.getElementById('progressBarMode')?.value || 'verticalButton';
  const showProgressPercentage = document.getElementById('progressShowPercentage')?.checked === true;
  const progressHorizontalPosition = document.getElementById('progressHorizontalPosition')?.value || 'top';
  const progressThickness = normalizeProgressThickness(document.getElementById('progressThickness')?.value);
  const progressColor = getPreviewProgressColor(topButtonColor, bottomButtonColor);
  const previousScreenButtonColor = validateHexColor(
    document.getElementById('previousScreenButtonColor')?.value,
    '#4A9EDD'
  );
  const nextScreenButtonColor = validateHexColor(
    document.getElementById('nextScreenButtonColor')?.value,
    '#4A9EDD'
  );
  const screenNavigationOpacity =
    clampNumber(document.getElementById('screenNavigationOpacity')?.value, 0, 100, 100) / 100;
  const featureButtons = [
    {
      button: bookmarkButton,
      enabled: true,
      position: document.getElementById('scrollBookmarkButtonPosition')?.value || 'pageBottom',
      color: getPreviewFeatureButtonColor('scrollBookmark', topButtonColor, bottomButtonColor),
      icon: getBookmarkIconSvg()
    },
    {
      button: outlineButton,
      enabled: true,
      position: document.getElementById('outlineButtonPosition')?.value || 'pageBottom',
      color: getPreviewFeatureButtonColor('outline', topButtonColor, bottomButtonColor),
      icon: getOutlineIconSvg()
    }
  ];

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
    ? (displaySize * 4) + displayProgressHeight + (displaySpacing * 4)
    : (displaySize * 4) + (displaySpacing * 3);
  const betweenFeatureCount = featureButtons.filter((feature) => feature.enabled && feature.position === 'betweenScrollButtons').length;
  const totalPreviewGroupHeight = betweenFeatureCount
    ? totalGroupHeight + (betweenFeatureCount * (displaySize + displaySpacing))
    : totalGroupHeight;

  const unit = displaySize + displaySpacing;
  const previousScreenOffset = unit;
  const progressOffset = unit * 2;
  const nextScreenOffset = progressOffset +
    (isVerticalProgressPreview ? displayProgressHeight + displaySpacing : 0);
  const betweenFeatureOffset = nextScreenOffset + unit;
  const bottomButtonOffset = betweenFeatureOffset + (betweenFeatureCount * unit);

  function getMainButtonPosition(offset, height) {
    if (verticalAlignment === 'center') {
      return {
        top: `calc(50% - ${totalPreviewGroupHeight / 2}px + ${offset}px)`,
        bottom: 'auto'
      };
    }
    if (verticalAlignment === 'top') {
      return {
        top: `${displayEdgeDistance + offset}px`,
        bottom: 'auto'
      };
    }
    return {
      top: 'auto',
      bottom: `${displayEdgeDistance + totalPreviewGroupHeight - offset - height}px`
    };
  }

  const topButtonPosition = getMainButtonPosition(0, displaySize);
  const previousScreenPosition = getMainButtonPosition(previousScreenOffset, displaySize);
  const progressButtonPosition = getMainButtonPosition(progressOffset, displayProgressHeight);
  const nextScreenPosition = getMainButtonPosition(nextScreenOffset, displaySize);
  const bottomButtonPosition = getMainButtonPosition(bottomButtonOffset, displaySize);

  function getBetweenFeaturePosition(index) {
    let top = 'auto';
    let bottom = 'auto';
    if (verticalAlignment === 'center') {
      const groupTopOffset = `calc(50% - ${totalPreviewGroupHeight / 2}px)`;
      top = `calc(${groupTopOffset} + ${betweenFeatureOffset + (index * unit)}px)`;
    } else if (verticalAlignment === 'top') {
      top = `calc(${displayEdgeDistance}px + ${betweenFeatureOffset + (index * unit)}px)`;
    } else {
      bottom = `${displayEdgeDistance + totalPreviewGroupHeight -
        (betweenFeatureOffset + (index * unit)) - displaySize}px`;
    }
    return { top, bottom };
  }

  function getStandaloneFeaturePosition(position, index, count) {
    let top = 'auto';
    let bottom = 'auto';
    if (position === 'pageTop') {
      const baseOffset = verticalAlignment === 'top'
        ? displayEdgeDistance + totalGroupHeight + displaySpacing
        : displayEdgeDistance;
      const offset = baseOffset + (index * (displaySize + displaySpacing));
      top = offset + 'px';
    } else {
      const offset = verticalAlignment === 'bottom'
        ? displayEdgeDistance + totalGroupHeight + displaySpacing + ((count - index - 1) * (displaySize + displaySpacing))
        : displayEdgeDistance + (index * (displaySize + displaySpacing));
      bottom = offset + 'px';
    }
    return { top, bottom };
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
    topButton.style.top = topButtonPosition.top;
    topButton.style.bottom = topButtonPosition.bottom;
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
    bottomButton.style.top = bottomButtonPosition.top;
    bottomButton.style.bottom = bottomButtonPosition.bottom;
    // 移除transform，使用精确计算的位置避免弹跳
    bottomButton.style.transform = 'none';
    bottomButton.style.willChange = 'top, bottom, width, height';
    bottomButton.style.color = iconColor;

    // 计算图标大小（与实际页面一致）
    const iconSize = Math.max(40, Math.min(70, displaySize * 0.6)) + '%';

    [
      {
        button: previousScreenButton,
        direction: 'previous',
        color: previousScreenButtonColor,
        position: previousScreenPosition
      },
      {
        button: nextScreenButton,
        direction: 'next',
        color: nextScreenButtonColor,
        position: nextScreenPosition
      }
    ].forEach((screenButton) => {
      if (!screenButton.button) return;
      screenButton.button.innerHTML = getScreenNavigationIconSvg(screenButton.direction);
      screenButton.button.style.display = 'flex';
      screenButton.button.style.width = size;
      screenButton.button.style.height = size;
      screenButton.button.style.borderRadius = buttonShape === 'square' ? '4px' : '50%';
      screenButton.button.style.backgroundColor = screenButton.color;
      screenButton.button.style.opacity = screenNavigationOpacity;
      screenButton.button.style.left = leftPos;
      screenButton.button.style.right = rightPos;
      screenButton.button.style.top = screenButton.position.top;
      screenButton.button.style.bottom = screenButton.position.bottom;
      screenButton.button.style.transform = 'none';
      screenButton.button.style.color = '#FFFFFF';
      const screenIcon = screenButton.button.querySelector('svg');
      if (screenIcon) {
        screenIcon.style.width = iconSize;
        screenIcon.style.height = iconSize;
        screenIcon.style.display = 'block';
      }
    });

    // 更新SVG图标样式 - 确保与实际页面完全一致
    const topIcon = topButton.querySelector('svg');
    const bottomIcon = bottomButton.querySelector('svg');

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
      progressButton.style.top = progressButtonPosition.top;
      progressButton.style.bottom = progressButtonPosition.bottom;
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

    const standaloneTopFeatures = featureButtons.filter((feature) => feature.enabled && feature.position === 'pageTop');
    const standaloneBottomFeatures = featureButtons.filter((feature) => feature.enabled && feature.position === 'pageBottom');
    let betweenIndex = 0;

    featureButtons.forEach((feature) => {
      const featureButton = feature.button;
      if (!featureButton) return;
      featureButton.classList.toggle('hidden', !feature.enabled);
      featureButton.innerHTML = feature.icon;
      featureButton.style.display = feature.enabled ? 'flex' : 'none';
      featureButton.style.width = size;
      featureButton.style.height = size;
      featureButton.style.borderRadius = buttonShape === 'square' ? '4px' : '50%';
      featureButton.style.backgroundColor = feature.color;
      featureButton.style.opacity = opacity;
      featureButton.style.left = leftPos;
      featureButton.style.right = rightPos;

      let position;
      if (feature.position === 'betweenScrollButtons') {
        position = getBetweenFeaturePosition(betweenIndex);
        betweenIndex += 1;
      } else if (feature.position === 'pageTop') {
        position = getStandaloneFeaturePosition(
          feature.position,
          standaloneTopFeatures.indexOf(feature),
          standaloneTopFeatures.length
        );
      } else {
        position = getStandaloneFeaturePosition(
          feature.position,
          standaloneBottomFeatures.indexOf(feature),
          standaloneBottomFeatures.length
        );
      }

      featureButton.style.top = position.top;
      featureButton.style.bottom = position.bottom;
      featureButton.style.transform = 'none';
      featureButton.style.willChange = 'top, bottom, width, height';
      featureButton.style.color = iconColor;
      const featureIcon = featureButton.querySelector('svg');
      if (featureIcon) {
        featureIcon.style.width = iconSize;
        featureIcon.style.height = iconSize;
        featureIcon.style.display = 'block';
      }
    });

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
    #previewPreviousScreenButton:hover {
      background-color: ${adjustColorBrightness(previousScreenButtonColor, -10)} !important;
      transform: scale(1.1) !important;
    }
    #previewNextScreenButton:hover {
      background-color: ${adjustColorBrightness(nextScreenButtonColor, -10)} !important;
      transform: scale(1.1) !important;
    }
    #previewBookmarkButton:hover {
      background-color: ${adjustColorBrightness(featureButtons[0].color, -10)} !important;
      transform: scale(1.1) !important;
    }
    #previewBookmarkButton:active {
      transform: scale(0.95) !important;
    }
    #previewOutlineButton:hover {
      background-color: ${adjustColorBrightness(featureButtons[1].color, -10)} !important;
      transform: scale(1.1) !important;
    }
    #previewOutlineButton:active {
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

function getOutlineSourceControls() {
  return [
    document.getElementById('outlineSourceH1'),
    document.getElementById('outlineSourceH2'),
    document.getElementById('outlineSourceH3'),
    document.getElementById('outlineSourceIdBlocks')
  ].filter(Boolean);
}

function ensureOutlineSourceSelection(showNotice) {
  const sources = getOutlineSourceControls();
  const notice = document.getElementById('outlineSourcesResetNotice');
  if (!sources.length || sources.some((source) => source.checked)) {
    if (notice && showNotice) {
      notice.style.display = 'none';
    }
    return false;
  }

  const h1 = document.getElementById('outlineSourceH1');
  const h2 = document.getElementById('outlineSourceH2');
  if (h1) h1.checked = true;
  if (h2) h2.checked = true;
  if (notice) {
    notice.style.display = showNotice ? 'block' : 'none';
  }
  return true;
}

function validateOutlineMaxItemsInput() {
  const input = document.getElementById('outlineMaxItems');
  const error = document.getElementById('outlineMaxItemsError');
  if (!input) return true;
  const value = Number(input.value);
  const isValid = Number.isInteger(value) && value >= 10 && value <= 50;
  if (error) {
    error.style.display = isValid ? 'none' : 'block';
  }
  return isValid;
}

function updateAdvancedVisibility() {
  const progressSettings = document.getElementById('progressBarSettings');
  const verticalSettings = document.getElementById('verticalProgressSettings');
  const horizontalSettings = document.getElementById('horizontalProgressSettings');
  const customColorSettings = document.getElementById('progressCustomColorContainer');
  const scrollBookmarksSettings = document.getElementById('scrollBookmarksSettings');
  const scrollBookmarkCustomColorSettings = document.getElementById('scrollBookmarkButtonCustomColorContainer');
  const outlineNavigationSettings = document.getElementById('outlineNavigationSettings');
  const outlineCustomColorSettings = document.getElementById('outlineButtonCustomColorContainer');
  const progressMode = document.getElementById('progressBarMode');
  const colorMode = document.getElementById('progressColorMode');
  const scrollBookmarkColorMode = document.getElementById('scrollBookmarkButtonColorMode');
  const outlineColorMode = document.getElementById('outlineButtonColorMode');

  if (progressSettings) {
    progressSettings.style.display = 'block';
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
  if (scrollBookmarksSettings) {
    scrollBookmarksSettings.style.display = 'block';
  }
  if (scrollBookmarkCustomColorSettings && scrollBookmarkColorMode) {
    scrollBookmarkCustomColorSettings.style.display = scrollBookmarkColorMode.value === 'custom' ? 'block' : 'none';
  }
  if (outlineNavigationSettings) {
    outlineNavigationSettings.style.display = 'block';
  }
  if (outlineCustomColorSettings && outlineColorMode) {
    outlineCustomColorSettings.style.display = outlineColorMode.value === 'custom' ? 'block' : 'none';
  }
}

function updateAdvancedPreviewControls() {
  updateAdvancedVisibility();
  updatePreviewButtons();
}

function setAdvancedSettingsControls(settings) {
  advancedSettingsState = mergeAdvancedSettings(settings);
  const screenNavigation = advancedSettingsState.screenNavigation;
  const progress = advancedSettingsState.progressBar;
  const icons = advancedSettingsState.iconCustomization;
  const scrollBookmarks = advancedSettingsState.scrollBookmarks;
  const outlineNavigation = advancedSettingsState.outlineNavigation;

  document.getElementById('screenStepRatio').value = Math.round(screenNavigation.screenStepRatio * 100);
  document.getElementById('previousScreenButtonColor').value = screenNavigation.previousScreenButtonColor;
  document.getElementById('previousScreenButtonColorHex').value = screenNavigation.previousScreenButtonColor;
  document.getElementById('nextScreenButtonColor').value = screenNavigation.nextScreenButtonColor;
  document.getElementById('nextScreenButtonColorHex').value = screenNavigation.nextScreenButtonColor;
  document.getElementById('screenNavigationOpacity').value = screenNavigation.opacity;
  document.getElementById('screenNavigationOpacityValue').textContent = screenNavigation.opacity + '%';

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

  document.getElementById('scrollBookmarkButtonPosition').value = scrollBookmarks.buttonPosition;
  document.getElementById('scrollBookmarkButtonColorMode').value = scrollBookmarks.buttonColorMode;
  document.getElementById('scrollBookmarkButtonCustomColor').value = scrollBookmarks.buttonCustomColor;
  document.getElementById('scrollBookmarkButtonCustomColorHex').value = scrollBookmarks.buttonCustomColor;
  document.getElementById('outlineButtonPosition').value = outlineNavigation.buttonPosition;
  document.getElementById('outlineButtonColorMode').value = outlineNavigation.buttonColorMode;
  document.getElementById('outlineButtonCustomColor').value = outlineNavigation.buttonCustomColor;
  document.getElementById('outlineButtonCustomColorHex').value = outlineNavigation.buttonCustomColor;
  document.getElementById('outlineSourceH1').checked = outlineNavigation.sources.h1;
  document.getElementById('outlineSourceH2').checked = outlineNavigation.sources.h2;
  document.getElementById('outlineSourceH3').checked = outlineNavigation.sources.h3;
  document.getElementById('outlineSourceIdBlocks').checked = outlineNavigation.sources.idBlocks;
  document.getElementById('outlineMaxItems').value = outlineNavigation.maxItems;
  document.getElementById('outlineFilterShortHeadings').checked = outlineNavigation.filterShortHeadings;
  document.getElementById('outlineHighlightCurrentSection').checked = outlineNavigation.highlightCurrentSection;
  document.getElementById('scrollBookmarkPerDomainLimit').value = String(scrollBookmarks.perDomainLimit);
  document.getElementById('scrollBookmarkRestoreMode').value = scrollBookmarks.restoreMode;

  ensureOutlineSourceSelection(false);
  validateOutlineMaxItemsInput();
  updateAdvancedVisibility();
  updatePreviewButtons();
}

function getAdvancedSettingsFromControls() {
  const screenStepRatio = clampNumber(document.getElementById('screenStepRatio').value, 50, 100, 90) / 100;
  const previousScreenButtonColor = validateHexColor(
    document.getElementById('previousScreenButtonColor').value,
    '#4A9EDD'
  );
  const nextScreenButtonColor = validateHexColor(
    document.getElementById('nextScreenButtonColor').value,
    '#4A9EDD'
  );
  const screenNavigationOpacity = clampNumber(
    document.getElementById('screenNavigationOpacity').value,
    0,
    100,
    100
  );
  const verticalHeight = clampNumber(document.getElementById('progressVerticalHeight').value, 40, 400, 120);
  const customColor = validateHexColor(document.getElementById('progressCustomColor').value, '#4a9edd');
  const iconColor = validateHexColor(document.getElementById('iconColor').value, '#FFFFFF');
  const scrollBookmarkCustomColor = validateHexColor(document.getElementById('scrollBookmarkButtonCustomColor').value, '#4a9edd');
  const outlineCustomColor = validateHexColor(document.getElementById('outlineButtonCustomColor').value, '#4a9edd');
  ensureOutlineSourceSelection(false);
  return mergeAdvancedSettings({
    screenNavigation: {
      enabled: true,
      screenStepRatio,
      previousScreenButtonColor,
      nextScreenButtonColor,
      opacity: screenNavigationOpacity
    },
    progressBar: {
      enabled: true,
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
    },
    scrollBookmarks: {
      enabled: true,
      buttonPosition: normalizeFeatureButtonPosition(document.getElementById('scrollBookmarkButtonPosition').value),
      buttonColorMode: normalizeFeatureButtonColorMode(document.getElementById('scrollBookmarkButtonColorMode').value),
      buttonCustomColor: scrollBookmarkCustomColor,
      matchMode: 'exact',
      perDomainLimit: normalizePerDomainLimit(document.getElementById('scrollBookmarkPerDomainLimit').value),
      globalLimit: 300,
      restoreMode: normalizeBookmarkRestoreMode(document.getElementById('scrollBookmarkRestoreMode').value)
    },
    outlineNavigation: {
      enabled: true,
      buttonPosition: normalizeFeatureButtonPosition(document.getElementById('outlineButtonPosition').value),
      buttonColorMode: normalizeFeatureButtonColorMode(document.getElementById('outlineButtonColorMode').value),
      buttonCustomColor: outlineCustomColor,
      sources: {
        h1: document.getElementById('outlineSourceH1').checked,
        h2: document.getElementById('outlineSourceH2').checked,
        h3: document.getElementById('outlineSourceH3').checked,
        idBlocks: document.getElementById('outlineSourceIdBlocks').checked
      },
      maxItems: normalizeOutlineMaxItems(document.getElementById('outlineMaxItems').value),
      filterShortHeadings: document.getElementById('outlineFilterShortHeadings').checked,
      highlightCurrentSection: document.getElementById('outlineHighlightCurrentSection').checked
    }
  });
}

function parseHostnameInput(value) {
  return domainUtils.getDomainKey(value);
}

function saveDomainFeatureStates(nextStates, callback) {
  domainFeatureStates = domainUtils.normalizeStates(nextStates, domainFeatureDefaults);
  chrome.storage.local.set({ [DOMAIN_STORAGE_KEYS.states]: domainFeatureStates }, () => {
    renderDomainFeatureStatesList();
    if (callback) callback();
  });
}

function saveDomainFeatureState(domainKey, updater, callback) {
  chrome.storage.local.get([DOMAIN_STORAGE_KEYS.states], (result) => {
    const latestStates = domainUtils.normalizeStates(
      result[DOMAIN_STORAGE_KEYS.states],
      domainFeatureDefaults
    );
    saveDomainFeatureStates(domainUtils.updateState(
      latestStates,
      domainKey,
      updater,
      domainFeatureDefaults
    ), callback);
  });
}

function removeDomainFeatureState(domainKey) {
  const nextStates = { ...domainFeatureStates };
  delete nextStates[domainKey];
  saveDomainFeatureStates(nextStates);
}

function clearDisabledSites() {
  const nextStates = {};
  Object.keys(domainFeatureStates).forEach((domainKey) => {
    if (domainFeatureStates[domainKey].extensionEnabled !== false) {
      nextStates[domainKey] = domainFeatureStates[domainKey];
    }
  });
  saveDomainFeatureStates(nextStates);
  return nextStates;
}

function restoreAllSitesEnabled() {
  saveDomainFeatureStates({});
  return {};
}

function showDomainError(message) {
  const error = document.getElementById('domainError');
  if (!error) return;
  error.textContent = message || '';
  error.style.display = message ? 'block' : 'none';
}

function createDomainToggle(lang, labelKey, checked, disabled, onChange) {
  const label = translations[lang]?.[labelKey] || labelKey;
  const toggleLabel = document.createElement('label');
  toggleLabel.className = 'domain-feature-toggle' + (disabled ? ' is-disabled' : '');
  toggleLabel.setAttribute('title', label);
  const toggle = document.createElement('input');
  toggle.type = 'checkbox';
  toggle.checked = checked;
  toggle.disabled = disabled;
  toggle.setAttribute('aria-label', label);
  toggle.addEventListener('change', () => onChange(toggle.checked));
  toggleLabel.appendChild(toggle);
  return toggleLabel;
}

function renderDomainFeatureStatesList() {
  const list = document.getElementById('domainList');
  const empty = document.getElementById('domainEmpty');
  if (!list || !empty) return;
  list.innerHTML = '';

  const lang = document.getElementById('languageSelector')?.value === 'auto'
    ? normalizeLanguage(navigator.language || navigator.userLanguage)
    : document.getElementById('languageSelector')?.value || 'en-US';
  const query = domainSearchText.toLowerCase();
  const domainKeys = Object.keys(domainFeatureStates)
    .sort()
    .filter((domainKey) => domainKey.toLowerCase().includes(query));

  empty.style.display = domainKeys.length === 0 ? 'block' : 'none';
  if (domainKeys.length > 0) {
    const header = document.createElement('div');
    header.className = 'domain-header';
    [
      'settings.domainName',
      'settings.domainExtension',
      'settings.domainProgressBar',
      'settings.domainScreenNavigation',
      'settings.domainScrollBookmarks',
      'settings.domainOutlineNavigation',
      'settings.domainActions'
    ].forEach((labelKey) => {
      const label = document.createElement('span');
      label.textContent = translations[lang]?.[labelKey] || labelKey;
      header.appendChild(label);
    });
    list.appendChild(header);
  }

  domainKeys.forEach((domainKey) => {
    const state = domainUtils.getState(domainFeatureStates, domainKey, domainFeatureDefaults);
    const row = document.createElement('div');
    row.className = 'domain-row';

    const name = document.createElement('span');
    name.className = 'domain-name';
    name.textContent = domainKey;

    const extensionToggle = createDomainToggle(
      lang,
      'settings.domainExtension',
      state.extensionEnabled,
      false,
      (checked) => {
        saveDomainFeatureState(domainKey, (current) => ({
          ...current,
          extensionEnabled: checked
        }), () => recordAnalyticsToggle('extension', checked));
      }
    );
    const featureToggles = domainUtils.FEATURE_KEYS.map((featureKey) => {
      const labelKeys = {
        progressBar: 'settings.domainProgressBar',
        screenNavigation: 'settings.domainScreenNavigation',
        scrollBookmarks: 'settings.domainScrollBookmarks',
        outlineNavigation: 'settings.domainOutlineNavigation'
      };
      return createDomainToggle(
        lang,
        labelKeys[featureKey],
        state.features[featureKey],
        !state.extensionEnabled,
        (checked) => {
          saveDomainFeatureState(domainKey, (current) => ({
            ...current,
            features: {
              ...current.features,
              [featureKey]: checked
            }
          }), () => recordAnalyticsToggle(featureKey, checked));
        }
      );
    });

    const deleteButton = document.createElement('button');
    deleteButton.type = 'button';
    const deleteLabel = translations[lang]?.['settings.deleteDomain'] || 'Delete';
    deleteButton.className = 'domain-delete-button';
    deleteButton.setAttribute('aria-label', deleteLabel);
    deleteButton.setAttribute('title', deleteLabel);
    deleteButton.innerHTML = `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M3 6h18"></path>
        <path d="M8 6V4h8v2"></path>
        <path d="M19 6l-1 14H6L5 6"></path>
        <path d="M10 11v5"></path>
        <path d="M14 11v5"></path>
      </svg>
    `;
    deleteButton.addEventListener('click', () => removeDomainFeatureState(domainKey));

    row.appendChild(name);
    row.appendChild(extensionToggle);
    featureToggles.forEach((toggle) => row.appendChild(toggle));
    row.appendChild(deleteButton);
    list.appendChild(row);
  });
}

function loadDomainFeatureStates() {
  chrome.storage.sync.get(['advancedSettings'], (syncResult) => {
    chrome.storage.local.get([
      DOMAIN_STORAGE_KEYS.states,
      DOMAIN_STORAGE_KEYS.defaults,
      DOMAIN_STORAGE_KEYS.migrationVersion,
      DOMAIN_STORAGE_KEYS.legacyStates
    ], (localResult) => {
      const migration = domainUtils.migrateStorage(localResult, syncResult.advancedSettings);
      domainFeatureStates = migration.states;
      domainFeatureDefaults = migration.defaults;
      const finish = () => renderDomainFeatureStatesList();
      if (!migration.needsWrite) {
        finish();
        return;
      }
      chrome.storage.local.set(domainUtils.toStorageData(migration), finish);
    });
  });
}

function normalizeBookmarks(bookmarks) {
  return bookmarks && typeof bookmarks === 'object' && !Array.isArray(bookmarks) ? bookmarks : {};
}

function formatBookmarkDate(timestamp) {
  if (!timestamp) return '';
  try {
    return new Date(timestamp).toLocaleString();
  } catch (err) {
    return '';
  }
}

function openSavedBookmark(key, bookmark) {
  const url = bookmark && (bookmark.url || bookmark.normalizedUrl);
  if (!url || !chrome.tabs || !chrome.tabs.create) return;

  chrome.storage.local.set({
    pendingScrollBookmarkRestore: {
      key,
      requestedAt: Date.now()
    }
  }, () => {
    recordAnalyticsAction('bookmarkRestoreClicks');
    chrome.tabs.create({ url });
  });
}

function renderSavedBookmarksList() {
  const list = document.getElementById('savedBookmarksList');
  const empty = document.getElementById('savedBookmarksEmpty');
  if (!list || !empty) return;
  list.innerHTML = '';

  const lang = document.getElementById('languageSelector')?.value === 'auto'
    ? normalizeLanguage(navigator.language || navigator.userLanguage)
    : document.getElementById('languageSelector')?.value || 'en-US';
  const entries = Object.entries(savedBookmarks)
    .sort((a, b) => (b[1].savedAt || 0) - (a[1].savedAt || 0));

  empty.style.display = entries.length === 0 ? 'block' : 'none';
  entries.forEach(([key, bookmark]) => {
    const row = document.createElement('div');
    row.className = 'bookmark-row';

    const info = document.createElement('div');
    info.className = 'bookmark-info';

    const title = document.createElement('div');
    title.className = 'bookmark-title';
    const titleText = document.createElement('span');
    titleText.className = 'bookmark-title-text';
    titleText.textContent = bookmark.title || bookmark.normalizedUrl || bookmark.url || key;

    const meta = document.createElement('span');
    meta.className = 'bookmark-meta';
    const percent = Math.round((Number(bookmark.scrollPct) || 0) * 100);
    meta.textContent = `${percent}% · ${formatBookmarkDate(bookmark.savedAt)}`;

    title.appendChild(titleText);
    title.appendChild(meta);

    const url = document.createElement('div');
    url.className = 'bookmark-url';
    url.textContent = bookmark.normalizedUrl || bookmark.url || '';

    info.appendChild(title);
    info.appendChild(url);

    const actions = document.createElement('div');
    actions.className = 'bookmark-actions';

    const openButton = document.createElement('button');
    openButton.type = 'button';
    openButton.textContent = translations[lang]?.['settings.openBookmark'] || 'Open';
    openButton.addEventListener('click', () => {
      openSavedBookmark(key, bookmark);
    });

    const deleteButton = document.createElement('button');
    deleteButton.type = 'button';
    deleteButton.textContent = translations[lang]?.['settings.deleteBookmark'] || 'Delete';
    deleteButton.addEventListener('click', () => removeSavedBookmark(key));

    actions.appendChild(openButton);
    actions.appendChild(deleteButton);
    row.appendChild(info);
    row.appendChild(actions);
    list.appendChild(row);
  });
}

function loadSavedBookmarks() {
  chrome.storage.local.get(['bookmarks'], (result) => {
    savedBookmarks = normalizeBookmarks(result.bookmarks);
    renderSavedBookmarksList();
  });
}

function removeSavedBookmark(key) {
  const nextBookmarks = { ...savedBookmarks };
  delete nextBookmarks[key];
  chrome.storage.local.set({ bookmarks: nextBookmarks }, () => {
    savedBookmarks = nextBookmarks;
    renderSavedBookmarksList();
  });
}

function activateTab(targetTab) {
  const tabButtons = document.querySelectorAll('.tab-button');
  const tabPanels = document.querySelectorAll('.tab-panel');

  tabButtons.forEach((item) => {
    const isActive = item.getAttribute('data-tab') === targetTab;
    item.classList.toggle('is-active', isActive);
    item.setAttribute('aria-selected', String(isActive));
  });
  tabPanels.forEach((panel) => {
    panel.classList.toggle('is-active', panel.getAttribute('data-tab-panel') === targetTab);
  });
}

function setupTabs() {
  const tabButtons = document.querySelectorAll('.tab-button');

  tabButtons.forEach((button) => {
    button.setAttribute('aria-selected', String(button.classList.contains('is-active')));
    button.addEventListener('click', () => {
      activateTab(button.getAttribute('data-tab'));
    });
  });
}

const ONBOARDING_VISIBLE_KEY = 'showOnboarding';

function setOnboardingVisible(visible) {
  const guide = document.getElementById('onboardingGuide');
  if (!guide) return;
  guide.style.display = visible ? 'block' : 'none';
}

function loadOnboardingState() {
  chrome.storage.local.get([ONBOARDING_VISIBLE_KEY], (result) => {
    setOnboardingVisible(result[ONBOARDING_VISIBLE_KEY] === true);
  });
}

function dismissOnboarding() {
  chrome.storage.local.set({ [ONBOARDING_VISIBLE_KEY]: false }, () => {
    setOnboardingVisible(false);
  });
}

function reopenOnboarding() {
  chrome.storage.local.set({ [ONBOARDING_VISIBLE_KEY]: true }, () => {
    setOnboardingVisible(true);
    activateTab('basic');
    document.getElementById('onboardingGuide')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  });
}

function setManifestVersion() {
  const versionElement = document.getElementById('manifestVersion');
  if (!versionElement || typeof chrome === 'undefined' || !chrome.runtime?.getManifest) return;
  versionElement.textContent = chrome.runtime.getManifest().version || versionElement.textContent;
}

function compareVersions(left, right) {
  const leftParts = String(left || '').split('.').map((part) => Number(part) || 0);
  const rightParts = String(right || '').split('.').map((part) => Number(part) || 0);
  const length = Math.max(leftParts.length, rightParts.length);
  for (let index = 0; index < length; index++) {
    const difference = (leftParts[index] || 0) - (rightParts[index] || 0);
    if (difference !== 0) return difference;
  }
  return 0;
}

function getManifestVersion() {
  if (typeof chrome !== 'undefined' && chrome.runtime?.getManifest) {
    return chrome.runtime.getManifest().version || '0.0.0';
  }
  return document.getElementById('manifestVersion')?.textContent || '0.0.0';
}

function renderReleaseNotes(lang) {
  const list = document.getElementById('releaseNotesList');
  if (!list) return;

  const localized = releaseNotesTranslations[lang] || releaseNotesTranslations['en-US'];
  const manifestVersion = getManifestVersion();
  list.innerHTML = '';

  RELEASE_NOTES
    .filter((release) => compareVersions(release.version, manifestVersion) <= 0)
    .forEach((release) => {
      const details = document.createElement('details');
      details.className = 'release-version feedback-disclosure';
      details.open = release.version === manifestVersion;
      details.setAttribute('data-release-version', release.version);

      const summary = document.createElement('summary');
      const version = document.createElement('span');
      version.textContent = `v${release.version}`;
      summary.appendChild(version);

      if (release.version === manifestVersion) {
        const currentBadge = document.createElement('span');
        currentBadge.className = 'release-current-badge';
        currentBadge.textContent = localized.currentVersion;
        summary.appendChild(currentBadge);
      }

      const content = document.createElement('div');
      content.className = 'release-version-content';

      ['added', 'improved', 'fixed'].forEach((categoryKey) => {
        const itemKeys = release.categories[categoryKey] || [];
        if (!itemKeys.length) return;

        const category = document.createElement('section');
        category.className = 'release-category';
        const heading = document.createElement('h4');
        heading.textContent = localized.categories[categoryKey];
        const items = document.createElement('ul');

        itemKeys.forEach((itemKey) => {
          const item = document.createElement('li');
          item.textContent = localized.items[itemKey];
          items.appendChild(item);
        });

        category.appendChild(heading);
        category.appendChild(items);
        content.appendChild(category);
      });

      details.appendChild(summary);
      details.appendChild(content);
      list.appendChild(details);
    });
}

function getAnalyticsLanguage() {
  const selected = document.getElementById('languageSelector')?.value;
  if (selected && selected !== 'auto') return selected;
  return normalizeLanguage(navigator.language || navigator.userLanguage);
}

function getAnalyticsText(key) {
  const lang = getAnalyticsLanguage();
  const localized = analyticsTranslations[lang] || analyticsTranslations['en-US'];
  return localized[key] || analyticsTranslations['en-US'][key] || key;
}

function renderAnalyticsState() {
  const toggle = document.getElementById('analyticsEnabled');
  const status = document.getElementById('analyticsStatus');
  const preview = document.getElementById('analyticsPreviewData');
  if (!toggle || !status || !preview) return;

  toggle.checked = analyticsRuntimeState.consent.enabled === true;
  toggle.disabled = false;
  if (!analyticsRuntimeState.configured && toggle.checked) {
    analyticsStatusKey = 'unavailable';
  } else if (analyticsStatusKey !== 'permissionDenied' && analyticsStatusKey !== 'error') {
    analyticsStatusKey = toggle.checked ? 'enabledStatus' : 'disabled';
  }
  status.textContent = getAnalyticsText(analyticsStatusKey);
  preview.textContent = JSON.stringify(analyticsRuntimeState.events || [], null, 2);
}

function sendAnalyticsMessage(message, callback) {
  if (!chrome.runtime || typeof chrome.runtime.sendMessage !== 'function') {
    callback({ ok: false, reason: 'runtime_unavailable' });
    return;
  }
  chrome.runtime.sendMessage(message, (response) => {
    if (chrome.runtime.lastError) {
      callback({ ok: false, reason: 'runtime_error' });
      return;
    }
    callback(response || { ok: false, reason: 'empty_response' });
  });
}

function recordAnalyticsAction(actionKey) {
  sendAnalyticsMessage({
    action: analyticsUtils.MESSAGE_ACTIONS.recordAction,
    actionKey
  }, () => {});
}

function recordAnalyticsToggle(feature, enabled) {
  sendAnalyticsMessage({
    action: analyticsUtils.MESSAGE_ACTIONS.recordToggle,
    feature,
    enabled: enabled === true,
    source: 'domainManager'
  }, () => {});
}

function refreshAnalyticsState(statusKey) {
  if (statusKey) analyticsStatusKey = statusKey;
  sendAnalyticsMessage({ action: analyticsUtils.MESSAGE_ACTIONS.getState }, (response) => {
    if (response.ok && response.state) {
      analyticsRuntimeState = response.state;
    }
    renderAnalyticsState();
  });
}

function getAnalyticsSettingsSnapshotPayload(buttonSettings, advancedSettings, language) {
  const manifest = chrome.runtime?.getManifest ? chrome.runtime.getManifest() : { version: 'unknown' };
  return analyticsUtils.buildSettingsSnapshotPayload({
    locale: language === 'auto' ? getAnalyticsLanguage() : language,
    extensionVersion: manifest.version,
    buttonSettings,
    advancedSettings
  });
}

function recordAnalyticsSettingsSnapshot(buttonSettings, advancedSettings, language, callback) {
  const payload = getAnalyticsSettingsSnapshotPayload(buttonSettings, advancedSettings, language);
  sendAnalyticsMessage({
    action: analyticsUtils.MESSAGE_ACTIONS.recordSettingsSnapshot,
    payload
  }, (response) => {
    if (typeof callback === 'function') callback(response);
  });
}

function getCurrentAnalyticsSettingsSnapshotPayload() {
  return getAnalyticsSettingsSnapshotPayload({
    horizontalPosition: document.getElementById('horizontalPosition').value,
    verticalAlignment: document.getElementById('verticalAlignment').value,
    buttonSize: Number(document.getElementById('buttonSize').value),
    buttonShape: document.getElementById('buttonShape').value,
    buttonSpacing: Number(document.getElementById('buttonSpacing').value),
    edgeDistance: Number(document.getElementById('edgeDistance').value),
    topButtonColor: document.getElementById('topButtonColor').value,
    bottomButtonColor: document.getElementById('bottomButtonColor').value,
    opacity: Number(document.getElementById('opacity').value),
    enableHoverHide: document.getElementById('enableHoverHide').checked
  }, domainUtils.stripLegacyEnabled(getAdvancedSettingsFromControls()), getAnalyticsLanguage());
}

function removeAnalyticsPermission(callback) {
  if (!analyticsRuntimeState.permissionOrigin ||
      !chrome.permissions ||
      typeof chrome.permissions.remove !== 'function') {
    callback();
    return;
  }
  chrome.permissions.remove({
    permissions: ['alarms'],
    origins: [analyticsRuntimeState.permissionOrigin]
  }, callback);
}

function disableAnalytics() {
  sendAnalyticsMessage({
    action: analyticsUtils.MESSAGE_ACTIONS.setConsent,
    enabled: false
  }, (response) => {
    removeAnalyticsPermission(() => {
      refreshAnalyticsState(response.ok ? 'disabled' : 'error');
    });
  });
}

function enableAnalytics() {
  const persistConsent = () => {
    sendAnalyticsMessage({
      action: analyticsUtils.MESSAGE_ACTIONS.setConsent,
      enabled: true
    }, (response) => {
      if (!response.ok) {
        analyticsStatusKey = 'error';
        renderAnalyticsState();
        return;
      }
      sendAnalyticsMessage({
        action: analyticsUtils.MESSAGE_ACTIONS.recordSettingsSnapshot,
        payload: getCurrentAnalyticsSettingsSnapshotPayload()
      }, () => refreshAnalyticsState(
        analyticsRuntimeState.configured ? 'enabledStatus' : 'unavailable'
      ));
    });
  };

  if (!analyticsRuntimeState.configured) {
    persistConsent();
    return;
  }
  if (!analyticsRuntimeState.permissionOrigin ||
      !chrome.permissions ||
      typeof chrome.permissions.request !== 'function') {
    analyticsStatusKey = 'error';
    renderAnalyticsState();
    return;
  }

  chrome.permissions.request({
    permissions: ['alarms'],
    origins: [analyticsRuntimeState.permissionOrigin]
  }, (granted) => {
    if (!granted || chrome.runtime.lastError) {
      analyticsStatusKey = 'permissionDenied';
      renderAnalyticsState();
      return;
    }
    persistConsent();
  });
}

function handleAnalyticsToggle(event) {
  if (event.target.checked) {
    enableAnalytics();
  } else {
    disableAnalytics();
  }
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
      renderDomainFeatureStatesList();
      renderSavedBookmarksList();
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
  if (!validateOutlineMaxItemsInput()) {
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
  const advancedSettings = domainUtils.stripLegacyEnabled(getAdvancedSettingsFromControls());

  chrome.storage.sync.set({scrollSpeed: scrollSpeed, buttonSettings: buttonSettings, advancedSettings: advancedSettings, language: language}, () => {
    recordAnalyticsSettingsSnapshot(buttonSettings, advancedSettings, language, () => {
      refreshAnalyticsState();
    });

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
  renderReleaseNotes(normalizeLanguage(navigator.language || navigator.userLanguage));
  loadOnboardingState();
  loadSettings();
  loadDomainFeatureStates();
  loadSavedBookmarks();
  refreshAnalyticsState();

  // 更新快捷键显示（根据操作系统平台）
  updateShortcutKeyDisplay();
  refreshGlobalShortcuts();

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

  document.getElementById('screenStepRatio').addEventListener('input', updatePreviewButtons);
  document.getElementById('screenNavigationOpacity').addEventListener('input', (e) => {
    document.getElementById('screenNavigationOpacityValue').textContent = e.target.value + '%';
    updatePreviewButtons();
  });
  document.getElementById('progressBarMode').addEventListener('change', updateAdvancedPreviewControls);
  document.getElementById('progressHorizontalPosition').addEventListener('change', updatePreviewButtons);
  document.getElementById('progressThickness').addEventListener('change', updatePreviewButtons);
  document.getElementById('progressVerticalHeight').addEventListener('input', updatePreviewButtons);
  document.getElementById('progressColorMode').addEventListener('change', updateAdvancedPreviewControls);
  document.getElementById('progressShowPercentage').addEventListener('change', updatePreviewButtons);
  document.getElementById('scrollBookmarkButtonPosition').addEventListener('change', updatePreviewButtons);
  document.getElementById('scrollBookmarkButtonColorMode').addEventListener('change', updateAdvancedPreviewControls);
  document.getElementById('outlineButtonPosition').addEventListener('change', updatePreviewButtons);
  document.getElementById('outlineButtonColorMode').addEventListener('change', updateAdvancedPreviewControls);
  getOutlineSourceControls().forEach((control) => {
    control.addEventListener('change', () => {
      ensureOutlineSourceSelection(true);
    });
  });
  document.getElementById('outlineMaxItems').addEventListener('input', validateOutlineMaxItemsInput);

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

  function bindColorPair(colorId, hexId) {
    document.getElementById(colorId).addEventListener('input', (e) => {
      document.getElementById(hexId).value = e.target.value;
      updatePreviewButtons();
    });
    document.getElementById(hexId).addEventListener('input', (e) => {
      const colorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
      if (colorRegex.test(e.target.value)) {
        document.getElementById(colorId).value = e.target.value;
        updatePreviewButtons();
      }
    });
  }

  bindColorPair('scrollBookmarkButtonCustomColor', 'scrollBookmarkButtonCustomColorHex');
  bindColorPair('outlineButtonCustomColor', 'outlineButtonCustomColorHex');
  bindColorPair('previousScreenButtonColor', 'previousScreenButtonColorHex');
  bindColorPair('nextScreenButtonColor', 'nextScreenButtonColorHex');

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
    renderDomainFeatureStatesList();
  });
  document.getElementById('addDomainButton').addEventListener('click', () => {
    const input = document.getElementById('domainInput');
    const domainKey = parseHostnameInput(input.value);
    if (!domainKey) {
      getCurrentLanguage().then(lang => {
        showDomainError(translations[lang]?.['settings.invalidDomain'] || 'Enter a valid http/https website hostname.');
      });
      return;
    }
    showDomainError('');
    saveDomainFeatureState(domainKey, {
      extensionEnabled: document.getElementById('domainInitialState').value === 'true',
      features: {
        progressBar: false,
        screenNavigation: false,
        scrollBookmarks: false,
        outlineNavigation: false
      }
    });
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
        refreshGlobalShortcuts();
        renderDomainFeatureStatesList();
        renderSavedBookmarksList();
      });
    } else {
      applyTranslation(lang);
      refreshGlobalShortcuts();
      renderDomainFeatureStatesList();
      renderSavedBookmarksList();
    }
  });

  // 保存按钮点击事件
  document.getElementById('saveButton').addEventListener('click', saveSettings);
  document.getElementById('analyticsEnabled').addEventListener('change', handleAnalyticsToggle);
  document.getElementById('dismissOnboardingButton').addEventListener('click', dismissOnboarding);
  document.getElementById('reopenOnboardingButton').addEventListener('click', reopenOnboarding);
  document.getElementById('manageGlobalShortcuts').addEventListener('click', openGlobalShortcutManager);

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
  window.addEventListener('focus', refreshGlobalShortcuts);
}

if (chrome.storage.onChanged && chrome.storage.onChanged.addListener) {
  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace !== 'local') return;
    if (changes[DOMAIN_STORAGE_KEYS.defaults]) {
      domainFeatureDefaults = domainUtils.normalizeDefaults(
        changes[DOMAIN_STORAGE_KEYS.defaults].newValue
      );
    }
    if (changes[DOMAIN_STORAGE_KEYS.states]) {
      domainFeatureStates = domainUtils.normalizeStates(
        changes[DOMAIN_STORAGE_KEYS.states].newValue,
        domainFeatureDefaults
      );
    }
    if (changes[DOMAIN_STORAGE_KEYS.defaults] || changes[DOMAIN_STORAGE_KEYS.states]) {
      renderDomainFeatureStatesList();
    }
  });
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', init);
