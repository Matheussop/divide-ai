import Redis from "ioredis";

const redisUrl = process.env.divide_ai_bd_REDIS_URL ?? process.env.REDIS_URL;

if (!redisUrl) {
  throw new Error(
    "Missing Redis URL. Set divide_ai_bd_REDIS_URL or REDIS_URL in environment variables."
  );
}

const globalForRedis = globalThis as unknown as {
  redis?: Redis;
};

export const redis =
  globalForRedis.redis ??
  new Redis(redisUrl, {
    maxRetriesPerRequest: 3,
  });

if (process.env.NODE_ENV !== "production") {
  globalForRedis.redis = redis;
}

export async function getJSON<T>(key: string): Promise<T | null> {
  const raw = await redis.get(key);
  if (raw === null) return null;
  return JSON.parse(raw) as T;
}

export async function setJSON<T>(key: string, value: T): Promise<void> {
  await redis.set(key, JSON.stringify(value));
}
