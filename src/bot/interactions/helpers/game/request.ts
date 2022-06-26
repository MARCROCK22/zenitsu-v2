import { Game } from '@prisma/client';
import { AsyncQueue } from '@sapphire/async-queue';
import { API } from '../../../../api.js';
import { CachedUser } from '../../../../database/zod.js';
import { asyncQueues } from '../../../handler.js';
import { restClient } from '../../../run.js';
import { ComponentInteraction } from '../../base.js';
import { parseGameType } from './index.js';

export async function request(interaction: ComponentInteraction, game: Game) {
    if (game.users[1] !== interaction.user.id) return;
    // let user = await API.cache.get(`user:${userId}`);
    // let opponent = await API.cache.get(`user:${opponentId}`);
    //fetch user and oppenent from rest if not in cache and add to cache
    // if (!user) {
    //     console.log('fetching user');
    //     const userResponse = JSON.parse(await restClient.fetchUser(userId));
    //     await API.cache.post(`user:${userId}`, userResponse);
    //     user = await API.cache.get(`user:${userId}`);
    // }

    // if (!opponent) {
    //     console.log('fetching opponent');
    //     const opponentResponse = JSON.parse(await restClient.fetchUser(opponentId));
    //     await API.cache.post(`user:${opponentId}`, opponentResponse);
    //     opponent = await API.cache.get(`user:${opponentId}`);
    // }

    let users = await Promise.all(game.users.map(async userId => {
        let user = await API.cache.get(`user:${userId}`);
        if (!user) {
            console.log('fetching user');
            const userResponse = JSON.parse(await restClient.fetchUser(userId));
            await API.cache.post(`user:${userId}`, userResponse);
            user = await API.cache.get(`user:${userId}`);
        }
        return user;
    }));

    // if (!user || !opponent) {
    //     //this code should never be executed, but if it is, we want to know about it
    //     await interaction.followUp({ content: 'User not found, if you see this please report' });
    //     return false;
    // }

    if (users.some(x => !x)) {
        console.log(users);
        await interaction.followUp({ content: 'User not found, if you see this please report' });
        return false;
    }

    const queue = new AsyncQueue();
    for (let i of users) asyncQueues[i!.id] = queue;
    await API.database.acceptGame(interaction.user.id);
    await interaction.editResponse(parseGameType(game.type).request(game, users as CachedUser[]));
}