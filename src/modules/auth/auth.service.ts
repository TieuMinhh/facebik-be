import bcrypt from 'bcrypt';
import { User } from '../user/user.model';
import { AppError } from '../../core/middlewares/error.middleware';
import { StatusCodes } from 'http-status-codes';
import { generateAccessToken, generateRefreshToken, verifyToken } from '../../core/utils/jwt';
import { Response } from 'express';
import { env } from '../../core/configs/env';
import { Types } from 'mongoose';

class AuthService {
  public async register(data: any) {
    const { username, displayName, email, password, gender, birthday } = data;

    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      throw new AppError('Email hoặc Username đã được sử dụng', StatusCodes.BAD_REQUEST);
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      username,
      displayName,
      email,
      password: hashedPassword,
      gender: gender || 'other',
      birthday: birthday || null,
    });

    // Remove password from payload
    const userObj = user.toObject();
    delete userObj.password;
    
    return userObj;
  }

  public async login(email: string, password: string) {
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      throw new AppError('Tài khoản không tồn tại', StatusCodes.UNAUTHORIZED);
    }

    const isMatch = await bcrypt.compare(password, user.password as string);
    if (!isMatch) {
      throw new AppError('Sai mật khẩu', StatusCodes.UNAUTHORIZED);
    }

    // Update status to online
    user.status = 'online';
    await user.save();

    const userObj = user.toObject();
    delete userObj.password;

    return userObj;
  }

  public async generateTokens(userId: Types.ObjectId, res: Response) {
    const accessToken = generateAccessToken(userId);
    const refreshToken = generateRefreshToken(userId);

    // Save refresh token in HttpOnly Cookie
    const isProduction = env.nodeEnv === 'production';
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: isProduction, // Phải là true nếu dùng SameSite=None
      sameSite: isProduction ? 'none' : 'lax', // 'none' cho phép gửi chéo domain giữa Vercel/Render
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // TODO: Có thể lưu refreshToken vào Redis để dễ quản lý thu hồi (Revoke) ở Phase 2

    return accessToken;
  }

  public async refreshToken(token: string, res: Response) {
    if (!token) {
      throw new AppError('Không tìm thấy Refresh Token', StatusCodes.UNAUTHORIZED);
    }

    try {
      const decoded = verifyToken(token);
      return { accessToken: await this.generateTokens(new Types.ObjectId(decoded.id), res) };
    } catch (error) {
      throw new AppError('Refresh Token hết hạn hoặc không hợp lệ', StatusCodes.UNAUTHORIZED);
    }
  }
}

export default new AuthService();
