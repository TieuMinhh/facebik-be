import mongoose, { Schema, Document } from 'mongoose';

export interface IMessageDocument extends Document {
  conversationId: mongoose.Types.ObjectId;
  senderId: mongoose.Types.ObjectId;
  content: string;
  messageType: 'text' | 'image' | 'file' | 'system' | 'voice' | 'sticker';
  attachments: {
    url: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
  }[];
  readBy: {
    userId: mongoose.Types.ObjectId;
    readAt: Date;
  }[];
  deliveredTo: {
    userId: mongoose.Types.ObjectId;
    deliveredAt: Date;
  }[];
  replyTo: mongoose.Types.ObjectId | null;
  reactions: {
    userId: mongoose.Types.ObjectId;
    emoji: string;
  }[];
  linkPreview: {
    title: string;
    description: string;
    image: string;
    url: string;
    siteName: string;
  };
  isEdited: boolean;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new Schema<IMessageDocument>(
  {
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
    },
    senderId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      default: '',
    },
    messageType: {
      type: String,
      enum: ['text', 'image', 'file', 'system', 'voice', 'sticker'],
      default: 'text',
    },
    attachments: [
      {
        url: String,
        fileName: String,
        fileSize: Number,
        mimeType: String,
      },
    ],
    readBy: [
      {
        userId: { type: Schema.Types.ObjectId, ref: 'User' },
        readAt: { type: Date, default: Date.now },
      },
    ],
    deliveredTo: [
      {
        userId: { type: Schema.Types.ObjectId, ref: 'User' },
        deliveredAt: { type: Date, default: Date.now },
      },
    ],
    replyTo: {
      type: Schema.Types.ObjectId,
      ref: 'Message',
      default: null,
    },
    reactions: [
      {
        userId: { type: Schema.Types.ObjectId, ref: 'User' },
        emoji: String,
      },
    ],
    linkPreview: {
      title: String,
      description: String,
      image: String,
      url: String,
      siteName: String,
    },
    isEdited: {
      type: Boolean,
      default: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for efficient queries
messageSchema.index({ conversationId: 1, createdAt: -1 });
messageSchema.index({ conversationId: 1, _id: -1 }); // For cursor-based pagination
messageSchema.index({ content: 'text' }); // Text search

export const Message = mongoose.model<IMessageDocument>('Message', messageSchema);
