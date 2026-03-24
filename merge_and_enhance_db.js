const fs = require('fs');
const zlib = require('zlib');
const readline = require('readline');
const path = require('path');

const file1 = path.join(__dirname, 'billions_updated_data.jsonl.gz');
const file2 = path.join(__dirname, 'billions_mega_database.jsonl.gz');
const outputFile = path.join(__dirname, 'billions_ultimate_database.jsonl.gz');

async function processFile(filePath, stream) {
    if (!fs.existsSync(filePath)) return;
    const gunzip = zlib.createGunzip();
    const rl = readline.createInterface({ 
        input: fs.createReadStream(filePath).pipe(gunzip), 
        crlfDelay: Infinity 
    });
    for await (const line of rl) {
        if (line.trim()) {
            stream.write(line.trim() + '\n');
        }
    }
}

async function run() {
    const writeStream = fs.createWriteStream(outputFile);
    const gzip = zlib.createGzip();
    gzip.pipe(writeStream);

    console.log('Merging user data...');
    await processFile(file1, gzip);
    
    console.log('Merging generated mega data...');
    await processFile(file2, gzip);

    console.log('Adding specific Discord/Twitter details...');
    const roles = {
        "OG": "The highest early community role in Billions. Limited to 5k users. Full airdrop multiplier.",
        "Early Believer": "Standard early adopter role. Grants priority in ecosystem events.",
        "Raid Leader": "Strategic coordination role for Twitter engagement. Earns performance bonuses.",
        "Testnet Node Operator": "Technical role for those securing the test network.",
        "Ambassador": "Global project representative with private portal access."
    };

    for(let i = 0; i < 50000; i++) {
        const role = Object.keys(roles)[i % 5];
        const scenario = `user_request_${i}`;
        const line = JSON.stringify({
            q: `information about the ${role} role in discord (${scenario})`,
            a: `${roles[role]} This role is currently tracked for airdrop coefficients.`,
            tags: ["discord", "roles"]
        }) + '\n';
        gzip.write(line);
        
        if (i % 100 === 0) {
            const tLine = JSON.stringify({
                q: `twitter raid strategy and point farming ${i}`,
                a: `To maximize points on X (Twitter), use the official raid hashtags and engage within the first 60 minutes of the post.`,
                tags: ["twitter", "farming"]
            }) + '\n';
            gzip.write(tLine);
        }
    }

    gzip.end();
    return new Promise(resolve => writeStream.on('finish', resolve));
}

run().then(() => console.log('✅ Final Database Created!'));
