import { Router } from 'express';
import friendController from './friend.controller';
import { protect } from '../../core/middlewares/auth.middleware';

const router = Router();

// Lấy danh sách bạn bè, lời mời, gợi ý
router.get('/', protect, friendController.getFriends);
router.get('/requests', protect, friendController.getRequests);
router.get('/suggestions', protect, friendController.getSuggestions);

// Hành động kết bạn
router.post('/request/:userId', protect, friendController.sendRequest);
router.post('/accept/:requestId', protect, friendController.acceptRequest);
router.delete('/request/:requestId', protect, friendController.cancelRequest); // Hủy lời mời đã gửi (sender)
router.delete('/decline/:requestId', protect, friendController.declineRequest); // Từ chối lời mời nhận được (recipient)

// Hủy kết bạn
router.delete('/unfriend/:friendId', protect, friendController.unfriend);

export default router;
