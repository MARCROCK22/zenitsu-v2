import mongoose from 'mongoose';

export interface gameModel {
  _id: mongoose.Types.ObjectId;
  type: 'Connect4' | 'TicTacToe';
  state: 'Waiting' | 'Playing' | 'Finished';
  guildId: string;
  channelId: string;
  messageId: string;
  users: string[];
  board: string[];
  turn: number;
  winner?: string;
  moves: string[];
  owner: string;
  accepted: string[];
}

const sch = new mongoose.Schema({
  type: { required: true, type: String },
  state: { required: true, type: String, default: 'Waiting' },
  guildId: { required: true, type: String },
  channelId: { required: true, type: String },
  messageId: { required: true, type: String },
  users: { required: true, type: [String] },
  board: { required: true, type: [String] },
  turn: { required: true, type: Number },
  winner: { type: String },
  moves: { required: true, type: [String] },
  owner: { required: true, type: String },
  accepted: { required: true, type: [String] }
}, {
  timestamps: true
});

export const gameSchema = mongoose.model<gameModel>('games', sch);