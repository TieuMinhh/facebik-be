import { Router } from 'express';
import postController from './post.controller';
import { protect } from '../../core/middlewares/auth.middleware';
import { uploadMedia } from '../../core/middlewares/upload.middleware';

const router = Router();

router.post('/', protect, uploadMedia.array('images', 10), postController.createPost);
router.get('/', protect, postController.getFeed);
router.get('/user/:userId', protect, postController.getUserPosts);
router.post('/:id/like', protect, postController.toggleLike);
router.delete('/:id', protect, postController.deletePost);

export default router;
