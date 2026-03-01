import { createClient } from 'redis';
import { env } from './env';

export const redisClient = createClient({
  url: env.redisUrl,
});

redisClient.on('error', (err) => {
  console.error('❌ Redis Client Error:', err);
});

redisClient.on('connect', () => {
  console.log('✅ Redis Connected');
});

// We connect it asynchronously in index/server
export const connectRedis = async () => {
  try {
    await redisClient.connect();
  } catch (error) {
    console.error('Redis connection failed', error);
  }
};
