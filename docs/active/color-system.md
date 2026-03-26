# Color System Implementation — In Progress

## Status: Open PR #127 on branch `claude/color-system-burgundy-v2`

## Brand Strategy: "Burgundy = Vincor Intelligence"

### Core principle
Burgundy appears **only where Vincor's intelligence surfaces** — predictions, AI-powered results, engine output. Not for structural headings, user inputs, or marketing copy.

### What gets burgundy
- **Hero KPI number** (e.g., "1,363 new customers") — the product's output
- **Chart lines + gradients** — predictions visualized (both dashboard and strategy charts)
- **Sparklines** — trend intelligence in KPI cards
- **Toggles (on state)** — user activating the engine
- **AI actions** ("Add rule with AI", sparkle icon) — intelligence surfacing
- **Journey trigger badges** ("Redeems") — outcome/reward moments
- **Connection checkmarks** — "Vincor has processed this"
- **Active sidebar items** — text + left border (connection page)
- **Slider fill + thumb** — user control over the engine

### What does NOT get burgundy
- **Page headings** ("Your Referral Strategy") — structural, use `--text-soft` (#404040)
- **Budget number** ("$150K") — user input, not product output
- **Landing page title** — marketing copy, stays black
- **KPI card secondary values** — use `--text-soft`, sparkline carries the brand signal
- **Body text, labels, descriptions** — standard text hierarchy

### Typography hierarchy (post-fix)
- `--color-brand` (#6B1D2A) — hero data moments (Vincor intelligence output)
- `--text-soft` / `--color-foreground-soft` (#404040) — headings, card values (structural, quiet)
- `--text-primary` (#0f172a) — body text, inputs (max readability)
- `--text-secondary` (#475569) — descriptions, supporting text
- `--text-tertiary` (#94a3b8) — labels, hints, timestamps

### Burgundy budget per screen
- **Strategy page**: ~4 moments (hero number, sparklines, chart, slider)
- **Dashboard page**: ~2 (chart line + gradient)
- **Connection page**: ~2 (checkmarks, active sidebar)
- **Landing page**: ~1 (logo only, CTA stays black)
- **Drawer/right panel**: ~4 (toggles, AI action, "Redeems", section accents)

## What was decided (previous session)
- **Burgundy brand color**: `#6B1D2A` (stored as `--color-brand` in Tailwind theme)
- **Light variant**: `#F9F0F1` (stored as `--color-brand-light`)
- **All buttons stay black** — burgundy is not for buttons
- **Logo**: burgundy V mark + burgundy "Vincor AI" text (approved)
- **Right panel/drawer**: burgundy toggles, sparkle AI actions, "Redeems" badge (approved — "looks polished")

## What was fixed (this session)
- **Hero KPI "1,363"**: changed from black (800wt) → burgundy (700wt) — anchors brand as the product's voice
- **"Your Referral Strategy" heading**: changed from `--text-primary` → `--text-soft` — stops competing with hero number
- **KPI card values**: changed from `--text-primary` → `--text-soft` — harmonizes with heading
- **Daily Forecast chart**: post-threshold gradient + stroke changed from slate/dark → burgundy (matches dashboard chart)
- **Chart endpoint**: dot + label changed from `--text-primary` → burgundy
- **Connection sidebar active state**: added burgundy text color alongside existing border
- **New token**: `--color-foreground-soft` / `--text-soft` (#404040) for demoted structural headings

## Design benchmarks
- **Linear**: indigo accent on sidebar, focus states, progress indicators — structural repetition
- **Mercury**: purple on sidebar, buttons, progress bars — financial product with non-standard color
- **Stripe**: indigo on logo, landing hero, payment buttons

## Files changed
- `src/styles/global.css` — added brand, brand-light, danger-light, foreground-soft tokens
- `src/components/Logo.jsx` — burgundy V mark + text
- `src/components/CTAButton.jsx` — added brand variant
- `src/components/StrategyCards.jsx` — toggles, badges, AI actions burgundy
- `src/components/IntegrationGroup.jsx` — badges normalized to gray
- `src/components/WhatUsersSee.jsx` — 1st Transaction trigger burgundy
- `src/pages/LandingPage.jsx` — CTA stays black
- `src/pages/DataConnectionPage.jsx` — active nav border + text + checkmarks burgundy
- `src/pages/StrategyBuilderPage.jsx` — hero KPI burgundy, heading/values softened, chart burgundy gradient
- `src/pages/DashboardPage.jsx` — chart curve + gradient burgundy
- `DESIGN_GUIDELINES.md` — brand colors, interactive text colors

## Tech context
- Tailwind CSS v4 fully migrated (no CSS modules remain)
- All design tokens in `src/styles/global.css` @theme block
- GStack installed with 27 slash commands
- Railway Preview Environments enabled (auto-deploy per PR)
- Node.js >= 20 required
