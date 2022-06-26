import { BaseCommand, DCommand } from '../../../../base.js';
import { Play } from './play.js';

@DCommand({
    description: 'TicTacToe',
    name: 'tictactoe',
    options: [new Play()],
})
export default class TicTacToe extends BaseCommand {

}