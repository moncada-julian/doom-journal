// Doom Journal - Background Service Worker
// Intercepts Twitter/X navigation and redirects to journaling page

const BLOCKED_DOMAINS = ['twitter.com', 'x.com'];
const DEFAULT_PASS_DURATION = 45; // minutes

// Check if a URL should be blocked
function shouldBlock(url) {
  try {
    const urlObj = new URL(url);
    return BLOCKED_DOMAINS.some(domain =>
      urlObj.hostname === domain || urlObj.hostname.endsWith('.' + domain)
    );
  } catch {
    return false;
  }
}

// Check if user has a valid pass
async function hasValidPass() {
  const data = await chrome.storage.local.get(['passExpiresAt', 'enabled']);

  // If extension is disabled, don't block
  if (data.enabled === false) {
    return true;
  }

  // Check if pass exists and is still valid
  if (data.passExpiresAt && Date.now() < data.passExpiresAt) {
    return true;
  }

  return false;
}

// Handle navigation events
chrome.webNavigation.onBeforeNavigate.addListener(async (details) => {
  // Only handle main frame navigations
  if (details.frameId !== 0) {
    return;
  }

  // Check if this URL should be blocked
  if (!shouldBlock(details.url)) {
    return;
  }

  // Check if user has a valid pass
  if (await hasValidPass()) {
    return;
  }

  // Redirect to blocked page with return URL
  const blockedUrl = chrome.runtime.getURL('blocked.html');
  const returnUrl = encodeURIComponent(details.url);

  chrome.tabs.update(details.tabId, {
    url: `${blockedUrl}?returnUrl=${returnUrl}`
  });
});

// Initialize default settings on install
chrome.runtime.onInstalled.addListener(async () => {
  const data = await chrome.storage.local.get(['enabled', 'entries', 'passDurationMinutes']);

  const defaults = {};

  if (data.enabled === undefined) {
    defaults.enabled = true;
  }

  if (data.entries === undefined) {
    defaults.entries = [];
  }

  if (data.passDurationMinutes === undefined) {
    defaults.passDurationMinutes = DEFAULT_PASS_DURATION;
  }

  if (Object.keys(defaults).length > 0) {
    await chrome.storage.local.set(defaults);
  }
});
