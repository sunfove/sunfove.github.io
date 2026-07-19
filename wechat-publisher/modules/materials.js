const { getDb } = require('../database/schema');
const { v4: uuidv4 } = require('uuid');

module.exports = {
  list(topicId, { page = 1, pageSize = 50 } = {}) { const db = getDb(); const items = db.prepare('SELECT * FROM materials WHERE topic_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?').all(topicId, pageSize, (page - 1) * pageSize); const total = db.prepare('SELECT COUNT(*) as c FROM materials WHERE topic_id = ?').get(topicId); return { items, total: total.c, page, pageSize }; },
  create(d) { const db = getDb(); const id = uuidv4(); db.prepare('INSERT INTO materials (id, topic_id, type, title, content, source_url) VALUES (?, ?, ?, ?, ?, ?)').run(id, d.topic_id, d.type || 'text', d.title, d.content || '', d.source_url || ''); return { id }; },
  update(id, d) { const db = getDb(); db.prepare('UPDATE materials SET title=COALESCE(?,title), content=COALESCE(?,content) WHERE id=?').run(d.title, d.content, id); return { updated: true }; },
  delete(id) { const db = getDb(); db.prepare('DELETE FROM materials WHERE id = ?').run(id); return { deleted: true }; },
  bulkDelete(ids) { const db = getDb(); if (!Array.isArray(ids) || !ids.length) return { deleted: 0 }; const stmt = db.prepare('DELETE FROM materials WHERE id = ?'); const del = db.transaction((arr) => { let c = 0; for (const id of arr) { const r = stmt.run(id); c += r.changes; } return c; }); return { deleted: del(ids) }; }
};
