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

- Use `className="..."` with Tailwind utilities — no CSS modules, no inline `style={{}}`
- Use CVA for component variants (see `Badge.jsx`, `CTAButton.jsx` for examples)
- Use `cn()` from `src/lib/utils.js` for conditional classes
- Before creating new components, check `src/components/` for existing patterns

For design tokens, color rules, and component recipes, follow `DESIGN_GUIDELINES.md`.

## Environments & Links

- **Production**: https://demo-v2-production.up.railway.app (auto-deploys from `main`)
- **Preview**: Created via PR — Railway auto-deploys per PR

### Link Rules:
- Always use full URLs (e.g., `https://github.com/eduardofteixeira/demo-v2/blob/main/src/components/Modal.jsx`), never relative paths
- The repo is private — do not link to GitHub raw/blob views as a way to preview changes
