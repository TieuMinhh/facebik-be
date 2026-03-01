import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';

// Custom error class
export class AppError extends Error {
  public statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Global error handler
export const errorHandler = (err: Error | AppError, req: Request, res: Response, next: NextFunction) => {
  console.error('[Error]:', err.message);
  
  const statusCode = err instanceof AppError ? err.statusCode : StatusCodes.INTERNAL_SERVER_ERROR;
  const message = err.message || 'Internal Server Error';
  
  res.status(statusCode).json({
    success: false,
    message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
};
