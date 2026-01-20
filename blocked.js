// Doom Journal - Blocked Page Logic

// State
let state = 'selecting'; // selecting, writing, paused, completed, redirecting
let selectedDuration = 0;
let remainingSeconds = 0;
let lastKeystrokeTime = 0;
let timerInterval = null;
let pauseCheckInterval = null;
let entryContent = '';
let returnUrl = '';
let continuingEntryId = null; // ID of entry being continued (null = new entry)
let latestEntry = null; // Most recent entry

// Nudge messages shown when paused
const NUDGE_MESSAGES = [
  'keep writing...',
  'just let it flow',
  'no need to edit, just write',
  'still there? keep going',
  'your thoughts are waiting'
];

// Completion messages
const COMPLETE_MESSAGES = [
  'nice. enjoy your scroll.',
  'thoughts deposited. Twitter unlocked.',
  "you've earned this",
  'mind cleared. doom scroll responsibly.'
];

// DOM Elements
const selectScreen = document.getElementById('selectScreen');
const writeScreen = document.getElementById('writeScreen');
const completeScreen = document.getElementById('completeScreen');
const journalInput = document.getElementById('journalInput');
const timerMinutes = document.getElementById('timerMinutes');
const timerSeconds = document.getElementById('timerSeconds');
const wordCount = document.getElementById('wordCount');
const pauseOverlay = document.getElementById('pauseOverlay');
const nudgeMessage = document.getElementById('nudgeMessage');
const completeMessage = document.getElementById('completeMessage');
const redirectCountdown = document.getElementById('redirectCountdown');
const durationButtons = document.querySelectorAll('.duration-btn');
const newEntryBtn = document.getElementById('newEntryBtn');

// Get return URL from query params
function getReturnUrl() {
  const params = new URLSearchParams(window.location.search);
  const url = params.get('returnUrl');
  return url ? decodeURIComponent(url) : 'https://twitter.com';
}

// Get the most recent entry
async function getLatestEntry() {
  const data = await chrome.storage.local.get(['entries']);
  const entries = data.entries || [];

  if (entries.length === 0) return null;

  // Sort by timestamp descending and return most recent
  const sorted = [...entries].sort((a, b) => b.timestamp - a.timestamp);
  return sorted[0];
}

// Format time display
function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return {
    minutes: mins.toString(),
    seconds: secs.toString().padStart(2, '0')
  };
}

// Update timer display
function updateTimerDisplay() {
  const time = formatTime(remainingSeconds);
  timerMinutes.textContent = time.minutes;
  timerSeconds.textContent = time.seconds;
}

// Count words in text
function countWords(text) {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

// Update word count display
function updateWordCount() {
  const count = countWords(journalInput.value);
  wordCount.textContent = `${count} word${count !== 1 ? 's' : ''}`;
}

// Get random item from array
function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Show nudge message
function showNudge() {
  nudgeMessage.textContent = randomItem(NUDGE_MESSAGES);
  pauseOverlay.classList.remove('hidden');
}

// Hide nudge message
function hideNudge() {
  pauseOverlay.classList.add('hidden');
}

// Switch to a screen
function showScreen(screen) {
  selectScreen.classList.add('hidden');
  writeScreen.classList.add('hidden');
  completeScreen.classList.add('hidden');
  screen.classList.remove('hidden');
}

// Start writing session
function startWriting(duration) {
  selectedDuration = duration;
  remainingSeconds = duration;
  state = 'writing';
  lastKeystrokeTime = Date.now();

  showScreen(writeScreen);
  updateTimerDisplay();
  updateWordCount(); // Update in case continuing with existing content
  journalInput.focus();

  // Start timer interval (checks every 100ms for smoother updates)
  timerInterval = setInterval(() => {
    if (state === 'writing') {
      // Only decrement if actively typing (within last 3 seconds)
      const timeSinceKeystroke = Date.now() - lastKeystrokeTime;

      if (timeSinceKeystroke < 10000) {
        // Active typing - decrement timer
        remainingSeconds -= 0.1;

        if (remainingSeconds <= 0) {
          remainingSeconds = 0;
          completeSession();
        }

        updateTimerDisplay();
      }
    }
  }, 100);

  // Check for pause state
  pauseCheckInterval = setInterval(() => {
    if (state === 'writing') {
      const timeSinceKeystroke = Date.now() - lastKeystrokeTime;

      if (timeSinceKeystroke >= 10000) {
        state = 'paused';
        showNudge();
      }
    }
  }, 500);
}

// Handle keystrokes
function handleInput() {
  lastKeystrokeTime = Date.now();
  entryContent = journalInput.value;
  updateWordCount();

  // Resume from pause
  if (state === 'paused') {
    state = 'writing';
    hideNudge();
  }
}

// Save journal entry
async function saveEntry() {
  // Get existing entries
  const data = await chrome.storage.local.get(['entries', 'passDurationMinutes']);
  let entries = data.entries || [];
  const passDuration = data.passDurationMinutes || 45;

  if (continuingEntryId) {
    // Update existing entry
    entries = entries.map(e => {
      if (e.id === continuingEntryId) {
        return {
          ...e,
          content: entryContent,
          duration: e.duration + selectedDuration, // Accumulate duration
          wordCount: countWords(entryContent)
        };
      }
      return e;
    });
  } else {
    // Create new entry
    const entry = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      content: entryContent,
      duration: selectedDuration,
      wordCount: countWords(entryContent)
    };
    entries.push(entry);
  }

  // Calculate pass expiration
  const passExpiresAt = Date.now() + (passDuration * 60 * 1000);

  // Save
  await chrome.storage.local.set({
    entries,
    passExpiresAt
  });
}

// Complete the session
async function completeSession() {
  state = 'completed';

  // Clean up intervals
  clearInterval(timerInterval);
  clearInterval(pauseCheckInterval);

  // Save entry
  await saveEntry();

  // Show completion screen
  completeMessage.textContent = randomItem(COMPLETE_MESSAGES);
  showScreen(completeScreen);

  // Countdown and redirect
  let countdown = 2;
  redirectCountdown.textContent = countdown;

  const countdownInterval = setInterval(() => {
    countdown--;
    redirectCountdown.textContent = countdown;

    if (countdown <= 0) {
      clearInterval(countdownInterval);
      state = 'redirecting';
      window.location.href = returnUrl;
    }
  }, 1000);
}

// Initialize
async function init() {
  returnUrl = getReturnUrl();

  // Load the most recent entry (if any)
  latestEntry = await getLatestEntry();
  if (latestEntry) {
    journalInput.value = latestEntry.content;
    entryContent = latestEntry.content;
    continuingEntryId = latestEntry.id;
  } else {
    journalInput.value = '';
  }

  // Set up duration button handlers
  durationButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const duration = parseInt(btn.dataset.duration, 10);
      startWriting(duration);
    });
  });

  // New entry button handler - clears textarea and starts fresh
  newEntryBtn.addEventListener('click', () => {
    journalInput.value = '';
    entryContent = '';
    continuingEntryId = null;
    updateWordCount();
    journalInput.focus();
  });

  // Set up input handler
  journalInput.addEventListener('input', handleInput);

  // Also track keydown for better responsiveness
  journalInput.addEventListener('keydown', () => {
    lastKeystrokeTime = Date.now();
    if (state === 'paused') {
      state = 'writing';
      hideNudge();
    }
  });
}

// Start
init();
