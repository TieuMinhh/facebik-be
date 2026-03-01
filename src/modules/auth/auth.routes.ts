import { Router } from 'express';
import authController from './auth.controller';
import { protect } from '../../core/middlewares/auth.middleware';

const router = Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/logout', authController.logout);
router.post('/refresh', authController.refresh);
router.get('/me', protect, authController.getMe);

export default router;
