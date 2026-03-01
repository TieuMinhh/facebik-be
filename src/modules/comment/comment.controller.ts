import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import commentService from './comment.service';

class CommentController {
  public async addComment(req: Request, res: Response) {
    const userId = req.user!._id.toString();
    const postId = req.params.postId as string;
    const { content, parentCommentId } = req.body;
    
    // Support image upload on comments
    let image = '';
    if (req.file) {
      image = req.file.path;
    }

    const comment = await commentService.addComment(userId, postId, content, parentCommentId, image);
    
    res.status(StatusCodes.CREATED).json({
      success: true,
      message: 'Bình luận thành công',
      data: comment,
    });
  }

  public async getComments(req: Request, res: Response) {
    const postId = req.params.postId as string;
    const limit = parseInt(req.query.limit as string) || 20;
    const cursor = req.query.cursor as string | undefined;

    const result = await commentService.getPostComments(postId, limit, cursor);
    
    res.status(StatusCodes.OK).json({
      success: true,
      data: result.comments,
      nextCursor: result.nextCursor,
    });
  }

  public async getReplies(req: Request, res: Response) {
    const parentCommentId = req.params.commentId as string;
    const replies = await commentService.getReplies(parentCommentId);
    
    res.status(StatusCodes.OK).json({
      success: true,
      data: replies,
    });
  }

  public async deleteComment(req: Request, res: Response) {
    const userId = req.user!._id.toString();
    const commentId = req.params.commentId as string;

    await commentService.deleteComment(commentId, userId);
    
    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Đã xóa bình luận',
    });
  }

  public async toggleLike(req: Request, res: Response) {
    const userId = req.user!._id.toString();
    const commentId = req.params.commentId as string;
    const { reactionType } = req.body;

    const result = await commentService.toggleLikeComment(commentId, userId, reactionType);
    
    res.status(StatusCodes.OK).json({
      success: true,
      message: result.message,
      isLiked: result.isLiked,
      reactionType: result.reactionType,
    });
  }
}

export default new CommentController();
