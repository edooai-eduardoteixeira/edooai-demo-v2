# Project: Vincor AI Demo (demo-v2)

## Tech Stack

- **Frontend**: React 18, Vite, React Router DOM 7
- **Backend**: Express.js with SSE streaming
- **Language**: JavaScript (no TypeScript)
- **Styling**: CSS Modules + CSS custom properties (global.css)
- **Deployment**: Railway (auto-deploys `main` to production)
- **Production URL**: https://demo-v2-production.up.railway.app

## Design System

Follow `DESIGN_GUIDELINES.md` exactly. Never improvise CSS values — use only the tokens and patterns defined there.

Key rules:
- **No raw hex colors** for text, backgrounds, borders, or accents — always use CSS variables from `src/styles/global.css`
- **No invented spacing values** — only use the allowed scale (2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 40, 48, 64, 80px)
- **No hardcoded shadows** — use `var(--shadow-xs)` through `var(--shadow-xl)`
- **No inline transition durations** — use `var(--transition-fast)`, `var(--transition-base)`, or `var(--transition-slow)`
- Platform brand colors in `PLATFORM_COLORS` are the only exception to the "no raw hex" rule

Before creating any new component, check existing components in `src/components/` for patterns to reuse.

## Environments

- **Production**: https://demo-v2-production.up.railway.app (auto-deploys from `main`)
- **Preview**: Railway Preview Environments (auto-deploy per PR — provide the full preview URL after every push)

## Migration Notes

This project uses CSS Modules + custom properties. Future projects should use Tailwind + shadcn/ui (see global CLAUDE.md). Do not migrate this project's styling approach unless Eduardo explicitly requests it.
