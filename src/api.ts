import __fetch from 'node-fetch';
import { BotGuild, BotGuildMember, BotUser } from './database/zod';
import { AsyncQueue } from '@sapphire/async-queue';


export const baseURL = {
    cache: 'http://localhost:5555/cache',
    database: 'http://localhost:5555/database',
    base: 'http://localhost:5555',
} as const;

const fetch = createFetchQueued() as typeof __fetch;

export const API = {
    ping() {
        return fetch(`${baseURL.base}/ping`).then(res => res.json());
    },
    database: {
        createGame(users: [string, string]) {
            return fetch(`${baseURL.database}/game`, {
                method: 'PUT',
                body: JSON.stringify({
                    type: 'ttt',
                    users
                }),
                headers: {
                    'Content-Type': 'application/json'
                }
            });
        }
    },
    cache: {
        post(id: string, data: any) {
            return fetch(baseURL.cache + '/' + encodeURIComponent(id), {
                method: 'POST',
                body: JSON.stringify(data),
                headers: {
                    'Content-Type': 'application/json'
                }
            }).then(res => res.text());
        },
        get(id: string) {
            return fetch(baseURL.cache + '/' + encodeURIComponent(id))
                .then(res => res.text())
                .then(res => {
                    const json = res ? JSON.parse(res) : null;
                    if (json && (json.id || json.user?.id)) return json;
                    else return null;
                });
        },
        delete(id: string, withMatch: boolean) {
            return fetch(baseURL.cache + '/' + encodeURIComponent(id) + `?match=${!!withMatch}`, {
                method: 'DELETE'
            }).then(res => res.text());
        },
        scan(query: string) {
            return fetch(baseURL.cache + '/scan/' + encodeURIComponent(query))
                .then(res => res.text())
                .then(res => {
                    const json = res ? JSON.parse(res) : null;
                    if (json && Array.isArray(json)) return json as string[];
                    else return [];
                });
        }
    } as {
        post(id: string, data: any): Promise<string>;
        //TODO: types overload for member, role, channel, user, guild, etc...
        //or make functions like getMember, getRole, getChannel, getUser, etc...
        get(id: `user:${string}`): Promise<BotUser | null>
        get(id: `guild:${string}`): Promise<BotGuild | null>
        get(id: `member:${string}:${string}`): Promise<BotGuildMember | null>
        get(id: string): Promise<any>;
        delete(id: string, withMatch: boolean): Promise<string>;
        scan(query: string): Promise<string[]>;
    }
};

export function createFetchQueued() {
    const queue = new AsyncQueue();
    return async function myQueuedFetch(...args: Parameters<typeof __fetch>) {
        await queue.wait();
        try {
            return __fetch(...args);
        } finally {
            queue.shift();
        }
    };
}