import { Router } from 'express';
import prismaClient from './prismaclient.js';

const databaseRouter = Router();

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
    const { type, users, channelId, messageId } = req.body;
    if (await prismaClient.game.findFirst({
        where: {
            users: {
                hasSome: users
            }
        },
        select: { id: true },
    })) return res.status(400).send('Game already exists');
    const data = await prismaClient.game.create({
        data: {
            type,
            users,
            channelId,
            messageId,
            state: 'waiting'
        }
    });
    res.json(data);
});

export { databaseRouter };

