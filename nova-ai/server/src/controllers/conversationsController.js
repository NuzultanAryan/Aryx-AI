import * as repo from '../db/repository.js';

/**
 * Conversations controller — CRUD operations for conversations.
 */

export function listConversations(req, res) {
  try {
    const { search } = req.query;
    let conversations;
    if (search && search.trim().length > 0) {
      conversations = repo.searchConversations(search.trim());
    } else {
      conversations = repo.getConversations();
    }
    res.json({ conversations });
  } catch (err) {
    console.error('Error listing conversations:', err.message);
    res.status(500).json({ error: 'Failed to load conversations.' });
  }
}

export function createConversation(req, res) {
  try {
    const title = req.body.title || 'Percakapan Baru';
    if (typeof title !== 'string' || title.length > 200) {
      return res.status(400).json({ error: 'Invalid title.' });
    }
    const conversation = repo.createConversation(title.trim());
    res.status(201).json({ conversation });
  } catch (err) {
    console.error('Error creating conversation:', err.message);
    res.status(500).json({ error: 'Failed to create conversation.' });
  }
}

export function getConversation(req, res) {
  try {
    const { id } = req.params;
    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Invalid conversation ID.' });
    }

    const conversation = repo.getConversationById(id);
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found.' });
    }

    const messages = repo.getMessagesByConversationId(id);
    res.json({ conversation, messages });
  } catch (err) {
    console.error('Error getting conversation:', err.message);
    res.status(500).json({ error: 'Failed to load conversation.' });
  }
}

export function updateConversation(req, res) {
  try {
    const { id } = req.params;
    const { title } = req.body;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Invalid conversation ID.' });
    }
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return res.status(400).json({ error: 'Title is required.' });
    }
    if (title.length > 200) {
      return res.status(400).json({ error: 'Title is too long.' });
    }

    const updated = repo.updateConversationTitle(id, title.trim());
    if (!updated) {
      return res.status(404).json({ error: 'Conversation not found.' });
    }
    res.json({ success: true });
  } catch (err) {
    console.error('Error updating conversation:', err.message);
    res.status(500).json({ error: 'Failed to update conversation.' });
  }
}

export function deleteConversation(req, res) {
  try {
    const { id } = req.params;
    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Invalid conversation ID.' });
    }

    const deleted = repo.deleteConversation(id);
    if (!deleted) {
      return res.status(404).json({ error: 'Conversation not found.' });
    }
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting conversation:', err.message);
    res.status(500).json({ error: 'Failed to delete conversation.' });
  }
}

export function deleteAllConversations(req, res) {
  try {
    const count = repo.deleteAllConversations();
    res.json({ success: true, deleted: count });
  } catch (err) {
    console.error('Error deleting all conversations:', err.message);
    res.status(500).json({ error: 'Failed to delete conversations.' });
  }
}
