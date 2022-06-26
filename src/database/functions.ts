import {
    channelSchema, guildSchema,
    memberSchema, messageSchema,
    roleSchema, userSchema
} from './zod.js';

export function parsePost(query: string, __data: any) {
    try {
        // const regexs = {
        //     guild: /^guild:(\d+)$/,
        //     member: /^member:(\d+):(\d+)$/,
        //     user: /^user:(\d+)$/,
        //     role: /^role:(\d+):(\d+)$/,
        //     channel: /^channel:(\d+):(\d+)$/,
        //     message: /^message:(\d+):(\d+)$/,

        // };
        switch (query.split(':')[0]) {
            case 'guild':
                return guildSchema.parse(__data);
            case 'member':
                return memberSchema.parse(__data);
            case 'user':
                return userSchema.parse(__data);
            case 'role':
                return roleSchema.parse(__data);
            case 'channel':
                return channelSchema.parse(__data);
            case 'message':
                return messageSchema.parse(__data);
            default:
                return __data;
        }
    } catch (e) {
        console.error(e);
        console.log(query, __data);
    }
}

//mejorar los tipos para que si el callback no retorna promesa esto tampoco
export async function executeFunction<T extends (...args: unknown[]) => unknown>(callback: T): Promise<{ data: Awaited<ReturnType<T>>; took: number }> {
    const date = Date.now();
    const result = await callback();
    const took = Date.now() - date;
    return {
        data: result as Awaited<ReturnType<T>>,
        took
    };
}