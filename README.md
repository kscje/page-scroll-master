# Page Scroll Master

一个 Chrome 扩展，用于快速滚动到页面顶部或底部，并提供浮动按钮、工具栏弹窗、快捷键和可视化设置页。

## 功能

- 一键滚动到页面顶部或底部
- 智能滚动容器检测：自动适配使用自定义滚动容器（如飞书 Wiki、Notion、语雀、钉钉文档等 SPA 页面）
- 浮动按钮常驻页面边缘
- 工具栏弹窗内可按站点启用或停用扩展
- 全局快捷键支持
  - `Ctrl+Shift+Up` / `Command+Shift+Up`
  - `Ctrl+Shift+Down` / `Command+Shift+Down`
- 平滑滚动动画
- 可调滚动速度（10ms - 2000ms）
- 可自定义按钮位置
  - 左侧 / 右侧
  - 顶部 / 居中 / 底部
- 可自定义按钮尺寸、颜色和透明度（尺寸 10px - 120px，透明度 0% - 100%）
- 鼠标悬停 + 指定快捷键隐藏按钮
- 全屏模式自动隐藏按钮
- 中英文界面支持
- 设置页实时预览
- 图标生成工具

## 安装

1. 下载或克隆本项目
2. 打开 Chrome 的扩展程序页面：`chrome://extensions/`
3. 开启“开发者模式”
4. 点击“加载已解压的扩展程序”
5. 选择本项目根目录

### 图标

如果你想重新生成图标，可以先打开 `create-icons.html`，生成后放入 `icons/` 目录：

- `icon16.png`
- `icon32.png`
- `icon48.png`
- `icon128.png`

## 使用

### 浮动按钮

- 点击上方箭头滚动到顶部
- 点击下方箭头滚动到底部

### 工具栏弹窗

点击扩展图标后，可针对当前网站启用或停用扩展，也可以打开设置页。

站点启用状态会保存在 `chrome.storage.local` 中，不影响其他网站。

### 快捷键

- 顶部：`Ctrl+Shift+Up` / `Command+Shift+Up`
- 底部：`Ctrl+Shift+Down` / `Command+Shift+Down`

## 设置项

在设置页中可以调整：

- 滚动速度
- 按钮位置
- 按钮尺寸
- 顶部按钮颜色
- 底部按钮颜色
- 透明度
- 鼠标悬停 + 快捷键隐藏
- 隐藏按钮所用快捷键
- 界面语言

设置会保存在 `chrome.storage.sync` 中，并由已打开页面中的内容脚本自动响应更新。

## 项目结构

- `manifest.json`：扩展配置
- `content.js`：页面内浮动按钮和滚动逻辑
- `popup.html` / `popup.js`：工具栏弹窗
- `options.html` / `options.js`：设置页
- `background.js`：快捷键处理
- `_locales/`：多语言文案
- `create-icons.html` / `create-icons.js`：图标生成工具

## 兼容性

- Google Chrome
- Microsoft Edge
- 其他基于 Chromium 的浏览器
- 飞书 Wiki、钉钉文档、Notion、语雀等使用自定义滚动容器的 SPA 页面（v1.5.0+）

## 注意事项

- 扩展需要访问网页内容，才能在页面中注入浮动按钮
- 某些浏览器内置页面（如 `chrome://` 页面）不支持内容脚本
- 如果快捷键冲突，可在浏览器扩展快捷键页面中调整
- 对于使用自定义滚动容器的页面，插件会自动检测并适配（检测策略：`document.scrollingElement` → 候选元素遍历 → `document.documentElement`）

## 更新记录

当前版本：`1.5.0`

## 联系方式

反馈或建议可联系：`kscj.e@live.com`
