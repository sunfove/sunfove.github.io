const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');
const { v4: uuidv4 } = require('uuid');
const logger = require('../modules/logger');

const DB_PATH = path.join(__dirname, '..', 'data', 'publisher.db');
const MIGRATIONS_DIR = path.join(__dirname, '..', 'migrations');

let db;

function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    migrate();
  }
  return db;
}

function ensureMigrationsTable() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      applied_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
    )
  `);
}

function listMigrations() {
  if (!fs.existsSync(MIGRATIONS_DIR)) return [];
  return fs
    .readdirSync(MIGRATIONS_DIR)
    .filter(f => f.endsWith('.js'))
    .sort((a, b) => a.localeCompare(b));
}

function getAppliedMigrations() {
  ensureMigrationsTable();
  return db.prepare('SELECT name FROM migrations ORDER BY name').all().map(r => r.name);
}

function runMigration(name, direction) {
  const filePath = path.join(MIGRATIONS_DIR, name);
  const migration = require(filePath);
  if (typeof migration[direction] !== 'function') {
    throw new Error(`Migration ${name} has no ${direction}()`);
  }
  logger.info(`[migrate] ${direction}: ${name}`);
  migration[direction](db, { v4: uuidv4 });
}

function recordMigration(name) {
  db.prepare('INSERT INTO migrations (name) VALUES (?)').run(name);
}

function removeMigrationRecord(name) {
  db.prepare('DELETE FROM migrations WHERE name = ?').run(name);
}

function migrate(target) {
  const migrations = listMigrations();
  const applied = new Set(getAppliedMigrations());

  for (const name of migrations) {
    if (applied.has(name)) continue;
    if (target && name > target) break;
    runMigration(name, 'up');
    recordMigration(name);
  }
}

function rollback(steps = 1) {
  const applied = getAppliedMigrations();
  const toRollback = applied.slice(-steps).reverse();
  for (const name of toRollback) {
    runMigration(name, 'down');
    removeMigrationRecord(name);
  }
}

function reset() {
  const applied = getAppliedMigrations();
  for (const name of applied.slice().reverse()) {
    runMigration(name, 'down');
    removeMigrationRecord(name);
  }
}

function status() {
  const migrations = listMigrations();
  const applied = new Set(getAppliedMigrations());
  return migrations.map(name => ({
    name,
    applied: applied.has(name)
  }));
}

// CLI 支持：node database/schema.js [migrate|rollback|reset|status]
if (require.main === module) {
  db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  const cmd = process.argv[2] || 'migrate';
  if (cmd === 'migrate') {
    migrate();
  } else if (cmd === 'rollback') {
    const steps = parseInt(process.argv[3] || '1', 10);
    rollback(steps);
  } else if (cmd === 'reset') {
    reset();
  } else if (cmd === 'status') {
    logger.info({ status: status() }, 'migration status');
  } else {
    logger.error('Usage: node database/schema.js [migrate|rollback|reset|status]');
    process.exit(1);
  }
  process.exit(0);
}

module.exports = { getDb, migrate, rollback, reset, status };
