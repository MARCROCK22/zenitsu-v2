import { BaseCommand, DCommand, DCommandOptions } from '../../../../base.js';
import { Play } from './play.js';

@DCommand({
    description: 'Connect4',
    name: 'connect4',
    options: [new Play()],
})
@DCommandOptions({
    isEphemeral: false,
    needDefer: true,
})
export default class Connect4 extends BaseCommand {

}