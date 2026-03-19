const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();
const fs = require('fs');
const zlib = require('zlib');
const path = require('path');
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'combined_all_data.json.gz');

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public'))); // Serve frontend files from 'public' folder

// Global data array
let aiData = [];
let communityBoard = [];
let captchaStats = { humans: 0, bots: 0 };

const COMMUNITY_FILE = path.join(__dirname, 'community_board.json');
const CAPTCHA_STATS_FILE = path.join(__dirname, 'captcha_stats.json');
const MERGE_THRESHOLD = 100; // 100 Qs + 100 As = 200 messages

// Helper: Read data into memory
function loadData() {
  try {
    const compressedData = fs.readFileSync(DATA_FILE);
    const data = zlib.gunzipSync(compressedData).toString('utf8');
    aiData = JSON.parse(data);
    console.log(`Loaded ${aiData.length} records into AI memory.`);

    // Load Community Board
    if (fs.existsSync(COMMUNITY_FILE)) {
      const commData = fs.readFileSync(COMMUNITY_FILE, 'utf8');
      communityBoard = JSON.parse(commData);
      console.log(`Loaded ${communityBoard.length} items to community board.`);
    } else {
      communityBoard = [];
      fs.writeFileSync(COMMUNITY_FILE, JSON.stringify(communityBoard), 'utf8');
    }

    // Load Captcha Stats
    if (fs.existsSync(CAPTCHA_STATS_FILE)) {
      const statsData = fs.readFileSync(CAPTCHA_STATS_FILE, 'utf8');
      captchaStats = JSON.parse(statsData);
      console.log(`Loaded captcha stats: Humans ${captchaStats.humans}, Bots ${captchaStats.bots}`);
    } else {
      fs.writeFileSync(CAPTCHA_STATS_FILE, JSON.stringify(captchaStats), 'utf8');
    }
  } catch (err) {
    console.error('Error reading data file', err);
    aiData = [];
  }
}

// Load data on startup
loadData();

// Helper: Save data
function saveData() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(aiData), 'utf8');
    return true;
  } catch (err) {
    console.error('Error saving data file', err);
    return false;
  }
}

// Helper: Save community data
function saveCommunityData() {
  try {
    fs.writeFileSync(COMMUNITY_FILE, JSON.stringify(communityBoard, null, 2), 'utf8');
  } catch (err) {
    console.error('Error saving community data', err);
  }
}

// Helper: Save captcha stats
function saveCaptchaStats() {
  try {
    fs.writeFileSync(CAPTCHA_STATS_FILE, JSON.stringify(captchaStats, null, 2), 'utf8');
  } catch (err) {
    console.error('Error saving captcha stats', err);
  }
}

// Logic to merge into AI database
function checkAndMergeAI() {
  const answeredQuestions = communityBoard.filter(q => q.a !== null);
  
  if (answeredQuestions.length >= MERGE_THRESHOLD) {
    console.log(`Threshold reached! Merging ${answeredQuestions.length} Q&As into AI Database...`);
    
    // 1. Get highest ID
    let maxId = aiData.length > 0 ? Math.max(...aiData.map(i => i.id)) : Date.now();
    
    // 2. Add them to AI Data
    answeredQuestions.forEach(item => {
      maxId++;
      aiData.push({
        id: maxId,
        q: item.q.toLowerCase(),
        a: item.a
      });
    });

    // 3. Re-compress and save back to gzip
    try {
      const dataString = JSON.stringify(aiData);
      const compressed = zlib.gzipSync(dataString);
      fs.writeFileSync(DATA_FILE, compressed);
      console.log('AI Database successfully compressed and updated!');
    } catch(e) {
      console.error('Error compressing new AI data:', e);
    }

    // 4. Reset Community Board 
    // (We keep unanswered questions, delete answered ones)
    communityBoard = communityBoard.filter(q => q.a === null);
    saveCommunityData();
  }
}

// AI Chat Route Using Gemini
app.post('/api/chat', async (req, res) => {
  const userText = (req.body.question || '').trim();
  if (!userText) {
    return res.json({ answer: "Sorry, I didn't understand your question. Can you clarify?" });
  }

  try {
    const prompt = `You are "Billions Assistant", a helpful and intelligent AI for the Billions Network. User question: ${userText}`;
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const answer = response.text();
    res.json({ answer });
  } catch (error) {
    console.error('Error with Gemini API:', error);
    res.status(500).json({ 
      answer: "I'm having trouble connecting to my Gemini brain right now. Please check your API key or try again later." 
    });
  }
});

// ==========================================
// Community Board Routes
// ==========================================

// Get all community posts
app.get('/api/community', (req, res) => {
  res.json(communityBoard);
});

// Post a new question
app.post('/api/community/ask', (req, res) => {
  const questionText = (req.body.question || '').trim();
  if (!questionText) return res.status(400).json({ error: "Question cannot be empty" });

  const newPost = {
    id: Date.now(),
    q: questionText,
    a: null, // Null means unanswered
    q_date: new Date().toISOString()
  };

  communityBoard.push(newPost);
  saveCommunityData();
  res.json({ success: true, post: newPost });
});

// Answer a question
app.post('/api/community/answer/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const answerText = (req.body.answer || '').trim();
  
  if (!answerText) return res.status(400).json({ error: "Answer cannot be empty" });

  const post = communityBoard.find(p => p.id === id);
  if (!post) return res.status(404).json({ error: "Question not found" });

  post.a = answerText;
  post.a_date = new Date().toISOString();
  
  saveCommunityData();
  
  // Trigger AI Merge logic
  checkAndMergeAI();
  
  res.json({ success: true, post });
});

// ==========================================
// CAPTCHA Stats Routes
// ==========================================

app.get('/api/captcha/stats', (req, res) => {
  res.json(captchaStats);
});

app.post('/api/captcha/record', (req, res) => {
  const { isHuman } = req.body;
  
  if (isHuman === true) {
    captchaStats.humans++;
  } else if (isHuman === false) {
    captchaStats.bots++;
  }
  
  saveCaptchaStats();
  res.json({ success: true, stats: captchaStats });
});

// ==========================================
// Admin Panel endpoints
// ==========================================
app.get('/api/admin/qa', (req, res) => {
  res.json(aiData);
});

app.post('/api/admin/qa', (req, res) => {
  const newItem = req.body;
  newItem.id = Date.now(); // Simple ID generation
  aiData.push(newItem);
  if (saveData()) {
    res.json({ success: true, item: newItem });
  } else {
    res.status(500).json({ error: 'Failed to save data' });
  }
});

app.delete('/api/admin/qa/:id', (req, res) => {
  const id = parseInt(req.params.id);
  aiData = aiData.filter(item => item.id !== id);
  if (saveData()) {
    res.json({ success: true });
  } else {
    res.status(500).json({ error: 'Failed to save data' });
  }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
