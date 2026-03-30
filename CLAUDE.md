# Project: Vincor Demo (demo-v2)

## Working Style

Challenge my requests when they conflict with the design system, introduce unnecessary complexity, skip required steps to ensure high-quality standards, have broken or untested logic. Don't just execute — tell me when something is a bad idea and why. Prefer "no, here's why" over silent compliance.

## Brand & Design System

**READ FIRST**: `docs/active/color-system.md` — complete brand identity, color system, typography, layout rules, button system, and design principles. This is the source of truth for all design decisions. `DESIGN_GUIDELINES.md` has the detailed implementation rules with Tailwind classes.

## Tech Stack

- **Frontend**: React 18, Vite, React Router DOM 7
- **Backend**: Express.js with SSE streaming
- **Language**: JavaScript (no TypeScript)
- **Styling**: Tailwind CSS v4 (all components use Tailwind utility classes)
- **UI Utilities**: class-variance-authority (CVA), clsx, tailwind-merge, lucide-react
- **Deployment**: Railway (auto-deploys `main` to production)
- **Production URL**: https://demo-v2-production.up.railway.app

## Styling

All components use **Tailwind utility classes**. No CSS modules.

- Use `className="..."` with Tailwind utilities — never inline `style={{}}`
- Use CVA for component variants (see `Badge.jsx`, `CTAButton.jsx` for examples)
- Use `cn()` from `src/lib/utils.js` for conditional classes
- Follow `DESIGN_GUIDELINES.md` for all design tokens and patterns

### Rules:
- **No raw hex colors** — use Tailwind color classes
- **No CSS modules** — everything is Tailwind
- **No inline styles** except for truly dynamic values (computed positions, dynamic widths)
- Platform brand colors in `PLATFORM_COLORS` (PlatformLogo.jsx) are the only hex exception
- Before creating new components, check `src/components/` for existing patterns

## Environments & Links

- **Production**: https://demo-v2-production.up.railway.app (auto-deploys from `main`)
- **Preview**: Railway Preview Environments (auto-deploy per PR — provide the full preview URL after every push)

### Link Rules:
- **NEVER give relative paths** like `/wines` or `/about`. Always use full URLs with the appropriate base domain.
- When referencing any page or route, use the full production URL (e.g., `https://demo-v2-production.up.railway.app/wines`) or the full Railway preview URL if working on a PR.
- **The repo is private** — do not link to GitHub raw file views, blob URLs, or commit pages as a way to "preview" changes. The PR link itself is fine (it's how I access the Railway preview).
