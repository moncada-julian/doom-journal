# CLAUDE_NOTES.md - Doom Journal

> Quick context file for future Claude sessions. Read this first.

## 1. Project Overview

**Doom Journal** is a Chrome extension that intercepts Twitter/X visits and requires users to journal for 1, 3, or 5 minutes before accessing the site. Think of it as a "friction layer" that encourages mindfulness before doom scrolling.

### Core Value Prop (displayed in UI)
- **Free** — no account, no payment, no catch
- **Private** — everything stays on device, zero network requests
- **Persistent** — entries saved locally, exportable anytime

### Main Features
- Intercepts twitter.com and x.com (all subpaths)
- Fullscreen, distraction-free dark mode writing interface
- Timer only counts down while actively typing (pauses after 10s idle)
- Gentle nudge messages when paused ("timer paused" + "keep writing...")
- Auto-continues most recent entry (or click "+ new entry" to start fresh)
- Configurable "pass" system (5-60 min) — after journaling, Twitter unlocks for that duration
- Popup with stats (total entries, time written, streak)
- View recent entries with expand/collapse
- Export as Markdown or JSON
- Toggle extension on/off (with confirmation modal requiring typed phrase)

## 2. What We Accomplished This Session (January 18, 2026)

### Changes Made
1. **Increased pause detection threshold from 3s to 10s** — Timer now gives more thinking time before showing nudge
2. **Added confirm modal when disabling extension** — Requires typing "yes i want to doom scroll" (with fuzzy matching at 70% similarity threshold) to prevent accidental disable. Enter key works to confirm.
3. **Added auto-continue for entries** — Textarea now auto-loads the most recent entry when you start writing. No more day-based reset.
4. **Added "+ new entry" button** — Top right of writing screen, lets user start fresh if they don't want to continue

### Previous Session (January 10, 2026)
Built the complete MVP from scratch:
- Full Chrome Manifest V3 extension structure
- URL interception via webNavigation API
- Journal page with active-typing timer logic
- Pause detection with rotating nudge messages
- Local storage for entries and settings
- Popup UI with stats, entry list, exports
- Generated simple icons using Python/PIL
- README.md and PRIVACY.md for distribution
- Pass system, auto-kick, exports, stats, etc.

## 3. Key Technical Decisions

| Decision | Why |
|----------|-----|
| Manifest V3 | Required for new Chrome extensions, future-proof |
| webNavigation API | Clean interception of Twitter URLs before page loads |
| chrome.storage.local | Simple, persistent, no sync (privacy-first) |
| Vanilla JS/CSS only | No build step, no dependencies, easy to audit |
| System fonts only | No external requests, works offline |
| Pass system with timestamp | Cleaner than tracking "sessions" — just check if `Date.now() < passExpiresAt` |
| Timer decrements in 100ms intervals | Smooth display updates while tracking 10s pause threshold |
| State machine for journal page | Clean separation: selecting → writing → paused → completed → redirecting |

## 4. Current State

### What's Working
- [x] Twitter/X interception and redirect
- [x] Duration selection (1, 3, 5 min)
- [x] Active typing timer with pause detection (10s threshold)
- [x] Nudge messages on pause ("timer paused" + rotating messages)
- [x] Entry saving to local storage
- [x] Auto-continue most recent entry
- [x] "+ new entry" button to start fresh
- [x] Pass system (configurable 1-60 min)
- [x] Live pass countdown timer in popup
- [x] Completion screen with countdown redirect
- [x] Popup stats (entries, time, streak)
- [x] Entry list with expand/collapse
- [x] Export as Markdown
- [x] Export as JSON
- [x] Enable/disable toggle with confirmation modal (fuzzy matching)
- [x] Pass duration setting
- [x] Auto-kick when pass expires (content script checks every 30s)
- [x] Works fully offline
- [x] Zero network requests (verified)

### GitHub & Hosting
- **GitHub Repo:** https://github.com/moncada-julian/doom-journal
- **Landing Page:** https://moncada-julian.github.io/doom-journal/
- **Privacy Policy URL:** https://moncada-julian.github.io/doom-journal/privacy.html

### Chrome Web Store Status
- [x] Developer account created ($5 fee paid)
- [x] GitHub repo created (public)
- [x] GitHub Pages enabled with landing page and privacy policy
- [ ] Screenshots needed
- [ ] ZIP file upload
- [ ] Store listing (description, etc.)
- [ ] Submit for review

### Known Issues / Limitations
- Icons are simple/placeholder (generated programmatically)
- No "blocked sites" management UI yet (hardcoded to twitter.com, x.com)

## 5. Tech Stack & Project Structure

```
doom_journal/
├── manifest.json        # Extension config (Manifest V3)
├── background.js        # Service worker - URL interception, pass checking
├── content.js           # Runs on Twitter - auto-kick when pass expires
├── blocked.html         # Journal page markup
├── blocked.js           # Timer logic, state machine, entry saving
├── blocked.css          # Dark mode styles, pause overlay animations
├── popup.html           # Extension popup markup
├── popup.js             # Stats calculation, entry rendering, exports
├── popup.css            # Popup styles
├── icons/
│   ├── icon16.png       # Toolbar
│   ├── icon48.png       # Extensions page
│   └── icon128.png      # Chrome Web Store
├── README.md            # User-facing install instructions
├── PRIVACY.md           # Privacy policy
└── CLAUDE_NOTES.md      # This file
```

### Data Schema (chrome.storage.local)
```javascript
{
  enabled: true,                    // Extension on/off
  passDurationMinutes: 45,          // How long pass lasts
  passExpiresAt: 1704848400000,     // Timestamp when current pass expires
  entries: [
    {
      id: "uuid",
      timestamp: 1704844800000,
      content: "journal text...",
      duration: 180,                // Selected duration in seconds
      wordCount: 150
    }
  ]
}
```

---

## Next Session TODO

**1. Complete Chrome Web Store submission**
- [x] Developer account created
- [ ] Take screenshots (1280x800 or 640x400) — explore using Playwright or similar tool for automated screenshots
- [ ] Create ZIP file of extension (manifest.json at root)
- [ ] Upload to Chrome Web Store developer console
- [ ] Fill in store listing:
  - Name: Doom Journal
  - Short description (132 char max): `Write before you scroll. Journal for 1-5 minutes before Twitter. Private, free, no account needed.`
  - Full description (drafted below)
  - Category: Productivity
  - Privacy policy URL (need to host PRIVACY.md publicly)
- [ ] Submit for review (usually 1-3 days)

**2. Create public GitHub repository** ✅ DONE
- [x] Initialize git repo
- [x] Create GitHub repo (public): https://github.com/moncada-julian/doom-journal
- [x] Push code
- [x] GitHub Pages enabled with landing page and privacy policy
- [x] Privacy policy URL: https://moncada-julian.github.io/doom-journal/privacy.html

**3. Explore screenshot automation tools**
- Look into Playwright, Puppeteer, or similar for taking extension screenshots programmatically
- Could be useful for store listing and README

### Drafted Store Description
```
Write before you scroll.

Doom Journal intercepts Twitter/X and asks you to journal for 1, 3, or 5 minutes before you can access the site. Think of it as a mindfulness speed bump for your doom scrolling habit.

HOW IT WORKS
• Visit Twitter or X → get redirected to a calm writing page
• Pick your duration (1, 3, or 5 minutes)
• Write whatever's on your mind — timer only counts while you're typing
• Complete your entry → get a pass to Twitter (configurable 1-60 min)
• Your entry is saved locally, always available

FEATURES
✓ Distraction-free dark mode writing interface
✓ Active typing timer — pauses when you stop, nudges you to keep going
✓ Auto-continues your last entry (or start fresh with "+ new entry")
✓ All entries stored locally in your browser
✓ Export anytime as Markdown or JSON
✓ Stats: total entries, time written, streak
✓ Toggle on/off, adjust pass duration

PRIVACY-FIRST
This extension makes ZERO network requests. No analytics. No tracking. No accounts. Everything stays on your device. Verify it yourself in DevTools.

Free. Private. Persistent.
```

---

## 6. Gotchas & Important Context

### Fuzzy Matching for Disable Confirmation
The disable modal uses Levenshtein distance with 70% similarity threshold. Located in `popup.js`:
- Target phrase: "yes i want to doom scroll"
- Normalizes input (lowercase, trim, collapse spaces)
- Enter key works to confirm when match is valid

### Auto-Continue Entry Logic
In `blocked.js`:
- `getLatestEntry()` fetches the most recent entry (any date)
- `continuingEntryId` tracks whether we're updating an existing entry or creating new
- When continuing, duration is accumulated (`e.duration + selectedDuration`)
- "+ new entry" button sets `continuingEntryId = null` and clears textarea

### Testing Tips
- To reset pass during testing, run in DevTools console:
  ```javascript
  chrome.storage.local.remove('passExpiresAt')
  ```
- To clear all data:
  ```javascript
  chrome.storage.local.clear()
  ```
- Refresh extension at `chrome://extensions` after code changes

### Code Patterns
- Timer uses `setInterval` at 100ms for smooth updates
- Pause detection uses separate `setInterval` at 500ms checking `lastKeystrokeTime`
- Pause threshold is 10000ms (10 seconds)
- Entry IDs use `crypto.randomUUID()`
- Exports use Blob + temporary anchor element for download

---

*Last updated: January 20, 2026 — GitHub repo created and GitHub Pages enabled. Next: screenshots, ZIP upload, and Chrome Web Store submission.*
