import { guildSchema, memberSchema, userSchema } from './zod.js';

export function parsePost(query: string, __data: any) {

    const regexs = {
        guild: /^guild:(\d+)$/,
        member: /^member:(\d+):(\d+)$/,
        user: /^user:(\d+)$/,
        //TODO: parse channel, message and role
        channel: /^channel:(\d+):(\d+)$/,
        message: /^message:(\d+):(\d+)$/,
        role: /^role:(\d+):(\d+)$/,
    };
    //change this to a switch statement
    if (query.match(regexs.guild)) return guildSchema.parse(__data);
    else if (query.match(regexs.member)) return memberSchema.parse(__data);
    else if (query.match(regexs.user)) return userSchema.parse(__data);
    else return __data;

}