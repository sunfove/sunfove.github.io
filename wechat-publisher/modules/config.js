const { getDb } = require('../database/schema');
const logger = require('./logger');

// 默认配置
const defaults = { site_name: '蘑菇公众号发布平台', ai_api_url: 'https://api.openai.com/v1', wechat_app_id: '', wechat_app_secret: '', ai_api_key: '' };

let memoryCache = null, cacheTime = 0;
const CACHE_TTL = 60e3;

function load() {
  const now = Date.now();
  if (memoryCache && (now - cacheTime < CACHE_TTL)) return memoryCache;
  const db = getDb();
  const rows = db.prepare('SELECT key, value FROM config').all();
  const cfg = { ...defaults };
  for (const r of rows) { cfg[r.key] = r.value; }
  // 环境变量覆盖
  const envMap = { WECHAT_APP_ID: 'wechat_app_id', WECHAT_APP_SECRET: 'wechat_app_secret', AI_API_KEY: 'ai_api_key', AI_API_URL: 'ai_api_url' };
  for (const [env, key] of Object.entries(envMap)) { if (process.env[env]) cfg[key] = process.env[env]; }
  memoryCache = cfg; cacheTime = now;
  return cfg;
}

function set(key, value) {
  const db = getDb();
  db.prepare(`INSERT INTO config (key, value, updated_at) VALUES (?, ?, datetime('now','localtime')) ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=excluded.updated_at`).run(key, String(value));
  if (memoryCache) memoryCache[key] = String(value);
}

function setBatch(entries) { for (const [k, v] of entries) set(k, v ? String(v) : ''); }

function getWechat() { const c = load(); return { appId: c.wechat_app_id, appSecret: c.wechat_app_secret }; }
function getAI() { const c = load(); return { apiKey: c.ai_api_key, apiUrl: c.ai_api_url }; }

module.exports = { load, set, setBatch, getWechat, getAI };
