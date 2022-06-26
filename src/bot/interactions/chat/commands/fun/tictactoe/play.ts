import { ApplicationCommandOptionType, ButtonStyle } from 'discord-api-types/v10';
import { API } from '../../../../../../api.js';
import { gameModel } from '../../../../../../database/models/game.js';
import { BaseCommand, DCommand, DCommandOptions, type ChatInputInteraction } from '../../../../base.js';

@DCommand({
    description: 'Play tictactoe',
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
    async run(interaction: ChatInputInteraction) {
        if (!interaction.data.guild_id) return interaction.editOrCreateResponse({ content: 'no guild xdxd' });
        if (!interaction.getMember('member')) return interaction.editOrCreateResponse({
            content: 'You need to specify a member to play with!',
        });
        const user = interaction.getUser('member');
        if (!user) throw new Error('User expected');
        if (user.bot) return interaction.editOrCreateResponse({
            content: 'You can\'t play with a bot!',
        });
        const messageId = await interaction.getResponse().then(x => x.id);
        const response = await API.database.createGame([interaction.user.id, user.id], {
            channelId: interaction.data.channel_id,
            messageId,
            guildId: interaction.data.guild_id,
            type: 'TicTacToe'
        });
        if (!response.ok) return interaction.editOrCreateResponse({
            content: await response.text(),
        });
        const game = await response.json() as gameModel;
        return interaction.editOrCreateResponse({
            content: `${user.username} tai invitado pa jugai ttt`,
            components: [{
                type: 1,
                components: [{
                    type: 2,
                    style: ButtonStyle.Success,
                    label: 'Play',
                    customId: `tictactoe,request,${game._id}`,
                }, {
                    type: 2,
                    style: ButtonStyle.Danger,
                    label: 'Cancel',
                    customId: `tictactoe,cancel,${game._id}`,
                }]
            }]
        });
    }
}