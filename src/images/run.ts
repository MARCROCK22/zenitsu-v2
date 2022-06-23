console.log('Starting...');

import express from 'express';
import { checkAuth } from './middlewares.js';
import { tictactoeRouter } from './tictactoe/router.js';

const app = express();

app.use(checkAuth);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/tictactoe', tictactoeRouter);

app.listen(3333, () => {
    console.log('App listening on port 3333');
});