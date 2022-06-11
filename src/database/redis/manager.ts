import { AsyncQueue } from '@sapphire/async-queue';
import { client as redisClient } from './client.js';

export const RedisManagerQueue = new AsyncQueue();

export const RedisManager = {
    client: redisClient,
    ping() {
        return this.client.ping();
    },
    async set(key: string, value: Record<string, any> | string, time?: number) {
        const res = time
            ? await this.client.setex(key, time, typeof value === 'object' ? JSON.stringify(value) : value)
            : await this.client.set(key, typeof value === 'object' ? JSON.stringify(value) : value);
        RedisManagerQueue.shift();
        return res;
    },
    async get(key: string) {
        const res = await this.client.get(key);
        return res;
    },
    async delete(key: string) {
        const res = await this.client.del(key);
        return res;
    },
    async deleteAllKeysMatched(match: string) {
        let pipeline = this.client.pipeline();
        const splice = 100;
        const arr = await this.scanMatch(match);
        for (let i = 0; i < arr.length / splice; i++) {
            pipeline.del(arr.slice(i * splice, (i + 1) * splice));
            await pipeline.exec();
            pipeline = this.client.pipeline();
        }
        return arr;
    },
    scanMatch(match: string) {
        return new Promise<string[]>((r, j) => {
            const stream = this.client.scanStream({
                match
            });

            let keys: string[] = [];

            stream
                .on('data', (resultKeys) => keys.push(...resultKeys))
                .on('end', () => r(keys))
                .on('error', (err) => j(err));
        });
    }
};