import { Game } from '@prisma/client';
import { RequestTypes } from 'detritus-client-rest';
import { ButtonStyle, MessageFlags } from 'discord-api-types/v10';
import { API } from '../../../../api.js';
import { splitArray } from '../../../functions.js';
import { restClient } from '../../../run.js';
import { ComponentInteraction } from '../../base.js';

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
        //this code should never be executed, but if it is, we want to know about it{
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
    const components: RequestTypes.CreateChannelMessageComponent[] = [];
    const splited = splitArray(gameData.board, 3);
    for (let i in splited) {
        const row: RequestTypes.CreateChannelMessageComponent[] = [];
        for (let j in splited[i]) {
            const index = parseInt(i) * 3 + parseInt(j);
            row.push({
                type: 2,
                style: ButtonStyle.Secondary,
                label: gameData.board[index] || '-',
                customId: `tictactoe,move,${user.id},${opponent.id},${index}`,
                disabled: !!gameData.board[index] || gameData.state === 'Finished',
            });
        }
        components.push({
            type: 1,
            components: row
        });
    }
    const winner = [user, opponent].find(x => x.id === gameData.winner);
    await interaction.editResponse({
        content: gameData.state === 'Finished'
            ? winner ? `${winner.username} won` : `Draw between ${user.username} and ${opponent.username}`
            : !(gameData.moves.length % 2) ? `[X] ${user.username} vs **${opponent.username}**` : `[O] **${user.username}** vs ${opponent.username}`,
        components,
        attachments: [],
        files: [{
            value: await API.images.tictactoe.drawGame(gameData),
            filename: 'ttt.png'
        }],
    });
    return gameData.state === 'Finished';
}