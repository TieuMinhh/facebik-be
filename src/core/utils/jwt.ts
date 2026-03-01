import jwt from 'jsonwebtoken';
import { env } from '../configs/env';
import { Types } from 'mongoose';

export const generateAccessToken = (userId: Types.ObjectId): string => {
  return jwt.sign({ id: userId.toString() }, env.jwtSecret as string, {
    expiresIn: env.jwtAccessExpiration as string,
  } as any);
};

export const generateRefreshToken = (userId: Types.ObjectId): string => {
  return jwt.sign({ id: userId.toString() }, env.jwtSecret as string, {
    expiresIn: env.jwtRefreshExpiration as string,
  } as any);
};

export const verifyToken = (token: string): { id: string } => {
  return jwt.verify(token, env.jwtSecret) as { id: string };
};
