// Doom Journal - Popup Logic

// DOM Elements
const enableToggle = document.getElementById('enableToggle');
const disableModal = document.getElementById('disableModal');
const confirmInput = document.getElementById('confirmInput');
const cancelDisableBtn = document.getElementById('cancelDisable');
const confirmDisableBtn = document.getElementById('confirmDisable');
const totalEntriesEl = document.getElementById('totalEntries');
const totalTimeEl = document.getElementById('totalTime');
const currentStreakEl = document.getElementById('currentStreak');
const entriesListEl = document.getElementById('entriesList');
const exportMdBtn = document.getElementById('exportMd');
const exportJsonBtn = document.getElementById('exportJson');
const passDurationSelect = document.getElementById('passDuration');
const passTimerEl = document.getElementById('passTimer');
const passCountdownEl = document.getElementById('passCountdown');

let passTimerInterval = null;

// Target phrase for disable confirmation
const TARGET_PHRASE = 'yes i want to doom scroll';

// Levenshtein distance for fuzzy matching
function levenshtein(a, b) {
  const matrix = [];
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

// Calculate similarity (0 to 1)
function similarity(input, target) {
  const normalizedInput = input.toLowerCase().trim().replace(/\s+/g, ' ');
  const normalizedTarget = target.toLowerCase();

  if (normalizedInput === normalizedTarget) return 1;
  if (normalizedInput.length === 0) return 0;

  const distance = levenshtein(normalizedInput, normalizedTarget);
  const maxLen = Math.max(normalizedInput.length, normalizedTarget.length);
  return 1 - (distance / maxLen);
}

// Check if input is close enough (70% similarity threshold)
function isCloseEnough(input) {
  return similarity(input, TARGET_PHRASE) >= 0.7;
}

// Show disable modal
function showDisableModal() {
  disableModal.classList.remove('hidden');
  confirmInput.value = '';
  confirmInput.focus();
  confirmDisableBtn.disabled = true;
}

// Hide disable modal
function hideDisableModal() {
  disableModal.classList.add('hidden');
  confirmInput.value = '';
}

// Format duration in minutes
function formatDuration(seconds) {
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMins = minutes % 60;
  return remainingMins > 0 ? `${hours}h ${remainingMins}m` : `${hours}h`;
}

// Format date for display
function formatDate(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);

  const isToday = date.toDateString() === now.toDateString();
  const isYesterday = date.toDateString() === yesterday.toDateString();

  if (isToday) {
    return `Today, ${date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
  } else if (isYesterday) {
    return `Yesterday, ${date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
  } else {
    return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  }
}

// Format date for export
function formatExportDate(timestamp) {
  return new Date(timestamp).toLocaleDateString([], {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

// Format time for export
function formatExportTime(timestamp) {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit'
  });
}

// Calculate streak (consecutive days with entries)
function calculateStreak(entries) {
  if (entries.length === 0) return 0;

  // Sort entries by timestamp descending
  const sorted = [...entries].sort((a, b) => b.timestamp - a.timestamp);

  // Get unique days
  const days = new Set();
  sorted.forEach(entry => {
    const date = new Date(entry.timestamp);
    days.add(date.toDateString());
  });

  const uniqueDays = Array.from(days).map(d => new Date(d)).sort((a, b) => b - a);

  if (uniqueDays.length === 0) return 0;

  // Check if streak is still active (last entry today or yesterday)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const lastEntryDay = new Date(uniqueDays[0]);
  lastEntryDay.setHours(0, 0, 0, 0);

  if (lastEntryDay < yesterday) {
    return 0; // Streak broken
  }

  // Count consecutive days
  let streak = 1;
  for (let i = 1; i < uniqueDays.length; i++) {
    const current = new Date(uniqueDays[i - 1]);
    current.setHours(0, 0, 0, 0);
    const prev = new Date(uniqueDays[i]);
    prev.setHours(0, 0, 0, 0);

    const diffDays = (current - prev) / (1000 * 60 * 60 * 24);

    if (diffDays === 1) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

// Render entries list
function renderEntries(entries) {
  if (entries.length === 0) {
    entriesListEl.innerHTML = '<p class="empty-state">no entries yet</p>';
    return;
  }

  // Sort by timestamp descending, take last 10
  const recentEntries = [...entries]
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 10);

  entriesListEl.innerHTML = recentEntries.map(entry => `
    <div class="entry-item" data-id="${entry.id}">
      <div class="entry-header">
        <span class="entry-date">${formatDate(entry.timestamp)}</span>
        <span class="entry-duration">${Math.floor(entry.duration / 60)} min</span>
      </div>
      <div class="entry-preview">${escapeHtml(entry.content.slice(0, 50))}${entry.content.length > 50 ? '...' : ''}</div>
      <div class="entry-full">${escapeHtml(entry.content)}</div>
    </div>
  `).join('');

  // Add click handlers to toggle expansion
  entriesListEl.querySelectorAll('.entry-item').forEach(item => {
    item.addEventListener('click', () => {
      item.classList.toggle('expanded');
    });
  });
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Update stats display
function updateStats(entries) {
  // Total entries
  totalEntriesEl.textContent = entries.length;

  // Total time
  const totalSeconds = entries.reduce((sum, e) => sum + e.duration, 0);
  totalTimeEl.textContent = formatDuration(totalSeconds);

  // Streak
  const streak = calculateStreak(entries);
  currentStreakEl.textContent = streak;
}

// Export as Markdown
function exportAsMarkdown(entries) {
  if (entries.length === 0) {
    alert('No entries to export');
    return;
  }

  // Sort by timestamp ascending
  const sorted = [...entries].sort((a, b) => a.timestamp - b.timestamp);

  // Group by date
  const byDate = {};
  sorted.forEach(entry => {
    const dateKey = new Date(entry.timestamp).toDateString();
    if (!byDate[dateKey]) {
      byDate[dateKey] = [];
    }
    byDate[dateKey].push(entry);
  });

  // Build markdown
  let markdown = '# Doom Journal Export\n\n';
  markdown += `> Exported on ${new Date().toLocaleDateString()}\n\n`;

  Object.entries(byDate).forEach(([dateKey, dayEntries]) => {
    markdown += `## ${formatExportDate(dayEntries[0].timestamp)}\n\n`;

    dayEntries.forEach(entry => {
      const time = formatExportTime(entry.timestamp);
      const duration = Math.floor(entry.duration / 60);
      markdown += `### ${time} (${duration} min, ${entry.wordCount} words)\n\n`;
      markdown += `${entry.content}\n\n`;
      markdown += `---\n\n`;
    });
  });

  downloadFile('doom-journal-export.md', markdown, 'text/markdown');
}

// Export as JSON
function exportAsJson(entries) {
  if (entries.length === 0) {
    alert('No entries to export');
    return;
  }

  const exportData = {
    exportDate: new Date().toISOString(),
    totalEntries: entries.length,
    entries: entries.sort((a, b) => a.timestamp - b.timestamp)
  };

  const json = JSON.stringify(exportData, null, 2);
  downloadFile('doom-journal-export.json', json, 'application/json');
}

// Download file helper
function downloadFile(filename, content, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Format pass countdown
function formatPassCountdown(ms) {
  if (ms <= 0) return '0:00';
  const totalSeconds = Math.floor(ms / 1000);
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Update pass timer display
function updatePassTimer(passExpiresAt) {
  if (!passExpiresAt || Date.now() >= passExpiresAt) {
    passTimerEl.classList.add('hidden');
    if (passTimerInterval) {
      clearInterval(passTimerInterval);
      passTimerInterval = null;
    }
    return;
  }

  passTimerEl.classList.remove('hidden');

  const updateCountdown = () => {
    const remaining = passExpiresAt - Date.now();
    if (remaining <= 0) {
      passTimerEl.classList.add('hidden');
      clearInterval(passTimerInterval);
      passTimerInterval = null;
    } else {
      passCountdownEl.textContent = formatPassCountdown(remaining);
    }
  };

  updateCountdown();
  if (passTimerInterval) clearInterval(passTimerInterval);
  passTimerInterval = setInterval(updateCountdown, 1000);
}

// Load and display data
async function loadData() {
  const data = await chrome.storage.local.get(['enabled', 'entries', 'passDurationMinutes', 'passExpiresAt']);

  // Enable toggle
  enableToggle.checked = data.enabled !== false;

  // Pass duration
  passDurationSelect.value = data.passDurationMinutes || 45;

  // Pass timer
  updatePassTimer(data.passExpiresAt);

  // Entries
  const entries = data.entries || [];
  updateStats(entries);
  renderEntries(entries);
}

// Initialize
function init() {
  loadData();

  // Enable toggle handler - intercept disable action
  enableToggle.addEventListener('change', async (e) => {
    if (enableToggle.checked) {
      // Turning ON - allow immediately
      await chrome.storage.local.set({ enabled: true });
    } else {
      // Turning OFF - show confirmation modal
      e.preventDefault();
      enableToggle.checked = true; // Reset toggle while modal is open
      showDisableModal();
    }
  });

  // Modal input handler - check for fuzzy match
  confirmInput.addEventListener('input', () => {
    confirmDisableBtn.disabled = !isCloseEnough(confirmInput.value);
  });

  // Enter key to confirm
  confirmInput.addEventListener('keydown', async (e) => {
    if (e.key === 'Enter' && isCloseEnough(confirmInput.value)) {
      enableToggle.checked = false;
      await chrome.storage.local.set({ enabled: false });
      hideDisableModal();
    }
  });

  // Cancel button
  cancelDisableBtn.addEventListener('click', () => {
    hideDisableModal();
  });

  // Confirm disable button
  confirmDisableBtn.addEventListener('click', async () => {
    enableToggle.checked = false;
    await chrome.storage.local.set({ enabled: false });
    hideDisableModal();
  });

  // Close modal on backdrop click
  disableModal.querySelector('.modal-backdrop').addEventListener('click', () => {
    hideDisableModal();
  });

  // Pass duration handler
  passDurationSelect.addEventListener('change', async () => {
    await chrome.storage.local.set({
      passDurationMinutes: parseInt(passDurationSelect.value, 10)
    });
  });

  // Export handlers
  exportMdBtn.addEventListener('click', async () => {
    const data = await chrome.storage.local.get(['entries']);
    exportAsMarkdown(data.entries || []);
  });

  exportJsonBtn.addEventListener('click', async () => {
    const data = await chrome.storage.local.get(['entries']);
    exportAsJson(data.entries || []);
  });
}

// Start
init();
