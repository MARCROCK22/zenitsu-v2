import { BaseCommand, DCommand, DCommandOptions } from '../../../base.js';
import { Play } from './play.js';

@DCommand({
    description: 'TicTacToe',
    name: 'tictactoe',
    options: [new Play()],
})
@DCommandOptions({
    isEphemeral: false,
    needDefer: true,
})
export default class TicTacToe extends BaseCommand {

}