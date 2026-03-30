/**
 * MongoDB connection singleton for Next.js
 * Reuses existing connection in development (hot-reload) and production.
 */
import mongoose from 'mongoose';

// ✅ FIXED: Import all models here so they're always registered
// regardless of which API route is called first
import '@/models/Branch';
import '@/models/Patient';
import '@/models/Dentist';
import '@/models/Appointment';

const MONGODB_URI = process.env.MONGODB_URI as string;

if (!MONGODB_URI) {
  throw new Error('Please define MONGODB_URI in your .env file');
}

// Global cache to prevent multiple connections during hot-reload
interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var _mongooseCache: MongooseCache;
}

const cache: MongooseCache = global._mongooseCache || { conn: null, promise: null };
global._mongooseCache = cache;

export async function connectDB(): Promise<typeof mongoose> {
  if (cache.conn) return cache.conn;

  if (!cache.promise) {
    cache.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
    });
  }

  cache.conn = await cache.promise;
  return cache.conn;
}