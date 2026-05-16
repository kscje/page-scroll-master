# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

[1.6.0]: https://github.com/kscje/page-scroll-master/releases/tag/v1.6.0
[1.5.0]: https://github.com/kscje/page-scroll-master/releases/tag/v1.5.0
[1.4.2]: https://github.com/kscje/page-scroll-master/releases/tag/v1.4.2
[1.4.1]: https://github.com/kscje/page-scroll-master/releases/tag/v1.4.1
[1.4.0]: https://github.com/kscje/page-scroll-master/releases/tag/v1.4.0
[1.3.0]: https://github.com/kscje/page-scroll-master/releases/tag/v1.3.0
[1.2.0]: https://github.com/kscje/page-scroll-master/releases/tag/v1.2.0
[1.0.0]: https://github.com/kscje/page-scroll-master/releases/tag/v1.0.0
[0.1.0]: https://github.com/kscje/page-scroll-master/releases/tag/v0.1.0
