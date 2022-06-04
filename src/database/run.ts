console.log('Starting...');

import { config } from 'dotenv';
import { join } from 'path';
import { RedisManager } from './manager.js';
import prismaClient from './prismaclient.js';
import express from 'express';
import { cacheRouter } from './cache.js';
import { databaseRouter } from './database.js';
import { executeFunction } from './functions.js';

config({
    path: join(process.cwd(), '.env')
});

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/cache', cacheRouter);
app.use('/database', databaseRouter);

app.get('/ping', async (req, res) => {
    const databasePing
        = (await executeFunction(() => prismaClient.$runCommandRaw({ ping: 1 }))).took;
    const redisPing
        = (await executeFunction(() => RedisManager.ping())).took;
    res.json({
        database: databasePing,
        redis: redisPing
    });
});

app.listen(5555, () => {
    console.log('Server listening on port 5555');
});