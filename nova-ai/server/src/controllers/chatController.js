import { getProvider } from '../services/aiProvider.js';
import * as repo from '../db/repository.js';
import config from '../config/index.js';

/**
 * Chat controller — handles the POST /api/chat endpoint.
 * Supports streaming via Server-Sent Events.
 */
export async function handleChat(req, res) {
  const { conversationId, message, model } = req.body;

  // Validate input
  if (!conversationId || typeof conversationId !== 'string') {
    return res.status(400).json({ error: 'conversationId is required and must be a string.' });
  }
  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    return res.status(400).json({ error: 'message is required and cannot be empty.' });
  }
  if (message.length > config.limits.maxMessageLength) {
    return res.status(400).json({ 
      error: `Message is too long. Maximum length is ${config.limits.maxMessageLength} characters.` 
    });
  }

  // Validate conversation exists
  const conversation = repo.getConversationById(conversationId);
  if (!conversation) {
    return res.status(404).json({ error: 'Conversation not found.' });
  }

  // Check AI provider
  const provider = getProvider();
  if (!provider.isReady()) {
    return res.status(503).json({ 
      error: 'AI provider is not configured. Please set a valid API key in the server .env file.',
      code: 'AI_NOT_CONFIGURED'
    });
  }

  // Save user message
  const userMessage = repo.addMessage(conversationId, 'user', message.trim());

  // Build context — get recent messages for this conversation only
  const contextMessages = repo.getRecentMessages(
    conversationId, 
    config.limits.maxContextMessages
  );

  const systemPrompt = config.ai.systemPrompt;

  // Set up SSE for streaming
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
  });

  let fullResponse = '';
  let aborted = false;
  const abortController = new AbortController();

  // Handle client disconnect
  req.on('close', () => {
    aborted = true;
    abortController.abort();
  });

  try {
    // Send user message id
    res.write(`data: ${JSON.stringify({ type: 'user_message', data: userMessage })}\n\n`);

    // Stream AI response
    const selectedModel = typeof model === 'string' && model.trim() ? model.trim() : null;
    for await (const chunk of provider.chatStream(contextMessages, systemPrompt, abortController.signal, selectedModel)) {
      if (aborted) break;
      fullResponse += chunk;
      res.write(`data: ${JSON.stringify({ type: 'chunk', data: chunk })}\n\n`);
    }

    if (!aborted && fullResponse.length > 0) {
      // Save assistant message
      const assistantMessage = repo.addMessage(conversationId, 'assistant', fullResponse);
      res.write(`data: ${JSON.stringify({ type: 'done', data: assistantMessage })}\n\n`);
      
      // Auto-generate title if this is the first exchange
      const allMessages = repo.getMessagesByConversationId(conversationId);
      if (allMessages.length <= 2 && conversation.title === 'Percakapan Baru') {
        const autoTitle = generateTitle(message.trim());
        repo.updateConversationTitle(conversationId, autoTitle);
        res.write(`data: ${JSON.stringify({ type: 'title_update', data: autoTitle })}\n\n`);
      }
    } else if (!aborted) {
      res.write(`data: ${JSON.stringify({ type: 'error', data: 'AI returned an empty response.' })}\n\n`);
    }
  } catch (err) {
    if (!aborted) {
      console.error('Chat stream error:', err.message);
      const errorMessage = categorizeError(err);
      res.write(`data: ${JSON.stringify({ type: 'error', data: errorMessage })}\n\n`);
    }
  } finally {
    if (!aborted) {
      res.write(`data: ${JSON.stringify({ type: 'end' })}\n\n`);
    }
    res.end();
  }
}

/**
 * Simple title generation from first user message.
 */
function generateTitle(message) {
  const cleaned = message.replace(/\n/g, ' ').trim();
  if (cleaned.length <= 50) return cleaned;
  return cleaned.substring(0, 47) + '...';
}

/**
 * Map provider errors to user-friendly messages.
 */
function categorizeError(err) {
  const msg = err.message || '';
  if (msg.includes('API key') || msg.includes('401') || msg.includes('UNAUTHENTICATED')) {
    return 'API key is invalid or expired. Please check your configuration.';
  }
  if (msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED') || msg.includes('rate')) {
    return 'Rate limit reached. Please wait a moment and try again.';
  }
  if (msg.includes('timeout') || msg.includes('DEADLINE_EXCEEDED')) {
    return 'The request timed out. Please try again.';
  }
  if (msg.includes('ECONNREFUSED') || msg.includes('ENOTFOUND') || msg.includes('fetch failed')) {
    return 'Cannot connect to the AI service. Please check your internet connection.';
  }
  return 'An error occurred while generating a response. Please try again.';
}
