import mongoose from 'mongoose';

export interface baseGame {
    _id: mongoose.Types.ObjectId;
    type: string;
    state: 'Waiting' | 'Playing' | 'Finished';
    guildId: string;
    channelId: string;
    messageId: string;
    users: string[];
    board: any;
    turn: number;
    winner?: string;
    moves: string[];
    owner: string;
    accepted: string[];
}

export interface TicTacToeGame extends baseGame {
    type: 'TicTacToe';
    board: string[];
}

export interface Connect4Game extends baseGame {
    type: 'Connect4';
    board: string[];
}

export interface DominoGame extends baseGame {
    type: 'Domino';
    board: { 0: string[]; 1: string[]; 2: string[]; 3: string[]; domino: string[]; extra: string[] }[];
}

export type gameModel =
    TicTacToeGame
    | Connect4Game
    | DominoGame;

// export interface gameModel extends baseGame {
//     _id: mongoose.Types.ObjectId;
//     type: 'Connect4' | 'TicTacToe';
//     state: 'Waiting' | 'Playing' | 'Finished';
//     guildId: string;
//     channelId: string;
//     messageId: string;
//     users: string[];
//     board: string[];
//     turn: number;
//     winner?: string;
//     moves: string[];
//     owner: string;
//     accepted: string[];
// }

const sch = new mongoose.Schema({
    type: { required: true, type: String },
    state: { required: true, type: String, default: 'Waiting' },
    guildId: { required: true, type: String },
    channelId: { required: true, type: String },
    messageId: { required: true, type: String },
    users: { required: true, type: [String] },
    board: { required: true, type: Object },
    turn: { required: true, type: Number },
    winner: { type: String },
    moves: { required: true, type: [String] },
    owner: { required: true, type: String },
    accepted: { required: true, type: [String] }
}, {
    timestamps: true
});

export const gameSchema = mongoose.model<gameModel>('games', sch);