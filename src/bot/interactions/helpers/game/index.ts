import { cancel } from './cancel.js';
import { request } from './request.js';
import { move } from './move.js';
import * as GameFunctions from '../index.js';
import { gameModel } from '../../../../database/models/game.js';

export {
    move,
    request,
    cancel
};

export function parseGameType(type: gameModel['type']) {
    switch (type) {
        case 'Connect4':
            return GameFunctions.Connect4;
        case 'TicTacToe':
            return GameFunctions.TicTacToe;
    }
}