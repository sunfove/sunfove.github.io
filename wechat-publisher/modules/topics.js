const { getDb } = require('../database/schema');
const { v4: uuidv4 } = require('uuid');
const logger = require('./logger');

module.exports = {
  list({ page = 1, pageSize = 20, status } = {}) { const db = getDb(); const sql = status && status !== 'all' ? 'WHERE status = ?' : ''; const params = status && status !== 'all' ? [status] : []; return { items: db.prepare(`SELECT * FROM topics ${sql} ORDER BY created_at DESC LIMIT ? OFFSET ?`).all(...params, pageSize, (page - 1) * pageSize), total: db.prepare(`SELECT COUNT(*) as c FROM topics ${sql}`).get(...params).c, page, pageSize }; },
  get(id) { const db = getDb(); const t = db.prepare('SELECT * FROM topics WHERE id = ?').get(id); if (!t) return null; t.articles = db.prepare('SELECT * FROM articles WHERE topic_id = ? ORDER BY created_at DESC').all(id); return t; },
  create(d) { const db = getDb(); const id = uuidv4(); db.prepare(`INSERT INTO topics (id, title, description, category, priority, status, deadline) VALUES (?, ?, ?, ?, ?, 'draft', ?)`).run(id, d.title, d.description || '', d.category || '', d.priority || 3, d.deadline || null); return this.get(id); },
  update(id, d) { const db = getDb(); db.prepare(`UPDATE topics SET title=COALESCE(?,title), description=COALESCE(?,description), category=COALESCE(?,category), priority=COALESCE(?,priority), status=COALESCE(?,status), updated_at=datetime('now','localtime') WHERE id=?`).run(d.title, d.description, d.category, d.priority, d.status, id); return this.get(id); },
  delete(id) { const db = getDb(); db.prepare('DELETE FROM topics WHERE id = ?').run(id); return { deleted: true }; },
  stats() { const db = getDb(); return { total: db.prepare('SELECT COUNT(*) as c FROM topics').get().c, inProgress: db.prepare("SELECT COUNT(*) as c FROM topics WHERE status='in_progress'").get().c }; }
};
