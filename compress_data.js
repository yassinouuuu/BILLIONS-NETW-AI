const fs = require('fs');
const zlib = require('zlib');
const path = require('path');

const inputPath = path.join(__dirname, 'combined_all_data.json');
const outputPath = path.join(__dirname, 'combined_all_data.json.gz');

const compressFile = () => {
    try {
        console.log('Reading ' + inputPath + '...');
        const fileContents = fs.readFileSync(inputPath);
        
        console.log('Compressing...');
        const compressed = zlib.gzipSync(fileContents);
        
        fs.writeFileSync(outputPath, compressed);
        console.log(`Successfully compressed to ${outputPath}`);
        console.log(`Original size: ${(fileContents.length / 1024 / 1024).toFixed(2)} MB`);
        console.log(`Compressed size: ${(compressed.length / 1024 / 1024).toFixed(2)} MB`);
        
    } catch (err) {
        console.error('An error occurred:', err);
    }
};

compressFile();
