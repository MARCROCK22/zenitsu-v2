import { API } from '../../../../api.js';
import { ComponentInteraction } from '../../base.js';

export async function cancel(interaction: ComponentInteraction, userId: string, opponentId: string) {
    if (![userId, opponentId].includes(interaction.user.id)) return;
    await API.database.deleteGame(interaction.user.id);
    await interaction.editOrCreateResponse({ content: `Deleted by <@${interaction.user.id}>` });
}