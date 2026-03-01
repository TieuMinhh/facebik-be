import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import userService from './user.service';

class UserController {
  public async getProfile(req: Request, res: Response) {
    const id = req.params.id as string;
    const currentUserId = req.user?._id?.toString();
    const user = await userService.getUserProfile(id, currentUserId);
    res.status(StatusCodes.OK).json({
      success: true,
      data: user,
    });
  }

  public async updateProfile(req: Request, res: Response) {
    const userId = req.user!._id.toString();
    // req.files may contain avatar and cover if uploaded via multer
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    
    let avatarUrl = req.body.avatar;
    let coverUrl = req.body.cover;

    if (files?.avatar) {
      avatarUrl = files.avatar[0].path; // URL from Cloudinary Storage
    }
    if (files?.cover) {
      coverUrl = files.cover[0].path; // URL from Cloudinary Storage
    }

    const updateData = {
      ...req.body,
      ...(avatarUrl && { avatar: avatarUrl }),
      ...(coverUrl && { cover: coverUrl }),
    };

    const user = await userService.updateProfile(userId, updateData);
    
    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Cập nhật hồ sơ thành công',
      data: user,
    });
  }

  public async follow(req: Request, res: Response) {
    const currentUserId = req.user!._id.toString();
    const targetUserId = req.params.id as string;

    const result = await userService.followUser(currentUserId, targetUserId);
    res.status(StatusCodes.OK).json({
      success: true,
      message: result.message,
    });
  }

  public async unfollow(req: Request, res: Response) {
    const currentUserId = req.user!._id.toString();
    const targetUserId = req.params.id as string;

    const result = await userService.unfollowUser(currentUserId, targetUserId);
    res.status(StatusCodes.OK).json({
      success: true,
      message: result.message,
    });
  }

  public async search(req: Request, res: Response) {
    const query = req.query.q as string;
    const currentUserId = req.user!._id.toString();

    const users = await userService.searchUsers(query, currentUserId);
    res.status(StatusCodes.OK).json({
      success: true,
      data: users,
    });
  }
}

export default new UserController();
