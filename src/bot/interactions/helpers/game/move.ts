import { Game } from '@prisma/client';
import { MessageFlags } from 'discord-api-types/v10';
import { API } from '../../../../api.js';
import { CachedUser } from '../../../../database/zod.js';
import { restClient } from '../../../run.js';
import { ComponentInteraction } from '../../base.js';
import { parseGameType } from './index.js';

export async function move(interaction: ComponentInteraction, index: number, game: Game): Promise<boolean> {
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

    if (game.users[game.turn] !== interaction.user.id) {
        await interaction.followUp({
            content: 'It is not your turn',
            flags: MessageFlags.Ephemeral
        });
        return false;
    }
    const gameResponse = await API.database.makeMove(interaction.user.id, { type: 'TicTacToe', move: index + '' });
    if (!gameResponse.ok) {
        await interaction.followUp({
            content: 'Invalid move',
            flags: MessageFlags.Ephemeral
        });
        return false;
    }
    const gameData = await gameResponse.json() as Game;
    await interaction.editResponse(await parseGameType(gameData.type).move(gameData, users as CachedUser[]));
    return gameData.state === 'Finished';
}