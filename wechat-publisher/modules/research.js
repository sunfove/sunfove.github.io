const { getDb } = require('../database/schema');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
const logger = require('./logger');

module.exports = {
  list(topicId) { const db = getDb(); return db.prepare('SELECT * FROM research WHERE topic_id = ? ORDER BY created_at DESC').all(topicId); },
  create(d) { const db = getDb(); const id = uuidv4(); db.prepare('INSERT INTO research (id, topic_id, title, url, source, content, summary) VALUES (?, ?, ?, ?, ?, ?, ?)').run(id, d.topic_id, d.title, d.url || '', d.source || '', d.content || '', d.summary || ''); return { id }; },
  delete(id) { const db = getDb(); db.prepare('DELETE FROM research WHERE id = ?').run(id); return { deleted: true }; },
  async crawl(url) { try { const resp = await axios.get(url, { timeout: 30000, headers: { 'User-Agent': 'Mozilla/5.0' } }); const text = (resp.data || '').substring(0, 10000); return { content: text, title: url.split('/').pop()?.slice(0, 50) || '抓取内容', source: new URL(url).hostname }; } catch (e) { throw new Error('抓取失败: ' + e.message); } },
  async summarize(text) { if (!text) return '无内容可总结'; return text.replace(/<[^>]+>/g, '').trim().substring(0, 200); }
};
