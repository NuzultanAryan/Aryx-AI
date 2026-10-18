const API_BASE = '/api';

/**
 * API service — all backend communication goes through here.
 */

async function request(url, options = {}) {
  const response = await fetch(`${API_BASE}${url}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || `Request failed with status ${response.status}`);
  }

  return response.json();
}

// Health
export async function checkHealth() {
  return request('/health');
}

// Conversations
export async function getConversations(search = '') {
  const params = search ? `?search=${encodeURIComponent(search)}` : '';
  return request(`/conversations${params}`);
}

export async function createConversation(title = 'Percakapan Baru') {
  return request('/conversations', {
    method: 'POST',
    body: JSON.stringify({ title }),
  });
}

export async function getConversation(id) {
  return request(`/conversations/${id}`);
}

export async function updateConversation(id, title) {
  return request(`/conversations/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ title }),
  });
}

export async function deleteConversation(id) {
  return request(`/conversations/${id}`, {
    method: 'DELETE',
  });
}

export async function deleteAllConversations() {
  return request('/conversations', {
    method: 'DELETE',
  });
}

/**
 * Chat streaming via SSE.
 * Returns an object with { stream, abort } where stream is an async generator
 * and abort is a function to cancel the request.
 */
export function sendChatMessage(conversationId, message, model) {
  const controller = new AbortController();

  const stream = async function* () {
    const response = await fetch(`${API_BASE}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversationId, message, model }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || 'Failed to send message');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));
            yield data;
          } catch {
            // Skip malformed SSE data
          }
        }
      }
    }
  };

  return {
    stream: stream(),
    abort: () => controller.abort(),
  };
}
