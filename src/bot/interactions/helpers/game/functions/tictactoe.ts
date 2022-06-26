import { Game } from '@prisma/client';
import { RequestTypes } from 'detritus-client-rest';
import { ButtonStyle } from 'discord-api-types/v10';
import { API } from '../../../../../api.js';
import { CachedUser } from '../../../../../database/zod.js';
import { splitArray } from '../../../../functions.js';

export function request(game: Game, users: CachedUser[]): RequestTypes.EditWebhookTokenMessage {
    const [user, opponent] = users;
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
    return {
        content: (game.moves.length % 2) ? `[O] ${user.username} vs **${opponent.username}**` : `[X] **${user.username}** vs ${opponent.username}`,
        components,
    };
}

export async function move(game: Game, users: CachedUser[]): Promise<RequestTypes.EditWebhookTokenMessage> {
    const [user, opponent] = users;
    const winner = users.find(x => x.id === game.winner);
    const components: RequestTypes.CreateChannelMessageComponent[] = [];
    const splited = splitArray(game.board, 3);
    for (let i in splited) {
        const row: RequestTypes.CreateChannelMessageComponent[] = [];
        for (let j in splited[i]) {
            const index = parseInt(i) * 3 + parseInt(j);
            row.push({
                type: 2,
                style: ButtonStyle.Secondary,
                label: game.board[index] || '-',
                customId: `tictactoe,move,${user.id},${opponent.id},${index}`,
                disabled: !!game.board[index] || game.state === 'Finished',
            });
        }
        components.push({
            type: 1,
            components: row
        });
    }
    return {
        content: game.state === 'Finished'
            ? winner ? `${winner.username} won` : `Draw between ${user.username} and ${opponent.username}`
            : (game.moves.length % 2) ? `[O] ${user.username} vs **${opponent.username}**` : `[X] **${user.username}** vs ${opponent.username}`,
        components,
        attachments: [],
        files: [{
            value: await API.images.tictactoe.drawGame(game),
            filename: 'ttt.png'
        }],
    };
}