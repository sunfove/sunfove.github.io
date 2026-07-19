const { getDb } = require('../database/schema');
const { v4: uuidv4 } = require('uuid');

module.exports = {
  list({ page = 1, pageSize = 60, source } = {}) { const db = getDb(); const sql = source && source !== 'all' ? 'WHERE source = ?' : ''; const params = source && source !== 'all' ? [source] : []; const items = db.prepare(`SELECT * FROM images ${sql} ORDER BY created_at DESC LIMIT ? OFFSET ?`).all(...params, pageSize, (page - 1) * pageSize); const total = db.prepare(`SELECT COUNT(*) as c FROM images ${sql}`).get(...params); return { items, total: total.c, page, pageSize }; },
  addRecord(d) { const db = getDb(); const id = uuidv4(); db.prepare('INSERT INTO images (id, filename, original_url, alt_text, width, height, file_size, source, article_id, topic_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').run(id, d.filename, d.original_url || '', d.alt_text || '', d.width || 0, d.height || 0, d.file_size || 0, d.source || 'upload', d.article_id || null, d.topic_id || null); return { id, filename: d.filename }; },
  delete(id) { const db = getDb(); const img = db.prepare('SELECT filename FROM images WHERE id = ?').get(id); db.prepare('DELETE FROM images WHERE id = ?').run(id); return { deleted: true, filename: img?.filename }; },
  async crawlImage(url, opts = {}) { const { get } = require('axios'); const fs = require('fs'), path = require('path'); const resp = await get(url, { responseType: 'arraybuffer', timeout: 30000 }); const ext = url.match(/\.(png|jpg|jpeg|gif|webp)/i)?.[1] || 'png'; const filename = `crawled-${Date.now()}.${ext}`; const dir = path.join(__dirname, '..', 'public', 'uploads'); fs.mkdirSync(dir, { recursive: true }); fs.writeFileSync(path.join(dir, filename), Buffer.from(resp.data)); return this.addRecord({ filename, original_url: url, source: 'crawl', alt_text: opts.alt_text || '' }); },
  async searchWebImages(query, count = 10) { return [{ url: `https://placeholder.com/search?q=${encodeURIComponent(query)}` }]; },
  stats() { const db = getDb(); return { total: db.prepare('SELECT COUNT(*) as c FROM images').get().c }; }
};
