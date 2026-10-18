import test from 'node:test';
import assert from 'node:assert/strict';
import app from '../src/app.js';
import * as repo from '../src/db/repository.js';
import { getDb } from '../src/db/database.js';

// Helper to make mock requests to express app without listening on a socket
async function request(method, path, body = null) {
  return new Promise((resolve) => {
    // Start temporary server
    const server = app.listen(0, async () => {
      const port = server.address().port;
      try {
        const url = `http://127.0.0.1:${port}${path}`;
        const options = {
          method,
          headers: { 'Content-Type': 'application/json' },
        };
        if (body) {
          options.body = JSON.stringify(body);
        }
        const res = await fetch(url, options);
        let data = null;
        const text = await res.text();
        try {
          data = JSON.parse(text);
        } catch {
          data = text;
        }
        server.close(() => resolve({ status: res.status, headers: res.headers, data }));
      } catch (err) {
        server.close(() => resolve({ status: 500, error: err }));
      }
    });
  });
}

test('GET /api/health returns health status and does NOT leak API key', async () => {
  const res = await request('GET', '/api/health');
  assert.equal(res.status, 200);
  assert.equal(res.data.database, 'ok');
  assert.ok(res.data.ai);
  assert.ok(Array.isArray(res.data.models));
  // Security check: API key must NEVER be in response
  assert.equal(res.data.ai.apiKey, undefined);
  assert.equal(res.data.apiKey, undefined);
  if (process.env.AI_API_KEY && process.env.AI_API_KEY !== 'your_api_key_here') {
    assert.equal(JSON.stringify(res.data).includes(process.env.AI_API_KEY), false);
  }
});

test('Conversation CRUD lifecycle', async () => {
  // 1. Create conversation
  const createRes = await request('POST', '/api/conversations', { title: 'Test Percakapan' });
  assert.equal(createRes.status, 201);
  assert.ok(createRes.data.conversation.id);
  assert.equal(createRes.data.conversation.title, 'Test Percakapan');
  const convId = createRes.data.conversation.id;

  // 2. Read conversation
  const getRes = await request('GET', `/api/conversations/${convId}`);
  assert.equal(getRes.status, 200);
  assert.equal(getRes.data.conversation.id, convId);
  assert.ok(Array.isArray(getRes.data.messages));

  // 3. Update conversation title
  const patchRes = await request('PATCH', `/api/conversations/${convId}`, { title: 'Judul Baru' });
  assert.equal(patchRes.status, 200);
  assert.equal(patchRes.data.success, true);

  // Verify updated title
  const verifyRes = await request('GET', `/api/conversations/${convId}`);
  assert.equal(verifyRes.data.conversation.title, 'Judul Baru');

  // 4. List conversations
  const listRes = await request('GET', '/api/conversations');
  assert.equal(listRes.status, 200);
  assert.ok(Array.isArray(listRes.data.conversations));
  assert.ok(listRes.data.conversations.some(c => c.id === convId));

  // 5. Delete conversation
  const delRes = await request('DELETE', `/api/conversations/${convId}`);
  assert.equal(delRes.status, 200);
  assert.equal(delRes.data.success, true);

  // 6. Verify 404 after deletion
  const notFoundRes = await request('GET', `/api/conversations/${convId}`);
  assert.equal(notFoundRes.status, 404);
});

test('POST /api/chat rejects empty message', async () => {
  const createRes = await request('POST', '/api/conversations', { title: 'Chat Test' });
  const convId = createRes.data.conversation.id;

  const emptyMsgRes = await request('POST', '/api/chat', { conversationId: convId, message: '   ' });
  assert.equal(emptyMsgRes.status, 400);
  assert.ok(emptyMsgRes.data.error.includes('empty'));

  // Clean up
  await request('DELETE', `/api/conversations/${convId}`);
});

test('POST /api/chat rejects invalid conversationId', async () => {
  const res = await request('POST', '/api/chat', { conversationId: 'non-existent-id', message: 'Halo' });
  assert.equal(res.status, 404);
});

test('Database Repository handles message context and search correctly', async () => {
  const conv = repo.createConversation('Pencarian Coding React');
  repo.addMessage(conv.id, 'user', 'Bagaimana cara membuat hook di React?');
  repo.addMessage(conv.id, 'assistant', 'Gunakan fungsi useMemo atau useState.');

  // Context check
  const recent = repo.getRecentMessages(conv.id, 10);
  assert.equal(recent.length, 2);
  assert.equal(recent[0].role, 'user');
  assert.equal(recent[1].role, 'assistant');

  // Search check
  const searchResults = repo.searchConversations('hook');
  assert.ok(searchResults.some(c => c.id === conv.id));

  // Clean up
  repo.deleteConversation(conv.id);
});
