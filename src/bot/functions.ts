import {
    join
} from 'path';
import {
    readdir,
    stat as fsStat
} from 'fs/promises';

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