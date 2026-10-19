import { DatabaseSync } from 'node:sqlite';
import config from '../config/index.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.resolve(__dirname, '..', '..', config.db.path);

let db;

export function getDb() {
  if (!db) {
    db = new DatabaseSync(dbPath);
    db.exec('PRAGMA journal_mode = WAL;');
    db.exec('PRAGMA foreign_keys = ON;');
    initializeSchema();
  }
  return db;
}

function initializeSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS conversations (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      conversation_id TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('user', 'assistant', 'system')),
      content TEXT NOT NULL,
      stats TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_messages_conversation_id 
      ON messages(conversation_id);
    CREATE INDEX IF NOT EXISTS idx_messages_created_at 
      ON messages(created_at);
    CREATE INDEX IF NOT EXISTS idx_conversations_updated_at 
      ON conversations(updated_at);
  `);

  // Safe migration for existing databases
  try {
    db.exec('ALTER TABLE messages ADD COLUMN stats TEXT;');
  } catch {
    // Column already exists, safe to ignore
  }
}

export function closeDb() {
  if (db) {
    db.close();
    db = null;
  }
}
