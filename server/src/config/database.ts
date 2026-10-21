import mongoose from 'mongoose';
import { envConfig } from './env.js';

let isConnected = false;

export async function connectDatabase(uri?: string): Promise<typeof mongoose> {
  if (isConnected && mongoose.connection.readyState === 1) {
    return mongoose;
  }

  const targetUri = uri || envConfig.MONGODB_URI;

  try {
    const conn = await mongoose.connect(targetUri, {
      serverSelectionTimeoutMS: 5000,
      autoIndex: envConfig.NODE_ENV !== 'production', // Build indexes in dev/test, disable in high-scale prod
    });

    isConnected = true;
    if (envConfig.NODE_ENV !== 'test') {
      console.log(`[MongoDB] Connected successfully to: ${conn.connection.host}/${conn.connection.name}`);
    }

    mongoose.connection.on('error', (err) => {
      console.error('[MongoDB Error]', err);
    });

    mongoose.connection.on('disconnected', () => {
      isConnected = false;
      if (envConfig.NODE_ENV !== 'test') {
        console.warn('[MongoDB] Disconnected from database.');
      }
    });

    return conn;
  } catch (err) {
    isConnected = false;
    console.error('[MongoDB Connection Failure]', err instanceof Error ? err.message : err);
    throw err;
  }
}

export async function disconnectDatabase(): Promise<void> {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    isConnected = false;
    if (envConfig.NODE_ENV !== 'test') {
      console.log('[MongoDB] Cleanly disconnected.');
    }
  }
}
