const chatMessages = document.getElementById('chat-messages');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const loading = document.getElementById('loading');
const themeToggle = document.getElementById('theme-toggle');

// Dynamic API Base URL for local testing vs live GitHub Pages
const API_BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') 
    ? 'http://localhost:3000' 
    : 'https://billions-netw-ai-1.onrender.com';

// Theme toggle
let isDarkTheme = false;
themeToggle.addEventListener('click', () => {
    isDarkTheme = !isDarkTheme;
    document.body.setAttribute('data-theme', isDarkTheme ? 'dark' : 'light');
    themeToggle.innerHTML = isDarkTheme ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
});

function addMessage(text, isUser) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user-message' : 'bot-message'}`;
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    contentDiv.textContent = text;
    
    messageDiv.appendChild(contentDiv);
    chatMessages.appendChild(messageDiv);
    
    // Auto scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

async function sendMessage() {
    const text = userInput.value.trim();
    if (!text) return;

    // Add user message to UI
    addMessage(text, true);
    userInput.value = '';
    
    // Show loading indicator
    loading.style.display = 'block';
    chatMessages.scrollTop = chatMessages.scrollHeight;

    try {
        const response = await fetch(`${API_BASE}/api/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ question: text })
        });

        const data = await response.json();
        
        // Hide loading
        loading.style.display = 'none';
        
        // Add bot message
        addMessage(data.answer, false);
    } catch (error) {
        console.error('Error:', error);
        loading.style.display = 'none';
        addMessage('An error occurred while connecting to the server. Make sure Node.js is running!', false);
    }
}

sendBtn.addEventListener('click', sendMessage);
userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendMessage();
    }
});

// ==========================================
// Community Board Logic
// ==========================================

const communityMessages = document.getElementById('community-messages');
const communityInput = document.getElementById('community-input');
const communitySendBtn = document.getElementById('community-send-btn');

// Fetch all posts from the server
async function fetchCommunityPosts() {
    try {
        const response = await fetch(`${API_BASE}/api/community`);
        const posts = await response.json();
        renderCommunityPosts(posts);
    } catch (err) {
        console.error('Error fetching community board', err);
    }
}

// Render posts
function renderCommunityPosts(posts) {
    // Reverse so newest is at the top, or keep as is. Let's do newest at bottom like chat.
    communityMessages.innerHTML = '';
    
    if (posts.length === 0) {
        communityMessages.innerHTML = '<div style="text-align:center; opacity:0.6; padding:20px;">No questions yet. Be the first to ask!</div>';
        return;
    }

    posts.forEach(post => {
        const postDiv = document.createElement('div');
        postDiv.className = 'community-post';
        
        const qDiv = document.createElement('div');
        qDiv.className = 'post-q';
        qDiv.textContent = `Q: ${post.q}`;
        postDiv.appendChild(qDiv);

        if (post.a) {
            // Already answered
            const aDiv = document.createElement('div');
            aDiv.className = 'post-a';
            aDiv.textContent = `A: ${post.a}`;
            postDiv.appendChild(aDiv);
        } else {
            // Unanswered: Show reply input
            const replyGroup = document.createElement('div');
            replyGroup.className = 'reply-input-group';
            
            const replyInput = document.createElement('input');
            replyInput.type = 'text';
            replyInput.placeholder = 'Type an answer...';
            
            const replyBtn = document.createElement('button');
            replyBtn.className = 'reply-btn';
            replyBtn.textContent = 'Reply';
            replyBtn.onclick = () => submitAnswer(post.id, replyInput.value);
            
            replyGroup.appendChild(replyInput);
            replyGroup.appendChild(replyBtn);
            postDiv.appendChild(replyGroup);
        }

        communityMessages.appendChild(postDiv);
    });
}

// Submit a new question
async function submitQuestion() {
    const text = communityInput.value.trim();
    if (!text) return;

    communityInput.value = 'Posting...';
    communityInput.disabled = true;

    try {
        await fetch(`${API_BASE}/api/community/ask`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ question: text })
        });
        
        communityInput.value = '';
        fetchCommunityPosts(); // Refresh list
    } catch (err) {
        console.error('Error posting question', err);
        alert('Failed to post question');
    } finally {
        communityInput.disabled = false;
        communityMessages.scrollTop = communityMessages.scrollHeight;
    }
}

// Submit an answer
async function submitAnswer(id, text) {
    if (!text.trim()) return;

    try {
        await fetch(`${API_BASE}/api/community/answer/${id}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ answer: text.trim() })
        });
        
        fetchCommunityPosts(); // Refresh list
    } catch (err) {
        console.error('Error posting answer', err);
        alert('Failed to post answer');
    }
}

// Event Listeners for Community
communitySendBtn.addEventListener('click', submitQuestion);
communityInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') submitQuestion();
});

// Auto-refresh the community board every 5 seconds
setInterval(fetchCommunityPosts, 5000);

// Initial Fetch
fetchCommunityPosts();

// ==========================================
// Logic Mini-Game
// ==========================================
const captchaContainer = document.getElementById('captcha-container');
const captchaQuestion = document.getElementById('captcha-question');
const captchaOptions = document.getElementById('captcha-options');
const captchaStatsBlock = document.getElementById('captcha-stats');
const statHCount = document.getElementById('stat-h-count');
const statBCount = document.getElementById('stat-b-count');

let captchaData = [];
let currentCaptcha = null;
let hasPlayed = false; // Limit to one try

function initCaptcha() {
    if (window.CAPTCHA_DATA) {
        captchaData = window.CAPTCHA_DATA;
        loadRandomCaptcha();
        loadCaptchaStats(); // Load initial stats
    } else {
        console.error('Error: CAPTCHA data not found in window');
        captchaQuestion.textContent = "Could not load the game.";
    }
}

async function loadCaptchaStats() {
    try {
        const res = await fetch(`${API_BASE}/api/captcha/stats`);
        const stats = await res.json();
        statHCount.textContent = stats.humans || 0;
        statBCount.textContent = stats.bots || 0;
    } catch (e) {
        console.error('Error loading stats', e);
        // Default to 0 if server is offline or not updated yet
        statHCount.textContent = 0;
        statBCount.textContent = 0;
    } finally {
        // Always show the block so the user can see the UI
        captchaStatsBlock.style.display = 'flex';
    }
}

async function recordCaptchaResult(isHuman) {
    try {
        await fetch(`${API_BASE}/api/captcha/record`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isHuman })
        });
        // Refresh the stats after recording
        loadCaptchaStats();
    } catch (e) {
        console.error('Error saving result', e);
    }
}

function loadRandomCaptcha() {
    if(!captchaData || captchaData.length === 0 || hasPlayed) return;
    
    // Pick a random question
    const randomIndex = Math.floor(Math.random() * captchaData.length);
    currentCaptcha = captchaData[randomIndex];
    
    // Render question
    captchaQuestion.textContent = currentCaptcha.sentence;
    captchaOptions.innerHTML = '';
    
    // Render buttons
    currentCaptcha.options.forEach(option => {
        const btn = document.createElement('button');
        btn.className = 'captcha-btn';
        btn.textContent = option;
        
        btn.onclick = () => checkCaptcha(btn, option);
        captchaOptions.appendChild(btn);
    });
}

function checkCaptcha(btnObj, selectedOption) {
    if (hasPlayed) return;
    hasPlayed = true;

    // Disable all buttons
    Array.from(captchaOptions.children).forEach(b => b.disabled = true);

    if (selectedOption === currentCaptcha.answer) {
        // Correct - Human!
        btnObj.classList.add('correct');
        captchaQuestion.textContent = "✅ Verification Successful! You are human.";
        recordCaptchaResult(true);
    } else {
        // Wrong - Bot!
        btnObj.classList.add('wrong');
        captchaQuestion.textContent = "❌ Verification Failed! You have been marked as a bot.";
        recordCaptchaResult(false);
    }
}

// Start the mini game
initCaptcha();
