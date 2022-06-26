import {
    GatewayDispatchPayload, GatewayGuildCreateDispatchData,
    GatewayGuildDeleteDispatchData, GatewayGuildRoleCreateDispatchData,
    GatewayGuildUpdateDispatchData, GatewayMessageCreateDispatchData,
    GatewayGuildRoleUpdateDispatchData, GatewayChannelUpdateDispatchData,
    GatewayChannelDeleteDispatchData, GatewayGuildMemberUpdateDispatchData,
    GatewayMessageDeleteDispatchData, GatewayMessageDeleteBulkDispatchData,
    GatewayGuildRoleDeleteDispatchData, GatewayChannelCreateDispatchData,
    GatewayInteractionCreateDispatchData, GatewayMessageUpdateDispatchData,
    ChannelType, APIChannel, GatewayUserUpdateDispatchData,
    InteractionType, ApplicationCommandType
} from 'discord-api-types/v10';
import { API } from '../api.js';

export class EventProcessor {
    async handle(event: GatewayDispatchPayload) {
        switch (event.t) {
            case 'GUILD_CREATE':
                await this.handleGuildCreate(event.d);
                break;
            case 'GUILD_UPDATE':
                await this.handleGuildUpdate(event.d);
                break;
            case 'GUILD_DELETE':
                await this.handleGuildDelete(event.d);
                break;
            case 'INTERACTION_CREATE':
                await this.handleInteractionCreate(event.d);
                break;
            case 'MESSAGE_CREATE':
                await this.handleMessageCreate(event.d);
                break;
            case 'MESSAGE_UPDATE':
                await this.handleMessageUpdate(event.d);
                break;
            case 'MESSAGE_DELETE':
                await this.handleMessageDelete(event.d);
                break;
            case 'MESSAGE_DELETE_BULK':
                await this.handleMessageDeleteBulk(event.d);
                break;
            case 'GUILD_ROLE_CREATE':
            case 'GUILD_ROLE_UPDATE':
                await this.handleRoleCreate(event.d);
                break;
            case 'GUILD_ROLE_DELETE':
                await this.handleRoleDelete(event.d);
                break;
            case 'THREAD_CREATE':
            case 'THREAD_UPDATE':
            case 'CHANNEL_CREATE':
            case 'CHANNEL_UPDATE':
                await this.handleChannelCreate(event.d);
                break;
            case 'THREAD_DELETE':
            case 'CHANNEL_DELETE':
                await this.handleChannelDelete(event.d);
                break;
            case 'GUILD_MEMBER_UPDATE':
                await this.handleGuildMemberUpdate(event.d);
                break;
        }
    }

    async handleInteractionCreate(event: GatewayInteractionCreateDispatchData) {
        if (event.guild_id) {
            if (event.message) await API.cache.post(`message:${event.guild_id}:${event.id}`, event.message);
            if (event.member) await API.cache.post(`member:${event.guild_id}:${event.member?.user.id}`, event.member);
            if (event.member?.user) await this.handleUserUpdate(event.member.user);
            if (event.user) await this.handleUserUpdate(event.user);
            if (event.type === InteractionType.ApplicationCommand && event.data.type === ApplicationCommandType.ChatInput) {
                for (let value of Object.values(event.data.resolved?.users ?? {})) {
                    await this.handleUserUpdate(value);
                }
                for (let value of Object.values(event.data.resolved?.channels ?? {})) {
                    await this.handleChannelCreate({
                        ...value,
                        guild_id: event.guild_id!
                    } as APIChannel);
                }
                for (let [key, value] of Object.entries(event.data.resolved?.members ?? {})) {
                    await this.handleGuildMemberUpdate({
                        ...value,
                        user: event.data.resolved?.users![key]!,
                        guild_id: event.guild_id
                    });
                }
            }
        }
    }

    async handleMessageCreate(event: GatewayMessageCreateDispatchData) {
        if (event.guild_id) {
            await API.cache.post(`message:${event.guild_id}:${event.id}`, event);
            if (event.member) await API.cache.post(`member:${event.guild_id}:${event.author.id}`, { user: event.author, ...event.member });
            await this.handleUserUpdate(event.author);
        }
    }

    async handleMessageUpdate(event: GatewayMessageUpdateDispatchData) {
        if (event.guild_id) {
            // const message = await API.cache.get(`message:${event.guild_id}:${event.id}`);
            // if (message) await API.cache.post(`old_message:${event.guild_id}:${event.id}`, event, 60);
            if ('content' in event) await API.cache.post(`message:${event.guild_id}:${event.id}`, event);
            if (event.member && event.author) await API.cache.post(`member:${event.guild_id}:${event.author.id}`, { user: event.author, ...event.member });
            if (event.author) await this.handleUserUpdate(event.author);
        }
    }

    async handleMessageDelete(event: GatewayMessageDeleteDispatchData) {
        if (event.guild_id)
            await API.cache.delete(`message:${event.guild_id}:${event.id}`, false) ?? 0;
    }

    async handleMessageDeleteBulk(event: GatewayMessageDeleteBulkDispatchData) {
        //probably python
        if (event.guild_id)
            for (let i of event.ids)
                await this.handleMessageDelete({
                    channel_id: event.channel_id,
                    guild_id: event.guild_id,
                    id: i
                });
    }

    async handleGuildDelete(event: GatewayGuildDeleteDispatchData) {
        await API.cache.delete(`guild:${event.id}`, false);
        await API.cache.delete(`*:${event.id}:*`, true);
    }

    async handleGuildUpdate(event: GatewayGuildUpdateDispatchData) {
        await API.cache.post(`guild:${event.id}`, event);
    }

    async handleGuildCreate(event: GatewayGuildCreateDispatchData) {

        await API.cache.post(`guild:${event.id}`, event);

        for (let i of event.roles) await this.handleRoleCreate({
            guild_id: event.id,
            role: i
        });

        for (let i of event.channels ?? []) await this.handleChannelCreate({
            ...i,
            guild_id: event.id
        } as APIChannel);

        for (let i of event.threads ?? []) await this.handleChannelCreate({
            ...i,
            guild_id: event.id
        } as APIChannel);

        for (let i of event.members ?? []) if (i.user) {
            await this.handleUserUpdate(i.user!);
            await this.handleGuildMemberUpdate({
                ...i,
                user: i.user,
                guild_id: event.id
            });
        }
    }

    async handleRoleCreate(event: GatewayGuildRoleCreateDispatchData | GatewayGuildRoleUpdateDispatchData) {
        await API.cache.post(`role:${event.guild_id}:${event.role.id}`, event.role);
    }

    async handleRoleDelete(event: GatewayGuildRoleDeleteDispatchData) {
        await API.cache.delete(`role:${event.guild_id}:${event.role_id}`, false);
        for (let i of await API.cache.scan(`member:${event.guild_id}:*`) ?? []) {
            const member = await API.cache.get(i as `member:${string}:${string}`);
            if (member && member.roles.includes(event.role_id)) {
                member.roles = member.roles.filter((r: string) => r !== event.role_id);
                await API.cache.post(i, member);
            }
        }
    }

    async handleChannelCreate(event: GatewayChannelCreateDispatchData | GatewayChannelUpdateDispatchData) {
        switch (event.type) {
            case ChannelType.GuildStageVoice:
            case ChannelType.GuildVoice:
            case ChannelType.GuildCategory:
            case ChannelType.GuildNews:
            case ChannelType.GuildNewsThread:
            case ChannelType.GuildPrivateThread:
            case ChannelType.GuildPublicThread:
            case ChannelType.GuildText:
                await API.cache.post(`channel:${event.guild_id}:${event.id}`, event);
                break;
        }
    }

    async handleChannelDelete(event: GatewayChannelDeleteDispatchData) {
        switch (event.type) {
            case ChannelType.GuildStageVoice:
            case ChannelType.GuildVoice:
            case ChannelType.GuildCategory:
            case ChannelType.GuildText:
            case ChannelType.GuildNews:
            case ChannelType.GuildNewsThread:
            case ChannelType.GuildPrivateThread:
            case ChannelType.GuildPublicThread:
                await API.cache.delete(`channel:${event.guild_id}:${event.id}`, false);
                break;
        }
    }

    async handleGuildMemberUpdate(event: GatewayGuildMemberUpdateDispatchData) {
        await API.cache.post(`member:${event.guild_id}:${event.user.id}`, event);
    }

    async handleUserUpdate(event: GatewayUserUpdateDispatchData) {
        await API.cache.post(`user:${event.id}`, event);
    }

}

/*
TODO:
*filter channels types that are not needed
*needed: text, public thread, new thread, private thread

*only use needed properties for roles and channels
*create interface for roles and channels
*/