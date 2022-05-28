import { z } from 'zod';

export const userSchema = z.object({
    id: z.string(),
    username: z.string(),
    discriminator: z.string(),
    avatar: z.string().nullish(),
    bot: z.boolean().optional(),
});

export type BotUser = z.infer<typeof userSchema>;

export const memberSchema = z.object({
    user: userSchema,
    roles: z.array(z.string()),
    nick: z.string().nullish(),
    avatar: z.string().nullish(),
});

export type BotGuildMember = z.infer<typeof memberSchema>;

export const guildSchema = z.object({
    id: z.string(),
    name: z.string(),
    owner_id: z.string(),
    icon: z.string().nullish(),
    preferred_locale: z.string()
});

export type BotGuild = z.infer<typeof guildSchema>;