# 插件发布前检查清单

## 📋 发布前检查项目

### 1. 元数据准备 ✅
- [ ] 英文插件名称：Smart Scroll Navigator – Top, Bottom & Progress（75字符以内）
- [ ] 中文插件名称：智能页面滚动导航器：顶部/底部、进度与跳转
- [x] 多语言简短描述已从 `listing-content.md` 更新（13 种语言，132字符以内；待填入商店后台）
- [x] 多语言详细描述已从 `listing-content.md` 更新（13 种语言，4000字符以内；待填入商店后台）
- [x] 版本号：2.5.0（语义化版本；与 `manifest.json` 一致）
- [ ] 应用类别：选择合适的类别（如 Productivity, Utilities）
- [ ] 年龄分级：Everyone

### 2. 技术规范检查 ✅
- [x] manifest.json 格式正确
- [x] 使用 Manifest V3
- [x] 权限使用合理（统计主机和 `alarms` 均为可选权限）
- [ ] 所有文件使用 UTF-8 编码
- [x] 代码无语法错误
- [x] 无未使用的权限或功能

### 3. 图标和图片准备 ✅
- [ ] 16x16px 图标（工具栏）
- [ ] 32x32px 图标（Retina显示）
- [ ] 48x48px 图标（扩展管理页）
- [x] 128x128px 商店图标：`assets/icon/icon128.png`
- [x] 每种语言 3 张截图：`assets/screenshots/<locale>/`
- [x] 新版多语言宣传图片：`assets/promotional/localized/<locale>/`
- [x] 旧版无文字通用宣传图片：`assets/promotional/generic/`
- [ ] 使用PNG格式，支持透明度

### 4. 功能测试 ✅
- [ ] 核心功能正常工作（滚动到顶部/底部）
- [ ] 快捷键功能正常（Windows/Linux/Mac）
- [ ] 自定义设置保存和加载
- [ ] 多语言支持（中文/繁体中文/英文/西班牙语/日语/德语/法语/葡萄牙语/韩语/意大利语/俄语/土耳其语/印度尼西亚语）
- [ ] 跨平台快捷键命名
- [ ] 鼠标悬停+快捷键隐藏功能
- [ ] 按钮样式自定义
- [ ] 位置设置功能
- [ ] 当前网站启用/停用开关
- [ ] 滚动位置书签默认关闭，开启后显示独立书签按钮
- [ ] 已保存位置管理列表
- [ ] 智能段落跳转默认关闭，开启后显示独立目录按钮
- [ ] 页面目录、上一段、下一段和当前章节高亮
- [ ] 目录来源、最大目录项、短标题过滤和当前章节高亮设置保存/加载
- [ ] 自动滚屏默认关闭，开启后显示独立播放/暂停按钮
- [ ] 自动滚屏速度、按钮颜色和智能暂停规则保存/加载

### 4.1 v2.0 智能段落跳转专项验收 ✅
- [ ] 默认关闭，升级后不显示新增目录 UI
- [ ] 开启后显示独立目录按钮，不与滚动位置书签入口合并
- [ ] 默认只解析主要滚动内容中的 H1/H2
- [ ] 导航、页脚、侧栏和隐藏标题不会进入目录
- [ ] 无有效标题时显示空状态，并禁用上一段/下一段
- [ ] 超过最大目录项时只显示配置上限内项目，并展示截断说明
- [ ] 点击目录项在根页面和自定义滚动容器中都能正确跳转
- [ ] 上一段/下一段在首段、末段和标题附近边界状态正确
- [ ] 当前章节高亮使用阅读锚点语义，并暴露可访问状态
- [ ] SPA 路由变化、动态 DOM 变化和目录设置变化后旧目录失效并可重建
- [ ] 功能关闭时不扫描标题、不渲染目录、不绑定额外高亮滚动监听
- [ ] 目录标题和页面结构只在当前页面内存中处理，不写入 storage、不发送远程服务

### 5. 兼容性测试 ✅
- [ ] Chrome 最新版本
- [ ] Chrome 前一个版本
- [ ] Edge 最新版本
- [ ] Windows 10/11
- [ ] macOS Monterey/Ventura
- [ ] Linux (Ubuntu 20.04+)
- [ ] 移动设备 (< 768px)
- [ ] 平板设备 (768px - 1024px)
- [ ] 桌面端 (> 1024px)

### 6. 性能测试 ✅
- [ ] 页面加载时间 < 200ms
- [ ] 内存使用 < 50MB
- [ ] CPU使用率 < 5%
- [ ] 无内存泄漏
- [ ] 无卡顿现象

### 7. 安全检查 ✅
- [ ] 无恶意代码
- [ ] 无安全漏洞
- [ ] 数据处理安全
- [ ] 权限使用合规
- [ ] 无敏感信息泄露

### 7.1 v2.1 匿名使用统计与隐私披露专项验收
- [x] 新安装和升级后匿名统计默认关闭
- [x] 未同意时不创建统计聚合、不请求可选权限、不发送统计请求
- [x] 开启时由用户手势请求 `alarms` 和固定统计域名可选权限
- [x] 权限被拒绝时统计保持关闭
- [x] 上传内容仅包含 allowlist 内的枚举设置和 UTC 日级聚合计数
- [x] 请求不包含 URL、域名、页面标题、正文、书签内容、站点状态或长期用户 ID
- [x] 单次请求体不超过 16KB，失败重试有上限且不影响核心功能
- [x] 相同批次 ID 不会重复计入服务端聚合
- [x] 关闭统计后清除待发送数据、停止调度并撤销可选权限
- [x] 全部 10 种支持语言的隐私政策已更新
- [x] 隐私政策包含 Chrome Web Store User Data Policy 的 Limited Use 合规声明
- [x] 商店描述不再声称“没有任何外部网络请求”
- [x] Chrome Web Store Privacy practices / Data usage 已按实际收集范围填写
- [x] 已说明 Cloudflare 基础设施、30 天批次去重记录和 13 个月聚合保留期
- [x] 真实 Chrome DevTools Network 已验证默认关闭、开启上传和关闭后三种状态

### 7.2 v2.2 建议与反馈服务专项验收
- [x] 表单默认不附带联系方式或图片，且不读取页面 URL 或浏览器语言
- [x] 客户端和服务端均限制最多 3 张 JPEG/PNG/WebP 图片且每张不超过 5MB
- [x] 反馈正文不写入 `chrome.storage`，服务端 D1 不保存正文、联系方式或图片
- [x] 固定反馈域名使用可选主机权限，提交结束后撤销
- [x] Worker 包含字段校验、图片签名校验、小时级限流、蜜罐字段和无内容日志
- [x] 全部 10 种设置页语言已包含表单、校验、提交中、成功和失败文案
- [x] 全部 10 种隐私政策已披露 Cloudflare、Resend、可选提交字段和 30 天日志保留期
- [x] 创建反馈 D1 数据库、配置 Worker secrets 并部署固定端点
- [x] 通过云端 Service Binding 验证生产 Worker、Resend 投递和 D1 `sent` 日志
- [x] Resend 测试邮件已由收件人于 2026-06-15 确认收到
- [x] 使用真实扩展验证权限请求、提交成功、邮件送达和 D1 `sent` 日志
- [x] 使用真实扩展验证联系方式和 2 张图片上传，邮件成功送达且 D1 仅记录图片数量
- [ ] 使用真实扩展验证小时级限流状态
- [ ] Chrome Web Store Privacy practices / Data usage 已按反馈实际处理范围更新

### 7.3 v2.3 自动滚屏与新增语言专项验收
- [x] 自动滚屏默认关闭，升级后不改变现有页面体验
- [x] Popup 已提供当前主域名自动滚屏启停
- [x] 设置页已提供速度、按钮颜色和智能暂停规则配置
- [x] 自动滚屏播放状态只保存在内容脚本内存，不写入 storage
- [x] 自动滚屏不新增 Chrome 权限或网络请求
- [x] 俄语、土耳其语和印度尼西亚语已加入 Options、Popup 和 Chrome locale
- [x] 发布构建白名单已包含 `_locales/ru`、`_locales/tr` 和 `_locales/id`

### 7.4 v2.5 易用性、兼容性与性能专项验收
- [x] 设置页高级功能按模块折叠，折叠状态保存在 `chrome.storage.local`
- [x] 恢复默认只重置 `chrome.storage.sync` 中的详细设置
- [x] 恢复默认不清空主域名状态、书签、统计 consent 或评分提示状态
- [x] 当前主域名插件关闭时不创建基础按钮或高级功能 DOM
- [x] 页面进度条、滚动位置书签、智能段落跳转和自动滚屏关闭时不保留对应运行成本
- [x] 反复启停高级功能不持续增加 DOM、监听器、Observer、timer 或 RAF
- [x] 顶部、底部、按屏、进度条、书签和目录跳转不会叠加旧滚动动画
- [x] 动态内容页面回到底部时会刷新目标高度并收敛到底部
- [x] 真实 Chrome 兼容性验收已完成（用户于 2026-06-20 确认）

### 8. 打包准备 ✅
- [x] 清理发布构建目录中的临时文件
- [x] 压缩为 ZIP：已生成 `dist/page-scroll-master-v2.5.0.zip`
- [x] ZIP 包大小 < 2MB（199.69 KB / 0.20 MB）
- [x] 所有必要文件都包含
- [x] 无多余文件
- [x] 文件结构正确，`unzip -t` 通过

### 9. 发布材料准备 ✅
- [ ] 开发者账户已注册（支付 $5 注册费）
- [ ] 详细描述已编写
- [ ] 截图已准备
- [ ] 支持链接已设置（可选）
- [ ] 隐私政策已准备（如适用）
- [ ] 发布说明已编写

## 📦 发布包内容检查

### 必需文件
- [ ] manifest.json
- [ ] popup.html
- [ ] popup.js
- [ ] content.js
- [ ] background.js
- [ ] options.html
- [ ] options.js
- [ ] icons/icon16.png
- [ ] icons/icon32.png
- [ ] icons/icon48.png
- [ ] icons/icon128.png
- [ ] _locales/en/messages.json
- [ ] _locales/zh_CN/messages.json
- [ ] _locales/zh_TW/messages.json
- [ ] _locales/es/messages.json
- [ ] _locales/ja/messages.json
- [ ] _locales/de/messages.json
- [ ] _locales/fr/messages.json
- [ ] _locales/pt_BR/messages.json
- [ ] _locales/ko/messages.json
- [ ] _locales/it/messages.json
- [ ] _locales/ru/messages.json
- [ ] _locales/tr/messages.json
- [ ] _locales/id/messages.json

### 商店后台资料（不放入扩展 ZIP）
- [x] `chrome-web-store/listing-content.md`
- [x] `chrome-web-store/privacy/`
- [x] `chrome-web-store/assets/`
- [x] `chrome-web-store/publish-guide.md`
- [x] `chrome-web-store/publish-checklist.md`
- [x] `chrome-web-store/README.md`

## 🚀 发布流程

1. **准备阶段**
   - [ ] 完成所有检查项目
   - [ ] 准备发布材料
   - [ ] 打包插件

2. **提交阶段**
   - [ ] 登录 Chrome Web Store Developer Dashboard
   - [ ] 上传ZIP包
   - [ ] 填写元数据
   - [ ] 上传图标和截图
   - [ ] 提交审核

3. **审核阶段**
   - [ ] 等待审核（3-7个工作日）
   - [ ] 处理审核反馈
   - [ ] 重新提交（如需要）

4. **发布阶段**
   - [ ] 审核通过
   - [ ] 插件上架
   - [ ] 验证发布状态

5. **维护阶段**
   - [ ] 监控用户反馈
   - [ ] 定期更新功能
   - [ ] 修复bug

## 💡 发布技巧

1. **最佳发布时间**：工作日上午，审核速度较快
2. **版本号策略**：以 `manifest.json` 中的版本号为准，v2.5 发布目标为 2.5.0
3. **描述优化**：使用关键词，提高搜索排名
4. **截图质量**：使用高质量截图，展示核心功能
5. **响应时间**：及时响应审核反馈，通常24小时内

## 📞 支持资源

- [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
- [Chrome Extensions Documentation](https://developer.chrome.com/docs/extensions/)
- [Chrome Web Store Help Center](https://support.google.com/chrome_webstore)
- [Chrome Extensions Community](https://groups.google.com/a/chromium.org/g/chromium-extensions)

---

**最后更新时间**：2026-06-20
**状态**：v2.5.0 发布材料和发布 ZIP 已准备完成，待提交商店后台
**构建产物**：`dist/page-scroll-master-v2.5.0.zip`（199.08 KB / 0.19 MB）
**验收说明**：v2.5 真实 Chrome 兼容性验收已完成；商店后台填写仍待人工完成
