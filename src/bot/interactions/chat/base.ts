import {
    APIApplicationCommandOption, ApplicationCommandType,
    ApplicationCommandOptionType, APIChatInputApplicationCommandInteraction,
    APIApplicationCommandInteractionDataOption,
    InteractionResponseType, MessageFlags,
    APIMessageComponentInteraction
} from 'discord-api-types/v10';

export class BaseCommand {
    name: string = '';
    description: string = '';
    type = ApplicationCommandType.ChatInput;
    options: APIApplicationCommandOption[] | (BaseCommand | BaseSubcommandGroup)[] = [];
    needDefer = false;
    isEphemeral = false;
    run(interaction: Interaction): Promise<any> | any {
        console.log(interaction);
    }

    onBefore(__interaction: Interaction): Promise<boolean> | boolean {
        return true;
    }

    onCancel(__interaction: Interaction): Promise<any> | any {
        // void 0;
    }

    onError(__interaction: Interaction, error: unknown): Promise<any> | any {
        console.error(error);
    }
}

export class BaseSubcommandGroup {
    name: string = '';
    description: string = '';
    type = ApplicationCommandOptionType.SubcommandGroup;
    options: BaseCommand[] = [];
}

export function DCommandOptions(options: { needDefer: boolean, isEphemeral: boolean; }) {
    return function (target: typeof BaseCommand): typeof BaseCommand {
        return class extends target {
            needDefer = options.needDefer;
            isEphemeral = options.isEphemeral;
        };
    };
}

export function DCommand(options: {
    name: string;
    description: string;
    options?: APIApplicationCommandOption[] | (BaseCommand | BaseSubcommandGroup)[]
}) {
    return function (target: typeof BaseCommand) {
        return class extends target {
            name = options.name;
            description = options.description;
            options = options.options || [];
        };
    };
}

export class BaseInteraction {
    readonly data!: APIChatInputApplicationCommandInteraction | APIMessageComponentInteraction;
    readonly client!: import('detritus-client-rest').Client;
    _promise?: Promise<any>;
    sendedAt = 0;
    sended = false;
    constructor(client: import('detritus-client-rest').Client, interaction: APIChatInputApplicationCommandInteraction | APIMessageComponentInteraction) {
        Object.defineProperties(this, {
            client: { value: client },
            data: { value: interaction },
        });
    }

    get user() {
        return this.data.member ? this.data.member.user : this.data.user!;
    }

    async getResponse() {
        if (this._promise) await this._promise;
        if (!this.sended) return Promise.resolve();
        return this.client.fetchWebhookTokenMessage(this.data.application_id, this.data.token, '@original')
            .then(x => {
                return JSON.parse(x.toString());
            });
    }

    async deleteResponse() {
        if (this._promise) await this._promise;
        if (!this.sended) return Promise.resolve();
        return this.client.deleteWebhookTokenMessage(this.data.application_id, this.data.token, '@original');
    }

    async editOrCreateResponse(response: Parameters<this['editResponse']>[0]) {
        if (this._promise) await this._promise;
        if (this.sended) return this.editResponse(response);
        return this.createInteractionResponse(response);
    }

    async createInteractionResponse(response: Exclude<Parameters<import('detritus-client-rest').Client['createInteractionResponse']>[2], number>['data']) {
        this.sendedAt = Date.now();
        this._promise = this.client.createInteractionResponse(this.data.id, this.data.token, {
            type: InteractionResponseType.ChannelMessageWithSource,
            data: response
        }).finally(() => {
            delete this._promise;
            this.sended = true;
        });
        return this._promise;
    }

    async deferUpdate() {
        if (this._promise) await this._promise;
        if (this.sended) return Promise.resolve();
        this.sendedAt = Date.now();
        this._promise = this.client.createInteractionResponse(this.data.id, this.data.token, {
            type: InteractionResponseType.DeferredMessageUpdate,

        }).finally(() => {
            delete this._promise;
            this.sended = true;
        });
        return this._promise;
    }

    async defer(isEphemeral: boolean) {
        if (this._promise) await this._promise;
        if (this.sended) return Promise.resolve();
        this.sendedAt = Date.now();
        this._promise = this.client.createInteractionResponse(this.data.id, this.data.token, {
            type: InteractionResponseType.DeferredChannelMessageWithSource,
            data: {
                flags: isEphemeral ? MessageFlags.Ephemeral : 0
            }
        }).finally(() => {
            delete this._promise;
            this.sended = true;
        });
        return this._promise;
    }

    editResponse(response: Exclude<Parameters<import('detritus-client-rest').Client['editWebhookTokenMessage']>[3], string>) {
        return this.client.editWebhookTokenMessage(this.data.application_id, this.data.token, '@original', response);
    }

    followUp(response: Parameters<import('detritus-client-rest').Client['executeWebhook']>[2]) {
        return this.client.executeWebhook(this.data.application_id, this.data.token, response);
    }

    editFollowUp(messageId: string, response: Parameters<import('detritus-client-rest').Client['editWebhookTokenMessage']>[3]) {
        return this.client.editWebhookTokenMessage(this.data.application_id, this.data.token, messageId, response);
    }

    deleteFollowUp(messageId: string) {
        return this.client.deleteWebhookTokenMessage(this.data.application_id, this.data.token, messageId);
    }

    getFollowUp(messageId: string) {
        return this.client.fetchWebhookTokenMessage(this.data.application_id, this.data.token, messageId);
    }

    get guildLocale() {
        return this.data.guild_locale;
    }

    get userLocale() {
        return this.data.locale;
    }

    get publicLocale() {
        return this.guildLocale || this.userLocale || 'en-US';
    }

}

export class ComponentInteraction extends BaseInteraction {
    readonly data!: APIMessageComponentInteraction;
    get customId() {
        return this.data.data.custom_id;
    }
}

export class Interaction extends BaseInteraction {
    readonly data!: APIChatInputApplicationCommandInteraction;
    readonly options !: APIApplicationCommandInteractionDataOption[];
    constructor(client: import('detritus-client-rest').Client, interaction: APIChatInputApplicationCommandInteraction, options: APIApplicationCommandInteractionDataOption[]) {
        super(client, interaction);
        Object.defineProperties(this, {
            options: { value: options ?? [] },
        });
    }

    get user() {
        return this.data.member ? this.data.member.user : this.data.user!;
    }

    getString(key: string) {
        const option = this.options.find(o => o.name === key);
        if (!option) return null;
        if (option.type === ApplicationCommandOptionType.String) {
            return option.value as string ?? null;
        }
        return null;
    }

    getBoolean(key: string) {
        const option = this.options.find(o => o.name === key);
        if (!option) return false;
        if (option.type === ApplicationCommandOptionType.Boolean) {
            return option.value as boolean ?? false;
        }
        return false;
    }

    getNumber(key: string) {
        const option = this.options.find(o => o.name === key);
        if (!option) return null;
        if (option.type === ApplicationCommandOptionType.Number) {
            return option.value as number ?? null;
        }
        return null;
    }

    getInteger(key: string) {
        const option = this.options.find(o => o.name === key);
        if (!option) return null;
        if (option.type === ApplicationCommandOptionType.Integer) {
            return option.value as number ?? null;
        }
        return null;
    }

    getUser(key: string) {
        const option = this.options.find(o => o.name === key);
        if (!option) return null;
        if (option.type === ApplicationCommandOptionType.User) {
            return this.data.data.resolved?.users![option.value]!;
        }
        return null;
    }

    getMember(key: string) {
        const option = this.options.find(o => o.name === key);
        if (!option) return null;
        if (option.type === ApplicationCommandOptionType.User) {
            return this.data.data.resolved?.members![option.value]!;
        }
        return null;
    }

}