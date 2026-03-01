import { Router } from 'express';
import commentController from './comment.controller';
import { protect } from '../../core/middlewares/auth.middleware';
import { uploadMedia } from '../../core/middlewares/upload.middleware';

const router = Router();

// Lấy danh sách bình luận gốc của 1 bài viết
router.get('/post/:postId', protect, commentController.getComments);

// Lấy danh sách trả lời của 1 bình luận
router.get('/:commentId/replies', protect, commentController.getReplies);

// Đăng bình luận
router.post('/post/:postId', protect, uploadMedia.single('image'), commentController.addComment);

// Thích bình luận
router.post('/:commentId/like', protect, commentController.toggleLike);

// Xóa bình luận
router.delete('/:commentId', protect, commentController.deleteComment);

export default router;
