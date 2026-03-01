import { Router } from 'express';
import userController from './user.controller';
import { protect, optionalProtect } from '../../core/middlewares/auth.middleware';
import { uploadMedia } from '../../core/middlewares/upload.middleware';

const router = Router();

// Lấy thông tin user (Public - nhưng có thể khóa lại nếu muốn)
router.get('/search', optionalProtect, userController.search);
router.get('/:id', optionalProtect, userController.getProfile);

// Cập nhật thông tin profile (Yêu cầu đăng nhập, cho phép upload ảnh)
// Sử dụng uploadMedia.fields để parse cả avatar và cover
router.put(
  '/profile',
  protect,
  uploadMedia.fields([
    { name: 'avatar', maxCount: 1 },
    { name: 'cover', maxCount: 1 },
  ]),
  userController.updateProfile
);

// Follow / Unfollow
router.post('/:id/follow', protect, userController.follow);
router.post('/:id/unfollow', protect, userController.unfollow);

export default router;
