module.exports = {
  up(db) {
    db.exec(`ALTER TABLE publish_log ADD COLUMN retry_count INTEGER DEFAULT 0;
      ALTER TABLE publish_log ADD COLUMN platform_error TEXT;`);
  },
  down(db) {
    db.exec(`CREATE TABLE publish_log_new (id TEXT PRIMARY KEY, article_id TEXT NOT NULL REFERENCES articles(id) ON DELETE CASCADE, platform TEXT NOT NULL DEFAULT 'wechat', status TEXT NOT NULL CHECK(status IN ('pending','success','failed')), message TEXT, published_url TEXT, published_at TEXT NOT NULL DEFAULT (datetime('now','localtime')));
      INSERT INTO publish_log_new SELECT id, article_id, platform, status, message, published_url, published_at FROM publish_log;
      DROP TABLE publish_log; ALTER TABLE publish_log_new RENAME TO publish_log;`);
  }
};
