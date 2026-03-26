# Color System Implementation — In Progress

## Status: Open PR #127 on branch `claude/color-system-burgundy-v2`

## What was decided
- **Burgundy brand color**: `#6B1D2A` (stored as `--color-brand` in Tailwind theme)
- **Light variant**: `#F9F0F1` (stored as `--color-brand-light`)
- **All buttons stay black** — burgundy is not for buttons
- **Logo**: burgundy V mark + burgundy "Vincor AI" text (implemented, looks good)
- **Right panel/drawer**: burgundy toggles, sparkle AI actions, "Redeems" badge (implemented, Eduardo approved — "looks polished")
- **1st Transaction trigger**: burgundy dot + text replacing green (implemented)
- **Sparklines**: changed from green to neutral, then to burgundy
- **Connection page sidebar**: burgundy left-border on active nav item + burgundy checkmarks (implemented but barely visible)

## What needs design work
### Problem: Burgundy/black conflict on the strategy page
Eduardo's feedback: "As a user I'm having a hard time understanding the burgundy/black. It feels like we are merging two different products and it's work in progress."

The right panel (drawer) works well — burgundy has a clear consistent role (toggles, section headers, AI action). The main strategy page doesn't — burgundy slider and sparklines feel scattered among massive black headings ("1,363", "$150K", "Your Referral Strategy") without a clear visual pattern.

### Problem: Strategy page chart gradient
The "Daily forecast" chart area gradient was supposed to be burgundy but was missed. Only the Dashboard page chart got the burgundy gradient. The Strategy page chart still uses black/gray gradient.

### Problem: Connection page sidebar accent too subtle
The 3px burgundy left-border on the active nav item is barely visible. Eduardo asked whether this design pattern should exist at all, or if the text color should change instead.

### Key tension to resolve
Burgundy works when it's the dominant visual element in a contained space (drawer panel). It struggles when competing with heavy black typography on the main pages. Need to rethink how the main page content integrates with the brand color — possibly adjusting the typography hierarchy (making big numbers burgundy? changing heading weights?) or rethinking what stays black vs what becomes burgundy.

## Design benchmarks discussed
- **Linear**: indigo accent on sidebar, focus states, progress indicators — structural repetition
- **Mercury**: purple on sidebar, buttons, progress bars — financial product with non-standard color
- **Stripe**: indigo on logo, landing hero, payment buttons

## Files changed in PR #127
- `src/styles/global.css` — added brand, brand-light, danger-light tokens
- `src/components/Logo.jsx` — burgundy V mark + text
- `src/components/CTAButton.jsx` — added brand variant (not used on landing page currently)
- `src/components/StrategyCards.jsx` — toggles burgundy, replaced blue (#3b5bdb) with brand/gray
- `src/components/IntegrationGroup.jsx` — badges normalized to gray
- `src/components/WhatUsersSee.jsx` — 1st Transaction trigger burgundy
- `src/pages/LandingPage.jsx` — CTA reverted to black
- `src/pages/DataConnectionPage.jsx` — active nav border + checkmarks burgundy
- `src/pages/StrategyBuilderPage.jsx` — slider, sparklines burgundy
- `src/pages/DashboardPage.jsx` — chart curve + gradient burgundy
- `DESIGN_GUIDELINES.md` — brand colors, interactive text colors, danger-light

## Tech context
- Tailwind CSS v4 fully migrated (no CSS modules remain)
- All design tokens in `src/styles/global.css` @theme block
- GStack installed with 27 slash commands
- Railway Preview Environments enabled (auto-deploy per PR)
- Node.js >= 20 required
