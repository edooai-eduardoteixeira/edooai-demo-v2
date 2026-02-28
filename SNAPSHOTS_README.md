# Code Snapshots — February 24, 2026

This repository contains two exact snapshots of the Edoo AI Demo v2 codebase, captured at two specific moments on **Tuesday, February 24, 2026**.

---

## Snapshot Details

| Snapshot | Directory | Timestamp | Git Commit |
|----------|-----------|-----------|------------|
| **Morning** | `snapshots/8am-pt-feb24/` | Feb 24, 2026 at **8:00 AM PT** (16:00 UTC) | `55d5785ba81af20e313534a1ca4a3b9942f8767d` |
| **Evening** | `snapshots/6pm-pt-feb24/` | Feb 24, 2026 at **6:00 PM PT** (02:00 UTC Feb 25) | `5302749a6f9ff9c1267586f8e8ff8db06aa840a6` |

**PT = Pacific Standard Time (UTC-8)** — February is before daylight saving time.

Each snapshot contains the complete source code (30 files) as it existed on the `main` branch at that exact moment. No files were added, removed, or modified from the original — they are byte-for-byte identical to the git history.

---

## How to See What This Code Produces

Each snapshot is a standalone Node.js + React application. To run it and see the output:

### Option 1: Run Locally

```bash
# Pick either snapshot:
cd snapshots/8am-pt-feb24/
# or
cd snapshots/6pm-pt-feb24/

# Install dependencies
npm install

# Build the frontend
npm run build

# Start the server
node server/index.js
```

Then open **http://localhost:3001** in your browser.

### Option 2: Deploy to a Cloud Platform

Upload the contents of either snapshot directory as a new project on:
- **Railway** (railway.com) — auto-detects Node.js, uses `npm run build` then `npm start`
- **Render** (render.com) — same auto-detection
- **Any platform** that supports Node.js apps

The app will build and serve automatically.

### Requirements

- Node.js 18+
- npm (comes with Node.js)
- No database or external services needed — the app is fully self-contained with hardcoded demo data

---

## What the App Shows

This is a 5-screen interactive demo of **Edoo AI**, an autonomous referral program platform for neobanks. The screens flow in sequence:

### Screen 1 — Landing Page
Hero section with the headline "Turn your best customers into your best acquisition channel" and a CTA button to start.

### Screen 2 — Data Connection
Two-column layout: left side shows 3 integration groups (CRM, Data Warehouse, Support) with platform logos (Braze, Segment, Snowflake, etc.). Clicking "Connect" triggers an animation. Right side shows a real-time checklist of detected data fields.

### Screen 3 — AI Analysis
Animated text streaming simulates AI analyzing 847,000 customer records. Discovers a 4-stage user journey (Sign-Up → KYC → First Transaction → Recurring). Shows conversion rate (34%) and reward pricing ($40 sign-up reward = ~$118 effective cost per transaction).

### Screen 4 — Strategy Proposal
Presents two referral strategies (Quick Win and Look-a-Like) with a budget slider ($50K–$1M). Live projections update as the slider moves, showing projected new users, spend, and blended CAC.

### Screen 5 — Dashboard (Projected 30-Day Results)
Shows projected campaign performance: 4,960 referrals sent, 684 new users, $147,600 spend, $216 blended CAC. Includes an S-curve chart with phase overlays (Seed, Expand, Optimize).

---

## What Changed Between 8AM and 6PM

Between these two snapshots, **10 pull requests (#7 through #16)** were merged, all focused on redesigning **Screen 2 (Data Connection)**:

### Files that differ (6 out of 30):
- `src/components/DataChecklist.jsx` — Checklist redesigned: square checkboxes replaced with text circles, business notes removed
- `src/components/IntegrationGroup.jsx` — Added step numbers and data direction pill badges, optional groups visually de-emphasized
- `src/components/PlatformLogo.jsx` — Green border + background when connected, added "Connected" label
- `src/config/neobank.js` — Simplified from 11 to 4 required fields, renamed categories, added whyLine copy
- `src/pages/DataConnectionPage.jsx` — Larger title, updated subtitle copy, wider grid layout
- `src/styles/global.css` — Added semantic color tokens, new shadow variables, border radius in px

### All other files (24 out of 30) are identical between the two snapshots.

Screens 1, 3, 4, and 5 look the same in both versions. Only Screen 2 has visible differences.

---

## Verification

To independently verify these snapshots match the git history:

1. Clone the repository: `git clone https://github.com/edooai-eduardoteixeira/edooai-demo-v2.git`
2. Check out the morning commit: `git checkout 55d5785ba81af20e313534a1ca4a3b9942f8767d`
3. Compare against `snapshots/8am-pt-feb24/` — all files should be identical
4. Check out the evening commit: `git checkout 5302749a6f9ff9c1267586f8e8ff8db06aa840a6`
5. Compare against `snapshots/6pm-pt-feb24/` — all files should be identical
