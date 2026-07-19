# 公众号发布平台构建进展

## 日期

2026-07-19

## 当日任务

Phase 1 Day 5：本地预览+留存模式

## 完成内容

1. `wechat_formatter_mdnice.mjs` 增加本地模式——当没有微信 accessToken 时，公式用内嵌 SVG，图片用原地址
2. `modules/publish.js` 新增 `previewLocalHtml()` 方法——不调微信 API 也能生成文章 HTML
3. `server.js` 新增 `GET /api/publish/preview/local/:articleId` 接口——生成完整带样式的静态 HTML 文件，存入 `preview/` 目录
4. pm2 状态恢复，开机自启重新确认

## 验证结果

| 项目 | 结果 |
|------|------|
| 语法检查 | ✅ 全部通过 |
| 服务重启 | ✅ `/api/health` 正常 |
| 本地预览接口 | ✅ 200 返回 JSON，含文件路径 |
| 静态 HTML 文件 | ✅ 生成成功（392KB，包含 86 个公式 SVG、87 个段落） |
| 公式渲染 | ✅ 全部公式以 SVG 内嵌到 HTML |

## 如何使用

```bash
# 生成本地预览（不消耗微信 API 额度）
curl http://localhost:3060/api/publish/preview/local/<articleId>

# 访问生成的静态文件
open http://localhost:3060/preview/preview-<articleId>-<timestamp>.html
```

## 下一步

**Day 6：发布模块整合** — 将 publish_v6.mjs 核心能力并入 server.js 的 publish 模块

## 相关文件

- `wechat-publisher/modules/publish.js`
- `wechat-publisher/server.js`
- `wechat-publisher/wechat_formatter_mdnice.mjs`
- `wechat-publisher/preview/*.html`
