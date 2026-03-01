import { Conversation, IConversationDocument } from './conversation.model';
import { AppError } from '../../core/middlewares/error.middleware';
import { StatusCodes } from 'http-status-codes';
import { Types } from 'mongoose';
import { User } from '../user/user.model';

class ConversationService {
  public async getConversations(userId: string): Promise<IConversationDocument[]> {
    return await Conversation.find({ 'members.userId': new Types.ObjectId(userId) })
      .sort({ updatedAt: -1 })
      .populate('members.userId', 'username displayName avatar isOnline lastSeen');
  }

  public async createOrGetPrivateConversation(
    userId: string,
    targetUserId: string
  ): Promise<IConversationDocument> {
    if (userId === targetUserId) {
      throw new AppError('Không thể tạo phòng chat với chính mình', StatusCodes.BAD_REQUEST);
    }

    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      throw new AppError('Người dùng không tồn tại', StatusCodes.NOT_FOUND);
    }

    // Tìm phòng chat 1-1 giữa 2 người
    let conversation = await Conversation.findOne({
      type: 'private',
      'members.userId': { $all: [new Types.ObjectId(userId), new Types.ObjectId(targetUserId)] },
    }).populate('members.userId', 'username displayName avatar isOnline lastSeen');

    // Nếu chưa có thì tạo mới
    if (!conversation) {
      conversation = await Conversation.create({
        type: 'private',
        members: [{ userId: new Types.ObjectId(userId) }, { userId: new Types.ObjectId(targetUserId) }],
        lastMessage: { content: '', senderId: new Types.ObjectId(userId), messageType: 'system', createdAt: new Date() }
      });
      await conversation.populate('members.userId', 'username displayName avatar isOnline lastSeen');
    }

    return conversation;
  }
}

export default new ConversationService();
