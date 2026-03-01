import { FriendRequest } from './friendRequest.model';
import { User } from '../user/user.model';
import { AppError } from '../../core/middlewares/error.middleware';
import { StatusCodes } from 'http-status-codes';
import { Types } from 'mongoose';
import { Notification } from '../notification/notification.model';
import notificationService from '../notification/notification.service';

class FriendService {
  public async sendFriendRequest(senderId: string, recipientId: string) {
    if (senderId === recipientId) {
      throw new AppError('Bạn không thể gửi lời mời kết bạn cho chính mình', StatusCodes.BAD_REQUEST);
    }

    // Check if recipient exists
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      throw new AppError('Người dùng không tồn tại', StatusCodes.NOT_FOUND);
    }

    // Check if already friends
    const sender = await User.findById(senderId);
    if (sender?.friends.some(id => id.toString() === recipientId.toString())) {
      throw new AppError('Hai bạn đã là bạn bè rồi', StatusCodes.BAD_REQUEST);
    }

    // Check if request already exists
    const existingRequest = await FriendRequest.findOne({
      $or: [
        { sender: new Types.ObjectId(senderId), recipient: new Types.ObjectId(recipientId) },
        { sender: new Types.ObjectId(recipientId), recipient: new Types.ObjectId(senderId) },
      ],
    });

    if (existingRequest) {
      if (existingRequest.status === 'pending') {
        throw new AppError('Lời mời kết bạn đang chờ xử lý', StatusCodes.BAD_REQUEST);
      }
      // If rejected, we can allow sending again? Facebook usually has a cooldown or just doesn't show the button.
      // For now, let's just delete the rejected one and create new.
      await FriendRequest.findByIdAndDelete(existingRequest._id);
    }

    const request = await FriendRequest.create({
      sender: senderId,
      recipient: recipientId,
      status: 'pending',
    });

    // Create Notification
    await Notification.create({
      userId: recipientId,
      senderId: senderId,
      type: 'friend_request',
      content: 'đã gửi cho bạn một lời mời kết bạn',
    });
    notificationService.pingNotification(recipientId);

    return request;
  }

  public async acceptFriendRequest(recipientId: string, requestId: string) {
    const request = await FriendRequest.findById(requestId);
    if (!request) {
      throw new AppError('Không tìm thấy lời mời kết bạn', StatusCodes.NOT_FOUND);
    }

    if (request.recipient.toString() !== recipientId.toString()) {
      throw new AppError('Bạn không có quyền chấp nhận lời mời này', StatusCodes.FORBIDDEN);
    }

    if (request.status !== 'pending') {
      throw new AppError('Lời mời này đã được xử lý', StatusCodes.BAD_REQUEST);
    }

    // Update status
    request.status = 'accepted';
    await request.save();

    // Add to friends lists
    await Promise.all([
      User.findByIdAndUpdate(request.sender, { $addToSet: { friends: request.recipient, following: request.recipient, followers: request.recipient } }),
      User.findByIdAndUpdate(request.recipient, { $addToSet: { friends: request.sender, following: request.sender, followers: request.sender } }),
    ]);

    // Create Notification
    await Notification.create({
      userId: request.sender,
      senderId: recipientId,
      type: 'friend_accept',
      content: 'đã chấp nhận lời mời kết bạn của bạn',
    });
    notificationService.pingNotification(request.sender.toString());

    return { message: 'Đã chấp nhận kết bạn' };
  }

  public async declineFriendRequest(recipientId: string, requestId: string) {
    const request = await FriendRequest.findById(requestId);
    if (!request) {
      throw new AppError('Không tìm thấy lời mời kết bạn', StatusCodes.NOT_FOUND);
    }

    if (request.recipient.toString() !== recipientId.toString()) {
      throw new AppError('Bạn không có quyền từ chối lời mời này', StatusCodes.FORBIDDEN);
    }

    request.status = 'rejected';
    await request.save();

    return { message: 'Đã từ chối lời mời kết bạn' };
  }

  public async cancelFriendRequest(senderId: string, requestId: string) {
    const request = await FriendRequest.findOneAndDelete({
      _id: requestId,
      sender: senderId.toString(),
      status: 'pending',
    });

    if (!request) {
      throw new AppError('Không thể hủy lời mời kết bạn', StatusCodes.BAD_REQUEST);
    }

    return { message: 'Đã hủy lời mời kết bạn' };
  }

  public async unfriend(userId: string, friendId: string) {
    await Promise.all([
      User.findByIdAndUpdate(userId, { $pull: { friends: friendId } }),
      User.findByIdAndUpdate(friendId, { $pull: { friends: userId } }),
      // Unfriend can also unfollow based on business rules, but usually people keep following if they want? 
      // Facebook unfriends = stop following usually.
      User.findByIdAndUpdate(userId, { $pull: { following: friendId, followers: friendId } }),
      User.findByIdAndUpdate(friendId, { $pull: { following: userId, followers: userId } }),
      FriendRequest.findOneAndDelete({
        $or: [
          { sender: userId, recipient: friendId },
          { sender: friendId, recipient: userId },
        ],
      }),
    ]);

    return { message: 'Đã hủy kết bạn' };
  }

  public async getFriends(userId: string) {
    const user = await User.findById(userId).populate('friends', 'username displayName avatar bio status');
    return user?.friends || [];
  }

  public async getFriendRequests(userId: string) {
    return await FriendRequest.find({
      recipient: userId,
      status: 'pending',
    }).populate('sender', 'username displayName avatar');
  }

  public async getFriendSuggestions(userId: string) {
    const user = await User.findById(userId);
    if (!user) return [];

    // Exclude: self, friends, blocked
    const excludedIds: any[] = [
      userId,
      ...user.friends,
      ...user.blockedUsers,
    ];

    // Get ONLY received pending requests to exclude (they appear in Friend Requests tab)
    const receivedRequests = await FriendRequest.find({
      recipient: userId,
      status: 'pending',
    });

    receivedRequests.forEach((req) => {
      excludedIds.push(req.sender);
    });

    // Suggestions: people not in excluded list
    const suggestions = await User.find({
      _id: { $nin: excludedIds },
    })
      .select('username displayName avatar bio')
      .limit(10);

    return suggestions;
  }

  public async getMutualFriendsCount(userId1: string, userId2: string): Promise<number> {
    const user1 = await User.findById(userId1).select('friends');
    const user2 = await User.findById(userId2).select('friends');
    if (!user1 || !user2) return 0;

    const set1 = new Set(user1.friends.map(id => id.toString()));
    const mutualCount = user2.friends.filter(id => set1.has(id.toString())).length;
    return mutualCount;
  }

  public async getSuggestionsWithMutual(userId: string) {
    const suggestions = await this.getFriendSuggestions(userId);
    const suggestionsWithMutual = await Promise.all(suggestions.map(async (user: any) => {
      const mutualCount = await this.getMutualFriendsCount(userId, user._id.toString());
      
      // Check for sent friend request
      const friendRequest = await FriendRequest.findOne({
        sender: userId,
        recipient: user._id,
        status: 'pending',
      });

      return { 
        ...user.toObject(), 
        mutualFriendsCount: mutualCount,
        friendStatus: friendRequest ? 'pending' : 'none',
        requestId: friendRequest?._id || null
      };
    }));
    return suggestionsWithMutual;
  }
}

export default new FriendService();
