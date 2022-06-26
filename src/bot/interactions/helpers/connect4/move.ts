import { Game } from '@prisma/client';
import { ButtonStyle, MessageFlags } from 'discord-api-types/v10';
import { API } from '../../../../api.js';
import { restClient } from '../../../run.js';
import { ComponentInteraction } from '../../base.js';
import { createComponentRow } from '../../../functions.js';

export async function move(interaction: ComponentInteraction, userId: string, opponentId: string, index: number, game: Game): Promise<boolean> {
    let user = await API.cache.get(`user:${userId}`);
    let opponent = await API.cache.get(`user:${opponentId}`);
    //fetch user and oppenent from rest if not in cache and add to cache
    if (!user) {
        console.log('fetching user');
        const userResponse = JSON.parse(await restClient.fetchUser(userId));
        await API.cache.post(`user:${userId}`, userResponse);
        user = await API.cache.get(`user:${userId}`);
    }

    if (!opponent) {
        console.log('fetching opponent');
        const opponentResponse = JSON.parse(await restClient.fetchUser(opponentId));
        await API.cache.post(`user:${opponentId}`, opponentResponse);
        opponent = await API.cache.get(`user:${opponentId}`);
    }

    if (!user || !opponent) {
        //this code should never be executed, but if it is, we want to know about it
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
    const gameResponse = await API.database.makeMove(interaction.user.id, { type: 'Connect4', move: index + '' });
    if (!gameResponse.ok) {
        await interaction.followUp({
            content: 'Invalid move',
            flags: MessageFlags.Ephemeral
        });
        return false;
    }
    const gameData = await gameResponse.json() as Game;

    const winner = [user, opponent].find(x => x.id === gameData.winner);
    await interaction.editResponse({
        content: gameData.state === 'Finished'
            ? winner ? `${winner.username} won` : `Draw between ${user.username} and ${opponent.username}`
            : (gameData.moves.length % 2) ? `[🔴] ${user.username} vs **${opponent.username}**` : `[🟡] **${user.username}** vs ${opponent.username}`,
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
        attachments: [],
        files: [{
            value: await API.images.connect4.drawGame(gameData),
            filename: 'c4.png'
        }],
    });
    return gameData.state === 'Finished';
}