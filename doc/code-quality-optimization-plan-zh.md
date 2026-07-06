# 代码质量优化方案

本文档基于当前功能现状、README、项目级运行约束和代码质量评估反馈整理。目标是先确认可采纳的优化边界和执行顺序；在用户确认前，不进入代码实现。

## 背景

当前项目是 Manifest V3 Chrome 扩展，根目录文件即源码，无前端框架、无打包器配置、无 `package.json`。核心能力包括页面顶部/底部跳转、页面进度条、滚动位置书签、智能段落跳转、自动滚屏、站点级启停、设置页实时预览、匿名统计、反馈入口和 13 语言界面。

本次评估反馈整体方向合理：主要技术债集中在内容脚本与设置页体量较大、本地化覆盖缺口、滚动路径性能隐患、默认值多处复制、错误处理和少量遗留文件。需要调整的是严重级别：部分反馈属于高价值维护性优化，不应全部按 Critical 处理。

## 当前实施状态

- 用户已确认开始开发。
- 批次 1（P0 小闭环）已实施：Toast DOM 安全、保存失败反馈、阅读工具/书签/大纲文案本地化。
- 批次 2（P1 健壮性与性能）已实施：storage lastError helper、滚动容器隐藏候选延迟探测、阅读剩余时间缓存失效路径。
- 批次 3（P2 一致性与清理）已实施：默认值 parity 测试、删除未引用的 `icon-manager.js`、`build.js` 跳过已压缩 vendor 二次压缩。
- 批次 4（P3 结构拆分）已实施：拆分 `updatePreviewButtons()` 的读取/布局/应用 helper，并将内容脚本 Shadow DOM 样式拆为内部样式片段 helper。
- 当前计划内批次已完成；后续只在新需求或单独确认后继续。

## 优化原则

- 保持现有原生 JavaScript、HTML、CSS 架构，不引入框架、构建器或远程代码。
- 不改变现有存储兼容语义：未出现在站点状态中的站点默认启用；站点数据仍留在 `chrome.storage.local`。
- 不改变用户已确认的基础默认体验：按钮尺寸 `40px`、按钮间距 `8px`、边缘距离 `8px`、页面进度条默认关闭。
- 优先修复真实用户可感知问题和低风险安全/健壮性问题，再做结构性重构。
- 对滚动容器、页面进度条、书签和大纲相关修改，必须同时考虑真实页面运行时与设置页预览。
- 非发布任务不运行 `node build.js`，不刷新 `dist/`，只运行与改动范围对应的回归测试和 `git diff --check`。

## 执行总览

| 阶段 | 优先级 | 主题 | 是否建议采纳 | 目标 |
| --- | --- | --- | --- | --- |
| P0 | 最高 | Toast DOM 安全、保存失败反馈、本地化缺口 | 已实施 | 关闭低成本风险，修复明确用户体验问题 |
| P1 | 高 | `chrome.storage` 错误处理、滚动路径性能热点 | 采纳/谨慎采纳 | 提升异常可观测性和复杂页面体验 |
| P2 | 中 | 默认值 parity、遗留文件、构建脚本清理 | 采纳 | 降低未来改默认值和发布验证风险 |
| P3 | 中低 | 大函数拆分、样式组织、设置页重复逻辑 | 分批采纳 | 改善维护性，避免一次性大重构 |
| P4 | 低 | 跨平台构建、微优化、文档漂移 | 视实际需要采纳 | 清理边缘问题，不抢占关键修复 |

## P0：用户可感知与低风险安全修复

### 1. 替换 `showReadingToast` 的 `innerHTML` 拼接

现状：`content.js` 中 `showReadingToast()` 用字符串拼接按钮 HTML，并把 `action.label` 写入 `innerHTML`。当前调用方主要传内部字符串，暂未构成实际漏洞，但这是不必要的注入面。

方案：

- 使用 `document.createElement('span')`、`document.createElement('button')` 构建 toast 内容。
- 按钮文案一律使用 `textContent`。
- 保留现有 `data-action-index` 或直接闭包绑定 action handler。

验收：

- toast 文案和按钮行为与现有一致。
- 恢复书签提示、保存成功提示仍正常显示和关闭。
- 运行 `node tests/test-progress-bar.js`，如覆盖不足则补充最小断言。

### 2. 保存设置校验失败时给出明确反馈

现状：`options.js` 中 `saveSettings()` 遇到按钮尺寸、间距、边缘距离、纵向进度高度或大纲批量数量非法时直接 `return`，用户点击保存后没有反馈。

方案：

- 复用现有错误元素：`sizeError`、`spacingError`、`edgeDistanceError`、`outlineMaxItemsError`。
- 为 `progressVerticalHeight` 增加或复用对应错误提示。
- 校验失败时显示本地化错误、聚焦对应输入，并阻止保存。
- 不改变合法输入的保存逻辑。

验收：

- 非法值保存时能看到错误提示，合法值保存后提示成功。
- 设置页预览仍随输入实时更新。
- 运行 `node tests/test-options-page.js`。

### 3. 阅读工具、书签和大纲菜单文案本地化

现状：README 宣称 13 语言界面，但 `content.js` 中滚动位置书签、智能段落跳转、页面目录、上一段、下一段、未检测到可跳转标题、保存/恢复提示等多处文案仍硬编码中文。

方案：

- 在 `_locales/*/messages.json` 增加 content script 使用的 message key。
- 在 `content.js` 增加轻量 `getMessage(key, fallback)` helper。
- 中文 fallback 可以保留为兜底，但正常路径应来自 `chrome.i18n.getMessage()`。
- 术语保持“页面进度条”，不恢复为“阅读进度条”。

验收：

- `_locales` key 集合保持一致。
- 非中文环境不再显示中文菜单文案。
- 运行 `node tests/test-language-normalization.js` 和相关内容脚本测试。

## P1：健壮性与性能

### 4. 封装 Chrome storage 安全访问

现状：`content.js`、`options.js`、`popup.js`、`rating.js` 等多处 storage 回调未统一检查 `chrome.runtime.lastError`。通常不影响正常路径，但在扩展更新、storage 配额异常、上下文失效时会静默失败或访问 `undefined`。

方案：

- 优先在本次触及的文件内引入小范围 helper，不急于全仓库大迁移。
- `get` 回调对 `result` 使用 `{}` 兜底。
- `set/remove` 失败时记录统一前缀日志，并避免误报保存成功。
- 对用户操作路径，如设置保存、评分偏好、站点启停，优先处理。

验收：

- 正常路径行为不变。
- 模拟 `chrome.runtime.lastError` 的测试能覆盖降级逻辑。
- 按范围运行 `test-options-page.js`、`test-toggle-state.js`、`test-content-enable-state.js`。

### 5. 优化滚动容器检测的探测式滚动

现状：`canScrollVertically()` 会对 `overflow:hidden` 等候选元素执行 `scrollTop` 写入探测。复杂 SPA 页面候选多时，可能造成强制布局和初始化卡顿。

采纳边界：

- 不建议简单给全量候选加固定 `.slice(0, 80)`，这可能破坏飞书 Wiki、Notion、语雀等复杂页面的滚动容器识别。
- 应保留 `document.scrollingElement`、候选容器评分和根元素回退逻辑。

方案：

- 先用只读条件过滤候选：`scrollHeight > clientHeight`、尺寸、可见性、overflow。
- 仅对最终少量高分候选执行 `scrollTop` 探测。
- 为候选数量和探测次数增加测试可观察计数，防止性能优化破坏识别准确性。

验收：

- 自定义滚动容器 fixture 仍能识别正确容器。
- `overflow:hidden` 但可程序滚动的容器仍被支持。
- 运行 `node tests/test-scroll-container-detection.js` 和 `node tests/test-spa-loading.js`。

### 6. 降低阅读剩余时间对滚动路径的影响

现状：剩余阅读时间默认关闭，但启用后 `getReadingText()` 可能在滚动更新链路中读取 `innerText`，长文档上可能触发布局计算。

方案：

- 保留“阅读剩余时间是估算”的产品定位。
- 将全文长度估算从高频滚动路径中移出，优先在启用、页面稳定或缓存失效后的低频路径中计算。
- 可评估用 `textContent` 作为近似来源，但需确认 CJK/Latin 混合估算仍可接受。

验收：

- 开启剩余阅读时间后滚动标签仍能更新。
- 关闭该功能时不做文本扫描。
- 运行 `node tests/test-progress-bar.js`。

## P2：一致性与仓库清理

### 7. 增加默认值 parity 测试

现状：默认值和范围散落在 `content.js`、`options.js`、`options.html` 和测试夹具中。当前代码里纵向进度高度实际为 `80px`，与部分项目级说明中的 `120px` 存在漂移，不能直接改代码，需要先确认产品基线。

方案：

- 第一阶段只增加 parity 测试，断言关键默认值和范围一致。
- 当前以源码和测试事实为准：按钮尺寸 `40`、间距 `8`、边缘距离 `8`、页面进度条默认关闭、纵向高度 `80`。
- 如果产品确认纵向高度应改为 `120`，再单独同步修改源码、HTML 默认值、测试和文档。

验收：

- 新测试能在默认值不一致时失败。
- 不改变现有用户默认体验。
- 运行 `node tests/test-options-page.js` 和新增 parity 测试。

实施状态：已完成。新增 `tests/test-default-parity.js`，按当前源码事实锁定按钮尺寸 `40`、间距 `8`、边缘距离 `8`、页面进度条默认关闭、纵向高度 `80`、纵向高度范围 `40-400`。

### 8. 删除或归档 `icon-manager.js`

现状：`icon-manager.js` 未被 manifest、HTML、build.js 或运行时代码引用，且内部动态图标实现不符合 `chrome.action.setIcon({ imageData })` 的实际参数要求。

方案：

- 如无后续计划，删除 `icon-manager.js`。
- 同步清理文档中对该文件的描述，避免维护者误判它是运行时模块。
- 不影响当前“按钮图标样式与图标颜色自定义”，该功能位于内容脚本/设置页路径。

验收：

- `rg "icon-manager|IconManager"` 仅剩历史记录或无结果。
- `node build.js` 不作为日常验证运行；若后续发布时再执行完整构建。

实施状态：已完成。已确认该文件未被 manifest、HTML、build.js 或运行时代码引用，并删除 `icon-manager.js`。

### 9. 跳过已压缩第三方 vendor 文件的二次压缩

现状：`build.js` 会对 `vendor/tldts.umd.min.js` 也执行 JS 压缩。如果本机安装了 Terser，会对已压缩第三方库再次 `--compress --mangle`，存在不必要风险。

方案：

- 在 `build.js` 中维护 `SKIP_MINIFY_FILES` 或按 `.min.js` 跳过。
- 保留 vendor 文件复制和许可证复制。

验收：

- 构建逻辑仍复制 vendor 文件。
- 发布验证时再运行 `node build.js`。

实施状态：已完成。`build.js` 保留 `vendor/tldts.umd.min.js` 复制，并在压缩阶段跳过该文件和其他 `.min.js` 文件。

## P3：结构性维护优化

### 10. 分批拆分超长函数

候选：

- `content.js`：`mergeAdvancedSettings()`、`setupHoverHideFunctionality()`、`addButtonStyles()`。
- `options.js`：`updatePreviewButtons()`、数值输入校验绑定。

方案：

- 不进行一次性大重构。
- 每次只拆一个职责边界，并用现有测试锁住行为。
- 优先拆“无业务语义变化”的 helper，例如数值校验、颜色校验、预览位置计算。

验收：

- 每次拆分前后相关测试一致通过。
- 不改变设置项默认值、预览位置或真实注入页面位置。

实施状态：已完成。`updatePreviewButtons()` 保留原入口，拆出预览元素读取、设置读取、布局计算、DOM 应用和 hover 样式 helper。

### 11. 样式组织优化

现状：`content.js` 内联大量 Shadow DOM CSS，维护成本高，但它也保证了扩展注入的自包含性。

方案：

- 第一阶段不直接外置为 CSS 文件。
- 先拆成 `getBaseButtonStyles()`、`getProgressStyles()`、`getReadingToolStyles()` 等字符串常量函数。
- 若后续确认外置 CSS，不使用远程资源，只使用扩展内资源，并评估 `web_accessible_resources` 和加载时序。

验收：

- Shadow DOM 样式注入结果不变。
- 进度条顶部/底部、纵向按钮、书签/大纲菜单显示一致。
- 运行 `node tests/test-progress-bar.js` 和 `node tests/test-options-page.js`。

实施状态：已完成。未外置 CSS，仍通过同一个 Shadow DOM `<style>` 注入；仅拆为基础按钮、进度条、阅读工具和隐藏交互样式片段。

## P4：低优先级与暂缓项

### 12. Windows 构建兼容

当前发布和验证环境以 macOS/Unix 命令为主，`zip`、`unzip`、`find` 依赖不是当前最高风险。若未来需要 Windows 本地发布，再改为 Node 原生 ZIP 库或跨平台实现。

### 13. `checkVisibility()` 替代可见性遍历

可以作为性能优化方向，但不能未经验证直接替换。需确认目标 Chrome 版本、不同页面隐藏方式和测试覆盖，再决定是否采用。

### 14. 顶层 IIFE 和微优化

内容脚本运行在隔离世界，顶层 `const`/`let` 的实际风险有限。`isMac()` 缓存、魔法数字命名、`Date.now()`/`performance.now()` 区分等可以在相关函数改动时顺手处理，不单独占用高优先级开发窗口。

### 15. Worker observability 与 analytics 限流

analytics worker 的公开写入端点应增加限流，建议采纳。`observability enabled = false` 是否开启取决于 Cloudflare 费用、日志保留和隐私策略，不应只因代码质量报告直接开启。

## 建议开发批次

### 批次 1：P0 小闭环

范围：

- `content.js` toast DOM 安全。
- `options.js` 保存失败反馈。
- `content.js` 阅读工具文案本地化及 `_locales` key 补齐。

验证：

- `node tests/test-options-page.js`
- `node tests/test-progress-bar.js`
- `node tests/test-language-normalization.js`
- `git diff --check`

### 批次 2：健壮性与性能

范围：

- storage lastError helper。
- 滚动容器探测优化。
- 阅读剩余时间缓存路径优化。

验证：

- `node tests/test-content-enable-state.js`
- `node tests/test-scroll-container-detection.js`
- `node tests/test-spa-loading.js`
- `node tests/test-progress-bar.js`
- `node tests/test-options-page.js`
- `git diff --check`

### 批次 3：一致性与清理

范围：

- 默认值 parity 测试。
- `icon-manager.js` 删除或归档。
- `build.js` 跳过 vendor 二次压缩。

验证：

- `node tests/test-options-page.js`
- 新增 parity 测试
- `git diff --check`
- 如用户明确要求发布验证，再运行 `node build.js`

### 批次 4：结构拆分

范围：

- 拆 `updatePreviewButtons()`。
- 拆内容脚本样式字符串。
- 抽通用数值/颜色校验 helper。

验证：

- 按触及范围运行设置页、进度条、图标、滚动容器相关测试。
- `git diff --check`

## 暂不执行项

- 不直接运行 `node build.js`。
- 不生成或刷新 `dist/`。
- 不提交、不打 tag、不推送。
- 不更改 Chrome 权限、远程端点、遥测字段或隐私披露。
- 不把 `80px` 纵向进度高度直接改为 `120px`，除非先确认产品基线。

## 确认问题

开发前建议确认以下三点：

1. 纵向页面进度高度的产品默认值以当前代码 `80px` 为准，还是改回项目说明中的 `120px`？
2. `icon-manager.js` 是否确认无后续计划，可以删除？
3. 当前四个批次已完成，后续是否进入新的单项优化或发布验证？
