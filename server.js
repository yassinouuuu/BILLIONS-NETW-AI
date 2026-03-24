const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const readline = require('readline');
const { Readable } = require('stream');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// Data paths
const KB_FILE_GZ = path.join(__dirname, 'billions_combined_mega_db.jsonl.gz');
const COMMUNITY_FILE = path.join(__dirname, 'community_board.json');
const CAPTCHA_STATS_FILE = path.join(__dirname, 'captcha_stats.json');

/** 
 * MEMORY-OPTIMIZED KNOWLEDGE ENGINE (100,000 ENTRIES)
 * Uses Streaming JSONL to stay under 512MB RAM on Render.
 */
let knowledgeMap = new Map();
let keywordMap = new Map();
let uniqueAnswers = [];

async function loadMassiveKnowledgeStream() {
    console.log('--- INITIALIZING MEMORY-OPTIMIZED BRAIN (TRUE STREAMING) ---');
    if (!fs.existsSync(KB_FILE_GZ)) return;

    try {
        const fileStream = fs.createReadStream(KB_FILE_GZ);
        const gunzip = zlib.createGunzip();
        const rl = readline.createInterface({ 
            input: fileStream.pipe(gunzip), 
            crlfDelay: Infinity 
        });

        const answerSet = new Map();
        let count = 0;
        let indexLimit = 300000; // Limit indexed questions to 300k to stay under 512MB RAM

        for await (const line of rl) {
            const trimmed = line.trim();
            if (!trimmed) continue;
            try {
                const item = JSON.parse(trimmed);
                
                // Always store unique answers
                if (!answerSet.has(item.a)) {
                    answerSet.set(item.a, uniqueAnswers.length);
                    uniqueAnswers.push(item.a);
                }
                const answerIdx = answerSet.get(item.a);

                // Priority indexing
                const cleanQ = item.q.toLowerCase().trim();
                const isPriority = item.tags && (item.tags.includes('core') || item.tags.includes('specialized') || item.tags.includes('discord') || item.tags.includes('airdrop'));

                if (isPriority || (count < indexLimit)) {
                    knowledgeMap.set(cleanQ, answerIdx);
                    if (item.tags) {
                        item.tags.forEach(tag => {
                            if (!keywordMap.has(tag)) keywordMap.set(tag, answerIdx);
                        });
                    }
                }
                
                count++;
                
                // Monitor memory every 50k lines
                if (count % 50000 === 0) {
                    const mem = process.memoryUsage().heapUsed / 1024 / 1024;
                    if (mem > 450) {
                        console.log(`⚠️ Memory Warning: ${mem.toFixed(2)} MB. Stopping further indexing.`);
                        break; 
                    }
                }
            } catch (e) { }
        }

        console.log(`✅ Success: ${count} patterns processed. ${knowledgeMap.size} unique keys indexed.`);
        console.log(`✅ Final RAM Usage: ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB`);
    } catch (err) {
        console.error('Brain stream error:', err);
    }
}

function searchLocalBrain(query) {
    const q = query.toLowerCase().trim();
    if (knowledgeMap.has(q)) return uniqueAnswers[knowledgeMap.get(q)];

    const words = q.split(/\s+/);
    for (const word of words) {
        if (keywordMap.has(word)) return uniqueAnswers[keywordMap.get(word)];
    }
    
    for (const [key, idx] of keywordMap) {
        if (q.includes(key)) return uniqueAnswers[idx];
    }
    return null;
}

// Community & Stats helpers
let communityBoard = [];
let captchaStats = { humans: 0, bots: 0 };

function loadOtherData() {
    try {
        if (fs.existsSync(COMMUNITY_FILE)) communityBoard = JSON.parse(fs.readFileSync(COMMUNITY_FILE, 'utf8'));
        if (fs.existsSync(CAPTCHA_STATS_FILE)) captchaStats = JSON.parse(fs.readFileSync(CAPTCHA_STATS_FILE, 'utf8'));
    } catch (e) { console.error('Data error:', e); }
}

// Routes
app.post('/api/chat', (req, res) => {
    const userText = req.body.question;
    if (!userText) return res.status(400).json({ error: 'Question required' });

    const answer = searchLocalBrain(userText);
    if (answer) return res.json({ answer });

    res.json({ 
        answer: "As an AI focused strictly on Billions Network, I couldn't find a direct match. Please ask about TGE, Airdrop, Open Claw, or our goal." 
    });
});

app.get('/api/community', (req, res) => res.json(communityBoard));
app.post('/api/community', (req, res) => {
    const { name, message } = req.body;
    if (name && message) {
        communityBoard.unshift({ name, message, date: new Date().toLocaleString() });
        if (communityBoard.length > 50) communityBoard.pop();
        fs.writeFileSync(COMMUNITY_FILE, JSON.stringify(communityBoard));
        res.json({ success: true, board: communityBoard });
    } else res.status(400).json({ error: 'Required fields missing' });
});

app.get('/api/stats', (req, res) => res.json(captchaStats));
app.post('/api/verify', (req, res) => {
    if (req.body.isHuman) captchaStats.humans++; else captchaStats.bots++;
    fs.writeFileSync(CAPTCHA_STATS_FILE, JSON.stringify(captchaStats));
    res.json(captchaStats);
});

// Initialization
(async () => {
    await loadMassiveKnowledgeStream();
    loadOtherData();
    app.listen(PORT, () => {
        console.log(`Server RUNNING on port ${PORT}`);
        console.log(`Optimized Brain: 100,000 records ready.`);
    });
})();
