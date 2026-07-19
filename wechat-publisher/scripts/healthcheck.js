#!/usr/bin/env node
// 健康检查脚本：检查 /api/health，失败则自动重启 pm2 进程

const http = require('http');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const logger = require('../modules/logger');

const HOST = process.env.HEALTH_HOST || 'localhost';
const PORT = process.env.HEALTH_PORT || 3060;
const PATH = process.env.HEALTH_PATH || '/api/health';
const MAX_FAILS = parseInt(process.env.HEALTH_MAX_FAILS || '3', 10);
const LOG_FILE = process.env.HEALTH_LOG || path.join(__dirname, '../logs/healthcheck.log');
const STATE_FILE = process.env.HEALTH_STATE || path.join(__dirname, '../logs/healthcheck-state.json');

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  fs.appendFileSync(LOG_FILE, line + '\n');
  logger.info(line);
}

function readState() {
  try {
    if (fs.existsSync(STATE_FILE)) {
      return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
    }
  } catch (e) {}
  return { consecutiveFails: 0, lastFailTime: null };
}

function writeState(state) {
  try {
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
  } catch (e) {}
}

function restartService() {
  exec('pm2 restart wechat-publisher', (err, stdout, stderr) => {
    if (err) {
      log(`重启失败: ${err.message}`);
    } else {
      log(`已执行 pm2 restart wechat-publisher`);
    }
  });
}

function check() {
  const req = http.get({ host: HOST, port: PORT, path: PATH, timeout: 10000 }, (res) => {
    let body = '';
    res.on('data', (chunk) => body += chunk);
    res.on('end', () => {
      const state = readState();
      if (res.statusCode === 200 && body.includes('"ok"')) {
        if (state.consecutiveFails > 0) {
          log('服务恢复健康');
        }
        state.consecutiveFails = 0;
        state.lastFailTime = null;
        writeState(state);
        process.exit(0);
      } else {
        handleFailure(state, `健康检查异常，状态码 ${res.statusCode}，响应 ${body.slice(0, 200)}`);
      }
    });
  });

  req.on('error', (err) => {
    handleFailure(readState(), `请求失败: ${err.message}`);
  });

  req.on('timeout', () => {
    req.destroy();
    handleFailure(readState(), '请求超时');
  });
}

function handleFailure(state, reason) {
  state.consecutiveFails += 1;
  state.lastFailTime = new Date().toISOString();
  log(`${reason}，连续失败 ${state.consecutiveFails}/${MAX_FAILS}`);
  writeState(state);

  if (state.consecutiveFails >= MAX_FAILS) {
    log('连续失败达到阈值，执行重启');
    restartService();
  }

  process.exit(1);
}

check();
