import { Game } from '@prisma/client';
import { RequestTypes } from 'detritus-client-rest';
import { ButtonStyle } from 'discord-api-types/v10';
import { API } from '../../../../../api.js';
import { CachedUser } from '../../../../../database/zod.js';
import { createComponentRow } from '../../../../functions.js';

export function request(game: Game, users: CachedUser[]): RequestTypes.EditWebhookTokenMessage {
    const [user, opponent] = users;
    return {
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
    };
}

export async function move(game: Game, users: CachedUser[]): Promise<RequestTypes.EditWebhookTokenMessage> {
    const [user, opponent] = users;
    const winner = users.find(x => x.id === game.winner);
    return {
        content: game.state === 'Finished'
            ? winner ? `${winner.username} won` : `Draw between ${user.username} and ${opponent.username}`
            : (game.moves.length % 2) ? `[🔴] ${user.username} vs **${opponent.username}**` : `[🟡] **${user.username}** vs ${opponent.username}`,
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
            value: await API.images.connect4.drawGame(game),
            filename: 'c4.png'
        }],
    };
}