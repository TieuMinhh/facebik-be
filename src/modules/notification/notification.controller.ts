import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import notificationService from './notification.service';

class NotificationController {
  public async getNotifications(req: Request, res: Response) {
    const userId = req.user!._id.toString();
    const limit = parseInt(req.query.limit as string) || 20;
    const cursor = req.query.cursor as string | undefined;

    const result = await notificationService.getNotifications(userId, limit, cursor);
    
    res.status(StatusCodes.OK).json({
      success: true,
      data: result.notifications,
      unreadCount: result.unreadCount,
      nextCursor: result.nextCursor,
    });
  }

  public async markAsRead(req: Request, res: Response) {
    const userId = req.user!._id.toString();
    const notificationId = req.params.id as string;

    await notificationService.markAsRead(notificationId, userId);
    
    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Đã đánh dấu đọc',
    });
  }

  public async markAllAsRead(req: Request, res: Response) {
    const userId = req.user!._id.toString();

    await notificationService.markAllAsRead(userId);
    
    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Đã đánh dấu đọc tất cả',
    });
  }
}

export default new NotificationController();
