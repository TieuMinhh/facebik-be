import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import postService from './post.service';

class PostController {
  public async createPost(req: Request, res: Response) {
    const userId = req.user!._id.toString();
    const { content, videoUrl, privacy } = req.body;
    
    let images: string[] = [];
    if (req.files && Array.isArray(req.files)) {
      images = req.files.map((file: any) => file.path);
    }

    const post = await postService.createPost(userId, content, images, videoUrl, privacy);
    
    res.status(StatusCodes.CREATED).json({
      success: true,
      message: 'Mới đăng bài viết thành công!',
      data: post,
    });
  }

  public async getFeed(req: Request, res: Response) {
    const userId = req.user!._id.toString();
    const limit = parseInt(req.query.limit as string) || 10;
    const cursor = req.query.cursor as string | undefined;

    const result = await postService.getNewsFeed(userId, limit, cursor);
    
    res.status(StatusCodes.OK).json({
      success: true,
      data: result.posts,
      nextCursor: result.nextCursor,
    });
  }

  public async getUserPosts(req: Request, res: Response) {
    const targetUserId = req.params.userId as string;
    const limit = parseInt(req.query.limit as string) || 10;
    const cursor = req.query.cursor as string | undefined;

    const result = await postService.getUserPosts(targetUserId, limit, cursor);
    
    res.status(StatusCodes.OK).json({
      success: true,
      data: result.posts,
      nextCursor: result.nextCursor,
    });
  }

  public async deletePost(req: Request, res: Response) {
    const userId = req.user!._id.toString();
    const postId = req.params.id as string;

    await postService.deletePost(postId, userId);
    
    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Xóa bài viết thành công',
    });
  }

  public async toggleLike(req: Request, res: Response) {
    const userId = req.user!._id.toString();
    const postId = req.params.id as string;
    const { reactionType } = req.body || {};

    const result = await postService.toggleLikePost(postId, userId, reactionType);
    
    res.status(StatusCodes.OK).json({
      success: true,
      message: result.message,
      isLiked: result.isLiked,
      reactionType: result.reactionType,
    });
  }
}

export default new PostController();
