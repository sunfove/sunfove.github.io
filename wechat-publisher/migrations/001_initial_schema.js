module.exports = {
  up(db, { v4 }) {
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY, username TEXT UNIQUE NOT NULL,
        role TEXT NOT NULL DEFAULT 'editor' CHECK(role IN ('admin','editor','reviewer')),
        created_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
      );
      CREATE TABLE IF NOT EXISTS topics (
        id TEXT PRIMARY KEY, title TEXT NOT NULL, description TEXT, category TEXT,
        priority INTEGER DEFAULT 3 CHECK(priority BETWEEN 1 AND 5),
        status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','approved','in_progress','completed','cancelled')),
        created_by TEXT REFERENCES users(id), created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now','localtime')), deadline TEXT
      );
      CREATE TABLE IF NOT EXISTS research (
        id TEXT PRIMARY KEY, topic_id TEXT NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
        title TEXT NOT NULL, url TEXT, source TEXT, content TEXT, summary TEXT, tags TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
      );
      CREATE TABLE IF NOT EXISTS materials (
        id TEXT PRIMARY KEY, topic_id TEXT NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
        type TEXT NOT NULL CHECK(type IN ('text','image','quote','reference','file')),
        title TEXT NOT NULL, content TEXT, source_url TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
      );
      CREATE TABLE IF NOT EXISTS articles (
        id TEXT PRIMARY KEY, topic_id TEXT NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
        title TEXT NOT NULL, author TEXT, content TEXT, summary TEXT, cover_image TEXT,
        status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','review_pending','review_rejected','review_approved','published','archived')),
        created_by TEXT REFERENCES users(id), reviewed_by TEXT REFERENCES users(id),
        review_comment TEXT, version INTEGER DEFAULT 1,
        created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now','localtime')), published_at TEXT
      );
      CREATE TABLE IF NOT EXISTS images (
        id TEXT PRIMARY KEY, filename TEXT NOT NULL, original_url TEXT, alt_text TEXT,
        width INTEGER, height INTEGER, file_size INTEGER,
        source TEXT CHECK(source IN ('crawl','generate','upload')),
        article_id TEXT REFERENCES articles(id) ON DELETE SET NULL,
        topic_id TEXT REFERENCES topics(id) ON DELETE SET NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
      );
      CREATE TABLE IF NOT EXISTS publish_log (
        id TEXT PRIMARY KEY, article_id TEXT NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
        platform TEXT NOT NULL DEFAULT 'wechat',
        status TEXT NOT NULL CHECK(status IN ('pending','success','failed')),
        message TEXT, published_url TEXT, published_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
      );
      CREATE TABLE IF NOT EXISTS review_log (
        id TEXT PRIMARY KEY, article_id TEXT NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
        reviewer_id TEXT REFERENCES users(id),
        action TEXT NOT NULL CHECK(action IN ('submit','approve','reject','revise')),
        comment TEXT, created_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
      );
      CREATE TABLE IF NOT EXISTS config (
        key TEXT PRIMARY KEY, value TEXT NOT NULL,
        updated_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
      );
      CREATE INDEX IF NOT EXISTS idx_topics_status ON topics(status);
      CREATE INDEX IF NOT EXISTS idx_topics_created ON topics(created_at);
      CREATE INDEX IF NOT EXISTS idx_articles_status ON articles(status);
      CREATE INDEX IF NOT EXISTS idx_articles_topic ON articles(topic_id);
      CREATE INDEX IF NOT EXISTS idx_articles_created ON articles(created_at);
      CREATE INDEX IF NOT EXISTS idx_research_topic ON research(topic_id);
      CREATE INDEX IF NOT EXISTS idx_materials_topic ON materials(topic_id);
    `);
    const existing = db.prepare('SELECT id FROM users WHERE username = ?').get('admin');
    if (!existing) {
      db.prepare('INSERT INTO users (id, username, role) VALUES (?, ?, ?)').run(v4(), 'admin', 'admin');
      db.prepare('INSERT INTO users (id, username, role) VALUES (?, ?, ?)').run(v4(), 'editor', 'editor');
      db.prepare('INSERT INTO users (id, username, role) VALUES (?, ?, ?)').run(v4(), 'reviewer', 'reviewer');
    }
    const siteName = db.prepare('SELECT value FROM config WHERE key = ?').get('site_name');
    if (!siteName) {
      db.prepare('INSERT INTO config (key, value) VALUES (?, ?)').run('site_name', '蘑菇公众号发布平台');
      db.prepare('INSERT INTO config (key, value) VALUES (?, ?)').run('ai_api_key', '');
      db.prepare('INSERT INTO config (key, value) VALUES (?, ?)').run('ai_api_url', 'https://api.openai.com/v1');
      db.prepare('INSERT INTO config (key, value) VALUES (?, ?)').run('wechat_app_id', '');
      db.prepare('INSERT INTO config (key, value) VALUES (?, ?)').run('wechat_app_secret', '');
    }
  },
  down(db) {
    db.exec(`DROP INDEX IF EXISTS idx_materials_topic; DROP INDEX IF EXISTS idx_research_topic;
      DROP INDEX IF EXISTS idx_articles_created; DROP INDEX IF EXISTS idx_articles_topic;
      DROP INDEX IF EXISTS idx_articles_status; DROP INDEX IF EXISTS idx_topics_created;
      DROP INDEX IF EXISTS idx_topics_status;
      DROP TABLE IF EXISTS config; DROP TABLE IF EXISTS review_log;
      DROP TABLE IF EXISTS publish_log; DROP TABLE IF EXISTS images;
      DROP TABLE IF EXISTS articles; DROP TABLE IF EXISTS materials;
      DROP TABLE IF EXISTS research; DROP TABLE IF EXISTS topics; DROP TABLE IF EXISTS users;`);
  }
};
