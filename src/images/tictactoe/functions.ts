import { Image, GIF, decode } from 'imagescript';
import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';

const imagesBuffer_X = readdirSync(join(process.cwd(), 'assets', 'images', 'tictactoe', 'X'))
    .map(x =>
        readFileSync(join(process.cwd(), 'assets', 'images', 'tictactoe', 'X', x))
    );
const imagesBuffer_O = readdirSync(join(process.cwd(), 'assets', 'images', 'tictactoe', 'O'))
    .map(x =>
        readFileSync(join(process.cwd(), 'assets', 'images', 'tictactoe', 'O', x))
    );

const backgroundBuffer = readFileSync(join(process.cwd(), 'assets', 'images', 'tictactoe', 'background.png'));

export default async function drawTictactoeBoard(board: { map: [string, number][]; turn: string; }) {
    const image = new Image(300, 300);

    const background = await decode(backgroundBuffer);
    if (background instanceof GIF) throw new Error('GIF not supported');
    image.composite(background, 0, 0);

    let index = 0;
    for (let [key, value] of board.map) {
        const y = index % 3;
        const x = Math.floor(index / 3);
        switch (key) {
            case 'X':
            case 'x': {
                const X_RANDOM = await decode(imagesBuffer_X[value]);
                if (X_RANDOM instanceof GIF) throw new Error('GIF not supported');
                image.composite(X_RANDOM, y * 100, x * 100);
            }
                break;
            case 'O':
            case 'o': {
                const O_RANDOM = await decode(imagesBuffer_O[value]);
                if (O_RANDOM instanceof GIF) throw new Error('GIF not supported');
                image.composite(O_RANDOM, y * 100, x * 100);
            }
                break;
        }
        index++;
    }

    return image.encode();
}