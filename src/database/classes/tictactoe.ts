const posicionesParaGanar = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6]
];

export class GameTTT {
    map: string[];
    __lastTurn: number;
    winner: null | number;
    draw: boolean;
    ended: boolean;

    constructor() {
        this.map = ['', '', '', '', '', '', '', '', '',];
        this.__lastTurn = 0;
        this.winner = null;
        this.draw = false;
        this.ended = false;
    }

    get turn() {
        return this.__lastTurn == 0 ? 1 : 0;
    }

    get ficha(): 'X' | 'O' {
        return this.turn == 1 ? 'X' : 'O';
    }

    finish() {
        this.ended = true;
        return this;
    }

    get finished() {
        return this.draw || this.ended || (this.winner !== null);
    }

    play(played: number) {
        if (!this.canPlay(played)) throw new Error(`Can't play ${played}.`);
        this.map[played] = this.ficha;
        if (posicionesParaGanar.find(p => p.every(x => this.map[x] == 'X')) || posicionesParaGanar.find(p => p.every(x => this.map[x] == 'O'))) {
            this.winner = this.turn;
            this.draw = false;
            return played;
        } else if (this.map.every(x => x)) {
            this.draw = true;
            return played;
        }
        this.__lastTurn = this.turn;
        return played;
    }

    canPlay(played: number) {
        return this.map[played] === '';
    }

}