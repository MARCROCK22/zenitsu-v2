console.log('Starting...');

import { WebSocket } from 'ws';
import { config } from 'dotenv';
import { join } from 'path';
import {
    APIChatInputApplicationCommandInteraction, APIChatInputApplicationCommandInteractionData,
    ApplicationCommandType, InteractionType,
    GatewayDispatchPayload,
    ButtonStyle
} from 'discord-api-types/v10';
import {
    Client as RestClient
} from 'detritus-client-rest';
import {
    BaseCommand, ComponentInteraction, Interaction
} from './interactions/chat/base.js';
import { getFiles } from './functions.js';
import { API } from '../api.js';
export const restClient = new RestClient(process.env.TOKEN!, {
    baseUrl: 'http://localhost:4444',
});

config({
    path: join(process.cwd(), '.env')
});

async function loadCommands() {
    const commands = [];
    const cmds = await getFiles(join(process.cwd(), 'dist', 'bot', 'interactions'));
    for (let i of cmds) {
        const cmd = await import('file:///' + i);
        if (cmd.default) {
            commands.push(new cmd.default());
            console.log(`Loaded command: ${commands[commands.length - 1].name}`);
        }
    }
    return commands;
}

async function connectToGateway() {

    const ws = new WebSocket('ws://localhost:6666');
    const commands: BaseCommand[] = [];

    ws.onopen = async () => {
        commands.push(...await loadCommands());
        setTimeout(async () => {
            await restClient.bulkOverwriteApplicationGuildCommands(process.env.APP_ID!, process.env.GUILD_TEST_ID!, commands);
            await restClient.bulkOverwriteApplicationGuildCommands(process.env.APP_ID!, '723568330216308786', commands);
        }, 2000);
        ws.send(JSON.stringify({ data: 'test', auth: process.env.TOKEN! }));
    };
    ws.onclose = (e) => {
        console.warn('Socket is closed. Reconnect will be attempted in 1 second.', e.reason);
        setTimeout(() => {
            connectToGateway();
        }, 1000);
    };
    ws.onmessage = async (data) => {
        const event = JSON.parse(data.data.toString()) as /* GatewayPackets.Packet */ GatewayDispatchPayload & { shard_id: number };
        if (event.t) console.log(`[${event.shard_id}] Received event: ${event.t}`);
        switch (event.t) {
            case 'MESSAGE_CREATE':
                break;
            case 'INTERACTION_CREATE':
                // console.log(event.d);
                switch (event.d.type) {
                    case InteractionType.ApplicationCommand:
                        switch (event.d.data.type) {
                            case ApplicationCommandType.ChatInput:
                                //TODO: mejorar los types
                                function getCommand(data: any, botCommand: any): [any, BaseCommand] {
                                    if (data.options?.some((x: { type: number }) => [1, 2].includes(x.type))) {
                                        return getCommand(data.options[0], botCommand.options[0]);
                                    }
                                    return [data, botCommand];
                                }
                                const [data, command] = getCommand(event.d.data, commands.find((x) => x.name === (event.d.data as APIChatInputApplicationCommandInteractionData).name));
                                const interaction = new Interaction(restClient, event.d as APIChatInputApplicationCommandInteraction, data.options);
                                if (command.needDefer) await interaction.defer(command.isEphemeral);
                                try {
                                    if (await command.onBefore(interaction)) await command.run(interaction);
                                    else await command.onCancel(interaction);
                                } catch (e) {
                                    try {
                                        await command.onError(interaction, e);
                                    } catch {
                                        // do nothing
                                    }
                                }
                                break;
                        }
                        break;
                    case InteractionType.MessageComponent:
                        const interaction = new ComponentInteraction(restClient, event.d);
                        console.dir(event.d, { depth: 0 });
                        console.log(interaction, interaction.customId);
                        if (interaction.customId.match(/tictactoe,cancel,([0-9]{17,}),([0-9]{17,})/gi)) {
                            // cancel ttt game
                        } else if (interaction.customId.match(/tictactoe,request,([0-9]{17,}),([0-9]{17,})/gi)) {
                            /*
                            parse to get user and opponent id
                            example: tictactoe_request_507367752391196682,623323181511344138
                            result: ["507367752391196682", "623323181511344138"]
                            */
                            const [, , userId, opponentId] = interaction.customId.match(/tictactoe,request,([0-9]{17,}),([0-9]{17,})/gi)![0].split(',');
                            if (opponentId !== interaction.user.id) return;
                            const user = await API.cache.get(`user:${userId}`);
                            const opponent = await API.cache.get(`user:${opponentId}`);
                            if (!user || !opponent) return interaction.followUp({ content: 'User not found' });
                            await interaction.deferUpdate();
                            await interaction.deleteResponse();
                            console.log(user, opponent);
                            interaction.followUp({
                                content: `${user.username} vs ${opponent.username}`,
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
    };
    ws.onerror = (err) => {
        console.error('Socket encountered error: ', err.message, 'Closing socket');
        ws.close();
    };

}

connectToGateway();