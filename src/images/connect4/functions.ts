import { Image, decode } from 'imagescript';
import { splitArray } from '../../bot/functions.js';
// import fetch from 'node-fetch';

export async function drawConnect4Board(board: { map: string[]; }) {
    console.log(board);
    const image = new Image(700, 600);
    image.fill(0xACACACff);

    const splited = splitArray(board.map, 6);

    for (let x in splited) {
        for (let y in splited[x]) {
            const ficha = splited[x][y];
            switch (ficha) {
                case '1':
                    image.drawBox(Number(x) * 100, Math.abs((Number(y) * 100) - 500), 100, 100, 0xffff00ff);
                    break;
                case '2':
                    image.drawBox(Number(x) * 100, Math.abs((Number(y) * 100) - 500), 100, 100, 0xff0000ff);
                    break;
            }
        }
    }

    return image.encode();
}