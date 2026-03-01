import mongoose, { Schema, Document } from 'mongoose';

export interface IFriendRequestDocument extends Document {
  sender: mongoose.Types.ObjectId;
  recipient: mongoose.Types.ObjectId;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
}

const friendRequestSchema = new Schema<IFriendRequestDocument>(
  {
    sender: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    recipient: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
  }
);

// Tránh gửi nhiều lời mời giữa 2 người (sender/recipient combo)
friendRequestSchema.index({ sender: 1, recipient: 1 }, { unique: true });

export const FriendRequest = mongoose.model<IFriendRequestDocument>('FriendRequest', friendRequestSchema);
