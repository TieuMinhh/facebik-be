import { Router } from 'express';
import authRoutes from '../modules/auth/auth.routes';

import userRoutes from '../modules/user/user.routes';
import postRoutes from '../modules/post/post.routes';
import commentRoutes from '../modules/comment/comment.routes';
import notificationRoutes from '../modules/notification/notification.routes';
import conversationRoutes from '../modules/conversation/conversation.routes';
import messageRoutes from '../modules/message/message.routes';
import friendRoutes from '../modules/friend/friend.routes';

const rootRouter = Router();

rootRouter.use('/auth', authRoutes);
rootRouter.use('/users', userRoutes);
rootRouter.use('/posts', postRoutes);
rootRouter.use('/comments', commentRoutes);
rootRouter.use('/notifications', notificationRoutes);
rootRouter.use('/conversations', conversationRoutes);
rootRouter.use('/messages', messageRoutes);
rootRouter.use('/friends', friendRoutes);

export default rootRouter;
