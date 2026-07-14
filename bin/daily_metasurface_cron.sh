#!/bin/bash
# 超表面日报定时执行脚本
# 由 OpenClaw 自动生成

set -e

# 设置工作目录
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_DIR="/home/ubuntu/time-frame-website"
cd "$REPO_DIR"

# 加载环境变量（如果 .env 存在）
if [ -f "$REPO_DIR/.env" ]; then
    export $(grep -v '^#' "$REPO_DIR/.env" | xargs)
fi

# 记录日志
LOG_FILE="/var/log/daily_metasurface.log"
exec 1>> "$LOG_FILE" 2>&1

echo "=========================================="
echo "🍄 超表面日报生成任务 - $(date '+%Y-%m-%d %H:%M:%S')"
echo "=========================================="

# 检查 API Key
if [ -z "$LLM_API_KEY" ] || [ "$LLM_API_KEY" = "your_api_key_here" ]; then
    echo "[ERROR] LLM_API_KEY 未配置，请先编辑 $REPO_DIR/.env"
    exit 1
fi

# 执行日报生成
echo "📋 开始生成超表面日报..."
python3 "$REPO_DIR/py_scripts/daily_metasurface.py"

echo "✅ 任务完成 - $(date '+%Y-%m-%d %H:%M:%S')"
echo ""
