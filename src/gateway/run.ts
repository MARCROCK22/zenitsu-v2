console.log('Starting...');

import { Gateway as DetritusSocket } from 'detritus-client-socket';
import dotenv from 'dotenv';
import path from 'path';
import { WebSocket, WebSocketServer } from 'ws';
import { EventProcessor } from './eventprocessor.js';
import { GatewayDispatchPayload } from 'discord-api-types/v10';
import { GatewayIntents } from 'detritus-client-socket/lib/constants';

dotenv.config({
    path: path.join(process.cwd(), '.env')
});

const eventProcessor = new EventProcessor();
const shards: { [x: number]: DetritusSocket.Socket } = {};
let socketToSend: WebSocket | void;
let shardCount = 1;//fetch shard count

setTimeout(() => {
    for (let i = 0; i < shardCount; i++) {
        const shard = spawnShard({
            count: shardCount,
            shardId: i,
        });
        shards[i] = shard;
    }
}, 500);

const ws = new WebSocketServer({ port: 6666 });
ws.on('connection', socket => {
    socket.onclose = () => {
        console.warn('Socket is closed. Reconnect will be attempted in 1 second.');
    };
    socket.onmessage = (data) => {
        let obj: { data?: any; auth?: string } = {};
        try {
            obj = JSON.parse(data.data.toString());
        } catch {
            //do nothing
        }
        if (obj.auth == process.env.TOKEN) {
            socketToSend = socket;
            console.log('received: %s', obj.data);
        }
    };
    socket.onerror = (err) => {
        console.error('Socket encountered error: ', err.message, 'Closing socket');
        socket.close();
    };
});

function spawnShard(options: { count: number; shardId: number; }): DetritusSocket.Socket {

    const client = new DetritusSocket.Socket(process.env.TOKEN!, {
        //guilds, content, message guilds
        // intents: 1 << 0 | 1 << 15 | 1 << 9,
        intents: ['GUILDS', 'GUILD_MESSAGES', 1 << 15] as (keyof typeof GatewayIntents)[],
        shardCount: options.count,
        autoReconnect: true,
        shardId: options.shardId,
    });

    client.on('ready', () => {
        console.log(`[${options.shardId}] Ready`);
    }).on('packet', async event => {
        await eventProcessor.handle(event as GatewayDispatchPayload);
        socketToSend?.send(JSON.stringify({ ...event, shard_id: options.shardId }));
    }).on('open', () => {
        console.log(`[${options.shardId}] Open`);
    }).on('close', (code) => {
        console.log(`[${options.shardId} ${code.code}] Close: ${code.reason}`);
    }).on('state', state => {
        console.log(`[${options.shardId}] State: ${state.state}`);
    }).on('warn', warn => {
        console.warn(`[${options.shardId}] Warn: ${warn.message}`);
    }).on('killed', () => {
        console.warn(`[${options.shardId}] Killed`);
    });

    client.connect('wss://gateway.discord.gg/');

    return client;
}