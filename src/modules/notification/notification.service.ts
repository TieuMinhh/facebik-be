import { Notification } from './notification.model';
import { AppError } from '../../core/middlewares/error.middleware';
import { StatusCodes } from 'http-status-codes';
import { Types } from 'mongoose';
import { io } from '../../server'; // Import Socket Server Instance

class NotificationService {
  /**
   * Push a ping via Socket and save internally
   * Instead of sending huge data payload, we just ping the client
   */
  public pingNotification(userId: string) {
    io.to(userId).emit('new_notification');
  }

  public async getNotifications(userId: string, limit: number = 20, cursor?: string) {
    const query: any = { userId: new Types.ObjectId(userId) };

    if (cursor) {
      query.createdAt = { $lt: new Date(cursor) };
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('senderId', 'username displayName avatar')
      .populate('postId', 'content images');

    let nextCursor = null;
    if (notifications.length === limit) {
      nextCursor = notifications[notifications.length - 1].createdAt;
    }

    // Lấy số lượng thông báo chưa đọc
    const unreadCount = await Notification.countDocuments({ userId: new Types.ObjectId(userId), isRead: false });

    return { notifications, nextCursor, unreadCount };
  }

  public async markAsRead(notificationId: string, userId: string) {
    const notification = await Notification.findOneAndUpdate(
      { _id: new Types.ObjectId(notificationId), userId: new Types.ObjectId(userId) },
      { $set: { isRead: true } },
      { new: true }
    );

    if (!notification) {
      throw new AppError('Không tìm thấy thông báo', StatusCodes.NOT_FOUND);
    }

    return notification;
  }

  public async markAllAsRead(userId: string) {
    await Notification.updateMany(
      { userId: new Types.ObjectId(userId), isRead: false },
      { $set: { isRead: true } }
    );
  }
}

export default new NotificationService();
