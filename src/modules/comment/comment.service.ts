import { Comment, ICommentDocument } from './comment.model';
import { Post } from '../post/post.model';
import { AppError } from '../../core/middlewares/error.middleware';
import { StatusCodes } from 'http-status-codes';
import { Types } from 'mongoose';
import { Notification } from '../notification/notification.model';
import notificationService from '../notification/notification.service';

class CommentService {
  public async addComment(
    authorId: string,
    postId: string,
    content: string,
    parentCommentId: string | null = null,
    image: string = ''
  ): Promise<ICommentDocument> {
    const post = await Post.findById(postId);
    if (!post) throw new AppError('Không tìm thấy bài viết', StatusCodes.NOT_FOUND);

    const newComment = await Comment.create({
      author: authorId,
      postId,
      content,
      image,
      parentComment: parentCommentId,
    });

    // Increment comment count on Post
    post.commentsCount += 1;
    await post.save();

    // Notify post author if commenter is not the author
    if (post.author.toString() !== authorId && !parentCommentId) {
      await Notification.create({
        userId: post.author,
        senderId: authorId,
        type: 'comment',
        content: 'đã bình luận về bài viết của bạn',
        postId: post._id,
      });
      notificationService.pingNotification(post.author.toString());
    }

    // Process replying notification if it's a nested comment
    if (parentCommentId) {
      const parentComment = await Comment.findById(parentCommentId);
      if (parentComment && parentComment.author.toString() !== authorId) {
        await Notification.create({
          userId: parentComment.author,
          senderId: authorId,
          type: 'comment',
          content: 'đã trả lời bình luận của bạn',
          postId: post._id,
        });
        notificationService.pingNotification(parentComment.author.toString());
      }
    }

    return newComment.populate('author', 'username displayName avatar');
  }

  public async getPostComments(postId: string, limit: number = 20, cursor?: string) {
    const query: any = { postId: new Types.ObjectId(postId), parentComment: null }; // Load root level only first

    if (cursor) {
      query.createdAt = { $lt: new Date(cursor) };
    }

    const comments = await Comment.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('author', 'username displayName avatar')
      .lean();

    // Fetch replies for these comments
    const commentIds = comments.map(c => c._id);
    const allReplies = await Comment.find({ parentComment: { $in: commentIds } })
      .sort({ createdAt: 1 })
      .populate('author', 'username displayName avatar')
      .lean();

    // Append replies to parent comments
    const commentsWithReplies = comments.map(comment => ({
      ...comment,
      replies: allReplies.filter(r => r.parentComment?.toString() === comment._id.toString())
    }));

    let nextCursor = null;
    if (commentsWithReplies.length === limit) {
      nextCursor = commentsWithReplies[commentsWithReplies.length - 1].createdAt;
    }

    return { comments: commentsWithReplies, nextCursor };
  }

  public async getReplies(parentCommentId: string) {
    const comments = await Comment.find({ parentComment: new Types.ObjectId(parentCommentId) })
      .sort({ createdAt: 1 }) // Chronological order for replies
      .populate('author', 'username displayName avatar');
      
    return comments;
  }

  public async deleteComment(commentId: string, userId: string) {
    const comment = await Comment.findById(commentId);
    if (!comment) throw new AppError('Không tìm thấy bình luận', StatusCodes.NOT_FOUND);

    const post = await Post.findById(comment.postId);
    if (!post) throw new AppError('Không tìm thấy bài viết của bình luận', StatusCodes.NOT_FOUND);

    if (comment.author.toString() !== userId && post.author.toString() !== userId) {
      throw new AppError('Bạn không có quyền xóa bình luận này', StatusCodes.FORBIDDEN);
    }

    // Delete comment and its replies
    const deletedCount = await Comment.deleteMany({
      $or: [{ _id: commentId }, { parentComment: commentId }],
    });

    post.commentsCount = Math.max(0, post.commentsCount - deletedCount.deletedCount);
    await post.save();
  }

  public async toggleLikeComment(commentId: string, userId: string, reactionType: string = 'like'): Promise<{ message: string; isLiked: boolean; reactionType?: string }> {
    const comment = await Comment.findById(commentId);
    if (!comment) throw new AppError('Không tìm thấy bình luận', StatusCodes.NOT_FOUND);

    const likeIndex = comment.likes.findIndex((like) => like.userId.toString() === userId);

    if (likeIndex > -1) {
      if (comment.likes[likeIndex].reactionType === reactionType) {
        // Unlike if same reaction
        comment.likes.splice(likeIndex, 1);
        await comment.save();
        return { message: 'Đã bỏ thích bình luận', isLiked: false };
      } else {
        // Change reaction
        comment.likes[likeIndex].reactionType = reactionType;
        await comment.save();
        return { message: 'Đã thay đổi cảm xúc bình luận', isLiked: true, reactionType };
      }
    } else {
      // Like
      comment.likes.push({ userId: new Types.ObjectId(userId), reactionType, createdAt: new Date() });
      await comment.save();

      // Create Notification if completely someone else
      if (comment.author.toString() !== userId) {
        await Notification.create({
          userId: comment.author,
          senderId: userId,
          type: 'like',
          content: 'đã bày tỏ cảm xúc về bình luận của bạn',
          postId: comment.postId, // Using the post ID
        });
        notificationService.pingNotification(comment.author.toString());
      }

      return { message: 'Đã thích bình luận', isLiked: true };
    }
  }
}

export default new CommentService();
