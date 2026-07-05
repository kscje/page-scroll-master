# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.5.2] - 2026-07-05

### Changed
- ✅ 优化性能

## [2.5.1] - 2026-06-30

### Fixed
- ✅ 修复从旧版本升级后，旧的页面进度条等高级功能启用状态可能被迁移为新域名默认开启的问题
- ✅ 修复已迁移到 v2.5 的用户在新域名中仍可能继承错误高级功能默认开启状态的问题
- ✅ 改进隐藏但可编程滚动的虚拟化页面兼容性，减少页面底部跳转无响应或误选滚动容器的问题

## [2.5.0] - 2026-06-20

### Changed
- ✅ 设置页高级功能按模块折叠，降低首次进入设置页的认知负担
- ✅ 优化恢复默认入口，支持恢复基础按钮、单个高级模块或全部同步设置默认值
- ✅ 统一顶部、底部、按屏、进度条、书签和目录跳转的滚动动画取消逻辑
- ✅ 优化长页面平滑滚动的单帧位移保护和动态到底部目标刷新
- ✅ 补齐未启用高级功能、重复启停和滚动动画竞争的回归测试

### Fixed
- ✅ 修复多个跳转入口连续触发时旧动画完成回调仍可能影响后续状态的问题
- ✅ 修复部分动态内容页面回到底部时旧目标高度失效导致的收敛不准确问题
- ✅ 修复部分 SPA 或聊天类页面切换内容后，按钮可能误滚动侧边栏或短暂失效的问题

## [2.4.0] - 2026-06-18

### Changed
- ✅ 调整插件的默认参数设定
- ✅ 优化域名管理列表

## [2.3.0] - 2026-06-16

### Added
- ✅ 新增自动滚屏播放，支持以稳定像素速度连续向下滚动
- ✅ 新增自动滚屏独立按钮、Popup 主域名启停和设置页速度/暂停规则配置
- ✅ 自动滚屏支持用户滚动、选中文字、编辑输入、标签页隐藏、全屏和主要视频播放时智能暂停
- ✅ 新增俄语、土耳其语和印度尼西亚语界面支持，语言总数扩展到 13 种

### Changed
- ✅ 设置页预览、域名状态管理、快速开始和更新记录同步展示自动滚屏
- ✅ 发布构建白名单纳入 `_locales/ru`、`_locales/tr` 和 `_locales/id`

## [2.2.0] - 2026-06-15

### Added
- ✅ 新增设置页全局快捷键展示，并提供 Chrome 快捷键管理入口
- ✅ 新增上一屏和下一屏跳转，支持根页面和自定义滚动容器
- ✅ 新增上一屏和下一屏独立按钮颜色、专用图标及按主域名启停
- ✅ 新增扩展内建议与反馈服务，支持可选联系方式和最多 3 张图片

### Changed
- ✅ 上一屏和下一屏按钮复用主按钮透明度，不再维护独立透明度
- ✅ 滚动位置书签和智能段落跳转的“上/下按钮之间”迁移为“页面中部”
- ✅ 页面中部阅读工具统一排列在“回到底部”按钮之后
- ✅ 设置页滑块、复选框和反馈图片选择控件视觉与可访问性优化

### Security
- ✅ 反馈服务使用固定可选主机权限，并在提交结束后撤销
- ✅ 反馈表单不读取页面 URL 或浏览器语言，服务端不保存正文、联系方式或图片

## [2.1.0] - 2026-06-13

### Added
- ✅ 新增按主域名控制插件总开关、页面进度条、滚动位置书签和智能段落跳转
- ✅ 新安装后自动打开设置页，并提供可关闭、可重新查看的快速开始引导
- ✅ 设置页新增本地多语言更新记录，展示 `v1.8.0` 以来的主要变化
- ✅ 新增默认关闭的匿名使用统计，经用户主动同意后仅发送区间化设置和 UTC 日级聚合操作次数
- ✅ 新增固定统计端点、可选主机与 `alarms` 权限、六小时批量上传和有界重试

### Changed
- ✅ 设置页高级功能区域只保留详细参数，三项高级功能的启用入口统一迁移到 Popup
- ✅ 站点状态统一按可注册主域名保存在 `chrome.storage.local`，同一主域名下的子域名共享状态
- ✅ 域名管理升级为插件和三项高级功能的统一状态列表
- ✅ 隐私政策和发布资料同步说明匿名统计的数据边界、权限、保留期和退出方式

### Fixed
- ✅ 旧版 `enableStates` 和高级功能启用设置迁移时保留已有行为
- ✅ 重复切换主域名状态时避免残留重复 DOM、滚动监听器或目录快照

## [2.0.0] - 2026-06-07

### Added
- ✅ 新增智能段落跳转，默认关闭，开启后通过独立目录按钮展示页面目录、上一段、下一段和当前章节高亮
- ✅ 新增主要滚动容器内的目录解析，默认收录 `h1/h2`，可选 `h3` 和带 `id` 的区块
- ✅ 新增语义噪声、可见性、短标题和相邻重复标题过滤，减少导航、页脚、侧栏和隐藏内容误收
- ✅ 新增目录点击跳转和相邻段落跳转，兼容根页面和自定义滚动容器坐标体系
- ✅ 新增 SPA 路由变化、动态 DOM 变化和目录设置变化后的目录快照失效与重建
- ✅ 新增智能段落跳转设置项：目录来源、最大目录项、短标题过滤和当前章节高亮
- ✅ 新增智能段落跳转回归测试，覆盖解析、过滤、截断、跳转、边界状态、设置刷新和生命周期

### Changed
- ✅ 滚动位置书签和智能段落跳转拆分为两个独立高级功能模块，各自拥有独立按钮、菜单和设置项
- ✅ 滚动位置书签新增页面再次打开时的加载方式，可选择自动加载到最新书签位置、仅提示恢复或手动加载
- ✅ 滚动位置书签菜单移除“查看已保存位置”，每域名保留数量新增“最近 2 条”
- ✅ 滚动位置书签和智能段落跳转的按钮颜色移除“跟随页面进度条”，默认改为跟随顶部按钮
- ✅ 隐私文档补充说明：目录标题和页面结构只在当前页面内存中处理，不写入存储，也不发送到远程服务

### Fixed
- ✅ 修复重新打开已保存页面后缺少手动恢复入口的问题，书签菜单现可直接加载当前页面的已保存位置
- ✅ 修复设置页“已保存位置”点击打开后停留在页面顶部的问题，新标签页会自动加载所选记录的保存位置

## [1.9.0] - 2026-06-05

### Added
- ✅ 新增滚动位置书签按钮，默认关闭，开启后可手动保存当前滚动位置
- ✅ 新增滚动位置书签：再次打开同一页面时显示恢复提示，不自动跳转
- ✅ 新增已保存位置管理列表，支持打开和删除保存的阅读位置
- ✅ 新增滚动位置存储上限：默认每域名最近 1 条，可选最近 3 条，全局最多 300 条
- ✅ 新增德语、法语、葡萄牙语、繁体中文、韩语和意大利语界面支持
- ✅ 自动语言检测扩展到 `zh-HK`、`zh-Hant`、`de*`、`fr*`、`pt*`、`ko*` 和 `it*`
- ✅ 新增 6 个 Chrome locale 文件，并补充 locale key 对齐测试

## [1.8.0] - 2026-05-31

### Added
- ✅ 新增高级阅读进度条：支持按钮组内纵向进度按钮和页面顶部/底部横向进度条
- ✅ 新增点击进度条跳转能力，并支持百分比显示、颜色模式、横向粗细和纵向高度配置
- ✅ 新增按钮图标自定义：内置默认箭头、三角形、折线箭头、极简箭头、双箭头 5 套 SVG 图标
- ✅ 新增图标颜色自定义，并预留未来自定义图标上传的数据结构
- ✅ 新增设置页网站启用状态管理，复用 `enableStates`，支持搜索、添加、删除、切换、清除已关闭站点和恢复全部启用
- ✅ 新增西班牙语和日语界面支持，自动语言检测扩展到 `zh*`、`es*`、`ja*`
- ✅ 新增进度条、图标自定义、网站管理和语言规范化测试

### Changed
- ✅ 更新扩展显示名为 `Smart Scroll Navigator – Top, Bottom & Progress`，并同步中文、西班牙语和日语名称
- ✅ 抽取通用 `smoothScrollTo()`，顶部/底部按钮和进度条点击跳转统一复用现有滚动容器逻辑
- ✅ 构建回归测试纳入 v1.8 新增测试

## [1.7.0] - 2026-05-19

### Changed
- ✅ 更新 Chrome Web Store 发布显示名：英文为 `One Click Top & Bottom – Fast Page Scroll`
- ✅ 更新中文发布显示名：`一键顶部/底部滚动`
- ✅ 同步发布检查清单、商店发布指南和商店截图素材中的插件名称

## [1.6.0] - 2026-05-16

### Added
- ✅ 新增按钮形状选项：支持圆形（Round）和正方形（Square）两种形状，可在设置页中切换
- ✅ 新增按钮间距选项（0-800px）：可自定义上下两个按钮之间的间距，包含输入实时验证
- ✅ 新增 `buttonSpacing`、`buttonShape` 设置项至存储和同步逻辑

### Fixed
- ✅ 修复悬停隐藏功能中鼠标离开时即便快捷键仍按下也会错误显示按钮的问题
- ✅ 添加 `isHidden` 状态追踪，确保隐藏条件满足时不会误显示按钮
- ✅ 隐藏状态下按钮添加 `pointer-events: none` 防止点击穿透
- ✅ 修复快捷键重复触发导致的隐藏状态混乱
- ✅ `disconnect` 清理逻辑中补充 `isHidden` 状态重置

### Changed
- ✅ 默认滚动速度从 1000ms 调整为 100ms，即开即用体验更顺畅
- ✅ 默认按钮尺寸从 48px 调整为 40px，视觉更紧凑
- ✅ 设置页预览功能同步适配按钮形状和间距变化

## [1.5.0] - 2026-05-14

### Added
- ✅ 新增滚动容器自动检测机制（`findScrollContainer`），支持自定义滚动容器页面
- ✅ 滚动逻辑全面适配自定义容器：`scrollToTop`、`scrollToBottom`、`getScrollTargetBottom` 改用容器 `scrollTop`/`scrollHeight` 替代 `window.scrollTo`/`window.pageYOffset`
- ✅ 扩展兼容飞书 Wiki、钉钉文档、Notion、语雀等使用自定义滚动容器的 SPA 页面

### Changed
- ✅ 容器检测策略：优先 `document.scrollingElement` → 遍历候选元素（`div, section, main, article, aside`）找 overflow:auto/scroll 最大容器 → 兜底 `document.documentElement`
- ✅ `initializeButton` 初始化时自动执行容器检测

## [1.4.2] - 2026-05-13

### Fixed
- ✅ 修复设置页预览按钮样式异常问题（opacity 控制失效、滚动速度控制失效）
- ✅ 修复构建脚本对 HTML 中内联样式和脚本的破坏性压缩问题
- ✅ 修复 JavaScript 注释移除时误删字符串内容的问题
- ✅ 添加内容安全策略（CSP）声明，符合 Chrome Web Store 审核要求
- ✅ 升级 `options_page` 为 MV3 推荐的 `options_ui` 格式

### Changed
- ✅ 重构 `build.js` 的 HTML 压缩逻辑：先提取 style/script 块再压缩
- ✅ 使用状态机方式安全移除 JavaScript 注释（避免匹配字符串内的 `//`）
- ✅ 新增构建后验证步骤，确保关键功能完整性

## [1.4.0] - 2026-05-09

### Added
- ✅ 工具栏弹窗新增当前网站启用/停用开关
- ✅ 新增按域名保存站点启用状态的本地存储逻辑
- ✅ 新增弹窗开关状态持久化测试
- ✅ 新增生产构建脚本，使用白名单生成 Chrome Web Store ZIP 包

### Changed
- ✅ 工具栏弹窗聚焦站点开关与设置入口
- ✅ 商店发布包改由 `build.js` 统一复制、压缩和校验内容
- ✅ 扩展清单补充作者、主页、最低 Chrome 版本与 `activeTab` 权限

## [1.3.0] - 2026-04-07

### Added
- ✅ 全屏模式自动隐藏按钮
- ✅ 顶部设置栏固定定位
- ✅ 垂直对齐方式即刻变动调整

### Changed
- ✅ 保存按钮位置调整：与语言选择器并列显示在标题栏右侧
- ✅ 代码规范性优化：移除冗余代码，提高代码质量

## [1.2.0] - 2026-04-01

### Added
- ✅ 鼠标悬停+快捷键隐藏功能
- ✅ 多语言支持：中文/英文自动切换

### Changed
- ✅ UI视觉一致性调整：统一保存按钮颜色为 #4A9EDD
- ✅ 跨平台快捷键命名优化：支持Windows、macOS、Linux
- ✅ 按钮颜色系统优化：默认颜色 #4A9EDD，支持自定义
- ✅ 预览窗口尺寸修复：支持小于40px的尺寸

## [1.0.0] - 2026-04-02

### Added
- ✅ 基础滚动功能：一键滚动到页面顶部和底部
- ✅ 平滑滚动动画效果
- ✅ 可配置滚动速度 (10ms-2000ms)
- ✅ 支持快捷键操作
- ✅ 简单设置界面
- ✅ 多语言支持（中文/英文）
- ✅ 跨平台快捷键命名
- ✅ 响应式设计，适配不同浏览器

### Changed
- ✅ 统一按钮默认背景颜色为 #4A9EDD
- ✅ 修复按钮预览窗口尺寸异常问题
- ✅ 优化鼠标悬停+快捷键隐藏功能
- ✅ 改进跨平台兼容性

### Fixed
- ✅ 修复快捷键间歇性失效问题
- ✅ 修复鼠标指针异常闪烁问题
- ✅ 修复预览窗口尺寸显示异常
- ✅ 修复中文乱码问题

## [0.1.0] - 2026-03-30

### Added
- 🚧 核心滚动功能开发
- 🚧 基础设置界面
- 🚧 图标系统搭建
- 🚧 多语言支持框架

[2.5.2]: https://github.com/kscje/page-scroll-master/releases/tag/v2.5.2
[2.5.1]: https://github.com/kscje/page-scroll-master/releases/tag/v2.5.1
[2.5.0]: https://github.com/kscje/page-scroll-master/releases/tag/v2.5.0
[2.4.0]: https://github.com/kscje/page-scroll-master/releases/tag/v2.4.0
[2.3.0]: https://github.com/kscje/page-scroll-master/releases/tag/v2.3.0
[2.2.0]: https://github.com/kscje/page-scroll-master/releases/tag/v2.2.0
[2.1.0]: https://github.com/kscje/page-scroll-master/releases/tag/v2.1.0
[2.0.0]: https://github.com/kscje/page-scroll-master/releases/tag/v2.0.0
[1.9.0]: https://github.com/kscje/page-scroll-master/releases/tag/v1.9.0
[1.8.0]: https://github.com/kscje/page-scroll-master/releases/tag/v1.8.0
[1.7.0]: https://github.com/kscje/page-scroll-master/releases/tag/v1.7.0
[1.6.0]: https://github.com/kscje/page-scroll-master/releases/tag/v1.6.0
[1.5.0]: https://github.com/kscje/page-scroll-master/releases/tag/v1.5.0
[1.4.2]: https://github.com/kscje/page-scroll-master/releases/tag/v1.4.2
[1.4.1]: https://github.com/kscje/page-scroll-master/releases/tag/v1.4.1
[1.4.0]: https://github.com/kscje/page-scroll-master/releases/tag/v1.4.0
[1.3.0]: https://github.com/kscje/page-scroll-master/releases/tag/v1.3.0
[1.2.0]: https://github.com/kscje/page-scroll-master/releases/tag/v1.2.0
[1.0.0]: https://github.com/kscje/page-scroll-master/releases/tag/v1.0.0
[0.1.0]: https://github.com/kscje/page-scroll-master/releases/tag/v0.1.0
