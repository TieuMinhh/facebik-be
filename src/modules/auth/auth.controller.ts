import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import authService from './auth.service';
import { env } from '../../core/configs/env';

class AuthController {
  public async register(req: Request, res: Response) {
    const { username, displayName, email, password } = req.body;

    const user = await authService.register({ username, displayName, email, password });
    
    // Create tokens
    const accessToken = await authService.generateTokens(user._id as any, res);

    res.status(StatusCodes.CREATED).json({
      success: true,
      message: 'Đăng ký thành công',
      data: { user, accessToken },
    });
  }

  public async login(req: Request, res: Response) {
    const { email, password } = req.body;

    const user = await authService.login(email, password);
    const accessToken = await authService.generateTokens(user._id as any, res);

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Đăng nhập thành công',
      data: { user, accessToken },
    });
  }

  public async logout(req: Request, res: Response) {
    // Xóa cookie
    const isProduction = env.nodeEnv === 'production';
    res.clearCookie('refresh_token', {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      path: '/',
    });

    res.status(StatusCodes.OK).json({ success: true, message: 'Đăng xuất thành công' });
  }

  public async refresh(req: Request, res: Response) {
    const refreshToken = req.cookies.refresh_token;
    
    // Auth service xử lý logic cấp accessToken
    const tokens = await authService.refreshToken(refreshToken, res);

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Refresh token thành công',
      data: { accessToken: tokens.accessToken },
    });
  }

  public async getMe(req: Request, res: Response) {
    res.status(StatusCodes.OK).json({
      success: true,
      data: req.user,
    });
  }
}

export default new AuthController();
