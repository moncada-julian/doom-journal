// Doom Journal - Content Script
// Runs on Twitter/X to check pass expiration and redirect when time's up

const CHECK_INTERVAL = 30000; // Check every 30 seconds

async function checkPass() {
  const data = await chrome.storage.local.get(['enabled', 'passExpiresAt']);

  // If disabled, do nothing
  if (data.enabled === false) {
    return;
  }

  // If no pass or pass expired, redirect to journal
  if (!data.passExpiresAt || Date.now() >= data.passExpiresAt) {
    const blockedUrl = chrome.runtime.getURL('blocked.html');
    const returnUrl = encodeURIComponent(window.location.href);
    window.location.href = `${blockedUrl}?returnUrl=${returnUrl}`;
  }
}

// Initial check after a short delay (let page settle)
setTimeout(checkPass, 2000);

// Periodic checks
setInterval(checkPass, CHECK_INTERVAL);
