import { RequestTypes } from 'detritus-client-rest';
import { ButtonStyle } from 'discord-api-types/v10';
import { API } from '../../../../../api.js';
import { gameModel } from '../../../../../database/models/game.js';
import { CachedUser } from '../../../../../database/zod.js';
import { splitArray } from '../../../../functions.js';

export function request(game: gameModel, users: CachedUser[]): RequestTypes.EditWebhookTokenMessage {
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
                customId: `tictactoe,move,${game._id},${index}`,
                disabled: false,
            });
        }
        components.push({
            type: 1,
            components: row,
        });
    }
    return {
        content: users.map(x => x.id === game.users[game.turn] ? `**${x.username}**` : x.username).join(' vs '),
        components,
    };
}

export async function move(game: gameModel, users: CachedUser[]): Promise<RequestTypes.EditWebhookTokenMessage> {
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
                customId: `tictactoe,move,${game._id},${index}`,
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
            : users.map(x => x.id === game.users[game.turn] ? `**${x.username}**` : x.username).join(' vs '),
        components,
        attachments: [],
        files: [{
            value: await API.images.tictactoe.drawGame(game),
            filename: 'ttt.png'
        }],
    };
}