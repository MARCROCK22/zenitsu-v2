import { Router } from 'express';
import { drawConnect4Board } from './functions.js';

export const connect4Router = Router();

connect4Router.post('/game', async (req, res) => {
    res.end(await drawConnect4Board(req.body));
});

// router.post('/stats', async (req, res) => {
// });

// router.post('/top', async (req, res) => {
// });