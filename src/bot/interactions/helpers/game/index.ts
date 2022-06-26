import { cancel } from './cancel.js';
import { request } from './request.js';
import { move } from './move.js';
import * as GameFunctions from '../index.js';
import { Game } from '@prisma/client';

export {
    move,
    request,
    cancel
};

export function parseGameType(type: Game['type']) {
    switch (type) {
        case 'Connect4':
            return GameFunctions.Connect4;
        case 'TicTacToe':
            return GameFunctions.TicTacToe;
    }
}