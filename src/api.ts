import __fetch from 'node-fetch';
import { CachedChannel, CachedGuild, CachedGuildMember, CachedMessage, CachedRole, CachedUser } from './database/zod';
import { AsyncQueue } from '@sapphire/async-queue';
import { join } from 'path';
import { config } from 'dotenv';
import { type gameModel } from './database/models/game';

config({
    path: join(process.cwd(), '.env')
});

export const baseURL = {
    cache: 'http://localhost:5555/cache',
    database: 'http://localhost:5555/database',
    base: 'http://localhost:5555',
    images: {
        base: 'http://localhost:3333',
        tictactoe: 'http://localhost:3333/tictactoe',
        connect4: 'http://localhost:3333/connect4'
    },
} as const;

const Authorization = process.env.KEYS!.split(',')[0];
const fetch = __fetch;// createFetchQueued() as typeof __fetch;
const queuedFetch: Record<string, typeof __fetch> = {};

export const API = {
    ping() {
        return fetch(`${baseURL.base}/ping`, {
            headers: {
                Authorization
            }
        }).then(res => res.json());
    },
    images: {
        tictactoe: {
            drawGame(game: gameModel) {
                return fetch(baseURL.images.tictactoe + '/game', {
                    method: 'POST',
                    body: JSON.stringify({
                        map: game.board.map((x, i) => {
                            const move = game.moves.find(x => Number(x.split(',')[1]) === i);
                            return [x, move ? move.split(',')[2] : null];
                        })
                    }),
                    headers: {
                        Authorization,
                        'Content-Type': 'application/json'
                    }
                }).then(x => x.arrayBuffer());
            }
        },
        connect4: {
            drawGame(game: gameModel) {
                return fetch(baseURL.images.connect4 + '/game', {
                    method: 'POST',
                    body: JSON.stringify({
                        map: game.board,
                    }),
                    headers: {
                        Authorization,
                        'Content-Type': 'application/json'
                    }
                }).then(x => x.arrayBuffer());
            }
        }
    },
    database: {
        async createGame(users: string[], { channelId, messageId, guildId, type }: { channelId: string, messageId: string, guildId: string, type: gameModel['type'] }) {
            return createFetchQueued('createGame')(`${baseURL.database}/game`, {
                method: 'PUT',
                body: JSON.stringify({
                    type,
                    users,
                    channelId,
                    messageId,
                    guildId,
                    turn: 0,
                }),
                headers: {
                    Authorization,
                    'Content-Type': 'application/json'
                }
            });
        },
        async getGame(userId: string) {
            const res = await fetch(`${baseURL.database}/game/${userId}`, {
                headers: {
                    Authorization
                }
            });
            return res.json() as Promise<gameModel | null>;
        },
        deleteGame(userId: string) {
            return fetch(`${baseURL.database}/game/${userId}`, {
                method: 'DELETE',
                headers: {
                    Authorization
                }
            });
        },
        makeMove(userId: string, { type, move }: { type: gameModel['type'], move: string }) {
            return fetch(`${baseURL.database}/game/${userId}/move`, {
                method: 'POST',
                body: JSON.stringify({
                    type,
                    move
                }),
                headers: {
                    Authorization,
                    'Content-Type': 'application/json'
                }
            });
        },
        acceptGame(userId: string) {
            return fetch(`${baseURL.database}/game/${userId}/accept`, {
                method: 'POST',
                headers: {
                    Authorization
                }
            });
        }
    },
    cache: {
        post(id: string, data: any, ex: number = 0) {
            return fetch(baseURL.cache + '/' + encodeURIComponent(id) + '?expire=' + ex, {
                method: 'POST',
                body: JSON.stringify(data),
                headers: {
                    Authorization,
                    'Content-Type': 'application/json'
                }
            }).then(res => res.text());
        },
        get(id: string) {
            return fetch(baseURL.cache + '/' + encodeURIComponent(id), {
                headers: {
                    Authorization
                }
            })
                .then(res => res.text())
                .then(res => {
                    const json = res ? JSON.parse(res) : null;
                    if (json && (json.id || json.user?.id)) return json;
                    else return null;
                });
        },
        delete(id: string, withMatch: boolean) {
            return fetch(baseURL.cache + '/' + encodeURIComponent(id) + `?match=${!!withMatch}`, {
                method: 'DELETE',
                headers: {
                    Authorization
                }
            }).then(res => res.text());
        },
        scan(query: string) {
            return fetch(baseURL.cache + '/scan/' + encodeURIComponent(query), {
                headers: {
                    Authorization
                }
            })
                .then(res => res.text())
                .then(res => {
                    const json = res ? JSON.parse(res) : null;
                    if (json && Array.isArray(json)) return json as string[];
                    else return [];
                });
        }
    } as {
        get(id: `user:${string}`): Promise<CachedUser | null>
        get(id: `guild:${string}`): Promise<CachedGuild | null>
        get(id: `member:${string}:${string}`): Promise<CachedGuildMember | null>
        get(id: `role:${string}:${string}`): Promise<CachedRole | null>
        get(id: `message:${string}:${string}`): Promise<CachedMessage | null>
        get(id: `channel:${string}:${string}`): Promise<CachedChannel | null>
        get(id: string): Promise<any>;
        post(id: string, data: any, ex?: number): Promise<string>;
        delete(id: string): Promise<number>
        delete(id: string, withMatch: true): Promise<string[]>
        delete(id: string, withMatch: boolean): Promise<number>;
        scan(query: string): Promise<string[]>;
    }
};

export function createFetchQueued(id?: string) {
    if (id && id in queuedFetch) return queuedFetch[id];
    if (id) {
        queuedFetch[id] = createFetchQueued();
        return queuedFetch[id];
    }
    const queue = new AsyncQueue();
    const func = async function myQueuedFetch(...args: Parameters<typeof __fetch>) {
        await queue.wait();
        try {
            return __fetch(...args);
        } finally {
            queue.shift();
        }
    };
    return func;
}