/**
 * 统一日志模块
 * - 使用 pino 做结构化日志
 * - 按天轮转日志文件
 * - 支持环境变量 LOG_LEVEL、LOG_DIR、LOG_TO_FILE_ONLY
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

function pad(n) { return n > 9 ? String(n) : '0' + n; }

function filenameGenerator(prefix) {
  return (time, index) => {
    if (!time) return `${prefix}.log`;
    const y = time.getFullYear();
    const m = pad(time.getMonth() + 1);
    const d = pad(time.getDate());
    return `${prefix}-${y}-${m}-${d}-${index}.log`;
  };
}

function createRotateStream(generator) {
  return rfs.createStream(generator, {
    interval: '1d',
    path: LOG_DIR,
    compress: 'gzip',
    maxFiles: 30,
    size: '50M',
    initialRotation: false,
  });
}

const appStream = createRotateStream(filenameGenerator('app'));
const errorStream = createRotateStream(filenameGenerator('error'));

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
