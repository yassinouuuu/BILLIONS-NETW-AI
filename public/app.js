/**
 * SPLASH SCREEN & INITIALIZATION
 */
function initSplashScreen() {
    const splash = document.getElementById('splash-screen');
    const mainApp = document.getElementById('main-app');
    const progressBar = document.getElementById('progress-bar-fill');
    const statusText = document.getElementById('status-text');

    const loadingSteps = [
        { progress: 20, text: "INITIALIZING NETWORK CONNECTIVITY..." },
        { progress: 45, text: "LOADING MASSIVE KNOWLEDGE ENGINE... (1M+ RECORDS)" },
        { progress: 70, text: "DECRYPTING BILLIONS PROTOCOLS..." },
        { progress: 85, text: "ESTABLISHING SECURE AGENT LINK..." },
        { progress: 100, text: "READY FOR CONNECTION" }
    ];

    let currentStep = 0;

    const interval = setInterval(() => {
        if (currentStep >= loadingSteps.length) {
            clearInterval(interval);
            setTimeout(() => {
                splash.classList.add('splash-hidden');
                mainApp.classList.add('app-visible');
                // Trigger title typing after splash is gone
                if (typeof type === 'function') {
                    setTimeout(type, 500);
                }
            }, 800);
            return;
        }

        const { progress, text } = loadingSteps[currentStep];
        progressBar.style.width = `${progress}%`;
        statusText.innerText = text;
        currentStep++;
    }, 700);
}

document.addEventListener('DOMContentLoaded', () => {
    initSplashScreen();
    // Keep existing DOMContentLoaded logic below or call it after splash?... 
    // Usually better to start loading data immediately in background.
});

const chatMessages = document.getElementById('chat-messages');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const loading = document.getElementById('loading');
const themeToggle = document.getElementById('theme-toggle');

// Dynamic API Base URL for local testing vs live GitHub Pages
const API_BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') 
    ? 'http://localhost:3000' 
    : ''; // Empty string means use the same domain relative path

// Theme toggle (Simplified for new UI)
let isDarkTheme = true; // Default to dark for futuristic look
document.body.setAttribute('data-theme', 'dark');

// Typing Effect for Hero Title
const typingText = document.getElementById('typing-text');
const phrases = ["BILLIONS NETWORK", "INTELLIGENT FUTURE", "AI INNOVATION"];
let phraseIndex = 0;
let charIndex = 0;
let isDeleting = false;
let typeSpeed = 100;

function type() {
    const current = phrases[phraseIndex];
    if (isDeleting) {
        typingText.textContent = current.substring(0, charIndex - 1);
        charIndex--;
        typeSpeed = 50;
    } else {
        typingText.textContent = current.substring(0, charIndex + 1);
        charIndex++;
        typeSpeed = 150;
    }

    if (!isDeleting && charIndex === current.length) {
        isDeleting = true;
        typeSpeed = 2000; // Pause at end
    } else if (isDeleting && charIndex === 0) {
        isDeleting = false;
        phraseIndex = (phraseIndex + 1) % phrases.length;
        typeSpeed = 500;
    }

    setTimeout(type, typeSpeed);
}

// document.addEventListener('DOMContentLoaded', type); // Removed: called by initSplashScreen

function addMessage(text, isUser) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `mini-msg ${isUser ? 'user' : 'bot'}`;
    messageDiv.textContent = text;
    
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
        
        if (response.ok) {
            addMessage(data.answer, false);
        } else {
            addMessage(data.answer || 'An error occurred on the server.', false);
        }
    } catch (error) {
        console.error('Error:', error);
        loading.style.display = 'none';
        addMessage('Connection failed. Please ensure the server is running and the API key is set in Render settings!', false);
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
const statProgressBar = document.getElementById('stats-progress-fill');
const statsBarContainer = document.getElementById('stats-bar');

let captchaData = [];
let currentCaptcha = null;
let hasPlayed = false;

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
        
        // Calculate percentage for progress bar
        const total = (stats.humans || 0) + (stats.bots || 0);
        if (total > 0) {
            const humanPercent = Math.round((stats.humans / total) * 100);
            statProgressBar.style.width = `${humanPercent}%`;
        } else {
            statProgressBar.style.width = `50%`;
        }
    } catch (e) {
        console.error('Error loading stats', e);
        statProgressBar.style.width = `50%`;
    } finally {
        statsBarContainer.style.display = 'flex';
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
        btn.className = 'option-btn';
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
