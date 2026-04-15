// Advanced Pomodoro Timer with Auto-switching, Themes, and Persistence
// The Pomodoro Technique: 25min focus, 5min short break, 15min long break

// ==================== CONFIGURATION ====================

const TIMER_MODES = {
    focus: {
        name: 'Focus',
        duration: 25 * 60,
        color: '#FF6B6B',
        secondaryColor: '#FF8E8E',
        modeColor: '#4ECDC4'
    },
    shortBreak: {
        name: 'Short Break',
        duration: 5 * 60,
        color: '#4ECDC4',
        secondaryColor: '#5FD8CF',
        modeColor: '#4ECDC4'
    },
    longBreak: {
        name: 'Long Break',
        duration: 15 * 60,
        color: '#A78BFA',
        secondaryColor: '#B69BFB',
        modeColor: '#A78BFA'
    }
};

// Motivational quotes that rotate each session
const MOTIVATIONAL_QUOTES = [
    { text: "Focus is the ultimate power skill of the 21st century.", author: "Robin Sharma" },
    { text: "Concentration is the secret of strength.", author: "Ralph Waldo Emerson" },
    { text: "The successful warrior is the average man, with laser-like focus.", author: "Bruce Lee" },
    { text: "It's not always that we need to do more but rather that we need to focus on less.", author: "Nathan W. Morris" },
    { text: "Where focus goes, energy flows.", author: "Tony Robbins" },
    { text: "The ability to concentrate and use time well is everything.", author: "Lee Iacocca" },
    { text: "Clarity of mind means clarity of passion.", author: "Blaise Pascal" },
    { text: "Focus on being productive instead of busy.", author: "Tim Ferriss" },
    { text: "You can do anything, but not everything.", author: "David Allen" },
    { text: "One reason so few of us achieve what we truly want is that we never direct our focus.", author: "Tony Robbins" },
    { text: "Starve your distractions, feed your focus.", author: "Unknown" },
    { text: "What you stay focused on will grow.", author: "Roy T. Bennett" }
];

// ==================== STATE MANAGEMENT ====================

let state = {
    currentMode: 'focus',
    timeRemaining: TIMER_MODES.focus.duration,
    isRunning: false,
    focusSessionsCompleted: 0,
    totalSessionsCompleted: 0,
    timerInterval: null,
    startTime: null,
    autoSwitch: true,
    theme: 'dark'
};

// ==================== DOM ELEMENTS ====================

const elements = {
    timerMode: document.querySelector('.timer-mode'),
    timerTime: document.querySelector('.timer-time'),
    timerStatus: document.querySelector('.timer-status'),
    startBtn: document.getElementById('startBtn'),
    resetBtn: document.getElementById('resetBtn'),
    skipBtn: document.getElementById('skipBtn'),
    focusCount: document.getElementById('focusCount'),
    totalCount: document.getElementById('totalCount'),
    modeButtons: document.querySelectorAll('.mode-btn'),
    progressCircle: document.querySelector('.progress-ring-circle-active'),
    gradientStart: document.querySelector('.gradient-start'),
    gradientEnd: document.querySelector('.gradient-end'),
    quoteText: document.getElementById('quoteText'),
    quoteAuthor: document.getElementById('quoteAuthor'),
    autoSwitchToggle: document.getElementById('autoSwitch'),
    themeBtn: document.getElementById('themeBtn')
};

// Circle progress configuration
const radius = 150;
const circumference = 2 * Math.PI * radius;
elements.progressCircle.style.strokeDasharray = `${circumference} ${circumference}`;
elements.progressCircle.style.strokeDashoffset = 0;

// ==================== UTILITY FUNCTIONS ====================

// Format time as MM:SS
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Update progress circle
function updateProgressCircle() {
    const mode = TIMER_MODES[state.currentMode];
    const progress = state.timeRemaining / mode.duration;
    const offset = circumference - (progress * circumference);
    elements.progressCircle.style.strokeDashoffset = offset;
}

// Update gradient colors based on mode
function updateGradientColors() {
    const mode = TIMER_MODES[state.currentMode];
    elements.gradientStart.style.stopColor = mode.color;
    elements.gradientEnd.style.stopColor = mode.secondaryColor;
    elements.timerMode.style.color = mode.modeColor;
    
    // Update CSS variables
    document.documentElement.style.setProperty('--gradient-start', mode.color);
    document.documentElement.style.setProperty('--gradient-end', mode.secondaryColor);
}

// Update UI display
function updateDisplay() {
    const mode = TIMER_MODES[state.currentMode];
    elements.timerMode.textContent = mode.name;
    elements.timerTime.textContent = formatTime(state.timeRemaining);
    elements.focusCount.textContent = state.focusSessionsCompleted;
    elements.totalCount.textContent = state.totalSessionsCompleted;
    
    updateProgressCircle();
    updateGradientColors();
    
    // Update status text
    if (state.isRunning) {
        elements.timerStatus.textContent = state.currentMode === 'focus' ? 'Stay focused!' : 'Take a break';
    } else {
        elements.timerStatus.textContent = state.timeRemaining === mode.duration ? 'Ready to start' : 'Paused';
    }
}

// Play notification sound using Web Audio API
function playNotificationSound() {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // Create a pleasant notification sound (three tones)
        const frequencies = [523.25, 659.25, 783.99]; // C5, E5, G5
        
        frequencies.forEach((freq, index) => {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = freq;
            oscillator.type = 'sine';
            
            const startTime = audioContext.currentTime + (index * 0.15);
            gainNode.gain.setValueAtTime(0.2, startTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.3);
            
            oscillator.start(startTime);
            oscillator.stop(startTime + 0.3);
        });
    } catch (error) {
        console.error('Audio playback error:', error);
    }
}

// Show browser notification
function showNotification(title, body) {
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, {
            body: body,
            icon: state.currentMode === 'focus' ? '🎯' : '☕',
            badge: '⏱️'
        });
    }
}

// Get random quote
function getRandomQuote() {
    return MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)];
}

// Update quote display
function updateQuote() {
    const quote = getRandomQuote();
    elements.quoteText.textContent = `"${quote.text}"`;
    elements.quoteAuthor.textContent = `- ${quote.author}`;
}

// ==================== LOCAL STORAGE ====================

function saveState() {
    const dataToSave = {
        focusSessionsCompleted: state.focusSessionsCompleted,
        totalSessionsCompleted: state.totalSessionsCompleted,
        autoSwitch: state.autoSwitch,
        theme: state.theme
    };
    localStorage.setItem('pomodoroState', JSON.stringify(dataToSave));
}

function loadState() {
    const saved = localStorage.getItem('pomodoroState');
    if (saved) {
        try {
            const data = JSON.parse(saved);
            state.focusSessionsCompleted = data.focusSessionsCompleted || 0;
            state.totalSessionsCompleted = data.totalSessionsCompleted || 0;
            state.autoSwitch = data.autoSwitch !== undefined ? data.autoSwitch : true;
            state.theme = data.theme || 'dark';
            
            // Apply loaded state to UI
            elements.autoSwitchToggle.checked = state.autoSwitch;
            applyTheme(state.theme);
        } catch (error) {
            console.error('Error loading saved state:', error);
        }
    }
}

// ==================== THEME MANAGEMENT ====================

function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    state.theme = theme;
    saveState();
}

function toggleTheme() {
    const newTheme = state.theme === 'dark' ? 'light' : 'dark';
    applyTheme(newTheme);
}

// ==================== TIMER LOGIC ====================

// Determine next mode based on completed sessions
function getNextMode() {
    if (state.currentMode === 'focus') {
        // After 4 focus sessions, take a long break
        return state.focusSessionsCompleted % 4 === 0 ? 'longBreak' : 'shortBreak';
    } else {
        // After any break, return to focus
        return 'focus';
    }
}

// Handle timer completion
function handleTimerComplete() {
    playNotificationSound();
    
    // Update session counts
    if (state.currentMode === 'focus') {
        state.focusSessionsCompleted++;
    }
    state.totalSessionsCompleted++;
    
    // Save progress
    saveState();
    updateDisplay();
    
    // Show notification
    const nextMode = getNextMode();
    const nextModeName = TIMER_MODES[nextMode].name;
    
    if (state.currentMode === 'focus') {
        showNotification(
            '🎯 Focus Session Complete!',
            `Great work! You've completed ${state.focusSessionsCompleted} focus session(s). Time for a ${nextModeName.toLowerCase()}.`
        );
    } else {
        showNotification(
            '☕ Break Complete!',
            'Feeling refreshed? Time to get back to work!'
        );
    }
    
    // Update quote
    updateQuote();
    
    // Auto-switch or stop
    if (state.autoSwitch) {
        setTimeout(() => {
            switchMode(nextMode);
            startTimer();
        }, 1000);
    } else {
        stopTimer();
    }
}

// Timer tick function with improved accuracy
function tick() {
    if (!state.isRunning || !state.startTime) return;
    
    // Calculate actual elapsed time for accuracy
    const now = Date.now();
    const elapsed = Math.floor((now - state.startTime) / 1000);
    const mode = TIMER_MODES[state.currentMode];
    state.timeRemaining = Math.max(0, mode.duration - elapsed);
    
    if (state.timeRemaining <= 0) {
        handleTimerComplete();
        return;
    }
    
    updateDisplay();
}

// Start timer
function startTimer() {
    if (!state.isRunning) {
        state.isRunning = true;
        
        // Set start time for accurate tracking
        const mode = TIMER_MODES[state.currentMode];
        state.startTime = Date.now() - ((mode.duration - state.timeRemaining) * 1000);
        
        // Update button
        elements.startBtn.innerHTML = `
            <svg class="btn-icon" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="4" width="4" height="16"/>
                <rect x="14" y="4" width="4" height="16"/>
            </svg>
            <span class="btn-text">Pause</span>
        `;
        
        // Start interval
        state.timerInterval = setInterval(tick, 100);
        
        // Request notification permission
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
        
        updateDisplay();
    } else {
        pauseTimer();
    }
}

// Pause timer
function pauseTimer() {
    state.isRunning = false;
    elements.startBtn.innerHTML = `
        <svg class="btn-icon" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <polygon points="5 3 19 12 5 21 5 3"/>
        </svg>
        <span class="btn-text">Start</span>
    `;
    
    if (state.timerInterval) {
        clearInterval(state.timerInterval);
        state.timerInterval = null;
    }
    
    updateDisplay();
}

// Stop timer
function stopTimer() {
    pauseTimer();
    state.startTime = null;
}

// Reset timer
function resetTimer() {
    stopTimer();
    state.timeRemaining = TIMER_MODES[state.currentMode].duration;
    state.startTime = null;
    updateDisplay();
}

// Skip to next session
function skipSession() {
    stopTimer();
    const nextMode = getNextMode();
    switchMode(nextMode);
}

// Switch mode
function switchMode(mode) {
    if (state.isRunning) {
        stopTimer();
    }
    
    state.currentMode = mode;
    state.timeRemaining = TIMER_MODES[mode].duration;
    state.startTime = null;
    
    // Update active button
    elements.modeButtons.forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.mode === mode) {
            btn.classList.add('active');
        }
    });
    
    updateDisplay();
}

// ==================== EVENT LISTENERS ====================

// Control buttons
elements.startBtn.addEventListener('click', startTimer);
elements.resetBtn.addEventListener('click', resetTimer);
elements.skipBtn.addEventListener('click', skipSession);

// Mode buttons
elements.modeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        switchMode(btn.dataset.mode);
    });
});

// Auto-switch toggle
elements.autoSwitchToggle.addEventListener('change', (e) => {
    state.autoSwitch = e.target.checked;
    saveState();
});

// Theme toggle
elements.themeBtn.addEventListener('click', toggleTheme);

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Ignore if typing in an input
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    
    // Space bar to start/pause
    if (e.code === 'Space') {
        e.preventDefault();
        startTimer();
    }
    
    // R to reset
    if (e.code === 'KeyR') {
        e.preventDefault();
        resetTimer();
    }
    
    // S to skip
    if (e.code === 'KeyS') {
        e.preventDefault();
        skipSession();
    }
});

// ==================== PAGE VISIBILITY ====================

// Handle page visibility changes for accurate timing
document.addEventListener('visibilitychange', () => {
    if (document.hidden && state.isRunning) {
        // Store current state when page becomes hidden
        state.hiddenTime = Date.now();
    } else if (!document.hidden && state.isRunning && state.hiddenTime) {
        // Recalculate when page becomes visible
        const hiddenDuration = Math.floor((Date.now() - state.hiddenTime) / 1000);
        state.timeRemaining = Math.max(0, state.timeRemaining - hiddenDuration);
        
        // Update start time to maintain accuracy
        const mode = TIMER_MODES[state.currentMode];
        state.startTime = Date.now() - ((mode.duration - state.timeRemaining) * 1000);
        
        if (state.timeRemaining === 0) {
            handleTimerComplete();
        } else {
            updateDisplay();
        }
        
        delete state.hiddenTime;
    }
});

// ==================== INITIALIZATION ====================

function init() {
    loadState();
    updateDisplay();
    updateQuote();
    
    console.log('🍅 Pomodoro Timer Pro initialized!');
    console.log('Keyboard shortcuts: Space (start/pause), R (reset), S (skip)');
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}