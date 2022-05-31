import { API } from '../api.js';
import {
    APIChatInputApplicationCommandInteraction,
    ApplicationCommandType, InteractionType,
    GatewayDispatchPayload,
    ButtonStyle, MessageFlags,
    GatewayInteractionCreateDispatch, APIMessageComponent, APIMessageActionRowComponent
} from 'discord-api-types/v10';
import { BaseCommand, BaseSubcommandGroup, ComponentInteraction, Interaction } from './interactions/chat/base.js';
import { restClient } from './run.js';
import { Game } from '@prisma/client';
import { RequestTypes } from 'detritus-client-rest';

export async function handleEvent(data: import('ws').MessageEvent, commands: BaseCommand[]) {
    const event = JSON.parse(data.data.toString()) as /* GatewayPackets.Packet */ GatewayDispatchPayload & { shard_id: number };
    if (event.t) console.log(`[${event.shard_id}] Received event: ${event.t}`);
    switch (event.t) {
        case 'MESSAGE_CREATE':
            break;
        case 'INTERACTION_CREATE':
            await handleInteractionCreate(event, commands);
            break;
        case 'RESUMED':
            console.log(`Shard (${event.shard_id}) resumed`);
            // await clientSnowTransfer.webhook.executeWebhook(process.env.WEBHOOK_ID!, process.env.WEBHOOK_TOKEN!, {
            //     content: `Shard (${event.shard_id}) resumed`
            // });
            break;
        case 'READY':
            console.log(`Shard (${event.shard_id}) ready`);
            // await clientSnowTransfer.webhook.executeWebhook(process.env.WEBHOOK_ID!, process.env.WEBHOOK_TOKEN!, {
            //     content: `Shard (${event.shard_id}) ready`,
            // });
            break;
    }
}

async function handleInteractionCreate(event: GatewayInteractionCreateDispatch & {
    shard_id: number;
}, commands: BaseCommand[]) {
    // console.log(event.d);
    switch (event.d.type) {
        case InteractionType.ApplicationCommand:
            switch (event.d.data.type) {
                case ApplicationCommandType.ChatInput: {
                    const interactionEvent = event.d as APIChatInputApplicationCommandInteraction;
                    function getCommand(data: any, botCommand: BaseCommand | BaseSubcommandGroup): [any, BaseCommand] {
                        if (data.options?.some((x: { type: number }) => [1, 2].includes(x.type))) {
                            return getCommand(data.options[0], botCommand.options[0] as BaseCommand | BaseSubcommandGroup);
                        }
                        return [data, botCommand as BaseCommand];
                    }
                    const __commandBot = commands.find(x => x.name === interactionEvent.data.name);
                    if (!__commandBot) return console.error(`Command ${interactionEvent.data.name} not found`);
                    const [data, command] = getCommand(interactionEvent.data, __commandBot);
                    const interaction = new Interaction(restClient, interactionEvent, data.options);
                    if (command.needDefer) await interaction.defer(command.isEphemeral);
                    try {
                        if (await command.onBefore(interaction)) await command.run(interaction);
                        else await command.onCancel(interaction);
                    } catch (e) {
                        try {
                            await command.onError(interaction, e);
                        } catch (ee) {
                            console.error('Unexpected error in onError', ee);
                        }
                    }
                    break;
                }
            }
            break;
        case InteractionType.MessageComponent:
            const interaction = new ComponentInteraction(restClient, event.d);
            await interaction.deferUpdate();
            const game = await API.database.getGame(interaction.user.id);
            if (!game) return;
            console.dir(event.d, { depth: 0 });
            console.log(interaction, interaction.customId);
            if (interaction.customId.match(/tictactoe,move,([0-9]{17,}),([0-9]{17,})/gi)) {
                const [, , userId, opponentId, index] = interaction.customId.match(/tictactoe,move,([0-9]{17,}),([0-9]{17,}),([0-9])/gi)![0].split(',');
                const user = await API.cache.get(`user:${userId}`);
                const opponent = await API.cache.get(`user:${opponentId}`);
                if (!user || !opponent) {
                    return interaction.followUp({ content: 'User not found' });
                }
                if (game.users[game.turn] !== interaction.user.id) return interaction.followUp({
                    content: 'It is not your turn',
                    flags: MessageFlags.Ephemeral
                });
                const gameResponse = await API.database.makeMove(interaction.user.id, { type: 'TicTacToe', move: index + '' });
                if (!gameResponse.ok) return interaction.followUp({
                    content: 'Invalid move',
                    flags: MessageFlags.Ephemeral
                });
                const gameData = await gameResponse.json() as Game;
                const components: RequestTypes.RawChannelMessageComponent[] = [];
                for (let i in splitArray(gameData.board, 3)) {
                    const row: RequestTypes.RawChannelMessageComponent[] = [];
                    for (let j in splitArray(gameData.board, 3)[i]) {
                        const index = parseInt(i) * 3 + parseInt(j);
                        row.push({
                            type: 2,
                            style: ButtonStyle.Secondary,
                            label: gameData.board[index] || '-',
                            //@ts-ignore
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
                        : gameData.turn === 0 ? `**${user.username}** vs ${opponent.username}` : `${user.username} vs **${opponent.username}**`,
                    components
                });
                if (gameData.state === 'Finished') await API.database.deleteGame(interaction.user.id);
            } else if (interaction.customId.match(/tictactoe,cancel,([0-9]{17,}),([0-9]{17,})/gi)) {
                const [, , userId, opponentId] = interaction.customId.match(/tictactoe,cancel,([0-9]{17,}),([0-9]{17,})/gi)![0].split(',');
                if (![userId, opponentId].includes(interaction.user.id)) return;
                await API.database.deleteGame(interaction.user.id);
                await interaction.editOrCreateResponse({ content: `Deleted by <@${interaction.user.id}>` });
            } else if (interaction.customId.match(/tictactoe,request,([0-9]{17,}),([0-9]{17,})/gi)) {
                const [, , userId, opponentId] = interaction.customId.match(/tictactoe,request,([0-9]{17,}),([0-9]{17,})/gi)![0].split(',');
                if (opponentId !== interaction.user.id) return;
                const user = await API.cache.get(`user:${userId}`);
                const opponent = await API.cache.get(`user:${opponentId}`);
                if (!user || !opponent) {
                    return interaction.followUp({ content: 'User not found' });
                }
                await API.database.acceptGame(interaction.user.id);
                console.log(user, opponent);
                await interaction.editResponse({
                    content: game.turn === 0 ? `**${user.username}** vs ${opponent.username}` : `${user.username} vs **${opponent.username}**`,
                    components: [{
                        type: 1,
                        components: [{
                            type: 2,
                            style: ButtonStyle.Secondary,
                            label: '-',
                            customId: `tictactoe,move,${user.id},${opponent.id},0`,
                        }, {
                            type: 2,
                            style: ButtonStyle.Secondary,
                            label: '-',
                            customId: `tictactoe,move,${user.id},${opponent.id},1`,
                        }, {
                            type: 2,
                            style: ButtonStyle.Secondary,
                            label: '-',
                            customId: `tictactoe,move,${user.id},${opponent.id},2`,
                        }]
                    }, {
                        type: 1,
                        components: [{
                            type: 2,
                            style: ButtonStyle.Secondary,
                            label: '-',
                            customId: `tictactoe,move,${user.id},${opponent.id},3`,
                        }, {
                            type: 2,
                            style: ButtonStyle.Secondary,
                            label: '-',
                            customId: `tictactoe,move,${user.id},${opponent.id},4`,
                        }, {
                            type: 2,
                            style: ButtonStyle.Secondary,
                            label: '-',
                            customId: `tictactoe,move,${user.id},${opponent.id},5`,
                        }]
                    }, {
                        type: 1,
                        components: [{
                            type: 2,
                            style: ButtonStyle.Secondary,
                            label: '-',
                            customId: `tictactoe,move,${user.id},${opponent.id},6`,
                        }, {
                            type: 2,
                            style: ButtonStyle.Secondary,
                            label: '-',
                            customId: `tictactoe,move,${user.id},${opponent.id},7`,
                        }, {
                            type: 2,
                            style: ButtonStyle.Secondary,
                            label: '-',
                            customId: `tictactoe,move,${user.id},${opponent.id},8`,
                        }]
                    }]
                });
            }
            break;
    }
}

function splitArray<T>(array: T[], chunkSize: number): T[][] {
    const results = [];
    array = array.slice();
    while (array.length) {
        results.push(array.splice(0, chunkSize));
    }
    return results;
}