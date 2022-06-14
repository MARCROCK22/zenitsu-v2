import { Game } from '@prisma/client';
import { RequestTypes } from 'detritus-client-rest';
import { ButtonStyle } from 'discord-api-types/v10';
import { API } from '../../../../api.js';
import { splitArray } from '../../../functions.js';
import { restClient } from '../../../run.js';
import { ComponentInteraction } from '../../chat/base.js';

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

    await API.database.acceptGame(interaction.user.id);
    console.log(user, opponent);
    const splited = splitArray([
        '', '', '',
        '', '', '',
        '', '', '',
    ], 3);
    const components: RequestTypes.CreateChannelMessageComponent[] = [];

    for (let i in splited) {
        const row: RequestTypes.CreateChannelMessageComponent[] = [];
        for (let j in splited[i]) {
            const index = parseInt(i) * 3 + parseInt(j);
            row.push({
                type: 2,
                style: ButtonStyle.Secondary,
                label: '-',
                customId: `tictactoe,move,${user.id},${opponent.id},${index}`,
                disabled: false,
            });
        }
        components.push({
            type: 1,
            components: row,
        });
    }

    await interaction.editResponse({
        content: game.turn === 0 ? `**${user.username}** vs ${opponent.username}` : `${user.username} vs **${opponent.username}**`,
        components,
    });
}