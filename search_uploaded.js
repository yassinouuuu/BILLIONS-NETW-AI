const fs = require('fs');
const zlib = require('zlib');
const readline = require('readline');
const path = require('path');

const file = path.join(__dirname, 'billions_updated_data.jsonl.gz');

async function search() {
    console.log('Searching for Discord/Twitter keywords in uploaded file...');
    const gunzip = zlib.createGunzip();
    const rl = readline.createInterface({ 
        input: fs.createReadStream(file).pipe(gunzip), 
        crlfDelay: Infinity 
    });

    let found = 0;
    for await (const line of rl) {
        if (line.toLowerCase().includes('og role') || line.toLowerCase().includes('raid') || line.toLowerCase().includes('multiplier')) {
            console.log(line);
            found++;
            if (found > 5) break;
        }
    }
    if (found === 0) console.log('No specific Discord roles/raid info found in this file.');
}

search();
