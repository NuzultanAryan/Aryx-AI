import { Router } from 'express';
import { handleChat } from '../controllers/chatController.js';
import { 
  listConversations, 
  createConversation, 
  getConversation, 
  updateConversation, 
  deleteConversation, 
  deleteAllConversations 
} from '../controllers/conversationsController.js';
import { healthCheck } from '../controllers/healthController.js';

const router = Router();

// Health
router.get('/health', healthCheck);

// Chat (streaming SSE)
router.post('/chat', handleChat);

// Conversations
router.get('/conversations', listConversations);
router.post('/conversations', createConversation);
router.delete('/conversations', deleteAllConversations);
router.get('/conversations/:id', getConversation);
router.patch('/conversations/:id', updateConversation);
router.delete('/conversations/:id', deleteConversation);

export default router;
