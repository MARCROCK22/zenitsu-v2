import {
    join
} from 'path';
import {
    readdir,
    stat as fsStat
} from 'fs/promises';
import { BaseCommand } from './interactions/base';
import { RequestTypes } from 'detritus-client-rest';

export async function getFiles(dir: string) {
    const files = await readdir(dir);
    const fileList: string[] = [];
    for (const file of files) {
        const filePath = join(dir, file);
        const stat = await fsStat(filePath);
        if (stat.isDirectory()) {
            fileList.push(...await getFiles(filePath));
        } else {
            fileList.push(filePath);
        }
    }
    return fileList;
}

export async function loadCommands() {
    const commands: BaseCommand[] = [];
    const cmds = await getFiles(join(process.cwd(), 'dist', 'bot', 'interactions'));
    for (let i of cmds) {
        const cmd = await import('file:///' + i);
        if (cmd.default) {
            commands.push(new cmd.default());
            console.log(`Loaded command: ${commands[commands.length - 1].name}`);
        }
    }
    return commands;
}

export function splitArray<T>(array: T[], chunkSize: number): T[][] {
    const results = [];
    array = array.slice();
    while (array.length) {
        results.push(array.splice(0, chunkSize));
    }
    return results;
}


export function createComponentRow(length: number, cb: (index: number) => Omit<RequestTypes.CreateChannelMessageComponent, 'type' | 'components'>) {
    const row: RequestTypes.CreateChannelMessageComponent[] = [];
    for (let i = 0; i < length; i++) {
        row.push({
            type: 2,
            ...cb(i)
        });
    }
    return row;
}