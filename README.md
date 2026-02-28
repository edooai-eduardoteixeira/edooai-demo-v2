# Edoo AI Demo v2

Interactive demo of **Edoo AI** — an autonomous referral program platform for neobanks. This is a 5-screen guided experience that walks through data connection, AI analysis, strategy configuration, and projected campaign results.

---

## Prerequisites

- **Node.js 18+** (check with `node -v`)
- **npm** (comes bundled with Node.js; check with `npm -v`)
- No database, API keys, or external services required — the app is fully self-contained with built-in demo data

## Setup & Run

```bash
# 1. Install dependencies
npm install

# 2. Build the frontend
npm run build

# 3. Start the server
npm start
```

The app will be available at **http://localhost:3001**.

### Development Mode

For local development with hot-reload:

```bash
# Terminal 1 — Vite dev server (frontend)
npm run dev

# Terminal 2 — Express server (backend)
npm run server
```

The Vite dev server runs on port 5173 and proxies API requests to the Express server on port 3001.

### Cloud Deployment

Upload this folder as a new project on any Node.js-compatible platform:

- **Railway** (railway.com) — auto-detects Node.js, runs `npm run build` then `npm start`
- **Render** (render.com) — same auto-detection
- **Heroku**, **Fly.io**, or any platform that supports Node.js

The `package.json` scripts handle everything:
- `build` → runs Vite to produce the frontend bundle
- `start` → runs the Express server, which serves the built frontend and the streaming API

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, React Router v7, Vite |
| Backend | Express 5 (Node.js) |
| Styling | CSS with custom properties (no framework) |
| Build | Vite 7 |

---

## What the App Shows

The demo flows through 5 screens in sequence. Click the CTA on each screen to advance.

### Screen 1 — Landing Page

Hero section with the headline **"Turn your best customers into your best acquisition channel"** and a call-to-action button to begin the demo.

### Screen 2 — Data Connection

Two-column layout:

- **Left side**: Three integration groups (CRM, Data Warehouse, Support) showing platform logos (Braze, Segment, Snowflake, Zendesk, etc.). Clicking "Connect" on each group triggers a connection animation.
- **Right side**: A real-time checklist of detected data fields that populates as integrations connect.

Once all required integrations are connected, the "Continue" button activates.

### Screen 3 — AI Analysis

Animated text streaming simulates Edoo AI analyzing **847,000 customer records**. The analysis discovers:

- A **4-stage user journey**: Sign-Up → KYC Verified → First Transaction → Recurring User
- Overall conversion rate: **34%**
- Reward pricing: **$40 sign-up reward** → approximately **$118 effective cost** per completing user (accounting for funnel drop-off)

### Screen 4 — Strategy Proposal

Presents two referral strategies:

- **Quick Win**: Targets high-intent users for fast conversion
- **Look-a-Like**: Targets users similar to top referrers for scale

A **budget slider** ($50K–$1M) lets you adjust spend. Live projections update in real time, showing projected new users, total spend, and blended CAC for each strategy.

### Screen 5 — Dashboard (Projected 30-Day Results)

Shows projected campaign performance over 30 days:

- **4,960** referrals sent
- **684** new users acquired
- **$147,600** total spend
- **$216** blended CAC

Includes an **S-curve chart** with three phase overlays (Seed → Expand → Optimize) showing how the campaign ramps over time.

---

## Project Structure

```
├── index.html              # Vite entry point
├── package.json            # Dependencies and scripts
├── vite.config.js          # Vite configuration
├── server/
│   ├── index.js            # Express server (serves frontend + streaming API)
│   └── streamConfig.js     # Streaming text configuration for AI analysis
├── src/
│   ├── main.jsx            # React entry point
│   ├── App.jsx             # Router and page layout
│   ├── components/         # Reusable UI components
│   │   ├── AnimatedNumber.jsx
│   │   ├── Badge.jsx
│   │   ├── CTAButton.jsx
│   │   ├── DataChecklist.jsx
│   │   ├── Expandable.jsx
│   │   ├── IntegrationGroup.jsx
│   │   ├── JourneyPipeline.jsx
│   │   ├── Logo.jsx
│   │   └── PlatformLogo.jsx
│   ├── config/
│   │   ├── index.js        # Config loader
│   │   └── neobank.js      # Neobank vertical configuration
│   ├── hooks/
│   │   ├── useProjections.js
│   │   ├── useStreamingText.js
│   │   └── useVerticalConfig.js
│   ├── pages/
│   │   ├── LandingPage.jsx
│   │   ├── DataConnectionPage.jsx
│   │   ├── AnalysisPage.jsx
│   │   ├── StrategyPage.jsx
│   │   └── DashboardPage.jsx
│   └── styles/
│       └── global.css      # Global styles and CSS custom properties
```

## Verifying It Works

After running `npm start`, open **http://localhost:3001** in your browser. You should see the Landing Page with the Edoo AI logo and the hero headline. Click **"Start Demo"** to walk through all 5 screens.
