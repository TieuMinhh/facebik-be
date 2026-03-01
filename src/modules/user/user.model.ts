import mongoose, { Schema, Document } from 'mongoose';

export interface IUserDocument extends Document {
  username: string;
  displayName: string;
  email: string;
  password?: string;
  avatar: string;
  cover: string;       // Cho Facebook
  bio: string;         // Cho Facebook
  gender: 'male' | 'female' | 'other'; // Facebook
  birthday: Date;      // Facebook
  followers: mongoose.Types.ObjectId[]; // Cho Facebook
  following: mongoose.Types.ObjectId[]; // Cho Facebook
  friends: mongoose.Types.ObjectId[];   // Cho Facebook
  status: 'online' | 'offline';
  lastSeen: Date;
  blockedUsers: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUserDocument>(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
    },
    displayName: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 50,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    avatar: {
      type: String,
      default: '',
    },
    // ---- Bổ sung Facebook Data ----
    cover: {
      type: String,
      default: '',
    },
    bio: {
      type: String,
      default: '',
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other'],
      default: 'other',
    },
    birthday: {
      type: Date,
      default: null,
    },
    followers: [{
      type: Schema.Types.ObjectId,
      ref: 'User',
    }],
    following: [{
      type: Schema.Types.ObjectId,
      ref: 'User',
    }],
    friends: [{
      type: Schema.Types.ObjectId,
      ref: 'User',
    }],
    // -------------------------------
    status: {
      type: String,
      enum: ['online', 'offline'],
      default: 'offline',
    },
    lastSeen: {
      type: Date,
      default: Date.now,
    },
    blockedUsers: [{
      type: Schema.Types.ObjectId,
      ref: 'User',
    }],
  },
  {
    timestamps: true,
  }
);

// Text index for search
userSchema.index({ username: 'text', displayName: 'text', email: 'text' });

export const User = mongoose.model<IUserDocument>('User', userSchema);
