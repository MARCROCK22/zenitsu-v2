import { Game } from '@prisma/client';
import { AsyncQueue } from '@sapphire/async-queue';
import { ButtonStyle } from 'discord-api-types/v10';
import { API } from '../../../../api.js';
import { createComponentRow } from '../../../functions.js';
import { asyncQueues } from '../../../handler.js';
import { restClient } from '../../../run.js';
import { ComponentInteraction } from '../../base.js';

export async function request(interaction: ComponentInteraction, userId: string, opponentId: string, game: Game) {
    if (opponentId !== interaction.user.id) return;
    let user = await API.cache.get(`user:${userId}`);
    let opponent = await API.cache.get(`user:${opponentId}`);
    //fetch user and oppenent from rest if not in cache and add to cache
    if (!user) {
        const userResponse = JSON.parse(await restClient.fetchUser(userId));
        await API.cache.post(`user:${userId}`, userResponse);
        user = await API.cache.get(`user:${userId}`);
    }

    if (!opponent) {
        const opponentResponse = JSON.parse(await restClient.fetchUser(opponentId));
        await API.cache.post(`user:${opponentId}`, opponentResponse);
        opponent = await API.cache.get(`user:${opponentId}`);
    }

    if (!user || !opponent)
        //this code should never be executed, but if it is, we want to know about it
        return interaction.followUp({ content: 'User not found, if you see this please report' });

    const queue = new AsyncQueue();
    asyncQueues[userId] = queue;
    asyncQueues[opponentId] = queue;

    await API.database.acceptGame(interaction.user.id);
    console.log(user, opponent);

    await interaction.editResponse({
        content: (game.moves.length % 2) ? `[🔴] ${user.username} vs **${opponent.username}**` : `[🟡] **${user.username}** vs ${opponent.username}`,
        components: [{
            type: 1,
            components: createComponentRow(5, index => ({
                style: ButtonStyle.Secondary,
                label: (index + 1) + '',
                customId: `connect4,move,${user!.id},${opponent!.id},${index}`,
                disabled: false,
            }))
        }, {
            type: 1,
            components: createComponentRow(2, index => ({
                style: ButtonStyle.Secondary,
                label: (index + 6) + '',
                customId: `connect4,move,${user!.id},${opponent!.id},${index + 5}`,
                disabled: false,
            }))
        }],
    });
}