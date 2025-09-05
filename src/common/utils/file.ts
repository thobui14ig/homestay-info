import * as fs from 'fs';

const writeFile = (text: string, fileName: string) => {
    fs.writeFileSync(`${fileName}.txt`, text, 'utf-8');
}

export { writeFile }