import mongoose, { Schema, Document } from 'mongoose';

export interface IPostDocument extends Document {
  author: mongoose.Types.ObjectId;
  content: string;
  images: string[];
  videoUrl: string;
  privacy: 'public' | 'friends' | 'private';
  likes: {
    userId: mongoose.Types.ObjectId;
    reactionType: 'like' | 'love' | 'haha' | 'wow' | 'sad' | 'angry';
    createdAt: Date;
  }[];
  commentsCount: number;
  sharesCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const postSchema = new Schema<IPostDocument>(
  {
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    content: {
      type: String,
      default: '',
    },
    images: [{ type: String }],
    videoUrl: { type: String, default: '' },
    privacy: {
      type: String,
      enum: ['public', 'friends', 'private'],
      default: 'public',
    },
    likes: [
      {
        userId: { type: Schema.Types.ObjectId, ref: 'User' },
        reactionType: {
          type: String,
          enum: ['like', 'love', 'haha', 'wow', 'sad', 'angry'],
          default: 'like',
        },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    commentsCount: { type: Number, default: 0 },
    sharesCount: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

// Indexes mapping fast feed queries
postSchema.index({ createdAt: -1 }); // Order newest to oldest
postSchema.index({ privacy: 1, createdAt: -1 });
postSchema.index({ author: 1, createdAt: -1 }); // Retrieve profile timeline

export const Post = mongoose.model<IPostDocument>('Post', postSchema);
