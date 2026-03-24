const fs = require('fs');
const zlib = require('zlib');
const readline = require('readline');
const path = require('path');

const KB_FILE_GZ = path.join(__dirname, 'billions_mega_database.jsonl.gz');

async function testDatabase() {
    if (!fs.existsSync(KB_FILE_GZ)) {
        console.log('File does not exist!');
        return;
    }

    const fileStream = fs.createReadStream(KB_FILE_GZ);
    const gunzip = zlib.createGunzip();
    const rl = readline.createInterface({ 
        input: fileStream.pipe(gunzip), 
        crlfDelay: Infinity 
    });

    let count = 0;
    let found = [];

    for await (const line of rl) {
        if (line.toLowerCase().includes('discord') || line.toLowerCase().includes('og') || line.toLowerCase().includes('twitter')) {
            found.push(line);
            if (found.length >= 5) break;
        }
        count++;
    }

    console.log(`Checked many lines. Total lines processed: ${count}`);
    console.log('Sample matches found:');
    found.forEach(l => console.log(l));
}

testDatabase();
