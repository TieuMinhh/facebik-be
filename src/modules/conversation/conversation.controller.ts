import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import conversationService from './conversation.service';

class ConversationController {
  public async getConversations(req: Request, res: Response) {
    const userId = req.user!._id.toString();
    const conversations = await conversationService.getConversations(userId);
    
    res.status(StatusCodes.OK).json({
      success: true,
      data: conversations,
    });
  }

  public async getOrCreatePrivate(req: Request, res: Response) {
    const userId = req.user!._id.toString();
    const targetUserId = req.params.targetUserId as string;

    const conversation = await conversationService.createOrGetPrivateConversation(userId, targetUserId);
    
    res.status(StatusCodes.OK).json({
      success: true,
      data: conversation,
    });
  }
}

export default new ConversationController();
