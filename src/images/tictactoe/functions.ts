import { Image, GIF, decode } from 'imagescript';
import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';
// import fetch from 'node-fetch';
import chroma from 'chroma-js';
import { findIndexByCase } from '../../database/classes/tictactoe.js';

const imagesBuffer_X = readdirSync(join(process.cwd(), 'assets', 'images', 'tictactoe', 'X'))
    .map(x =>
        readFileSync(join(process.cwd(), 'assets', 'images', 'tictactoe', 'X', x))
    );
const imagesBuffer_O = readdirSync(join(process.cwd(), 'assets', 'images', 'tictactoe', 'O'))
    .map(x =>
        readFileSync(join(process.cwd(), 'assets', 'images', 'tictactoe', 'O', x))
    );

const backgroundBuffer = readFileSync(join(process.cwd(), 'assets', 'images', 'tictactoe', 'background.png'));

export async function drawTictactoeBoard(board: { map: [string, number][]; turn: number; }) {
    const image = new Image(300, 300);
    // const background = await decode(await fetch('https://cdn.discordapp.com/attachments/804318974086610954/986793073424076861/2xx7529.jpg').then(x => x.buffer()));
    const background = await decode(backgroundBuffer);
    if (background instanceof GIF) throw new Error('Unexpected GIF');
    image.composite(background, 0, 0);

    let index = 0;
    for (let [key, value] of board.map) {
        const y = index % 3;
        const x = Math.floor(index / 3);
        switch (key) {
            case 'X':
            case 'x': {
                const X_RANDOM = await decode(imagesBuffer_X[value]);
                if (X_RANDOM instanceof GIF) throw new Error('Unexpected GIF');
                X_RANDOM.fill((x, y) => {
                    const pixel = X_RANDOM.getPixelAt(x, y);
                    const [r, g, b, a] = Image.colorToRGBA(pixel);
                    const [mixR, mixG, mixB] = chroma.mix('#' + Image.rgbToColor(r, g, b).toString(16), '#ff0000', 0.7, 'rgb').rgb();
                    return Image.rgbaToColor(mixR, mixG, mixB, a);
                });
                image.composite(X_RANDOM, y * 100, x * 100);
            }
                break;
            case 'O':
            case 'o': {
                const O_RANDOM = await decode(imagesBuffer_O[value]);
                if (O_RANDOM instanceof GIF) throw new Error('Unexpected GIF');
                O_RANDOM.fill((x, y) => {
                    const pixel = O_RANDOM.getPixelAt(x, y);
                    const [r, g, b, a] = Image.colorToRGBA(pixel);
                    const [mixR, mixG, mixB] = chroma.mix('#' + Image.rgbToColor(r, g, b).toString(16), '#0000ff', 0.7, 'rgb').rgb();
                    return Image.rgbaToColor(mixR, mixG, mixB, a);
                });
                image.composite(O_RANDOM, y * 100, x * 100);
            }
                break;
        }
        index++;
    }

    let winMethod: {
        mode: number; y: number; x: number;
    } | undefined;

    const findCases = [
        findIndexByCase(board.map.map(x => x[0]), 'X'),
        findIndexByCase(board.map.map(x => x[0]), 'O'),
    ];

    switch (findCases.find(x => x !== -1)) {
        case 0:
            winMethod = {
                mode: 1,
                y: 0,
                x: 0
            };
            break;
        case 1:
            winMethod = {
                mode: 1,
                y: 1,
                x: 0
            };
            break;
        case 2:
            winMethod = {
                mode: 1,
                y: 2,
                x: 0
            };
            break;
        case 3:
            winMethod = {
                mode: 2,
                y: 0,
                x: 0
            };
            break;
        case 4:
            winMethod = {
                mode: 2,
                y: 0,
                x: 1
            };
            break;
        case 5:
            winMethod = {
                mode: 2,
                y: 0,
                x: 2
            };
            break;
        case 6:
            winMethod = {
                mode: 3,
                y: 0,
                x: 0
            };
            break;
        case 7:
            winMethod = {
                mode: 4,
                y: 0,
                x: 0
            };
            break;
    }

    if (winMethod) {
        switch (winMethod.mode) {
            case 1:
                image.fill((x, y) => {
                    const pixel = image.getPixelAt(x, y);
                    if (y === ((winMethod!.y + 1) * (image.width / 3)) - (image.width / 6)) {
                        const color = 0xff0000ff;
                        const random = Math.floor(Math.random() * 5);
                        for (let i = 0; i < 5; i++) {
                            if (!(x % 4)) image.composite(getCircle(), x, y + i - random);
                        }
                        return color;
                    }
                    return pixel;
                });
                break;
            case 2:
                image.fill((x, y) => {
                    const pixel = image.getPixelAt(x, y);
                    if (x === ((winMethod!.x + 1) * (image.width / 3)) - (image.width / 6)) {
                        const color = 0xff0000ff;
                        const random = Math.floor(Math.random() * 5);
                        for (let i = 0; i < 5; i++) {
                            if (!(y % 4)) image.composite(getCircle(), x - i - random, y);
                        }
                        return color;
                    }
                    return pixel;
                });
                break;
            case 3:
                image.fill((x, y) => {
                    const pixel = image.getPixelAt(x, y);
                    if (x === y) {
                        const color = 0xff0000ff;
                        const random = Math.floor(Math.random() * 5);
                        for (let i = 0; i < 3; i++) {
                            if (!(x % 2)) image.composite(getCircle(), x, y + i - random);
                        }
                        return color;
                    }
                    return pixel;
                });
                break;
            case 4:
                image.fill((x, y) => {
                    const pixel = image.getPixelAt(x, y);
                    if (y + x === image.width) {
                        const color = 0xff0000ff;
                        const random = Math.floor(Math.random() * 5);
                        for (let i = 0; i < 3; i++) {
                            if (!(x % 2)) image.composite(getCircle(), x, y + i - random);
                        }
                        return color;
                    }
                    return pixel;
                });
                break;
        }
    }

    return image.encode();
}


function getCircle() {
    const circle = new Image(5, 5);
    circle.fill(0xff0000ff);
    circle.cropCircle();
    circle.fill((x, y) => {
        const pixel = circle.getPixelAt(x, y);
        return Math.random() > .2 ? pixel : 0xffffffff;
    });
    return circle;
}
/*
export const posicionesParaGanar = [
    0. [0, 1, 2],
    1. [3, 4, 5],
    2. [6, 7, 8],
    3. [0, 3, 6],
    4. [1, 4, 7],
    5. [2, 5, 8],
    6. [0, 4, 8],
    7. [2, 4, 6]
];
 */