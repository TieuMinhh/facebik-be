import { Router } from 'express';
import notificationController from './notification.controller';
import { protect } from '../../core/middlewares/auth.middleware';

const router = Router();

// Lấy danh sách thông báo
router.get('/', protect, notificationController.getNotifications);

// Đánh dấu đọc tất cả
router.put('/read-all', protect, notificationController.markAllAsRead);

// Đánh dấu đọc 1 cái
router.put('/:id/read', protect, notificationController.markAsRead);

export default router;
