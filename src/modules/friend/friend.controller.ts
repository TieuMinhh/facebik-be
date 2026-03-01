import { Request, Response, NextFunction } from 'express';
import friendService from './friend.service';
import { StatusCodes } from 'http-status-codes';

class FriendController {
  public async sendRequest(req: Request, res: Response, next: NextFunction) {
    try {
      const recipientId = req.params.userId as string;
      const senderId = (req as any).user._id;
      const request = await friendService.sendFriendRequest(senderId, recipientId);
      res.status(StatusCodes.CREATED).json(request);
    } catch (error) {
      next(error);
    }
  }

  public async acceptRequest(req: Request, res: Response, next: NextFunction) {
    try {
      const requestId = req.params.requestId as string;
      const recipientId = (req as any).user._id;
      const result = await friendService.acceptFriendRequest(recipientId, requestId);
      res.status(StatusCodes.OK).json(result);
    } catch (error) {
      next(error);
    }
  }

  public async declineRequest(req: Request, res: Response, next: NextFunction) {
    try {
      const requestId = req.params.requestId as string;
      const recipientId = (req as any).user._id;
      const result = await friendService.declineFriendRequest(recipientId, requestId);
      res.status(StatusCodes.OK).json(result);
    } catch (error) {
      next(error);
    }
  }

  public async cancelRequest(req: Request, res: Response, next: NextFunction) {
    try {
      const requestId = req.params.requestId as string;
      const senderId = (req as any).user._id;
      const result = await friendService.cancelFriendRequest(senderId, requestId);
      res.status(StatusCodes.OK).json(result);
    } catch (error) {
      next(error);
    }
  }

  public async unfriend(req: Request, res: Response, next: NextFunction) {
    try {
      const friendId = req.params.friendId as string;
      const userId = (req as any).user._id;
      const result = await friendService.unfriend(userId, friendId);
      res.status(StatusCodes.OK).json(result);
    } catch (error) {
      next(error);
    }
  }

  public async getFriends(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.params.userId || (req as any).user._id;
      const friends = await friendService.getFriends(userId);
      res.status(StatusCodes.OK).json(friends);
    } catch (error) {
      next(error);
    }
  }

  public async getRequests(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user._id;
      const requests = await friendService.getFriendRequests(userId);
      res.status(StatusCodes.OK).json(requests);
    } catch (error) {
      next(error);
    }
  }

  public async getSuggestions(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user._id;
      const suggestions = await friendService.getSuggestionsWithMutual(userId);
      res.status(StatusCodes.OK).json(suggestions);
    } catch (error) {
      next(error);
    }
  }
}

export default new FriendController();
