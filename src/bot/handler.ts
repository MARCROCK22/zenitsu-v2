import { API } from '../api.js';
import {
    APIChatInputApplicationCommandInteraction,
    ApplicationCommandType, InteractionType,
    GatewayDispatchPayload,
    GatewayInteractionCreateDispatch,
} from 'discord-api-types/v10';
import { BaseCommand, BaseSubcommandGroup, ComponentInteraction, ChatInputInteraction } from './interactions/base.js';
import { restClient } from './run.js';
import { GameHelpers } from './interactions/helpers/index.js';
import { AsyncQueue } from '@sapphire/async-queue';

export const asyncQueues: Record<string, AsyncQueue | undefined> = {};

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
                    const interaction = new ChatInputInteraction(restClient, interactionEvent, data.options);
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
            const queue = asyncQueues[interaction.user.id];
            if (queue) await queue.wait();
            const game = await API.database.getGame(interaction.user.id);
            if (!game) return;
            if (interaction.customId.match(/(tictactoe|connect4),move,([0-9]{17,}),([0-9]{17,}),([0-8])/gi)) {
                const [__type, , userId, opponentId, index] = interaction.customId.match(/(tictactoe|connect4),move,([0-9]{17,}),([0-9]{17,}),([0-8])/gi)![0].split(',');
                const shouldDeleteGame = await GameHelpers.move(interaction, parseInt(index), game);
                if (shouldDeleteGame) {
                    await API.database.deleteGame(interaction.user.id);
                    while (asyncQueues[userId]?.remaining) asyncQueues[userId]!.shift();
                    delete asyncQueues[userId];
                    while (asyncQueues[opponentId]?.remaining) asyncQueues[opponentId]!.shift();
                    delete asyncQueues[opponentId];
                    return;
                }
            } else if (interaction.customId.match(/(tictactoe|connect4),cancel,([0-9]{17,}),([0-9]{17,})/gi)) {
                const [__type, , userId, opponentId] = interaction.customId.match(/(tictactoe|connect4),cancel,([0-9]{17,}),([0-9]{17,})/gi)![0].split(',');
                await GameHelpers.cancel(interaction, userId, opponentId);
            } else if (interaction.customId.match(/(tictactoe|connect4),request,([0-9]{17,}),([0-9]{17,})/gi)) {

                await GameHelpers.request(interaction, game);
            }
            console.log(interaction, interaction.customId);
            // switch (interaction.customId.split(',')[0]) {
            //     case 'tictactoe': {
            //         if (interaction.customId.match(/tictactoe,move,([0-9]{17,}),([0-9]{17,}),([0-8])/gi)) {
            //             const [, , userId, opponentId, index] = interaction.customId.match(/tictactoe,move,([0-9]{17,}),([0-9]{17,}),([0-8])/gi)![0].split(',');
            //             const shouldDeleteGame = await HelpersComponent.tictactoe.move(interaction, userId, opponentId, parseInt(index), game);
            //             if (shouldDeleteGame) {
            //                 await API.database.deleteGame(interaction.user.id);
            //                 while (asyncQueues[userId]?.remaining) asyncQueues[userId]!.shift();
            //                 delete asyncQueues[userId];
            //                 while (asyncQueues[opponentId]?.remaining) asyncQueues[opponentId]!.shift();
            //                 delete asyncQueues[opponentId];
            //                 return;
            //             }
            //         } else if (interaction.customId.match(/tictactoe,cancel,([0-9]{17,}),([0-9]{17,})/gi)) {
            //             const [, , userId, opponentId] = interaction.customId.match(/tictactoe,cancel,([0-9]{17,}),([0-9]{17,})/gi)![0].split(',');
            //             await HelpersComponent.tictactoe.cancel(interaction, userId, opponentId);
            //         } else if (interaction.customId.match(/tictactoe,request,([0-9]{17,}),([0-9]{17,})/gi)) {
            //             const [, , userId, opponentId] = interaction.customId.match(/tictactoe,request,([0-9]{17,}),([0-9]{17,})/gi)![0].split(',');
            //             await HelpersComponent.tictactoe.request(interaction, userId, opponentId, game);
            //         }
            //     } break;
            //     case 'connect4': {
            //         if (interaction.customId.match(/connect4,move,([0-9]{17,}),([0-9]{17,}),([0-8])/gi)) {
            //             const [, , userId, opponentId, index] = interaction.customId.match(/connect4,move,([0-9]{17,}),([0-9]{17,}),([0-8])/gi)![0].split(',');
            //             const shouldDeleteGame = await HelpersComponent.connect4.move(interaction, userId, opponentId, parseInt(index), game);
            //             if (shouldDeleteGame) {
            //                 await API.database.deleteGame(interaction.user.id);
            //                 while (asyncQueues[userId]?.remaining) asyncQueues[userId]!.shift();
            //                 delete asyncQueues[userId];
            //                 while (asyncQueues[opponentId]?.remaining) asyncQueues[opponentId]!.shift();
            //                 delete asyncQueues[opponentId];
            //                 return;
            //             }
            //         } else if (interaction.customId.match(/connect4,cancel,([0-9]{17,}),([0-9]{17,})/gi)) {
            //             const [, , userId, opponentId] = interaction.customId.match(/connect4,cancel,([0-9]{17,}),([0-9]{17,})/gi)![0].split(',');
            //             await HelpersComponent.connect4.cancel(interaction, userId, opponentId);
            //         } else if (interaction.customId.match(/connect4,request,([0-9]{17,}),([0-9]{17,})/gi)) {
            //             const [, , userId, opponentId] = interaction.customId.match(/connect4,request,([0-9]{17,}),([0-9]{17,})/gi)![0].split(',');
            //             await HelpersComponent.connect4.request(interaction, userId, opponentId, game);
            //         }
            //     } break;
            // }
            queue?.shift();
            break;
    }
}

/*
TODO: replace `game,method,id1,id2` by `game,method,_id`
*/