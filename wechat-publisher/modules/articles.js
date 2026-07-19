const { getDb } = require('../database/schema');
const { v4: uuidv4 } = require('uuid');

function enrich(article) {
  if (!article) return article;
  const db = getDb();
  if (article.topic_id) { const t = db.prepare('SELECT title FROM topics WHERE id = ?').get(article.topic_id); if (t) article.topic_title = t.title; }
  if (article.id) article.images = db.prepare('SELECT * FROM images WHERE article_id = ?').all(article.id);
  return article;
}

module.exports = {
  list({ page = 1, pageSize = 20, status } = {}) { const db = getDb(); const sql = status && status !== 'all' ? 'WHERE a.status = ?' : ''; const params = status && status !== 'all' ? [status] : []; const items = db.prepare(`SELECT a.*, t.title as topic_title FROM articles a LEFT JOIN topics t ON a.topic_id = t.id ${sql} ORDER BY a.updated_at DESC LIMIT ? OFFSET ?`).all(...params, pageSize, (page - 1) * pageSize); const total = db.prepare(`SELECT COUNT(*) as c FROM articles ${sql}`).get(...params); return { items, total: total.c, page, pageSize }; },
  get(id) { return enrich(getDb().prepare('SELECT * FROM articles WHERE id = ?').get(id)); },
  create(d) { const db = getDb(); const id = uuidv4(); db.prepare('INSERT INTO articles (id, topic_id, title, author, content, summary, status) VALUES (?, ?, ?, ?, ?, ?, ?)').run(id, d.topic_id, d.title || '无标题', d.author || '蘑菇', d.content || '', d.summary || '', d.status || 'draft'); return this.get(id); },
  update(id, d) { const db = getDb(); db.prepare(`UPDATE articles SET title=COALESCE(?,title), author=COALESCE(?,author), content=COALESCE(?,content), summary=COALESCE(?,summary), status=COALESCE(?,status), version=version+1, updated_at=datetime('now','localtime') WHERE id=?`).run(d.title, d.author, d.content, d.summary, d.status, id); return this.get(id); },
  delete(id) { const db = getDb(); db.prepare('DELETE FROM articles WHERE id = ?').run(id); return { deleted: true }; },
  stats() { const db = getDb(); return { total: db.prepare('SELECT COUNT(*) as c FROM articles').get().c, published: db.prepare("SELECT COUNT(*) as c FROM articles WHERE status='published'").get().c }; }
};
