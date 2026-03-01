import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { AppError } from './error.middleware';
import { StatusCodes } from 'http-status-codes';
import { User, IUserDocument } from '../../modules/user/user.model';

// Extend Express Request object to include user
declare global {
  namespace Express {
    interface Request {
      user?: IUserDocument;
    }
  }
}

export const protect = async (req: Request, res: Response, next: NextFunction) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    throw new AppError('Bạn chưa đăng nhập. Vui lòng cung cấp Access Token.', StatusCodes.UNAUTHORIZED);
  }

  try {
    const decoded = verifyToken(token);
    const user = await User.findById(decoded.id);

    if (!user) {
      throw new AppError('Tài khoản này không còn tồn tại.', StatusCodes.UNAUTHORIZED);
    }

    req.user = user;
    next();
  } catch (error) {
    throw new AppError('Access token không hợp lệ hoặc đã hết hạn.', StatusCodes.UNAUTHORIZED);
  }
};

export const optionalProtect = async (req: Request, res: Response, next: NextFunction) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next();
  }

  try {
    const decoded = verifyToken(token);
    const user = await User.findById(decoded.id);

    if (user) {
      req.user = user;
    }
    next();
  } catch (error) {
    // If token is invalid, we just don't populate req.user but let it pass
    next();
  }
};
