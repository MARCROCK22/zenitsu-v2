import { Router } from 'express';
import { GameTTT } from './classes/tictactoe.js';
import { prismaClient } from './prisma/client.js';

const databaseRouter = Router();
const defaultBoards = {
    TicTacToe: [
        '', '', '',
        '', '', '',
        '', '', '',
    ]
} as Record<string, string[]>;

// prismaClient.queuedGame.deleteMany({
//     where: {
//         users: {
//             has: '507367752391196682'
//         }
//     }
// }).then((x) => {
//     console.log(x);
// });

databaseRouter.put('/game', async (req, res) => {
    const { type, users, channelId, messageId, guildId, turn } = req.body;
    if (await prismaClient.game.findFirst({
        where: {
            users: {
                hasSome: users
            }
        },
        select: { id: true },
    })) return res.status(400).send('Game already exists');
    if (!(type in defaultBoards)) return res.status(400).send('Invalid game type');
    const data = await prismaClient.game.create({
        data: {
            type,
            users,
            channelId,
            messageId,
            guildId,
            turn,
            board: defaultBoards[type as keyof typeof defaultBoards],
        }
    });
    res.json(data);
});

databaseRouter.get('/game/:userId', async (req, res) => {
    const { userId } = req.params;
    const data = await prismaClient.game.findFirst({
        where: {
            users: {
                hasSome: userId
            },
        },
    });
    res.json(data);
});

databaseRouter.delete('/game/:userId', async (req, res) => {
    const { userId } = req.params;
    await prismaClient.game.deleteMany({
        where: {
            users: {
                hasSome: userId
            }
        }
    });
    res.send('OK');
});

databaseRouter.post('/game/:userId/move', async (req, res) => {
    const { type, move } = req.body;
    const { userId } = req.params;
    const data = await prismaClient.game.findFirst({
        where: {
            users: {
                hasSome: userId
            }
        },
    });
    if (!data) return res.status(400).send('Game not found');

    switch (type) {
        case 'TicTacToe': {
            const game = new GameTTT();
            for (let i of data.moves)
                game.play(Number(i.split(',')[1]));
            if (!game.canPlay(move)) return res.status(400).send('Invalid move');
            console.log(game.finished, game.draw, game.winner, game.map);
            game.play(move);
            const updatedGame = await prismaClient.game.update({
                where: {
                    id: data.id
                },
                data: {
                    board: game.map,
                    turn: game.finished ? data.turn : (data.turn === 0 ? 1 : 0),
                    moves: {
                        push: `${userId},${move}`
                    },
                    state: game.finished ? 'Finished' : 'Playing',
                    winner: !game.draw && game.finished ? userId : null,
                }
            });
            console.log(game.finished, game.draw, game.winner, game.map);
            // if (game.finished) await prismaClient.game.delete({
            //     where: {
            //         id: data.id
            //     }
            // });
            res.json(updatedGame);
            break;
        }
        default: {
            res.status(400).send('Invalid game type');
            break;
        }
    }

});


databaseRouter.post('/game/:userId/move', async (req, res) => {
    const { userId } = req.params;
    const data = await prismaClient.game.findFirst({
        where: {
            users: {
                hasSome: userId
            },
        },
    });
    if (!data) return res.status(400).send('Game not found');
    const gameUpdated = await prismaClient.game.update({
        where: {
            id: data.id
        },
        data: {
            state: 'Playing'
        }
    });
    return res.json(gameUpdated);
});

export { databaseRouter };