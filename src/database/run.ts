console.log('Starting...');

import { config } from 'dotenv';
import { join } from 'path';
import { RedisManager } from './manager.js';
import prismaClient from './prismaclient.js';
import express from 'express';
import { cacheRouter } from './cache.js';
import { databaseRouter } from './database.js';

config({
    path: join(process.cwd(), '.env')
});

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/cache', cacheRouter);
app.use('/database', databaseRouter);

app.get('/ping', async (req, res) => {
    const date = Date.now();
    await prismaClient.$runCommandRaw({ ping: 1 });
    const dateRedis = Date.now();
    await RedisManager.ping();
    res.json({
        database: Date.now() - date,
        redis: Date.now() - dateRedis
    });
});

app.listen(5555, () => {
    console.log('Server listening on port 5555');
});