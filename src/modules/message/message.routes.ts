import { Router } from 'express';
import messageController from './message.controller';
import { protect } from '../../core/middlewares/auth.middleware';
import { uploadMedia } from '../../core/middlewares/upload.middleware';

const router = Router();

// Lấy tin nhắn của 1 phòng chat
router.get('/conversation/:conversationId', protect, messageController.getMessages);

// Gửi tin nhắn mới
router.post('/conversation/:conversationId', protect, uploadMedia.single('image'), messageController.sendMessage);

export default router;
