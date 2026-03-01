import { Message, IMessageDocument } from './message.model';
import { Conversation } from '../conversation/conversation.model';
import { AppError } from '../../core/middlewares/error.middleware';
import { StatusCodes } from 'http-status-codes';
import { Types } from 'mongoose';
import { io } from '../../server'; 

class MessageService {
  public async sendMessage(
    senderId: string,
    conversationId: string,
    content: string,
    image?: string
  ): Promise<IMessageDocument> {
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) throw new AppError('Không tìm thấy cuộc trò chuyện', StatusCodes.NOT_FOUND);

    // Xác thực người gửi nằm trong phòng
    const isMember = conversation.members.some((m) => m.userId.toString() === senderId);
    if (!isMember) {
      throw new AppError('Bạn không có quyền nhắn tin trong phòng này', StatusCodes.FORBIDDEN);
    }

    let messageType: 'text' | 'image' = 'text';
    const attachments = [];

    if (image) {
      messageType = 'image';
      attachments.push({ url: image, fileName: 'image', fileSize: 0, mimeType: 'image/jpeg' });
    }

    const newMessage = await Message.create({
      conversationId: new Types.ObjectId(conversationId),
      senderId: new Types.ObjectId(senderId),
      content,
      messageType,
      attachments,
    });

    // Cập nhật lastMessage cho Conversation
    conversation.lastMessage = {
      content: messageType === 'image' ? '[Hình ảnh]' : content,
      senderId: new Types.ObjectId(senderId),
      messageType,
      createdAt: new Date(),
    };
    conversation.updatedAt = new Date();
    await conversation.save();

    await newMessage.populate('senderId', 'username displayName avatar');

    // Socket: Gửi Broadcast thông báo tin nhắn mới cho tất cả các thành viên (Online trong Personal Rooms của họ)
    const membersToNotify = conversation.members.filter((m) => m.userId.toString() !== senderId);
    membersToNotify.forEach((member) => {
      io.to(member.userId.toString()).emit('receive_message', {
        conversationId,
        message: newMessage,
      });
    });

    return newMessage;
  }

  public async getMessages(conversationId: string, userId: string, limit: number = 50, cursor?: string) {
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) throw new AppError('Không tìm thấy cuộc trò chuyện', StatusCodes.NOT_FOUND);

    const isMember = conversation.members.some((m) => m.userId.toString() === userId);
    if (!isMember) throw new AppError('Không có quyền xem', StatusCodes.FORBIDDEN);

    const query: any = { conversationId: new Types.ObjectId(conversationId) };

    if (cursor) {
      query.createdAt = { $lt: new Date(cursor) };
    }

    const messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('senderId', 'username displayName avatar');

    let nextCursor = null;
    if (messages.length === limit) {
      nextCursor = messages[messages.length - 1].createdAt;
    }

    return { messages: messages.reverse(), nextCursor }; // Trả về dạng cũ nhất dưới cùng
  }
}

export default new MessageService();
