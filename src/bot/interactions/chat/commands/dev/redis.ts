import { ApplicationCommandOptionType } from 'discord-api-types/v10';
import { API } from '../../../../../api.js';
import { BaseCommand, DCommand, DCommandOptions, type Interaction } from '../../base.js';

@DCommandOptions({
    isEphemeral: false,
    needDefer: true
})
@DCommand({
    name: 'redis',
    description: 'redis test',
    options: [{
        type: ApplicationCommandOptionType.String,
        description: 'testxdxd',
        name: 'query',
        required: true,
    }, {
        type: ApplicationCommandOptionType.Boolean,
        description: 'testxdxd',
        name: 'scan',
        required: false,
    }]
})
export default class Test extends BaseCommand {

    onBefore(interaction: Interaction): boolean | Promise<boolean> {
        return interaction.user.id === '507367752391196682';
    }

    onCancel(interaction: Interaction) {
        return interaction.editOrCreateResponse({
            content: 'no.'
        });
    }

    async run(interaction: Interaction) {
        const query = interaction.getString('query')!;
        const scan = interaction.getBoolean('scan');
        await interaction.editOrCreateResponse({
            files: [{
                value: Buffer.from(JSON.stringify(scan ? await API.cache.scan(query) : await API.cache.get(query), null, 2)),
                filename: 'response.json'
            }]
        });
    }
}