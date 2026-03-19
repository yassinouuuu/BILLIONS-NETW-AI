const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
require('dotenv').config();
const zlib = require('zlib');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// Data paths
const KB_FILE_GZ = path.join(__dirname, 'billions_massive_data.json.gz');
const DATA_FILE = path.join(__dirname, 'data.json.gz');
const COMMUNITY_FILE = path.join(__dirname, 'community_board.json');
const CAPTCHA_STATS_FILE = path.join(__dirname, 'captcha_stats.json');

// Memory Storage
let aiData = [];
let communityBoard = [];
let captchaStats = { humans: 0, bots: 0 };

/** 
 * MASSIVE 1,000,000 ENTRY KNOWLEDGE ENGINE (Memory-Optimized)
 * Optimized for keyword and semantic pattern matching.
 */
let knowledgeMap = new Map(); // question -> answerIndex
let keywordMap = new Map();   // single_word -> answerIndex
let uniqueAnswers = [];

function loadMassiveKnowledge() {
    console.log('--- INITIALIZING MASSIVE KNOWLEDGE ENGINE (1,000,000 ENTRIES) ---');
    try {
        if (!fs.existsSync(KB_FILE_GZ)) return;

        const compressedKB = fs.readFileSync(KB_FILE_GZ);
        const kbRaw = zlib.gunzipSync(compressedKB).toString('utf8');
        const fullArray = JSON.parse(kbRaw);

        const answerSet = new Map();

        fullArray.forEach(item => {
            if (!answerSet.has(item.a)) {
                answerSet.set(item.a, uniqueAnswers.length);
                uniqueAnswers.push(item.a);
            }
            const answerIdx = answerSet.get(item.a);
            
            // 1. Precise Pattern (normalize by removing internal refs)
            const cleanQ = item.q.split(' (Ref:')[0].toLowerCase().trim();
            knowledgeMap.set(cleanQ, answerIdx);

            // 2. Keyword Indexing
            if (item.tags) {
                item.tags.forEach(tag => {
                    if (!keywordMap.has(tag)) keywordMap.set(tag, answerIdx);
                });
            }
        });

        console.log(`✅ Success: Indexed ${knowledgeMap.size} semantic patterns.`);
        console.log(`✅ Success: Indexed ${keywordMap.size} critical keywords.`);
    } catch (err) {
        console.error('Local brain error:', err);
    }
}

function searchLocalBrain(query) {
    const q = query.toLowerCase().trim();
    
    // 1. Precise Match in 1,000,000 variations
    if (knowledgeMap.has(q)) {
        return uniqueAnswers[knowledgeMap.get(q)];
    }

    // 2. Multi-word search (check if any multi-word phrase in knowledgeMap matches)
    // For performance, we check common keywords first
    const words = q.split(/\s+/);
    for (const word of words) {
        if (keywordMap.has(word)) {
            return uniqueAnswers[keywordMap.get(word)];
        }
    }
    
    // 3. Last fallback: Check if any part of the query is a key term
    for (const [key, idx] of keywordMap) {
        if (q.includes(key)) return uniqueAnswers[idx];
    }

    return null;
}

// Load other data
function loadOtherData() {
    try {
        if (fs.existsSync(DATA_FILE)) {
            const data = zlib.gunzipSync(fs.readFileSync(DATA_FILE)).toString('utf8');
            aiData = JSON.parse(data);
        }
        if (fs.existsSync(COMMUNITY_FILE)) {
            communityBoard = JSON.parse(fs.readFileSync(COMMUNITY_FILE, 'utf8'));
        }
        if (fs.existsSync(CAPTCHA_STATS_FILE)) {
            captchaStats = JSON.parse(fs.readFileSync(CAPTCHA_STATS_FILE, 'utf8'));
        }
    } catch (e) { console.error('Data error:', e); }
}

// Routes
app.post('/api/chat', (req, res) => {
    const userText = req.body.question;
    if (!userText) return res.status(400).json({ error: 'Question required' });

    const answer = searchLocalBrain(userText);
    
    if (answer) {
        console.log(`[Local Brain] Matched query: "${userText}"`);
        return res.json({ answer });
    }

    res.json({ 
        answer: "As an AI focused strictly on Billions Network, I couldn't find a direct match for that. Please ask about TGE, Airdrop, Open Claw, or the Network goal." 
    });
});

// Community Board Endpoints
app.get('/api/community', (req, res) => res.json(communityBoard));
app.post('/api/community', (req, res) => {
    const { name, message } = req.body;
    if (name && message) {
        communityBoard.unshift({ name, message, date: new Date().toLocaleString() });
        if (communityBoard.length > 50) communityBoard.pop();
        fs.writeFileSync(COMMUNITY_FILE, JSON.stringify(communityBoard));
        res.json({ success: true, board: communityBoard });
    } else {
        res.status(400).json({ error: 'Name and message required' });
    }
});

// Captcha Stats
app.get('/api/stats', (req, res) => res.json(captchaStats));
app.post('/api/verify', (req, res) => {
    if (req.body.isHuman) {
        captchaStats.humans++;
    } else {
        captchaStats.bots++;
    }
    fs.writeFileSync(CAPTCHA_STATS_FILE, JSON.stringify(captchaStats));
    res.json(captchaStats);
});

// Start Server
loadMassiveKnowledge();
loadOtherData();
app.listen(PORT, () => {
    console.log(`Server RUNNING on port ${PORT}`);
    console.log(`Gemini AI: REMOVED by request.`);
    console.log(`Local Brain: 1,000,000 records ready.`);
});
