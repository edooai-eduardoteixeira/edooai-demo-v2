# Project: Vincor AI Demo (demo-v2)

## Tech Stack

- **Frontend**: React 18, Vite, React Router DOM 7
- **Backend**: Express.js with SSE streaming
- **Language**: JavaScript (no TypeScript)
- **Styling**: Tailwind CSS v4 + CSS Modules (hybrid — see Styling section below)
- **UI Utilities**: class-variance-authority (CVA), clsx, tailwind-merge, lucide-react
- **Deployment**: Railway (auto-deploys `main` to production)
- **Production URL**: https://demo-v2-production.up.railway.app

## Styling

This project uses a **hybrid approach** after a partial Tailwind migration:

### For new components and modifications — use Tailwind:
- Use Tailwind utility classes (`className="flex items-center gap-2 text-foreground"`)
- Use CVA for component variants (see `Badge.jsx`, `CTAButton.jsx` for examples)
- Use `cn()` from `src/lib/utils.js` for conditional classes
- Semantic colors: `text-foreground`, `text-foreground-muted`, `text-foreground-faint`, `bg-accent`, `bg-surface`, `border-border`, `text-success`, `text-danger`, `text-warn`
- Shadows: `shadow-xs`, `shadow-sm`, `shadow-md`, `shadow-lg`, `shadow-xl`
- Radii: `rounded-sm` (6px), `rounded-md` (10px), `rounded-lg` (14px), `rounded-xl` (20px), `rounded-full`

### Legacy CSS Modules (do NOT rewrite — modify in place):
- `WhatUsersSee.module.css` — timeline/carousel layout
- `StrategyDrawer.module.css` — drawer + form controls
- `StrategyTimeline.module.css` — two-column timeline
- `DataConnection.module.css` — data connection page layout

These modules use legacy CSS variables (`var(--text-primary)`, `var(--border)`, etc.) which are aliased in `global.css :root`.

### Rules:
- **No raw hex colors** — use Tailwind color classes or CSS variables
- **No inline `style={{}}`** in new code — use Tailwind classes
- Platform brand colors in `PLATFORM_COLORS` (PlatformLogo.jsx) are the only hex exception
- Before creating new components, check `src/components/` for existing patterns

## Environments

- **Production**: https://demo-v2-production.up.railway.app (auto-deploys from `main`)
- **Preview**: Railway Preview Environments (auto-deploy per PR — provide the full preview URL after every push)
