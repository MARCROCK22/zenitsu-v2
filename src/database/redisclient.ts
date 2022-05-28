import Redis from 'ioredis';

export const client = new Redis({
    port: 9001,
    host: 'localhost',
    enableReadyCheck: true,
});

client.on('error', (err) => {
    console.error('Error: ', err);
}).on('connect', () => {
    console.log('Connected to Redis');
}).on('reconnecting', () => {
    console.log('Reconnecting to Redis');
}).on('end', () => {
    console.warn('Disconnected from Redis');
}).on('ready', () => {
    console.log('Redis is ready');
}).on('close', () => {
    console.warn('Connection to Redis closed');
});

client.flushall()
    .then(() => {
        console.log('Flushed all keys');
    });

export async function deleteAllKeysMatched(match: string) {
    let pipeline = client.pipeline();
    const splice = 100;
    const arr = await scanMatch(match);
    for (let i = 0; i < arr.length / splice; i++) {
        pipeline.del(arr.slice(i * splice, (i + 1) * splice));
        await pipeline.exec();
        pipeline = client.pipeline();
    }
}

export function scanMatch(match: string): Promise<string[]> {
    return new Promise((r, j) => {
        const stream = client.scanStream({
            match
        });

        let keys: string[] = [];

        stream
            .on('data', async (resultKeys) => keys.push(...resultKeys))
            .on('end', async () => r(keys))
            .on('error', (err) => j(err));
    });
}