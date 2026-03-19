const fs = require('fs');
const zlib = require('zlib');

const input = 'billions_massive_data.jsonl';
const output = 'billions_massive_data.json.gz';

console.log('Compressing 100,000 records (JSONL)...');
const fileContents = fs.createReadStream(input);
const writeStream = fs.createWriteStream(output);
const gzip = zlib.createGzip();

fileContents.pipe(gzip).pipe(writeStream).on('finish', () => {
    console.log('Successfully compressed 100k records to billions_massive_data.json.gz');
    if (fs.existsSync(input)) fs.unlinkSync(input);
});
