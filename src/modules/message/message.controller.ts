import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import messageService from './message.service';

class MessageController {
  public async sendMessage(req: Request, res: Response) {
    const userId = req.user!._id.toString();
    const conversationId = req.params.conversationId as string;
    const { content } = req.body;
    
    let image = '';
    if (req.file) {
      image = req.file.path; // from cloudinary
    }

    const message = await messageService.sendMessage(userId, conversationId, content, image);
    
    res.status(StatusCodes.CREATED).json({
      success: true,
      message: 'Đã gửi tin nhắn',
      data: message,
    });
  }

  public async getMessages(req: Request, res: Response) {
    const userId = req.user!._id.toString();
    const conversationId = req.params.conversationId as string;
    const limit = parseInt(req.query.limit as string) || 50;
    const cursor = req.query.cursor as string | undefined;

    const result = await messageService.getMessages(conversationId, userId, limit, cursor);
    
    res.status(StatusCodes.OK).json({
      success: true,
      data: result.messages,
      nextCursor: result.nextCursor,
    });
  }
}

export default new MessageController();
