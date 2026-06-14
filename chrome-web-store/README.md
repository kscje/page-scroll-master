# Chrome Web Store 发布资料

此目录是 Chrome Web Store 发布资料的唯一维护入口。商店后台需要填写或上传的内容全部集中在这里，扩展运行源码和发布 ZIP 不放入本目录。

## 快速入口

| 内容 | 路径 | 用途 |
| --- | --- | --- |
| 多语言名称、摘要和详细说明 | `listing-content.md` | 复制到各语言商店详情页 |
| 发布检查清单 | `publish-checklist.md` | 提交前逐项确认 |
| 发布操作指南 | `publish-guide.md` | 开发者后台填写与提交流程 |
| 多语言隐私政策 | `privacy/` | 部署公开 URL，并填写到隐私政策字段 |
| 商店图标 | `assets/icon/icon128.png` | 商店图标上传 |
| 宣传图 | `assets/promotional/` | 新版多语言宣传图和旧版无文字通用图 |
| 多语言截图 | `assets/screenshots/<locale>/` | 每种语言 4 张最终截图 |
| 图片生成工具 | `tools/` | 生成候选图片并执行资料校验 |

## 最终上传图片

- 图标：`assets/icon/icon128.png`，尺寸 `128x128`
- 新版多语言宣传图：`assets/promotional/localized/<locale>/`
  - `small-promo-440x280.png`
  - `marquee-promo-1400x560.png`
- 旧版无文字通用图：`assets/promotional/generic/`
- 截图：`assets/screenshots/<locale>/01-04-*.png`，尺寸 `1280x800`

截图语言目录：

`en`、`zh-CN`、`zh-TW`、`es`、`ja`、`de`、`fr`、`pt`、`ko`、`it`

## 管理规则

1. 商店文案只在 `listing-content.md` 中维护，不在发布指南中保存另一份文案模板。
2. 隐私政策只在 `privacy/` 中维护，各语言必须保持相同的数据范围、权限、端点和保留期限。
3. `assets/` 只放最终确认后可直接上传的图片，不放联系表或临时预览。宣传图按 `localized/` 和 `generic/` 分类，避免新旧版本混淆。
4. 图片生成器输出到 `tools/previews/v2.1/`，审阅后再将选定图片更新到 `assets/`。
5. 扩展图标源文件仍为根目录 `icons/icon128.png`；发布前需确保其与 `assets/icon/icon128.png` 一致。
6. 发布 ZIP 仍由根目录 `node build.js` 生成，且不会包含本目录中的商店资料。

## 常用命令

生成多语言候选图片：

```bash
node chrome-web-store/tools/generate-store-assets.js
```

校验文案、隐私政策、图片尺寸和图标一致性：

```bash
node chrome-web-store/tools/validate-store-materials.js
```

生成最终扩展 ZIP：

```bash
node build.js
```
