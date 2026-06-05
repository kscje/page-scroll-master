# Page Scroll Master 高级功能开发指引

本文档用于指导后续 Codex 自动开发 Page Scroll Master 的高级功能。开发时应优先保持现有插件体验稳定：所有高级功能默认关闭，用户未主动启用前，页面浮动按钮、Popup、设置页基础功能应与 v1.7.0 保持一致。

## 目标版本规划

### v1.8 Advanced Controls Update

v1.8 聚焦低风险、高感知的高级功能基础版：

- 可配置阅读进度条
- 按钮图标样式与图标颜色自定义
- 设置页管理网站启用状态列表
- 新增西班牙语和日语支持

### v1.9 Reading Position & Feedback Update

v1.9 聚焦阅读位置恢复、多语言覆盖扩展和用户反馈闭环：

- 返回上次滚动位置
- 页面滚动位置书签
- 可选自动记录与手动恢复
- 新增德语、法语、葡萄牙语、繁体中文、韩语、意大利语支持
- 设置页新增“建议&反馈”分类

### v2.0 Outline Navigation Update

v2.0 聚焦长页面导航：

- 智能段落跳转
- 页面标题大纲面板
- 当前章节高亮

### v2.1 Privacy-Friendly Usage Analytics Update

v2.1 聚焦匿名使用统计和隐私合规披露，帮助评估功能优先级和默认值：

- 设置页新增“发送匿名使用统计”开关，默认关闭
- 统计核心设置分布和高级功能启用率
- 按日聚合顶部、底部、进度跳转等操作次数
- 明确禁止上传 URL、域名、页面标题、页面内容和站点级使用记录
- 更新隐私政策、商店隐私实践和发布检查清单

详细规格见 `doc/v2.1-usage-analytics-spec-zh.md`，实施步骤见 `doc/v2.1-usage-analytics-implementation-plan-zh.md`。

## 全局设计原则

### 默认不改变现有体验

高级功能未开启时，页面显示仍为当前两个浮动按钮：

```text
┌──────┐
│  ▲   │
└──────┘

┌──────┐
│  ▼   │
└──────┘
```

不要在默认状态下注入进度条、目录按钮、书签按钮或额外提示。

### 高级功能围绕现有按钮体系展开

现有核心体验是“页面边缘浮动按钮组”。新增功能应尽量复用：

- `content.js` 中的 Shadow DOM 按钮宿主
- 现有滚动容器检测逻辑
- 现有按钮设置：尺寸、形状、间距、颜色、透明度、位置
- 现有全屏隐藏、站点启停、SPA 检测机制

### 设置结构应可向后兼容

新增设置应写入 `chrome.storage.sync`，站点级状态继续写入 `chrome.storage.local`。读取设置时必须提供默认值，避免旧版本用户升级后出现 `undefined` 导致的样式或逻辑异常。

建议新增统一设置对象：

```js
advancedSettings: {
  progressBar: {
    enabled: false,
    mode: 'verticalButton',
    horizontalPosition: 'top',
    colorMode: 'followTopButton',
    customColor: '#4A9EDD',
    thickness: 3,
    verticalHeight: 72,
    clickToJump: true,
    showPercentage: false,
    showRemainingTime: false
  },
  iconCustomization: {
    enabled: false,
    iconSet: 'defaultArrow',
    iconColor: '#FFFFFF',
    customIcon: {
      enabled: false,
      topIconDataUrl: '',
      bottomIconDataUrl: ''
    }
  },
  readingTools: {
    enabled: false,
    buttonPosition: 'pageBottom',
    buttonColorMode: 'followProgressBar',
    buttonCustomColor: '#4A9EDD',
    features: {
      scrollBookmarks: true,
      outlineNavigation: false
    }
  },
  scrollBookmarks: {
    matchMode: 'exact',
    perDomainLimit: 1,
    globalLimit: 300,
    restorePromptEnabled: true
  },
  outlineNavigation: {
    enabled: false,
    includeH1: true,
    includeH2: true,
    includeH3: false,
    includeIdAnchors: false,
    maxItems: 30,
    highlightCurrent: true
  }
}
```

## v1.8 功能一：可配置阅读进度条

### 产品目标

让用户在长页面、文档、Wiki、Notion、语雀、飞书等页面中直观看到阅读进度，并可点击进度条跳转到页面任意位置。

### 显示模式

阅读进度条应支持两种模式，由用户在设置页自由选择。

#### 模式 A：纵向进度按钮

显示在上/下按钮之间，作为按钮组中的第三个长按钮。

```text
┌──────┐
│  ▲   │
└──────┘

┌──────┐
│ 37%  │
│ ███  │
│ ███  │
│ ░░░  │
└──────┘

┌──────┐
│  ▼   │
└──────┘
```

不显示百分比时：

```text
┌──────┐
│  ▲   │
└──────┘

┌──────┐
│      │
│ ███  │
│ ███  │
│ ░░░  │
└──────┘

┌──────┐
│  ▼   │
└──────┘
```

纵向进度按钮规则：

- 宽度跟随当前 `buttonSettings.buttonSize`
- 高度使用独立设置 `advancedSettings.progressBar.verticalHeight`，默认 `72`
- 形状跟随当前 `buttonSettings.buttonShape`
- 间距使用当前 `buttonSettings.buttonSpacing`
- 透明度跟随当前 `buttonSettings.opacity`
- 默认颜色跟随顶部按钮颜色，也可自定义
- 文字或图标颜色默认使用图标颜色设置
- 点击按钮内部任意高度时跳转到对应进度

纵向点击比例计算：

```js
const ratio = 1 - ((event.clientY - rect.top) / rect.height);
const targetTop = scrollRange * clamp(ratio, 0, 1);
```

顶部代表 `100%`，底部代表 `0%`。

#### 模式 B：横向页面边缘进度条

显示在页面顶部或底部。

```text
页面顶部：
████████████░░░░░░░░░░░░░░░░  37%

页面内容
────────────────────────────
```

横向进度条规则：

- 位置可选：顶部或底部
- 粗细可选：`2px`、`3px`、`4px`、`6px`
- 默认颜色为 `#4A9EDD` 或跟随顶部按钮颜色
- 点击横向位置跳转到对应页面百分比
- 默认不显示剩余阅读时间
- 默认不启用拖动 scrub，后续小版本再考虑

横向点击比例计算：

```js
const ratio = (event.clientX - rect.left) / rect.width;
const targetTop = scrollRange * clamp(ratio, 0, 1);
```

### 进度计算

不要直接写死 `scrollTop / (scrollHeight - clientHeight)`。应复用或扩展当前 `content.js` 已有函数：

- `findScrollContainer()`
- `resolveScrollContainer()`
- `getScrollTop(container)`
- `setScrollTop(container, top)`
- `getElementScrollRange(container)`
- `isRootScrollElement(element)`

推荐新增：

```js
function getScrollProgress(container) {
  const range = getElementScrollRange(container);
  if (range <= 0) return 0;
  return Math.max(0, Math.min(1, getScrollTop(container) / range));
}
```

### 平滑跳转

当前代码中 `scrollToTop()` 和 `scrollToBottom()` 各自实现动画。v1.8 应先抽取通用函数：

```js
function smoothScrollTo(container, targetTop) {
  const start = getScrollTop(container);
  const end = Math.max(0, Math.min(targetTop, getElementScrollRange(container)));
  const startTime = performance.now();

  function scroll(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / scrollSpeed, 1);
    const easeProgress = easeInOutCubic(progress);
    setScrollTop(container, start + (end - start) * easeProgress);

    if (progress < 1) {
      requestAnimationFrame(scroll);
    }
  }

  requestAnimationFrame(scroll);
}
```

然后让 `scrollToTop()`、`scrollToBottom()`、进度条点击跳转都复用该函数。

### 滚动监听与节流

进度条应绑定到当前真实滚动容器。监听滚动时使用 `requestAnimationFrame` 节流，约等于 16ms 更新一次：

```js
let progressUpdateFrame = null;

function requestProgressUpdate() {
  if (progressUpdateFrame) return;
  progressUpdateFrame = requestAnimationFrame(() => {
    progressUpdateFrame = null;
    updateProgressBar();
  });
}
```

### SPA 容器变化

不能只在初始化时绑定一次滚动容器。当前项目已有 SPA 检测和 `detectAndUpdateScrollContainer()`。新增进度条时应在滚动容器变化后：

- 解绑旧容器的 `scroll` 监听
- 绑定新容器的 `scroll` 监听
- 立即刷新进度

建议新增：

```js
let progressScrollContainer = null;

function bindProgressToContainer(container) {
  if (progressScrollContainer === container) return;
  if (progressScrollContainer) {
    progressScrollContainer.removeEventListener('scroll', requestProgressUpdate);
  }
  progressScrollContainer = container;
  progressScrollContainer.addEventListener('scroll', requestProgressUpdate, { passive: true });
  requestProgressUpdate();
}
```

根滚动元素场景需注意：如果实际滚动事件发生在 `window`，应绑定 `window`，不要只绑定 `documentElement`。

### 显示百分比

`showPercentage` 默认关闭。开启后：

- 纵向进度按钮内部显示 `37%`
- 横向进度条可在右侧显示 `37%` 或悬停 tooltip
- 百分比应四舍五入到整数

### 预计剩余阅读时间

`showRemainingTime` 默认关闭，可作为实验功能。首次加载时计算一次，SPA 内容变化时可防抖重新计算。

估算建议：

- 英文、西班牙语等空格分词语言：按单词数 / `250 wpm`
- 中文、日文：按字符数估算，建议先按 `500 chars/min`
- 只作为近似提示，不要在 UI 中使用过于确定的措辞

注意过滤：

- `script`
- `style`
- `noscript`
- 扩展自身 Shadow DOM
- 隐藏元素可先不精确过滤，避免复杂度过高

### 无限滚动页面

Twitter/X、微博、部分信息流页面会动态增加 `scrollHeight`，导致进度条看似“后退”。v1.8 应保守处理：

- 在设置页添加注意事项说明
- 对明显无限滚动页面不做复杂承诺
- 可在检测到 `scrollHeight` 短时间多次增长时降低更新频率或平滑更新
- 不建议 v1.8 做复杂站点黑名单，除非已有明确需求

### 全屏隐藏

进度条必须与现有按钮共用全屏隐藏行为。当前 `fullscreenManager` 只管理按钮容器，后续应扩展为：

- 按钮组进入全屏隐藏
- 纵向进度按钮跟随按钮组隐藏
- 横向进度条也隐藏

可复用 `.psm-fullscreen-hidden` 类。

### 设置页 UI

建议新增“高级功能”区域，默认折叠或位于基础设置之后：

```text
高级功能
────────────────────────
[ ] 启用阅读进度条

显示样式
(•) 进度按钮，显示在上下按钮之间
( ) 页面顶部/底部横向进度条

进度按钮设置：
高度            [ 72 px ]
颜色            ( 跟随顶部按钮 | 跟随底部按钮 | 自定义 )

横向进度条设置：
位置            ( 顶部 | 底部 )
粗细            [ 3 px ]
颜色            [ #4A9EDD ]

通用：
[✓] 点击跳转
[ ] 显示百分比
[ ] 显示剩余阅读时间
```

## v1.8 功能二：按钮图标样式与颜色自定义

### 产品目标

允许用户修改按钮内部图标样式和颜色，同时为后续上传自定义图标预留接口。

### 默认行为

不开启图标自定义时，按钮图标保持当前白色上/下箭头。

### 内置图标组

v1.8 推荐先内置 SVG 图标组，不使用字体字符，避免不同系统字体差异。

推荐图标组：

- `defaultArrow`：当前默认上/下箭头
- `triangle`：上/下三角形
- `chevron`：上/下折线箭头
- `minimalArrow`：极简箭头
- `doubleArrow`：双箭头

### 设置页 UI

```text
按钮样式
────────────────────────
[ ] 自定义按钮图标

开启后显示：

图标样式
[ 默认箭头 ] [ 三角形 ] [ 折线箭头 ] [ 极简箭头 ] [ 双箭头 ]

图标颜色
[ #FFFFFF ]

图标预览
┌──────┐     ┌──────┐
│  ▲   │     │  ▼   │
└──────┘     └──────┘

未来扩展
[上传自定义图标] Coming soon
```

### 数据结构

```js
iconCustomization: {
  enabled: false,
  iconSet: 'defaultArrow',
  iconColor: '#FFFFFF',
  customIcon: {
    enabled: false,
    topIconDataUrl: '',
    bottomIconDataUrl: ''
  }
}
```

### 实现注意事项

- 当前按钮图标在 `createScrollButton()` 中使用内联 SVG。应新增 `getIconSvg(direction, iconSet)`。
- 图标颜色应通过 `currentColor` 控制，按钮上设置 `color: iconColor`。
- 仍需保留 `aria-label`、`title`。
- 上传自定义图标在 v1.8 只预留接口，不实现真实上传和存储。

## v1.8 功能三：设置页管理网站启用状态

### 产品目标

当前 Popup 已支持按域名启用/禁用插件，但用户缺少集中管理入口。v1.8 在设置页新增网站列表管理。

### 当前存储

现有 `popup.js` 使用：

```js
const STATES_KEY = 'enableStates';
```

存储在 `chrome.storage.local`：

```js
{
  enableStates: {
    'notion.so': true,
    'yuque.com': false
  }
}
```

默认规则：未出现在列表中的网站视为启用。

### 设置页 UI

```text
网站启用状态
────────────────────────
搜索域名
[ notion.so              ]

┌──────────────────────────────┐
│ 域名                  状态    │
├──────────────────────────────┤
│ notion.so             开启    │
│ yuque.com             关闭    │
│ docs.google.com       关闭    │
└──────────────────────────────┘

[添加域名]   [清除已关闭站点]   [恢复全部启用]
```

添加域名：

```text
添加网站规则
────────────────
域名
[ example.com ]

状态
(•) 启用
( ) 禁用

[保存]
```

### 行为规则

- 只保存 hostname，不保存完整 URL。
- 用户输入 URL 时应解析为 hostname。
- 列表只展示用户手动改过的站点。
- “恢复全部启用”应清空 `enableStates` 或将所有值设为 `true`。推荐清空，保持存储干净。
- “清除已关闭站点”只删除值为 `false` 的记录。
- 设置页修改后，已打开页面应通过 `chrome.storage.onChanged` 自动响应。

### 测试建议

新增或扩展测试：

- URL 输入可正确提取 hostname
- 非 http/https 输入被拒绝或提示
- 默认未列出域名视为启用
- 设置页修改 `enableStates` 后 Popup 状态同步
- 清空列表后所有站点恢复默认启用

## v1.8 功能四：新增语言支持

### 推荐新增语言

推荐新增：

- 西班牙语：`es`
- 日语：`ja`

理由：

- 项目已支持英文和简体中文。
- 西班牙语覆盖面广，适合提升全球用户可达性。
- 日语在桌面浏览器、技术文档、效率工具用户中价值高。

### 文件结构

新增：

```text
_locales/es/messages.json
_locales/ja/messages.json
```

### 设置页语言值

建议内部使用：

```text
auto
zh-CN
en-US
es-ES
ja-JP
```

设置页显示：

```text
自动检测
简体中文
English
Español
日本語
```

### 必须同步的位置

当前项目不完全依赖 `_locales`，还在 JS 内维护翻译对象。因此新增语言时必须同步：

- `_locales/es/messages.json`
- `_locales/ja/messages.json`
- `options.js` 中的 `translations`
- `popup.js` 中的 `popupTranslations`
- `options.html` 的语言选择器
- 商店素材和 README 可后续再补

### 自动语言检测

当前逻辑中只判断 `zh`，后续应扩展：

```js
function normalizeLanguage(browserLang) {
  const lang = (browserLang || '').toLowerCase();
  if (lang.startsWith('zh')) return 'zh-CN';
  if (lang.startsWith('es')) return 'es-ES';
  if (lang.startsWith('ja')) return 'ja-JP';
  return 'en-US';
}
```

## v1.9 功能：滚动位置书签

滚动位置书签的最终 V1.9 产品边界、数据结构、URL 归一化和恢复流程，见 `doc/v1.9-scroll-position-bookmarks-prd-zh.md`。下方内容仅保留为早期设计背景，开发时不应作为实现依据。

### 产品目标

解决用户在长页面中找不到上次阅读位置的问题。

### 推荐交互

不要默认强制自动恢复，避免打扰用户。推荐默认开启后显示恢复提示。

```text
┌────────────────────┐
│ 恢复到上次阅读位置？ │
│ [恢复]        [忽略] │
└────────────────────┘
```

点击顶部/底部按钮前，可以自动记住当前位置。跳转后显示返回点：

```text
┌──────┐
│  ▲   │
└──────┘

●  ← 返回上次位置

┌──────┐
│  ▼   │
└──────┘
```

### 设置页 UI

```text
高级功能
────────────────────────
[ ] 显示阅读工具按钮

功能：
[x] 滚动位置书签
[ ] 智能段落跳转（v2.0）

阅读工具按钮位置：
( ) 页面顶部
(•) 页面底部
( ) 上/下按钮之间

阅读工具按钮颜色：
(•) 跟随阅读进度条
( ) 跟随顶部按钮
( ) 跟随底部按钮
( ) 自定义颜色

每个站点保留：
(•) 最新 1 条
( ) 最近 3 条
```

### 存储建议

使用 `chrome.storage.local`，不要用 sync，避免大量页面记录占用同步配额。

建议 key：

```js
readingPositions: {
  '<normalized-url>': {
    top: 1234,
    range: 9000,
    updatedAt: 1710000000000,
    hostname: 'example.com'
  }
}
```

## v1.9 功能：新增多语言支持

### 产品目标

在 v1.8 已新增西班牙语和日语的基础上，v1.9 继续扩展主要浏览器用户语言覆盖，提升 Chrome Web Store 国际化展示能力。

### 推荐新增语言

v1.9 新增：

- 德语：`de-DE`
- 法语：`fr-FR`
- 葡萄牙语：`pt-BR`
- 繁体中文：`zh-TW`
- 韩语：`ko-KR`
- 意大利语：`it-IT`

### Chrome locale 文件

新增：

```text
_locales/de/messages.json
_locales/fr/messages.json
_locales/pt_BR/messages.json
_locales/zh_TW/messages.json
_locales/ko/messages.json
_locales/it/messages.json
```

### 语言选择器

设置页语言选择应包含：

```text
自动检测
简体中文
繁體中文
English
Español
日本語
Deutsch
Français
Português
한국어
Italiano
```

### 自动检测

语言归一化规则建议：

```text
zh-TW / zh-HK / zh-Hant -> zh-TW
zh-*                    -> zh-CN
en-*                    -> en-US
es-*                    -> es-ES
ja-*                    -> ja-JP
de-*                    -> de-DE
fr-*                    -> fr-FR
pt-*                    -> pt-BR
ko-*                    -> ko-KR
it-*                    -> it-IT
其他                    -> en-US
```

### 必须同步的位置

- 新增 `_locales/*/messages.json`
- `options.js` 中的 `translations`
- `popup.js` 中的 `popupTranslations`
- `options.html` 的语言选择器
- README 中的语言支持说明
- 如商店素材覆盖多语言，可后续补充

## v1.9 功能：建议&反馈模块

### 产品目标

让用户可以在设置页直接提交建议、问题反馈或功能请求，形成比 README 中邮箱地址更易发现的反馈入口。

### 方案评估

#### 方案 A：邮件反馈

通过设置页表单收集用户输入，点击提交后打开 `mailto:` 链接，预填收件人、主题和正文。

优点：

- 不需要后端服务。
- 不需要新增网络权限。
- 隐私风险最低。
- 与当前 README 中的联系邮箱一致。
- Chrome Web Store 审核风险较低。

缺点：

- 不能真正静默“直接发送”，需要用户本地邮件客户端或浏览器处理 `mailto:`。
- 用户没有配置邮件客户端时可能失败。
- 开发者需要在邮箱中人工管理反馈。

#### 方案 B：专门建议管理模块

扩展直接提交到后端 API，开发者在后台管理页面查看反馈。

优点：

- 用户体验更顺畅，可以真正点击提交。
- 开发者可集中查看、分类、统计反馈。
- 可支持状态追踪、标签、回复等高级能力。

缺点：

- 需要后端、数据库、管理后台和部署。
- 需要处理垃圾提交、限流、鉴权和数据备份。
- 扩展需要新增网络请求目标，隐私政策要更新。
- 若收集页面 URL、邮箱等信息，需要更严谨的告知和合规处理。
- 对当前零后端、隐私友好的插件形态来说复杂度偏高。

### v1.9 推荐方案

v1.9 推荐采用“邮件反馈优先”的轻量方案：

- 设置页新增“建议&反馈”分类。
- 用户填写反馈类型、内容、可选联系方式。
- 点击提交后打开预填好的 `mailto:kscj.ty@gmail.com`。
- 同时提供“复制反馈内容”按钮，作为 `mailto` 失败时的备用方案。
- 不自动收集页面 URL；如要附带当前页面信息，必须提供复选框并默认关闭。

专门建议管理模块建议作为后续 v2.x 或独立服务规划，不纳入 v1.9。

### 设置页 UI

```text
建议&反馈
────────────────────────
反馈类型
[ 功能建议 v ]

你的建议
[                                      ]
[                                      ]
[                                      ]

联系方式（可选）
[ your@email.com                      ]

[ ] 附带当前页面 URL 和浏览器语言

[发送邮件] [复制内容]
```

### 邮件内容

建议预填：

```text
To: kscj.ty@gmail.com
Subject: [Page Scroll Master Feedback] 功能建议

反馈类型：
功能建议

反馈内容：
...

联系方式：
...

环境信息：
Extension Version: 1.9.0
Language: zh-CN
Page URL: 用户勾选后才附带
```

### 隐私要求

- 默认不附带当前页面 URL。
- 默认不附带用户邮箱，联系方式由用户主动填写。
- 不保存反馈内容，除非后续明确增加草稿功能。
- README 和隐私政策可补充说明：反馈表单通过用户邮件客户端发送，扩展不会自行上传反馈内容。

## v2.0 功能：智能段落跳转

### 产品目标

为长文档页面提供轻量目录跳转能力。

### 推荐入口

不要常驻显示目录面板。开启后复用 v1.9 引入的「阅读工具按钮」，点击后在同一个菜单中显示目录和段落跳转能力。

```text
┌──────┐
│  ▲   │
└──────┘

┌──────┐
│  ▼   │
└──────┘

  🔖   ← 阅读工具按钮
```

点击后展开：

```text
┌──────────────────┐
│ 页面目录          │
│ Introduction      │
│ Installation      │
│ Configuration     │
│ API Reference     │
└──────────────────┘
```

### 标题解析

默认只抓：

- `h1`
- `h2`

可选：

- `h3`
- `[id]`

`[id]` 噪声很大，默认不要启用。

### 设置页 UI

```text
高级功能
────────────────────────
[ ] 启用智能段落跳转

目录来源：
[x] H1
[x] H2
[ ] H3
[ ] 带 id 的区块

显示方式：
(•) 点击阅读工具按钮后显示

最大目录项：
[ 30 ]

[x] 自动过滤过短标题
[x] 当前章节高亮
```

## 后续暂缓功能

### 自动滚动/演示模式

可作为后续高级功能。需处理：

- 播放/暂停
- 速度调节
- 用户滚轮或触摸时自动暂停
- 输入框聚焦时禁用
- 视频站点和全屏状态

暂不纳入 v1.8。

### 滚动统计热力图

差异化强，但与当前核心定位距离较远。需处理隐私、数据清理、站点统计 UI。暂不建议近期开发。

### 页面 Mini-Map

视觉强，但浏览器页面缩略图实现复杂，受跨域图片、动态内容、性能影响较大。暂不建议近期开发。

## 代码改造建议

### content.js

建议新增或抽取模块化函数，但保持单文件结构也可以：

- `smoothScrollTo(container, targetTop)`
- `getScrollProgress(container)`
- `createProgressBar()`
- `updateProgressBar()`
- `removeProgressBar()`
- `bindProgressToContainer(container)`
- `applyAdvancedSettings()`
- `getIconSvg(direction, iconSet)`

注意：

- 不要破坏现有 `scrollToTop()`、`scrollToBottom()` 外部消息动作名。
- 不要影响 `chrome.runtime.onMessage` 现有行为。
- 站点禁用时应移除按钮和进度条。
- 全屏时应隐藏按钮和进度条。

### options.js

建议：

- 增加 `advancedSettings` 默认值合并函数
- 增加高级功能 UI 读取、预览、保存
- 增加语言归一化函数
- 增加域名列表管理逻辑

### popup.js

建议：

- 语言检测支持 `es`、`ja`
- 翻译对象新增西班牙语、日语
- 保持现有站点启停逻辑不变

### 测试

建议新增：

- `test-progress-bar.js`
- `test-icon-customization.js`
- `test-domain-management.js`
- `test-language-normalization.js`

重点覆盖：

- 旧设置为空时默认值正确
- 进度计算边界：无滚动范围、顶部、底部、中间
- 点击跳转目标值正确
- 纵向进度按钮点击比例正确
- 横向进度条点击比例正确
- 站点启停列表管理不破坏 Popup 逻辑
- 语言自动检测正确回退到英文

## 发布与文案建议

v1.8 README 可描述为：

```text
- 新增高级阅读进度条：支持按钮组内纵向进度按钮，或页面顶部/底部横向进度条
- 新增点击进度条快速跳转到页面任意位置
- 新增按钮图标样式与图标颜色自定义
- 新增设置页网站启用状态管理
- 新增西班牙语和日语界面
```

Chrome Web Store 截图建议优先展示：

- 横向顶部进度条
- 纵向进度按钮
- 设置页高级功能区域
- 图标自定义预览
- 网站列表管理

## 开发顺序建议

1. 抽取 `smoothScrollTo()`，保证现有顶部/底部滚动测试通过。
2. 增加 `advancedSettings` 默认值与存储读写。
3. 实现横向进度条，因为它不影响按钮布局，风险最低。
4. 实现纵向进度按钮，接入按钮尺寸、形状、间距、颜色、透明度。
5. 实现图标样式与颜色自定义。
6. 实现设置页网站启用列表管理。
7. 新增西班牙语和日语。
8. 补测试、更新 README、CHANGELOG 和发布清单。

## 验收标准

v1.8 完成时应满足：

- 高级功能未开启时，页面显示与 v1.7.0 一致。
- 开启横向进度条后，顶部/底部显示正确，点击可跳转。
- 开启纵向进度按钮后，按钮组显示为上按钮、进度按钮、下按钮。
- 纵向进度按钮跟随当前按钮尺寸、形状、间距、颜色和透明度。
- SPA 页面切换后，进度条仍能跟随正确滚动容器。
- 全屏时按钮和进度条都隐藏。
- 站点禁用时按钮和进度条都移除。
- 设置页可管理已保存的站点启停状态。
- 新增语言在 Popup、设置页和扩展基本信息中可用。
- 所有现有测试通过，新增测试覆盖核心新逻辑。
