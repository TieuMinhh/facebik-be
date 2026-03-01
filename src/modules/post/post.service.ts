import { Post, IPostDocument } from './post.model';
import { User } from '../user/user.model';
import { AppError } from '../../core/middlewares/error.middleware';
import { StatusCodes } from 'http-status-codes';
import { Types } from 'mongoose';
import { Notification } from '../notification/notification.model';
import notificationService from '../notification/notification.service';

class PostService {
  public async createPost(
    authorId: string,
    content: string,
    images: string[] = [],
    videoUrl: string = '',
    privacy: string = 'public'
  ): Promise<IPostDocument> {
    if (!content && images.length === 0 && !videoUrl) {
      throw new AppError('Bài viết không thể trống', StatusCodes.BAD_REQUEST);
    }

    const newPost = await Post.create({
      author: authorId,
      content,
      images,
      videoUrl,
      privacy,
    });

    const populatedPost = await newPost.populate('author', 'username displayName avatar followers');
    const author: any = populatedPost.author;

    // Create notifications for all followers
    if (author.followers && author.followers.length > 0) {
      const followers = author.followers.map((f: any) => f.toString());
      const notificationContent = images.length > 0 
        ? 'đã thêm 1 ảnh mới' 
        : 'đã chia sẻ một bài viết mới';

      // Bulk create notifications or loop
      // For this clone, a simple loop with ping is fine, or bulk insert
      const notifications = followers.map((fId: string) => ({
        userId: new Types.ObjectId(fId),
        senderId: authorId,
        type: 'mention', // or a new 'post' type if added, currently 'mention' works best for feed
        content: notificationContent,
        postId: newPost._id,
      }));

      await Notification.insertMany(notifications);
      
      // Ping each follower
      followers.forEach((fId: string) => {
        notificationService.pingNotification(fId);
      });
    }

    return populatedPost;
  }

  public async getNewsFeed(
    userId: string,
    limit: number = 10,
    cursor?: string
  ) {
    const user = await User.findById(userId);
    if (!user) throw new AppError('Không tìm thấy người dùng', StatusCodes.NOT_FOUND);

    // List of users that current user can see (self + following)
    const viewableUserIds = [new Types.ObjectId(userId), ...user.following];

    const query: any = {
      author: { $in: viewableUserIds },
    };

    if (cursor) {
      query.createdAt = { $lt: new Date(cursor) };
    }

    const posts = await Post.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('author', 'username displayName avatar')
      .populate('likes.userId', 'username displayName avatar');

    // Mũi nhọn Pagination: Trả về nextCursor là createdAt của bài viết cuối cùng trong array
    let nextCursor = null;
    if (posts.length === limit) {
      nextCursor = posts[posts.length - 1].createdAt;
    }

    return { posts, nextCursor };
  }

  public async getUserPosts(
    userId: string,
    limit: number = 10,
    cursor?: string
  ) {
    const query: any = { author: new Types.ObjectId(userId) };

    if (cursor) {
      query.createdAt = { $lt: new Date(cursor) };
    }

    const posts = await Post.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('author', 'username displayName avatar')
      .populate('likes.userId', 'username displayName avatar');

    let nextCursor = null;
    if (posts.length === limit) {
      nextCursor = posts[posts.length - 1].createdAt;
    }

    return { posts, nextCursor };
  }

  public async deletePost(postId: string, userId: string): Promise<void> {
    const post = await Post.findById(postId);
    if (!post) throw new AppError('Không tìm thấy bài viết', StatusCodes.NOT_FOUND);

    if (post.author.toString() !== userId) {
      throw new AppError('Không có quyền xóa bài viết này', StatusCodes.FORBIDDEN);
    }

    await post.deleteOne();
  }

  public async toggleLikePost(postId: string, userId: string, reactionType: string = 'like'): Promise<{ message: string; isLiked: boolean; reactionType?: string }> {
    const post = await Post.findById(postId);
    if (!post) throw new AppError('Không tìm thấy bài viết', StatusCodes.NOT_FOUND);

    const likeIndex = post.likes.findIndex((like) => like.userId.toString() === userId);

    if (likeIndex > -1) {
      const currentReaction = post.likes[likeIndex].reactionType;
      
      // Khác reaction thì cập nhật reaction mới
      if (reactionType && currentReaction !== reactionType) {
        post.likes[likeIndex].reactionType = reactionType as any;
        post.likes[likeIndex].createdAt = new Date();
        await post.save();
        return { message: 'Đã thay đổi cảm xúc', isLiked: true, reactionType };
      }
      
      // Giống reaction (hoặc default like) thì Bỏ thích (Unlike)
      post.likes.splice(likeIndex, 1);
      await post.save();
      return { message: 'Đã bỏ thích', isLiked: false };
    } else {
      // Like mới
      post.likes.push({ userId: new Types.ObjectId(userId), reactionType: (reactionType as any) || 'like', createdAt: new Date() });
      await post.save();

      // Create Notification if completely someone else
      if (post.author.toString() !== userId) {
        await Notification.create({
          userId: post.author,
          senderId: userId,
          type: 'like',
          content: 'đã bày tỏ cảm xúc về bài viết của bạn',
          postId: post._id,
        });

        // Gửi qua Sockets
        notificationService.pingNotification(post.author.toString());
      }

      return { message: 'Đã bày tỏ cảm xúc', isLiked: true, reactionType };
    }
  }
}

export default new PostService();
