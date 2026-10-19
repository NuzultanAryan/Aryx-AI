import { getDb } from './database.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Data access layer for conversations — abstracts SQL so swapping to
 * PostgreSQL later only requires changing this file.
 */

export function createConversation(title) {
  const db = getDb();
  const id = uuidv4();
  const now = new Date().toISOString();
  const stmt = db.prepare(
    'INSERT INTO conversations (id, title, created_at, updated_at) VALUES (?, ?, ?, ?)'
  );
  stmt.run(id, title, now, now);
  return { id, title, created_at: now, updated_at: now };
}

export function getConversations() {
  const db = getDb();
  return db.prepare(
    'SELECT id, title, created_at, updated_at FROM conversations ORDER BY updated_at DESC'
  ).all();
}

export function getConversationById(id) {
  const db = getDb();
  return db.prepare(
    'SELECT id, title, created_at, updated_at FROM conversations WHERE id = ?'
  ).get(id);
}

export function updateConversationTitle(id, title) {
  const db = getDb();
  const now = new Date().toISOString();
  const result = db.prepare(
    'UPDATE conversations SET title = ?, updated_at = ? WHERE id = ?'
  ).run(title, now, id);
  return result.changes > 0;
}

export function touchConversation(id) {
  const db = getDb();
  const now = new Date().toISOString();
  db.prepare('UPDATE conversations SET updated_at = ? WHERE id = ?').run(now, id);
}

export function deleteConversation(id) {
  const db = getDb();
  const result = db.prepare('DELETE FROM conversations WHERE id = ?').run(id);
  return result.changes > 0;
}

export function deleteAllConversations() {
  const db = getDb();
  const result = db.prepare('DELETE FROM conversations').run();
  return result.changes;
}

export function addMessage(conversationId, role, content, stats = null) {
  const db = getDb();
  const id = uuidv4();
  const now = new Date().toISOString();
  const statsJson = stats ? JSON.stringify(stats) : null;
  const stmt = db.prepare(
    'INSERT INTO messages (id, conversation_id, role, content, stats, created_at) VALUES (?, ?, ?, ?, ?, ?)'
  );
  stmt.run(id, conversationId, role, content, statsJson, now);
  touchConversation(conversationId);
  return { id, conversation_id: conversationId, role, content, stats, created_at: now };
}

export function getMessagesByConversationId(conversationId, limit) {
  const db = getDb();
  const query = limit
    ? 'SELECT id, conversation_id, role, content, stats, created_at FROM messages WHERE conversation_id = ? ORDER BY created_at ASC, rowid ASC LIMIT ?'
    : 'SELECT id, conversation_id, role, content, stats, created_at FROM messages WHERE conversation_id = ? ORDER BY created_at ASC, rowid ASC';
  const rows = limit ? db.prepare(query).all(conversationId, limit) : db.prepare(query).all(conversationId);
  return rows.map(r => {
    let parsedStats = null;
    if (r.stats) {
      try {
        parsedStats = typeof r.stats === 'string' ? JSON.parse(r.stats) : r.stats;
      } catch {
        parsedStats = null;
      }
    }
    return { ...r, stats: parsedStats };
  });
}

export function getRecentMessages(conversationId, limit) {
  const db = getDb();
  // Get last N messages ordered ascending for context with rowid tiebreaker
  const rows = db.prepare(
    `SELECT id, conversation_id, role, content, stats, created_at 
     FROM messages 
     WHERE conversation_id = ? 
     ORDER BY created_at DESC, rowid DESC 
     LIMIT ?`
  ).all(conversationId, limit);
  return rows.reverse().map(r => {
    let parsedStats = null;
    if (r.stats) {
      try {
        parsedStats = typeof r.stats === 'string' ? JSON.parse(r.stats) : r.stats;
      } catch {
        parsedStats = null;
      }
    }
    return { ...r, stats: parsedStats };
  });
}

export function searchConversations(query) {
  const db = getDb();
  const like = `%${query}%`;
  return db.prepare(
    `SELECT DISTINCT c.id, c.title, c.created_at, c.updated_at
     FROM conversations c
     LEFT JOIN messages m ON c.id = m.conversation_id
     WHERE c.title LIKE ? OR m.content LIKE ?
     ORDER BY c.updated_at DESC
     LIMIT 50`
  ).all(like, like);
}
