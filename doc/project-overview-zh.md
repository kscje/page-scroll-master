# Page Scroll Master 项目总览

本文档汇总 Page Scroll Master 当前产品形态、技术架构、关键数据边界、验证方式和后续规划入口。除特别注明外，本文以当前源码、`manifest.json`、`README.md` 和 `doc/CHANGELOG.md` 中的 `2.5.5` 状态为准。

## 1. 项目定位

Page Scroll Master 当前对外名称为 **Smart Scroll Navigator - Top, Bottom & Progress**。它是一个 Manifest V3 Chrome 扩展，面向长页面、文档型页面和自定义滚动容器页面，提供快速滚动、页面进度、阅读位置保存、段落导航、自动滚屏和站点级启停控制。

核心价值：

- 快速到达页面顶部、底部、上一屏和下一屏。
- 在普通页面和文档类 SPA 中尽量识别真实滚动容器。
- 通过 Popup 按主域名控制插件和高级功能，降低对无关站点的干扰。
- 通过 Options 页面提供可视化配置、实时预览、站点管理、书签管理、反馈和关于入口。
- 在隐私边界内提供主动反馈和 Chrome Web Store 评分入口。

当前版本：`2.5.5`
最低 Chrome 版本：`90`
扩展架构：Manifest V3、原生 JavaScript / HTML / CSS、内容脚本 + Popup + Options + Service Worker。

## 2. 当前产品功能

### 2.1 基础滚动能力

- 页面浮动按钮：回到顶部、回到底部。
- 快捷键：
  - `Ctrl+Shift+Up` / `Command+Shift+Up`：回到顶部。
  - `Ctrl+Shift+Down` / `Command+Shift+Down`：回到底部。
- 支持立即、浏览器原生顺滑和自定义三种滚动模式；新用户默认立即，自定义动画时长可在 `10ms - 2000ms` 范围内配置。
- 自定义滚动容器检测，兼容 Notion、飞书 Wiki、语雀、钉钉文档等 SPA 或文档类页面。
- 全屏模式下自动隐藏浮动按钮。
- 鼠标悬停 + 指定快捷键隐藏按钮。

### 2.2 按钮外观与布局

默认按钮体验：

- 按钮尺寸：`40px`。
- 按钮间距：`8px`。
- 边缘距离：`8px`。
- 默认按钮颜色：`#4A9EDD`。
- 默认图标颜色：`#FFFFFF`。
- 默认位置：页面右侧、垂直居中。
- 默认形状：圆形。

可配置项：

- 左侧 / 右侧。
- 顶部 / 居中 / 底部。
- 按钮尺寸、形状、间距、透明度。
- 顶部按钮颜色、底部按钮颜色。
- 内置图标样式和图标颜色。

### 2.3 Popup 站点控制

工具栏 Popup 负责当前主域名的控制入口：

- 插件总开关。
- 页面进度条开关。
- 按屏跳转开关。
- 滚动位置书签开关。
- 智能段落跳转开关。
- 自动滚屏开关。
- 设置页入口。
- 满足频控条件后的 Chrome Web Store 评分邀请。

主域名状态按可注册主域名归一化，同一主域名下的不同子域名共享状态。新安装时，未出现在本地状态表中的站点默认启用；用户可在基础设置中改为默认关闭，且手动设置的主域名状态始终优先。

### 2.4 页面进度条

页面进度条默认关闭，启用后支持：

- 纵向按钮模式。
- 页面顶部或底部横向进度条。
- 点击进度条跳转到页面位置。
- 显示百分比。
- 可选剩余阅读时间估算。
- 自定义颜色、横向粗细和纵向高度。

当前运行时默认：

- 模式：纵向按钮。
- 横向位置：顶部。
- 横向粗细：`4px`。
- 纵向高度：`80px`。
- 点击跳转：开启。
- 百分比显示：开启。
- 剩余阅读时间：关闭。

注意：项目级操作指南中记录的基础体验要求为“纵向进度高度默认 `120px`”，但当前 `content.js` 运行时常量为 `80px`。后续调整默认值时，应同时核对 `content.js`、`options.js`、`options.html` 和测试夹具，避免 Options 预览与真实页面不一致。

### 2.5 按屏跳转

按屏跳转默认关闭，启用后提供上一屏和下一屏独立按钮：

- 默认步长为视口或滚动容器可视高度的 `90%`。
- 支持根页面和自定义滚动容器。
- 独立按钮颜色配置。
- 复用主按钮透明度，不维护独立透明度。

### 2.6 滚动位置书签

滚动位置书签默认关闭，启用后提供：

- 独立书签按钮。
- 手动保存当前页面阅读位置。
- 再次打开页面时支持自动加载、提示恢复或手动加载。
- 设置页中查看、打开和删除已保存位置。
- 每域名保留最近 `1`、`2` 或 `3` 条记录。
- 全局最多保留 `300` 条记录。

书签内容存储在 `chrome.storage.local`，不会同步到其他设备。

### 2.7 智能段落跳转

智能段落跳转默认关闭，启用后提供：

- 独立目录按钮。
- 页面目录菜单。
- 上一段、下一段跳转。
- 当前章节高亮。
- 默认解析 `h1` / `h2`，可选 `h3` 和带 `id` 的区块。
- 过滤不可见内容、语义噪声、短标题和相邻重复标题。
- 支持 SPA 路由变化和动态 DOM 变化后的目录快照重建。

目录标题和页面结构仅在当前页面内存中处理，不写入 storage，也不发送到远程服务。

### 2.8 自动滚屏

自动滚屏默认关闭，启用后提供：

- 独立播放 / 暂停按钮。
- 稳定像素速度向下滚动。
- 预设速度和自定义速度。
- 在用户滚动、选中文字、编辑输入、标签页隐藏、全屏或主要视频播放时智能暂停。

自动滚屏运行时依赖 `requestAnimationFrame`，停止或关闭时需要取消活动动画帧。

### 2.9 Options 设置页

设置页负责全局配置、实时预览和管理入口：

- 滚动模式和自定义动画时长。
- 按钮位置、尺寸、形状、间距、颜色、透明度。
- 悬停隐藏和快捷键。
- 页面进度条详细参数。
- 按屏跳转详细参数。
- 滚动位置书签详细参数和已保存位置管理。
- 智能段落跳转详细参数。
- 自动滚屏详细参数。
- 按钮图标自定义。
- 主域名启停状态管理。
- 建议与反馈表单。
- 关于插件、版本、联系信息和商店评分入口。
- 多语言界面选择。

Options 页面依赖 Chrome Extension API，不应直接把普通 `file://` 打开结果当作真实运行结果。

### 2.10 多语言

当前 README 记录的界面语言包括：

- 简体中文。
- 繁体中文。
- 英文。
- 西班牙语。
- 日语。
- 德语。
- 法语。
- 葡萄牙语。
- 韩语。
- 意大利语。
- 俄语。
- 土耳其语。
- 印度尼西亚语。

多语言相关位置需要保持一致：

- `options.js` 的 Options 翻译表和语言归一化。
- `popup.js` 的 Popup 翻译表和语言归一化。
- `options.html` 的语言选择器。
- `_locales/*/messages.json` 的 Chrome locale key。

## 3. 技术架构

### 3.1 总体结构

```text
manifest.json
  ├─ content_scripts
  │   ├─ vendor/tldts.umd.min.js
  │   ├─ domain-utils.js
  │   └─ content.js
  ├─ action.default_popup
  │   ├─ popup.html
  │   ├─ popup.js
  │   └─ rating.js
  ├─ options_ui
  │   ├─ options.html
  │   ├─ options.js
  │   ├─ feedback.js
  │   └─ rating.js
  └─ background.service_worker
      └─ background.js
```

### 3.2 主要模块职责

- `manifest.json`：扩展元信息、权限、内容脚本、后台脚本、快捷键、Options 和 Popup 入口。
- `content.js`：页面运行时真相源，负责 Shadow DOM 注入、滚动容器检测、按钮渲染、进度条、按屏跳转、书签恢复、目录导航、自动滚屏、SPA 适配和运行时清理。
- `domain-utils.js`：主域名归一化、站点状态结构、旧 `enableStates` 迁移和高级功能启停状态归一化。
- `popup.html` / `popup.js`：工具栏弹窗，负责当前主域名总开关、高级功能开关、设置入口、评分邀请和内容脚本通知。
- `options.html` / `options.js`：设置页结构、配置加载保存、表单校验、实时预览、站点管理、书签管理、反馈入口、多语言文案和关于模块。
- `background.js`：MV3 Service Worker，负责全局快捷键消息转发、安装生命周期和旧统计数据清理。
- `feedback.js`：反馈表单客户端校验、图片类型和大小限制、反馈端点配置。
- `rating.js`：评分邀请频控状态、商店评分 URL、Popup 展示条件和用户操作记录。
- `_locales/`：Manifest、内容脚本和 Chrome 原生界面的本地化文案。
- `tests/`：Node + `vm` 模拟环境回归测试。
- `build.js`：发布包生成入口，负责复制白名单文件、压缩、产物校验、源码和压缩产物回归测试、ZIP 生成。
- `chrome-web-store/`：商店文案、隐私政策、发布清单、发布指南、最终素材和素材生成工具。
- `feedback-backend/`：反馈转发 Cloudflare Worker。

### 3.3 页面运行时设计

`content.js` 是真实页面行为的核心：

- 通过 Shadow DOM 隔离按钮和工具 UI。
- 初始化前先读取站点总开关和高级功能开关。
- 站点关闭时不创建页面按钮和高级功能 DOM。
- 高级功能关闭时不应创建对应功能的 DOM、监听器、Observer、定时器或动画帧。
- 滚动容器优先使用 `document.scrollingElement`，再对候选容器评分，最后回退根元素。
- SPA 页面通过延迟初始化、MutationObserver、防抖和重试处理延迟挂载的 `document.body`、动态内容和容器替换。
- 滚动相关能力应复用同一个容器坐标体系，避免进度、书签、目录和自动滚屏在自定义滚动容器中错位。

### 3.4 设置页与运行时的双路径

设置页预览和真实页面注入是两条独立路径：

- 预览逻辑主要在 `options.js` 的预览更新流程。
- 真实页面逻辑在 `content.js` 的 Shadow DOM、样式和滚动容器计算。

修改按钮尺寸、间距、颜色、默认值、进度条布局或阅读工具位置时，需要同步核对：

- HTML 默认值。
- Options 保存和校验。
- Options 实时预览。
- `content.js` 运行时默认值和布局计算。
- 对应 `tests/test-*.js` 夹具。

## 4. 存储与数据边界

### 4.1 `chrome.storage.sync`

同步存储保存跨设备配置：

- `scrollMode`：滚动模式，支持立即、浏览器原生顺滑和自定义动画；新用户默认立即，缺少该字段的历史配置按自定义模式兼容。
- `scrollSpeed`：自定义滚动动画时长，范围为 `10ms - 2000ms`；切换到其他模式时继续保留该值。
- `buttonSettings`：按钮位置、尺寸、形状、颜色、透明度、隐藏快捷键等。
- `advancedSettings`：页面进度条、按屏跳转、书签、目录、自动滚屏、图标等详细参数。
- `language`：界面语言。

新增同步设置字段时必须深合并旧数据并做类型校验，不能要求用户清空 storage。

### 4.2 `chrome.storage.local`

本地存储保存与当前设备或站点相关的数据：

- `domainFeatureStates`：按主域名保存插件总开关和高级功能开关。
- `domainFeatureDefaults`：主域名状态默认值。
- `domainFeatureMigrationVersion`：站点状态迁移版本。
- `enableStates`：旧版站点启停状态，迁移时保留兼容。
- `bookmarks`：滚动位置书签。
- `pendingScrollBookmarkRestore`：从设置页打开书签位置后的待恢复状态。
- `ratingPromptState`：评分邀请本地频控状态。

浏览历史、页面位置、站点状态、评分邀请状态和统计队列都留在本地存储，不进入同步存储。

### 4.3 权限与远程端点

Manifest 当前声明：

- `permissions`：`storage`、`activeTab`。
- `optional_host_permissions`：
  - `https://page-scroll-master-feedback.kscje-apps.workers.dev/*`

远程能力均为用户主动或主动同意后触发：

- 反馈仅在用户点击提交后发送反馈类型、正文、可选联系方式和最多 3 张图片。
- 评分入口只打开 Chrome Web Store 页面，不读取用户是否完成评分。

禁止在未确认前新增 Chrome 权限、远程服务、遥测字段或隐私披露变化。

## 5. 构建、发布与验证

### 5.1 构建方式

项目源码位于仓库根目录。`dist/build/` 和发布 ZIP 由 `node build.js` 生成。

当前工作区存在 `package.json`，其脚本为：

```json
{
  "scripts": {
    "build": "node build.js"
  }
}
```

但项目发布事实仍以 `build.js` 为统一入口。日常功能或文档修改不应默认运行 `node build.js`，除非任务明确要求生成发布包、准备发布或检查发布产物。

### 5.2 回归测试

按改动范围选择最小充分测试：

- Popup 启停：`node tests/test-toggle-state.js`
- 内容脚本启停：`node tests/test-content-enable-state.js`
- 滚动容器：`node tests/test-scroll-container-detection.js`
- SPA 初始化：`node tests/test-spa-loading.js`
- 设置、预览、站点和书签管理：`node tests/test-options-page.js`
- 页面进度和阅读工具：`node tests/test-progress-bar.js`
- 按屏跳转：`node tests/test-screen-navigation.js`
- 自动滚屏：`node tests/test-auto-scroll.js`
- 智能段落跳转：`node tests/test-outline-navigation.js`
- 图标：`node tests/test-icon-customization.js`
- 站点管理：`node tests/test-domain-management.js`
- 多语言：`node tests/test-language-normalization.js`
- 后台生命周期：`node tests/test-background-lifecycle.js`
- 安装生命周期：`node tests/test-background-install-lifecycle.js`
- 反馈：`node tests/test-feedback-*.js`

功能、设置、Manifest 或本地化改动完成前，应运行相关测试并执行：

```bash
git diff --check
```

仅修改 Markdown 文档时，可不运行完整构建，但至少检查相关 diff 和 `git diff --check`。

### 5.3 发布资料

发布相关资料集中在：

- `doc/CHANGELOG.md`
- `chrome-web-store/listing-content.md`
- `chrome-web-store/privacy/*.md`
- `chrome-web-store/publish-checklist.md`
- `chrome-web-store/publish-guide.md`
- `chrome-web-store/assets/`
- `chrome-web-store/tools/`

发布任务应同步版本号、功能描述、隐私披露和商店素材，并且只有在用户明确要求时才生成 ZIP、提交、打 tag、推送或执行商店操作。

## 6. 当前规划入口

### 6.1 v2.5 已完成方向

`2.5.0` 主要聚焦：

- 设置页高级功能按模块折叠，降低首次进入设置页的认知负担。
- 恢复默认入口，可恢复基础按钮、单个高级模块或全部同步设置。
- 未启用功能零开销检查，避免默认关闭或主域名关闭时残留 DOM、监听器、Observer、timer 或 RAF。
- 统一滚动动画取消逻辑，减少顶部、底部、按屏、进度条、书签和目录跳转之间的竞争。
- 优化长页面平滑滚动位移保护和动态到底部目标刷新。

### 6.2 后续规划方向

后续规划仍以 `doc/product-requirements-pool-zh.md` 和新版本产品规划为准。已从 v2.5 必做范围移出的“简洁模式 / 完整模式”和新增语种支持仍属于需求池，不应在 README、CHANGELOG、商店文案或发布清单中宣称已实现。

## 7. 维护注意事项

- 修改默认值时，同步检查 `content.js`、`options.js`、`options.html` 和测试夹具。
- 修改页面 UI 时，同时核对 Options 预览和真实页面 Shadow DOM。
- 修改站点启停、初始化、storage 更新或卸载逻辑时，验证不会留下重复 DOM、重复监听器、重复 Observer 或未取消动画帧。
- 修改语言、文案或 locale key 时，运行 `node tests/test-language-normalization.js`。
- 修改隐私、统计、反馈或权限时，同步更新隐私政策和商店资料，并先确认新增数据边界。
- 不要把普通 `file://` 页面表现当作扩展运行结果；视觉或运行时验收应加载未打包扩展。
- `dist/`、ZIP、CRX 和 PEM 是生成产物或敏感产物，不应提交。
