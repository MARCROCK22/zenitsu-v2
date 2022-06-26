console.log('Starting...');

import express from 'express';
import { checkAuth } from './middlewares.js';
import { tictactoeRouter } from './tictactoe/router.js';
import { connect4Router } from './connect4/router.js';
import { config } from 'dotenv';
import { join } from 'path';

config({
    path: join(process.cwd(), '.env')
});

const app = express();

app.use(checkAuth);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/tictactoe', tictactoeRouter);
app.use('/connect4', connect4Router);

app.listen(3333, () => {
    console.log('App listening on port 3333');
});