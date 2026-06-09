# Page Scroll Master Codex Operating Guide

本文件是 Codex 在本仓库工作的项目级入口。它继承上级 `../AGENTS.md` 的通用规则，并补充本项目的架构、实现和验证要求。

## Context Order

开始工作时只读取完成当前任务所需的最小上下文：

1. `git status --short`，先确认用户已有改动和本次写入范围。
2. `README.md`，确认当前功能、版本和项目结构。
3. 与任务直接相关的 `doc/` 规格、实施计划或发布文档。
4. 对应源码及其 `tests/test-*.js` 回归测试。
5. 发布任务再读取 `doc/CHANGELOG.md`、`doc/PUBLISH_CHECKLIST.md` 和 `doc/CHROME_WEB_STORE_PUBLISH_GUIDE.md`。

显式用户要求优先。若旧计划与当前实现冲突，以当前源码、`manifest.json` 和最新变更记录为事实依据，不要照搬过期方案。

## Project Baseline

- Chrome Extension，Manifest V3。
- 使用原生 JavaScript、HTML 和 CSS，无前端框架、无打包器配置、无 `package.json`。
- 根目录文件是源码；`dist/build/` 和发布 ZIP 由 `node build.js` 生成。
- 除非用户明确要求生成可发布 ZIP、准备发布或验证发布包，否则不要运行 `node build.js`，也不要创建或刷新 `dist/` 下的发布产物。
- 扩展匹配 `<all_urls>`，必须保持权限最小化，不引入远程代码或不必要的网络请求。
- 当前设置和页面功能依赖 Chrome Extension API，不能把普通 `file://` 页面表现当作扩展运行结果。

## Ownership Map

- `manifest.json`：版本、权限、内容脚本、后台脚本、快捷键和本地化入口。
- `content.js`：页面运行时真相源；负责 Shadow DOM 注入、滚动容器检测、SPA 适配、按钮、页面进度、阅读工具和书签恢复。
- `options.html`：设置页结构、可见文案、控件范围和 HTML 默认值。
- `options.js`：设置加载/保存/校验、设置页实时预览、站点状态管理、书签管理和 Options 多语言文案。
- `popup.html` / `popup.js`：工具栏弹窗、当前站点启停和 Popup 多语言文案。
- `background.js`：全局快捷键消息转发。
- `_locales/*/messages.json`：Manifest、内容脚本和 Chrome 原生界面的 locale 文案。
- `tests/`：Node + `vm` 模拟环境回归测试，不是扩展运行时资源。
- `build.js`：清理、复制、压缩、产物校验、源码与打包后回归测试、ZIP 生成的统一入口。
- `store-assets/`：Chrome Web Store 截图和宣传图的 SVG 源文件、生成脚本和 PNG 产物。

## Runtime Contracts

### Storage

- `chrome.storage.sync`：`scrollSpeed`、`buttonSettings`、`advancedSettings`、`language`。
- `chrome.storage.local`：按站点启停状态 `enableStates` 和阅读位置 `bookmarks`。
- 未出现在 `enableStates` 中的站点默认启用；不要改变这一兼容语义。
- 新增设置字段必须通过深合并和校验兼容旧用户数据，不能要求用户清空 storage。
- 浏览历史、页面位置等站点数据应留在 `storage.local`，不要迁移到同步存储。

### Defaults And Parity

同一默认值经常同时存在于 `content.js`、`options.js`、`options.html` 和测试夹具中。修改默认值、范围或布局计算时必须同步检查这些位置。

当前基础默认体验应保持：

- 按钮尺寸 `40px`、按钮间距 `8px`、边缘距离 `8px`。
- 页面进度条默认关闭；启用后的默认样式为纵向按钮。
- 纵向进度高度默认 `120px`，范围 `40-400px`。
- 横向进度条默认位于顶部，默认粗细 `4px`。
- 可见术语统一使用“页面进度条”，不要恢复为“阅读进度条”。

设置页预览和真实页面运行时是两条独立实现路径：

- 预览逻辑主要在 `options.js` 的 `updatePreviewButtons()`。
- 真实页面布局、颜色、方向和标签逻辑在 `content.js` 及其 Shadow DOM 样式。
- 视觉不一致时比较两条路径的容器、padding、尺寸和定位计算，修复根因，不只修预览。
- 进度为 `0%` 时，进度按钮应与配置的主按钮颜色一致；产生进度后才显示同色系进度填充。
- 纵向进度方向应与页面滚动方向一致，从上向下增长。

### Scroll And SPA Behavior

- 不要假设 `window` 或 `document.documentElement` 一定是滚动容器。
- 保留 `document.scrollingElement`、候选容器评分和根元素回退逻辑。
- SPA 和延迟出现的 `document.body` 依赖 MutationObserver、重试和按需重新解析滚动容器。
- 修改初始化、清理或事件绑定时，要验证站点禁用、storage 更新、页面卸载和重复初始化不会留下重复 DOM 或监听器。

### Localization

支持的语言必须在以下位置保持一致：

- `options.js` 的 Options 翻译表和 `normalizeLanguage()`。
- `popup.js` 的 Popup 翻译表和 `normalizeLanguage()`。
- `options.html` 的语言选择器。
- `_locales/*/messages.json` 的 Chrome locale key 集合。

新增或重命名用户可见文案时，先判断其归属；Options 内嵌文案、Popup 文案和 Chrome locale 可能需要同时更新。最后运行 `node tests/test-language-normalization.js`。

## Implementation Rules

- 遵循现有原生 JavaScript 风格：2 空格缩进、分号、`camelCase` 命名。
- 优先扩展现有 helper 和数据结构，不为小功能引入框架或依赖。
- 保持改动聚焦；不要顺手格式化大型 HTML、SVG 或翻译表。
- 不回滚或覆盖工作区中非本任务产生的改动。
- 修改页面 UI 时同步考虑 Options 预览、真实注入页面、顶部/底部模式和自定义滚动容器。
- 阅读剩余时间是启发式估算；调整算法或文案时应明确其近似性质，并避免在滚动事件中高频扫描全文。
- 新增 Chrome 权限、外部服务、遥测、远程请求或隐私披露变化前必须先征得用户确认。

## Verification

按改动范围运行最小充分验证：

- Popup 启停：`node tests/test-toggle-state.js`
- 内容脚本启停：`node tests/test-content-enable-state.js`
- 滚动容器：`node tests/test-scroll-container-detection.js`
- SPA 初始化：`node tests/test-spa-loading.js`
- 设置、预览、站点和书签管理：`node tests/test-options-page.js`
- 页面进度和阅读工具：`node tests/test-progress-bar.js`
- 图标：`node tests/test-icon-customization.js`
- 站点管理：`node tests/test-domain-management.js`
- 多语言：`node tests/test-language-normalization.js`

功能、设置、Manifest 或本地化改动完成前，运行与改动范围对应的回归测试，并执行：

```bash
git diff --check
```

不要把 `node build.js` 当作日常修改的默认验证命令。它会重建 `dist/build/`、运行源码和压缩产物回归测试，并生成 `dist/page-scroll-master-v<version>.zip`；只有用户明确要求打包成可发布 ZIP、准备发布或检查发布产物时才运行。`dist/`、ZIP、CRX 和 PEM 均为忽略项，不要提交。

仅修改 Markdown 文档时，可不运行完整构建，但至少检查相关 diff 和 `git diff --check`。

不要直接打开 `options.html` 来判断设置页是否正常；普通页面缺少 `chrome.storage` 等 API。优先使用 `tests/test-options-page.js`，需要视觉验证时加载仓库根目录的未打包扩展。只有用户明确要求使用发布构建或生成 ZIP 时，才刷新并加载 `dist/build/`。

## Release Discipline

发布工作应形成完整闭环：

1. 核对工作区、分支、远端和待发布 diff。
2. 同步 `manifest.json`、`README.md`、`doc/CHANGELOG.md` 及相关商店/隐私文档中的版本和功能描述。
3. 用户明确要求生成发布包后，运行 `node build.js` 和 `git diff --check`。
4. 检查 ZIP 文件名、内容和大小。
5. 只有用户明确要求时才执行提交、打 tag、推送或商店操作。

未收到明确打包要求时，即使功能已完成，也不要为了“完整验证”自动运行 `node build.js` 或生成发布 ZIP。

## Definition Of Done

任务完成需满足：

- 行为在正确的源码职责边界内实现。
- 默认值、存储兼容、Options 预览和真实页面保持一致。
- 相关回归测试通过；只有用户明确要求发布包时，才要求发布改动通过完整构建和 ZIP 校验。
- 未覆盖用户已有改动，未提交生成产物。
- 最终报告明确列出改动文件、验证结果和任何尚未执行的浏览器、完整构建或商店验证；未明确要求时无需生成 ZIP。
