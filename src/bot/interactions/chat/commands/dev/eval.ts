import { ApplicationCommandOptionType } from 'discord-api-types/v10';
import { inspect } from 'util';
import { BaseCommand, DCommand, DCommandOptions, type Interaction } from '../../base.js';

@DCommandOptions({
    isEphemeral: false,
    needDefer: true
})
@DCommand({
    name: 'eval',
    description: 'evaluate',
    options: [{
        type: ApplicationCommandOptionType.String,
        description: 'testxdxd',
        name: 'code',
        required: true,
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
        const code = interaction.getString('code')!;

        try {
            let res = await eval(code);
            await interaction.editOrCreateResponse({
                content: '```js\n' + inspect(res) + '```'
            });
        } catch (e) {
            await interaction.editOrCreateResponse({
                content: '```js\n' + e + '```'
            });
        }

    }
}