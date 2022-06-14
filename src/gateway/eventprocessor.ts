import {
    GatewayDispatchPayload, GatewayGuildCreateDispatch,
    GatewayGuildDeleteDispatch, GatewayGuildRoleCreateDispatch,
    GatewayGuildUpdateDispatch, GatewayMessageCreateDispatch,
    GatewayGuildRoleUpdateDispatch, GatewayChannelUpdateDispatch,
    GatewayChannelDeleteDispatch, GatewayGuildMemberUpdateDispatch,
    GatewayMessageDeleteDispatch, GatewayMessageDeleteBulkDispatch,
    GatewayGuildRoleDeleteDispatch, GatewayChannelCreateDispatch,
    ChannelType, GatewayUserUpdateDispatch,
    GatewayInteractionCreateDispatch,
} from 'discord-api-types/v10';
import { API } from '../api.js';

export class EventProcessor {
    async handle(event: GatewayDispatchPayload) {
        switch (event.t) {
            case 'GUILD_CREATE':
                await this.handleGuildCreate(event);
                break;
            case 'GUILD_UPDATE':
                await this.handleGuildUpdate(event);
                break;
            case 'GUILD_DELETE':
                await this.handleGuildDelete(event);
                break;
            case 'MESSAGE_CREATE':
                await this.handleMessageCreate(event);
                break;
            case 'INTERACTION_CREATE':
                await this.handleInteractionCreate(event);
                break;
            case 'MESSAGE_DELETE':
                await this.handleMessageDelete(event);
                break;
            case 'MESSAGE_DELETE_BULK':
                await this.handleMessageDeleteBulk(event);
                break;
            case 'GUILD_ROLE_CREATE':
            case 'GUILD_ROLE_UPDATE':
                await this.handleRoleCreate(event);
                break;
            case 'GUILD_ROLE_DELETE':
                await this.handleRoleDelete(event);
                break;
            case 'CHANNEL_CREATE':
            case 'CHANNEL_UPDATE':
                await this.handleChannelCreate(event);
                break;
            case 'CHANNEL_DELETE':
                await this.handleChannelDelete(event);
                break;
            case 'GUILD_MEMBER_UPDATE':
                await this.handleGuildMemberUpdate(event);
                break;
            case 'USER_UPDATE':
                await this.handleUserUpdate(event);
                break;
        }
    }

    async handleInteractionCreate({ d: event }: GatewayInteractionCreateDispatch) {
        if (event.guild_id) {
            await API.cache.post(`message:${event.guild_id}:${event.id}`, event);
            await API.cache.post(`user:${event.member?.user.id}`, event.member?.user);
            if (event.member) await API.cache.post(`member:${event.guild_id}:${event.member?.user.id}`, event.member);
            console.log('interaction', JSON.stringify(event, null, 2));
            if ('message' in event && event.message && event.message.interaction) {
                if (event.message.interaction.user) await API.cache.post(`user:${event.message.interaction.user.id}`, event.message.interaction.user);
            }
        }
    }

    async handleMessageCreate({ d: event }: GatewayMessageCreateDispatch) {
        if (event.guild_id) {
            await API.cache.post(`message:${event.guild_id}:${event.id}`, event);
            await API.cache.post(`user:${event.author.id}`, event.author);
            if (event.member) await API.cache.post(`member:${event.guild_id}:${event.author.id}`, { user: event.author, ...event.member });
        }
    }

    handleMessageDelete({ d: event }: GatewayMessageDeleteDispatch) {
        if (event.guild_id)
            return API.cache.delete(`message:${event.guild_id}:${event.id}`, false);
    }

    async handleMessageDeleteBulk({ d: event }: GatewayMessageDeleteBulkDispatch) {
        //probably python
        if (event.guild_id)
            for (let i of event.ids)
                await API.cache.delete(`message:${event.guild_id}:${i}`, false);
    }

    async handleGuildDelete({ d: event }: GatewayGuildDeleteDispatch) {
        await API.cache.delete(`guild:${event.id}`, false);
        await API.cache.delete(`*:${event.id}:*`, true);
    }

    async handleGuildUpdate({ d: event }: GatewayGuildUpdateDispatch) {
        await API.cache.post(`guild:${event.id}`, event);
    }

    async handleGuildCreate({ d: event }: GatewayGuildCreateDispatch) {

        await API.cache.post(`guild:${event.id}`, event);

        for (let i of event.roles) await API.cache.post(`role:${event.id}:${i.id}`, i);

        for (let i of event.channels ?? []) await API.cache.post(`channel:${event.id}:${i.id}`, i);

        for (let i of event.threads ?? []) await API.cache.post(`channel:${event.id}:${i.id}`, i);

        for (let i of event.members ?? []) {
            if (i.user) {
                await API.cache.post(`member:${event.id}:${i.user.id}`, i);
                await API.cache.post(`user:${i.user.id}`, i.user);
            } else console.log('No user for member', i);
        }

    }

    handleRoleCreate({ d: event }: GatewayGuildRoleCreateDispatch | GatewayGuildRoleUpdateDispatch) {
        return API.cache.post(`role:${event.guild_id}:${event.role.id}`, event.role);
    }

    async handleRoleDelete({ d: event }: GatewayGuildRoleDeleteDispatch) {
        await API.cache.delete(`role:${event.guild_id}:${event.role_id}`, false);
        for (let i of await API.cache.scan(`member:${event.guild_id}:*`) ?? []) {
            const member = await API.cache.get(i);
            if (member.roles.includes(event.role_id)) {
                member.roles = member.roles.filter((r: string) => r !== event.role_id);
                await API.cache.post(i, member);
            }
        }
    }

    async handleChannelCreate({ d: event }: GatewayChannelCreateDispatch | GatewayChannelUpdateDispatch) {
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

    async handleChannelDelete({ d: event }: GatewayChannelDeleteDispatch) {
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

    async handleGuildMemberUpdate({ d: event }: GatewayGuildMemberUpdateDispatch) {
        await API.cache.post(`user:${event.user.id}`, event.user);
        return API.cache.post(`member:${event.guild_id}:${event.user.id}`, event);
    }

    async handleUserUpdate({ d: event }: GatewayUserUpdateDispatch) {
        return API.cache.post(`user:${event.id}`, event);
    }
}

/*
TODO:
*filter channels types that are not needed
*needed: text, public thread, new thread, private thread

*only use needed properties for roles and channels
*create interface for roles and channels
*/