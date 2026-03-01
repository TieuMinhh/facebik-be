import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import 'express-async-errors'; // Auto-handle promise rejections in routes
import http from 'http';
import { Server } from 'socket.io';
import { connectDB } from './core/configs/db';
import { connectRedis } from './core/configs/redis';
import { env } from './core/configs/env';
import { errorHandler } from './core/middlewares/error.middleware';
import rootRouter from './routes';
import userService from './modules/user/user.service';

const app: Express = express();
const httpServer = http.createServer(app);

// Socket.io initialization
export const io = new Server(httpServer, {
  cors: {
    origin: env.frontendUrl,
    credentials: true,
  },
});

// Middleware
app.use(helmet());
app.use(
  cors({
    origin: env.frontendUrl,
    credentials: true, // Allow cookies
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Database connection
connectDB();
connectRedis();

// API Routes
app.use('/api', rootRouter);

// Health Check
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'OK', message: 'Facebook Clone Backend is running' });
});

// Realtime WebSocket Entry
io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);
  
  const setupUser = async (userId: string) => {
    socket.join(userId);
    (socket as any).userId = userId; // Store userId in socket object
    console.log(`User ${userId} joined personal room`);
    
    // Update user status in DB
    await userService.updateStatus(userId, 'online');
    
    // Broadcast status change
    io.emit('user_status_change', { userId, status: 'online' });
    
    socket.emit('connected');
  };

  socket.on('setup', setupUser);
  socket.on('join_personal_room', setupUser);

  socket.on('typing', (receiverId: string) => {
    socket.in(receiverId).emit('typing');
  });

  socket.on('stop_typing', (receiverId: string) => {
    socket.in(receiverId).emit('stop_typing');
  });

  socket.on('disconnect', async () => {
    const userId = (socket as any).userId;
    console.log(`Socket disconnected: ${socket.id}, User: ${userId}`);
    
    if (userId) {
      // Check if user has other active connections (could be multiple tabs)
      const userSockets = await io.in(userId).fetchSockets();
      if (userSockets.length === 0) {
        // Only mark offline if no other sockets are connected to this userId
        await userService.updateStatus(userId, 'offline');
        io.emit('user_status_change', { userId, status: 'offline' });
      }
    }
  });
});

// Global Error Handler
app.use(errorHandler);

httpServer.listen(env.port, () => {
  console.log(`🚀 Server running in ${env.nodeEnv} mode on port ${env.port}`);
});
