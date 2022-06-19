import { ApplicationCommandOptionType } from 'discord-api-types/v10';
import { inspect } from 'util';
import { BaseCommand, DCommand, DCommandOptions, type Interaction } from '../../../base.js';
import { doRequest } from '../../../../puppetter.js';

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

        // try {
        //     const page = await browser.newPage();
        //     await page.goto('http://localhost:3333/test');
        //     const buffer = await page.screenshot({ type: 'png' });
        //     console.log(typeof buffer, buffer);
        //     if (typeof buffer !== 'string')
        //         buffers.push(buffer);
        //     await page.close();
        // } catch (e) {
        //     console.log(e);
        // }

        const code = interaction.getString('code')!;

        try {
            let res = await eval(code);
            await interaction.editOrCreateResponse({
                content: '```js\n' + inspect(res) + '```',
                files: [{
                    value: await doRequest('http://localhost:3333/test?map=%5B\'X\'%2C%20\'O\'%5D') as Buffer,
                    filename: 'ttt.png'
                }]
            });
        } catch (e) {
            console.log(e);
            await interaction.editOrCreateResponse({
                content: '```js\n' + e + '```',
                embeds: e && typeof e === 'object' && 'errors' in e ? [{
                    description: '```js\n' + JSON.stringify((e as { errors: any }).errors, null, 2) + '```',
                }] : undefined,
            });
        }

    }
}