# 插件发布前检查清单

## 📋 发布前检查项目

### 1. 元数据准备 ✅
- [ ] 英文插件名称：Smart Scroll Navigator – Top, Bottom & Progress（75字符以内）
- [ ] 中文插件名称：智能页面滚动导航器：顶部/底部、进度与跳转
- [ ] 简短描述：一键跳转顶部/底部，显示阅读进度，并支持长页面快速定位（132字符以内）
- [ ] 详细描述：完整的功能介绍（4000字符以内）
- [ ] 版本号：1.8.0（语义化版本）
- [ ] 应用类别：选择合适的类别（如 Productivity, Utilities）
- [ ] 年龄分级：Everyone

### 2. 技术规范检查 ✅
- [ ] manifest.json 格式正确
- [ ] 使用 Manifest V3
- [ ] 权限使用合理（只请求必要权限）
- [ ] 所有文件使用 UTF-8 编码
- [ ] 代码无语法错误
- [ ] 无未使用的权限或功能

### 3. 图标和图片准备 ✅
- [ ] 16x16px 图标（工具栏）
- [ ] 32x32px 图标（Retina显示）
- [ ] 48x48px 图标（扩展管理页）
- [ ] 128x128px 图标（应用商店）
- [ ] 至少2张截图（1280x800px 或 640x400px）
- [ ] 宣传图片（440x280px，可选）
- [ ] 使用PNG格式，支持透明度

### 4. 功能测试 ✅
- [ ] 核心功能正常工作（滚动到顶部/底部）
- [ ] 快捷键功能正常（Windows/Linux/Mac）
- [ ] 自定义设置保存和加载
- [ ] 多语言支持（中文/英文/西班牙语/日语）
- [ ] 跨平台快捷键命名
- [ ] 鼠标悬停+快捷键隐藏功能
- [ ] 按钮样式自定义
- [ ] 位置设置功能
- [ ] 当前网站启用/停用开关

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

### 8. 打包准备 ✅
- [ ] 清理临时文件
- [ ] 压缩为ZIP格式
- [ ] ZIP包大小 < 2MB
- [ ] 所有必要文件都包含
- [ ] 无多余文件
- [ ] 文件结构正确

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

### 可选文件
- [ ] create-icons.html（图标生成工具，不放入商店发布包）
- [ ] create-icons.js（图标生成工具脚本，不放入商店发布包）
- [ ] ICON_GUIDE.md（图标设置指南）
- [ ] CHROME_WEB_STORE_PUBLISH_GUIDE.md（发布指南）
- [ ] CHANGELOG.md（版本历史）
- [ ] PUBLISH_CHECKLIST.md（发布检查清单）
- [ ] README.md（项目说明）

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
2. **版本号策略**：以 `manifest.json` 中的版本号为准，当前为 1.8.0
3. **描述优化**：使用关键词，提高搜索排名
4. **截图质量**：使用高质量截图，展示核心功能
5. **响应时间**：及时响应审核反馈，通常24小时内

## 📞 支持资源

- [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
- [Chrome Extensions Documentation](https://developer.chrome.com/docs/extensions/)
- [Chrome Web Store Help Center](https://support.google.com/chrome_webstore)
- [Chrome Extensions Community](https://groups.google.com/a/chromium.org/g/chromium-extensions)

---

**最后更新时间**：2026-05-16
**状态**：准备就绪（v1.8.0 Advanced Controls）
**下一步**：提交审核
