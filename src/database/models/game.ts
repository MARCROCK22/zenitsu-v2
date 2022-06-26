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

/*
// This is your Prisma schema file,
// learn more about it in the docs: https://pris.ly/d/prisma-schema

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "mongodb"
  url      = env("DATABASE_URL")
}

model Game {
  id        String    @id @default(cuid()) @map("_id")
  type      GameType
  state     GameState @default(Waiting)
  guildId   String
  channelId String
  messageId String
  users     String[]
  board     String[]
  turn      Int
  winner    String?
  moves     String[] //...moves
  owner     String
  accepted  String[]
}

enum GameType {
  TicTacToe
  Connect4
}

enum GameState {
  Waiting
  Playing
  Finished
}

 */