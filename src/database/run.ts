console.log('Starting...');

import { config } from 'dotenv';
import { join } from 'path';
import { RedisManager } from './redis/manager.js';
import express from 'express';
import { cacheRouter } from './cache.js';
import { databaseRouter } from './database.js';
import { executeFunction } from './functions.js';
import { checkAuth } from './middlewares.js';
import mongoose from 'mongoose';

config({
    path: join(process.cwd(), '.env')
});

mongoose.connect(process.env.DATABASE_URL!)
    .then(() => {
        console.log('Connected to mongoose');
    });

const app = express();

app.use(checkAuth);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/cache', cacheRouter);
app.use('/database', databaseRouter);

app.get('/ping', async (_req, res) => {
    const databasePing
        = (await executeFunction(() => new Promise((r, j) => {
            mongoose.connection.db
                .admin()
                .ping((err, result) => (err || !result) ? j(err || result) : r(true));
        }))).took;
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