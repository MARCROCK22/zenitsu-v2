import { Router } from 'express';
import { drawTictactoeBoard } from './functions.js';

export const tictactoeRouter = Router();

tictactoeRouter.post('/game', async (req, res) => {
    res.end(await drawTictactoeBoard(req.body));
});

// router.post('/stats', async (req, res) => {
// });

// router.post('/top', async (req, res) => {
// });