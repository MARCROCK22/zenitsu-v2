import { z } from 'zod';

export const userSchema = z.object({
    id: z.string(),
    username: z.string(),
    discriminator: z.string(),
    avatar: z.string().nullish(),
    bot: z.boolean().optional(),
});

export type CachedUser = z.infer<typeof userSchema>;

export const memberSchema = z.object({
    user: userSchema,
    roles: z.array(z.string()),
    nick: z.string().nullish(),
    avatar: z.string().nullish(),
});

export type CachedGuildMember = z.infer<typeof memberSchema>;

export const guildSchema = z.object({
    id: z.string(),
    name: z.string(),
    owner_id: z.string(),
    icon: z.string().nullish(),
    preferred_locale: z.string()
});

export type CachedGuild = z.infer<typeof guildSchema>;

export const roleSchema = z.object({
    id: z.string(),
    name: z.string(),
    position: z.number(),
    permissions: z.string(),
    color: z.number(),
});

export type CachedRole = z.infer<typeof roleSchema>;

export const channelSchema = z.object({
    id: z.string(),
    name: z.string(),
    guild_id: z.string(),
    type: z.number()
});

export type CachedChannel = z.infer<typeof channelSchema>;

export const messageSchema = z.object({
    id: z.string(),
    content: z.string(),
    author: userSchema
});


export type CachedMessage = z.infer<typeof messageSchema>;