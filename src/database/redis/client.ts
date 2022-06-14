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