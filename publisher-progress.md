# 公众号发布平台构建进展

## 2026-07-19（Day 4）| 日志规范化

今日完成了 **日志规范化**，核心交付物是一个统一、可长期维护的日志模块。

### 主要改动

1. **新增 `wechat-publisher/modules/logger.js`**
   - 基于 [pino](https://getpino.io/) 提供结构化 JSON 日志
   - 使用 `rotating-file-stream` 按天轮转日志文件
   - 生成 `logs/app-YYYY-MM-DD-*.log`（全级别）和 `logs/error-YYYY-MM-DD-*.log`（warn 及以上）
   - 自动保留最近 30 份文件，支持 `LOG_LEVEL`、`LOG_DIR`、`LOG_TO_FILE_ONLY` 环境变量

2. **替换全部 `console.log` / `console.error`**
   - `server.js`：启动日志接入 logger
   - `database/schema.js`：迁移日志接入 logger
   - `scripts/healthcheck.js`：健康检查输出同时写入原文件和 logger
   - `publish_v6.mjs`：发布流程日志接入 logger
   - `wechat_formatter_mdnice.mjs`：公式/图片上传日志接入 logger

3. **依赖更新**
   - `package.json` 新增 `pino`、`pino-pretty`、`rotating-file-stream`

### 验证结果

```bash
# 本地启动服务，日志正常输出
$ PORT=13060 node server.js
{"level":"info","time":"2026-07-19T...","pid":...,"msg":"🍄 蘑菇发布平台运行中: http://localhost:13060"}

# 日志文件已生成
$ ls wechat-publisher/logs
app.log  error.log  healthcheck.log  healthcheck-state.json  pm2-err.log  pm2-out.log
```

### 下一步

- Day 5：公式渲染收尾，增加本地预览模式（不发微信也能看最终效果）

---

## 历史进展

- **Day 1**：统一配置管理，把 publish_v6 硬编码的 AppID/Secret 迁到 config 表，支持环境变量覆盖
- **Day 2**：服务进程守护，pm2 + systemd 自启 + `/api/health` 健康检查
- **Day 3**：数据库迁移化，schema.js 改造为可 up/down 的迁移运行器
- **Day 4**：日志规范化，pino 替换 console.log，按天轮转
