import { Router } from 'express';
import conversationController from './conversation.controller';
import { protect } from '../../core/middlewares/auth.middleware';

const router = Router();

// Lấy danh sách conversation
router.get('/', protect, conversationController.getConversations);

// Tạo nhóm chat riêng (1-1)
router.post('/private/:targetUserId', protect, conversationController.getOrCreatePrivate);

export default router;
