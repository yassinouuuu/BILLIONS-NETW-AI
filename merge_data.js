const fs = require('fs');
const path = require('path');

const filesToMerge = [
    'billions_massive_data.json',
    'billions_specific_data_5k.json',
    'crypto_airdrops_5k.json'
];

let combinedData = [];
let idCounter = 1;

filesToMerge.forEach(filename => {
    const filePath = path.join(__dirname, filename);
    if (fs.existsSync(filePath)) {
        try {
            const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            if (Array.isArray(data)) {
                data.forEach(item => {
                    combinedData.push({
                        id: idCounter++,
                        q: item.q || '',
                        a: item.a || ''
                    });
                });
                console.log(`Loaded ${data.length} items from ${filename}`);
            }
        } catch (e) {
            console.error(`Error processing ${filename}:`, e.message);
        }
    } else {
        console.log(`${filename} not found, skipping.`);
    }
});

const outputFilename = 'combined_all_data.json';
fs.writeFileSync(path.join(__dirname, outputFilename), JSON.stringify(combinedData, null, 2));

console.log(`Successfully merged all data into ${outputFilename}. Total items: ${combinedData.length}`);
