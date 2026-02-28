# Edoo AI Demo v2

Interactive demo of **Edoo AI** — an autonomous referral program platform for neobanks.

## How to Run

### Requirements

- Node.js 18+
- npm (comes with Node.js)
- No database or external services needed — the app is fully self-contained

### Steps

```bash
# Install dependencies
npm install

# Build the frontend
npm run build

# Start the server
npm start
```

Then open **http://localhost:3001** in your browser.

### Deploy to Cloud

Upload this folder as a new project on Railway, Render, or any Node.js-compatible platform. It auto-detects the build and start commands from `package.json`.

## What the App Shows

A 5-screen interactive flow:

1. **Landing Page** — Hero section with CTA
2. **Data Connection** — Connect integrations (CRM, Data Warehouse, Support) and see detected data fields
3. **AI Analysis** — Animated analysis of customer records, discovering a 4-stage user journey
4. **Strategy Proposal** — Two referral strategies with a budget slider and live projections
5. **Dashboard** — Projected 30-day campaign results with an S-curve performance chart
