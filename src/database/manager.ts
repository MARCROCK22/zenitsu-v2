import { AsyncQueue } from '@sapphire/async-queue';
import { client as redisClient } from './redisclient.js';

export const RedisManagerQueue = new AsyncQueue();

export const RedisManager = {
    client: redisClient,
    ping() {
        return this.client.ping();
    },
    async set(key: string, value: Record<string, any> | string, time?: number) {
        const res = time
            ? await redisClient.setex(key, time, typeof value === 'object' ? JSON.stringify(value) : value)
            : await redisClient.set(key, typeof value === 'object' ? JSON.stringify(value) : value);
        RedisManagerQueue.shift();
        return res;
    },
    async get(key: string) {
        const res = await redisClient.get(key);
        return res;
    },
    async delete(key: string) {
        const res = await redisClient.del(key);
        return res;
    }
};