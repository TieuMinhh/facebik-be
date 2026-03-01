import { User, IUserDocument } from './user.model';
import { AppError } from '../../core/middlewares/error.middleware';
import { StatusCodes } from 'http-status-codes';
import { Types } from 'mongoose';
import { Notification } from '../notification/notification.model';
import notificationService from '../notification/notification.service';
import { FriendRequest } from '../friend/friendRequest.model';

class UserService {
  public async getUserProfile(userId: string, currentUserId?: string): Promise<any> {
    const user = await User.findById(userId)
      .select('-password')
      .populate('followers', 'username displayName avatar')
      .populate('following', 'username displayName avatar')
      .lean();
      
    if (!user) {
      throw new AppError('Người dùng không tồn tại', StatusCodes.NOT_FOUND);
    }

    if (currentUserId && userId !== currentUserId) {
      // Find friendship status
      const friendRequest = await FriendRequest.findOne({
        $or: [
          { sender: currentUserId, recipient: userId },
          { sender: userId, recipient: currentUserId },
        ],
      });

      let friendStatus: 'none' | 'pending' | 'friends' | 'received' = 'none';
      let requestId = null;
      let isFollowing = false;

      // Check following status
      if (user.followers.some((f: any) => f._id.toString() === currentUserId)) {
        isFollowing = true;
      }

      if (user.friends.some((id: any) => id.toString() === currentUserId)) {
        friendStatus = 'friends';
      } else if (friendRequest) {
        requestId = friendRequest._id;
        if (friendRequest.status === 'pending') {
          if (friendRequest.sender.toString() === currentUserId) {
            friendStatus = 'pending';
          } else {
            friendStatus = 'received';
          }
        }
      }

      // Late import to avoid circular dependency
      const friendService = (await import('../friend/friend.service')).default;
      const mutualFriendsCount = await friendService.getMutualFriendsCount(userId, currentUserId);

      return { ...user, friendStatus, requestId, isFollowing, mutualFriendsCount };
    }

    return user;
  }

  public async updateProfile(
    userId: string,
    updateData: { displayName?: string; bio?: string; avatar?: string; cover?: string }
  ): Promise<IUserDocument> {
    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      throw new AppError('Người dùng không tồn tại', StatusCodes.NOT_FOUND);
    }

    return user;
  }

  public async followUser(currentUserId: string, targetUserId: string): Promise<{ message: string }> {
    if (currentUserId === targetUserId) {
      throw new AppError('Bạn không thể tự theo dõi chính mình', StatusCodes.BAD_REQUEST);
    }

    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      throw new AppError('Người dùng cần follow không tồn tại', StatusCodes.NOT_FOUND);
    }

    // Check if already following
    if (targetUser.followers.includes(currentUserId as any)) {
      throw new AppError('Bạn đã theo dõi người này rồi', StatusCodes.BAD_REQUEST);
    }

    // Add to followers & following
    await Promise.all([
      User.findByIdAndUpdate(targetUserId, { $push: { followers: currentUserId } }),
      User.findByIdAndUpdate(currentUserId, { $push: { following: targetUserId } }),
    ]);

    // Create Notification
    await Notification.create({
      userId: targetUserId,
      senderId: currentUserId,
      type: 'follow',
      content: 'đã bắt đầu theo dõi bạn',
      isRead: false,
    });
    
    // Gửi tín hiệu báo có thông báo lên Socket (Nếu TargetUser đang online)
    notificationService.pingNotification(targetUserId);

    return { message: 'Đã theo dõi người dùng thành công' };
  }

  public async unfollowUser(currentUserId: string, targetUserId: string): Promise<{ message: string }> {
    if (currentUserId === targetUserId) {
      throw new AppError('Bạn không thể unfollow chính mình', StatusCodes.BAD_REQUEST);
    }

    // Remove from followers & following
    await Promise.all([
      User.findByIdAndUpdate(targetUserId, { $pull: { followers: currentUserId } }),
      User.findByIdAndUpdate(currentUserId, { $pull: { following: targetUserId } }),
    ]);

    return { message: 'Đã bỏ theo dõi thành công' };
  }

  public async searchUsers(query: string, currentUserId: string): Promise<IUserDocument[]> {
    if (!query) return [];

    const regex = new RegExp(query, 'i');
    const users = await User.find({
      $and: [
        { _id: { $ne: new Types.ObjectId(currentUserId) } },
        {
          $or: [
            { displayName: { $regex: regex } },
            { username: { $regex: regex } },
          ],
        },
      ],
    })
      .select('username displayName avatar bio')
      .limit(10);

    return users;
  }

  public async updateStatus(userId: string, status: 'online' | 'offline'): Promise<IUserDocument | null> {
    const updateData: any = { status };
    if (status === 'offline') {
      updateData.lastSeen = new Date();
    }

    return await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true }
    );
  }
}

export default new UserService();
