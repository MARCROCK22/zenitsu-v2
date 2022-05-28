import { ApplicationCommandOptionType, ButtonStyle } from 'discord-api-types/v10';
import { API } from '../../../../../../api.js';
import { BaseCommand, DCommand, DCommandOptions, Interaction } from '../../../base.js';

@DCommand({
    description: 'Play TicTacToe',
    name: 'play',
    options: [{
        name: 'member',
        description: 'Member to play with',
        type: ApplicationCommandOptionType.User,
        required: true,
    }]
})
@DCommandOptions({
    isEphemeral: false,
    needDefer: true,
})
export class Play extends BaseCommand {
    async run(interaction: Interaction) {
        if (!interaction.getMember('member')) return interaction.editOrCreateResponse({
            content: 'You need to specify a member to play with!',
        });
        const user = interaction.getUser('member');
        if (!user) throw new Error('User expected');
        if (user.bot) return interaction.editOrCreateResponse({
            content: 'You can\'t play with a bot!',
        });
        const response = await API.database.createGame([interaction.user.id, user.id]);
        if (!response.ok) return interaction.editOrCreateResponse({
            content: await response.text(),
        });
        return interaction.editOrCreateResponse({
            content: user.username,
            components: [{
                type: 1,
                components: [{
                    type: 2,
                    style: ButtonStyle.Success,
                    label: 'Play',
                    customId: `tictactoe,request,${interaction.user.id},${user.id}`,
                }, {
                    type: 2,
                    style: ButtonStyle.Danger,
                    label: 'Cancel',
                    customId: `tictactoe,cancel,${interaction.user.id},${user.id}`,
                }]
            }]
        });
    }
}