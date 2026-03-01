import mongoose, { Schema, Document } from 'mongoose';

export interface ICommentDocument extends Document {
  postId: mongoose.Types.ObjectId;
  author: mongoose.Types.ObjectId;
  content: string;
  image?: string;
  parentComment: mongoose.Types.ObjectId | null;
  likes: {
    userId: mongoose.Types.ObjectId;
    reactionType: string;
    createdAt: Date;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const commentSchema = new Schema<ICommentDocument>(
  {
    postId: {
      type: Schema.Types.ObjectId,
      ref: 'Post',
      required: true,
      index: true, // For finding comments of a post
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    image: {
      type: String,
      default: '',
    },
    parentComment: {
      type: Schema.Types.ObjectId,
      ref: 'Comment',
      default: null, // If null, it's a root comment. If ObjectId, it's a reply.
      index: true,
    },
    likes: [
      {
        userId: { type: Schema.Types.ObjectId, ref: 'User' },
        reactionType: { type: String, enum: ['like', 'love', 'haha', 'wow', 'sad', 'angry'], default: 'like' },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
  }
);

export const Comment = mongoose.model<ICommentDocument>('Comment', commentSchema);
