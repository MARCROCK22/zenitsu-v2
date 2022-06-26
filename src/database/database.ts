import { Router } from 'express';
import { GameTTT } from './classes/tictactoe.js';
import { gameSchema } from './models/game.js';
//fix this
import __moduleConnect4 from '@lil_marcrock22/connect4-ai';

const { Connect4 } = __moduleConnect4;

const databaseRouter = Router();
const defaultBoards = {
    TicTacToe: [
        '', '', '',
        '', '', '',
        '', '', '',
    ],
    Connect4: [
        '', '', '', '', '', '',
        '', '', '', '', '', '',
        '', '', '', '', '', '',
        '', '', '', '', '', '',
        '', '', '', '', '', '',
        '', '', '', '', '', '',
        '', '', '', '', '', ''
    ],
    //Think about this
    Domino: []
} as Record<string, string[]>;

databaseRouter.post('/game/:userId/move', async (req, res) => {
    const { type, move } = req.body;
    const { userId } = req.params;
    const data = await gameSchema.findOne({
        users: userId
    });
    if (!data) return res.status(400).send('Game not found');

    switch (type) {
        case 'TicTacToe': {
            const game = new GameTTT();
            for (let i of data.moves)
                game.play(Number(i.split(',')[1]));
            if (!game.canPlay(move)) return res.status(400).send('Invalid move');
            game.play(move);
            const updatedGame = await gameSchema.findOneAndUpdate({
                id: data.id
            }, {
                board: game.map,
                turn: game.finished ? data.turn : (data.turn === 0 ? 1 : 0),
                $push: {
                    moves: `${userId},${move},${Math.floor(Math.random() * 9)}`
                },
                state: game.finished ? 'Finished' : 'Playing',
                winner: !game.draw && game.finished ? userId : null,
            }, { new: true });
            res.json(updatedGame);
            break;
        }
        case 'Connect4': {
            const game = new Connect4({ columns: 7, lengthArr: 6, necessaryToWin: 4 }, [null, null]);
            game.createBoard();
            for (let i of data.moves)
                game.play(Number(i.split(',')[1]));
            if (!game.canPlay(move)) return res.status(400).send('Invalid move');
            game.play(move);
            const updatedGame = await gameSchema.findOneAndUpdate({
                id: data.id
            }, {
                board: Object.values(game.map).flat().map(x => x.key.toString()),
                turn: game.finished ? data.turn : (data.turn === 0 ? 1 : 0),
                moves: {
                    push: `${userId},${move}`
                },
                state: game.finished ? 'Finished' : 'Playing',
                winner: game.winner ? userId : null,
            }, { new: true });
            res.json(updatedGame);
            break;
        }
        default: {
            res.status(400).send('Invalid game type');
            break;
        }
    }

});

databaseRouter.put('/game', async (req, res) => {
    const { type, users, channelId, messageId, guildId, turn } = req.body;
    if (await gameSchema.exists({
        $or: (users as string[]).map(x => ({ users: x }))
    })) return res.status(400).send('Game already exists');
    if (!(type in defaultBoards)) return res.status(400).send('Invalid game type');
    const data = await gameSchema.create({
        type,
        users,
        channelId,
        messageId,
        guildId,
        turn,
        board: defaultBoards[type as keyof typeof defaultBoards],
        owner: users[0]
    });
    res.json(data);
});

databaseRouter.get('/game/:userId', async (req, res) => {
    const { userId } = req.params;
    const data = await gameSchema.findOne({
        users: userId
    });
    res.json(data);
});

databaseRouter.delete('/game/:userId', async (req, res) => {
    const { userId } = req.params;
    const data = await gameSchema.findOne({
        users: userId
    });
    if (!data) return res.status(400).send('Game not found');
    if (data.owner === userId || data.users.length === 2)
        await gameSchema.deleteMany({
            users: userId
        });
    else await gameSchema.updateOne({
        users: userId,
    }, {
        $pull: {
            accepted: userId,
            users: !data.accepted.includes(userId) ? userId : undefined,
        }
    });
    res.send('OK');
});

databaseRouter.post('/game/:userId/start', async (req, res) => {
    const { userId } = req.params;
    const game = await gameSchema.findOne({
        users: userId
    });
    if (!game) return res.status(400).send('Game not found');
    const gameUpdated = await gameSchema.findOneAndUpdate({
        id: game.id
    }, {
        state: 'Playing',
        users: game.accepted
    }, { new: true });
    return res.json(gameUpdated);
});

databaseRouter.post('/game/:userId/accept', async (req, res) => {
    const { userId } = req.params;
    const game = await gameSchema.findOne({
        users: userId
    });
    if (!game) return res.status(400).send('Game not found');
    const gameUpdated = await gameSchema.findOneAndUpdate({
        id: game.id
    }, {
        state: game.users.length === 2
            ? 'Playing'
            : game.users.length === (game.accepted.filter(x => x !== userId).length + 1)
                ? 'Playing'
                : 'Waiting',
        $addToSet: {
            accepted: userId
        }
    }, { new: true });
    return res.json(gameUpdated);
});

export { databaseRouter };