console.log('Starting...');

import { config } from 'dotenv';
import { join } from 'path';
import { WebSocket } from 'ws';
import {
    Client as RestClient
} from 'detritus-client-rest';
import {
    BaseCommand,
} from './interactions/base.js';
import { loadCommands } from './functions.js';
import { handleEvent } from './handler.js';

config({
    path: join(process.cwd(), '.env')
});

export const restClient = new RestClient(process.env.TOKEN!, {
    baseUrl: 'http://localhost:4444',
    headers: {
        'bot-token': process.env.TOKEN,
    }
});

function connectToGateway() {

    const ws = new WebSocket('ws://localhost:6666');
    const commands: BaseCommand[] = [];

    ws.onopen = async () => {
        commands.push(...await loadCommands());
        setTimeout(async () => {
            // await restClient.bulkOverwriteApplicationGuildCommands(process.env.APP_ID!, process.env.GUILD_TEST_ID!, commands);
            // await restClient.bulkOverwriteApplicationGuildCommands(process.env.APP_ID!, '723568330216308786', commands);
        }, 2000);
        ws.send(JSON.stringify({ data: 'test', auth: process.env.TOKEN! }));
    };
    ws.onclose = (e) => {
        console.warn('Socket is closed. Reconnect will be attempted in 1 second.', e.reason);
        setTimeout(() => {
            connectToGateway();
        }, 1000);
    };
    ws.onmessage = (data) => {
        return handleEvent(data, commands);
    };
    ws.onerror = (err) => {
        console.error('Socket encountered error: ', err.message, 'Closing socket');
        ws.close();
    };

}

connectToGateway();