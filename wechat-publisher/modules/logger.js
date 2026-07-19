/**
 * 统一日志模块
 * - 使用 pino 做结构化日志
 * - 按天轮转日志文件
 * - 支持环境变量 LOG_LEVEL 和 LOG_DIR
 */
const path = require('path');
const fs = require('fs');
const pino = require('pino');
const rfs = require('rotating-file-stream');

const LOG_LEVEL = process.env.LOG_LEVEL || 'info';
const LOG_DIR = process.env.LOG_DIR || path.join(__dirname, '..', 'logs');

if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

// 使用按天生成的文件名函数，确保文件名格式正确
function pad(n) { return n > 9 ? String(n) : '0' + n; }
function filenameGenerator(time, index) {
  if (!time) return 'app.log';
  const y = time.getFullYear();
  const m = pad(time.getMonth() + 1);
  const d = pad(time.getDate());
  return `app-${y}-${m}-${d}-${index}.log`;
}

function errorFilenameGenerator(time, index) {
  if (!time) return 'error.log';
  const y = time.getFullYear();
  const m = pad(time.getMonth() + 1);
  const d = pad(time.getDate());
  return `error-${y}-${m}-${d}-${index}.log`;
}

function createRotateStream(filename) {
  return rfs.createStream(filename, {
    interval: '1d',
    path: LOG_DIR,
    compress: 'gzip',
    maxFiles: 30,
    size: '50M',
    initialRotation: false,
  });
}

// 仅输出到文件，不污染 stdout；生产环境需要看日志时读文件
const appStream = createRotateStream(filenameGenerator);
const errorStream = createRotateStream(errorFilenameGenerator);

// 控制台输出：可选，适合 dev；生产用 LOG_TO_FILE_ONLY=1 关闭
const toConsole = process.env.LOG_TO_FILE_ONLY !== '1';

const streams = [
  { stream: appStream, level: LOG_LEVEL },
  { stream: errorStream, level: 'warn' },
];
if (toConsole) {
  streams.push({ stream: process.stdout, level: LOG_LEVEL });
}

const logger = pino({
  level: LOG_LEVEL,
  base: { pid: process.pid },
  timestamp: pino.stdTimeFunctions.isoTime,
  formatters: {
    level(label) {
      return { level: label };
    },
  },
}, pino.multistream(streams));

module.exports = logger;
module.exports.LOG_DIR = LOG_DIR;
module.exports.LOG_LEVEL = LOG_LEVEL;
