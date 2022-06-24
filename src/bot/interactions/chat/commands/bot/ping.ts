import { API } from '../../../../../api.js';
import { BaseCommand, DCommand, DCommandOptions, type ChatInputInteraction } from '../../../base.js';

@DCommandOptions({
    isEphemeral: false,
    needDefer: true,
})
@DCommand({
    name: 'ping',
    description: 'ponga!',
})
export default class Ping extends BaseCommand {
    async run(interaction: ChatInputInteraction) {
        const ping = await API.ping() as { database: number; redis: number; };
        return interaction.editOrCreateResponse({
            content:
                `Interaction: ${Date.now() - interaction.sendedAt!}ms\n` +
                `Database: ${ping.database}ms\n` +
                `Redis: ${ping.redis}ms\n`,
        });
    }
}