import { RequestTypes } from 'detritus-client-rest';
import { ButtonStyle } from 'discord-api-types/v10';
import { API } from '../../../../../api.js';
import { gameModel } from '../../../../../database/models/game.js';
import { CachedUser } from '../../../../../database/zod.js';
import { createComponentRow } from '../../../../functions.js';

export function request(game: gameModel, users: CachedUser[]): RequestTypes.EditWebhookTokenMessage {
    return {
        content: users.map(x => x.id === game.users[game.turn] ? `**${x.username}**` : x.username).join(' vs '),
        components: [{
            type: 1,
            components: createComponentRow(5, index => ({
                style: ButtonStyle.Secondary,
                label: (index + 1) + '',
                customId: `connect4,move,${game._id},${index}`,
                disabled: false,
            }))
        }, {
            type: 1,
            components: createComponentRow(2, index => ({
                style: ButtonStyle.Secondary,
                label: (index + 6) + '',
                customId: `connect4,move,${game._id},${index + 5}`,
                disabled: false,
            }))
        }],
    };
}

export async function move(game: gameModel, users: CachedUser[]): Promise<RequestTypes.EditWebhookTokenMessage> {
    const [user, opponent] = users;
    const winner = users.find(x => x.id === game.winner);
    return {
        content: game.state === 'Finished'
            ? winner ? `${winner.username} won` : `Draw between ${user.username} and ${opponent.username}`
            : users.map(x => x.id === game.users[game.turn] ? `**${x.username}**` : x.username).join(' vs '),
        components: [{
            type: 1,
            components: createComponentRow(5, index => ({
                style: ButtonStyle.Secondary,
                label: (index + 1) + '',
                customId: `connect4,move,${game._id},${index}`,
                disabled: false,
            }))
        }, {
            type: 1,
            components: createComponentRow(2, index => ({
                style: ButtonStyle.Secondary,
                label: (index + 6) + '',
                customId: `connect4,move,${game._id},${index + 5}`,
                disabled: false,
            }))
        }],
        attachments: [],
        files: [{
            value: await API.images.connect4.drawGame(game),
            filename: 'c4.png'
        }],
    };
}