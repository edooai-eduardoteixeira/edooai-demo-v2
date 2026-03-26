# Project: Vincor AI Demo (demo-v2)

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

### Key tokens:
- **Colors**: `text-foreground`, `text-foreground-muted`, `text-foreground-faint`, `bg-accent`, `bg-surface`, `border-border`, `text-success`, `text-danger`, `text-warn`
- **Shadows**: `shadow-xs`, `shadow-sm`, `shadow-md`, `shadow-lg`, `shadow-xl`
- **Radii**: `rounded-sm` (6px), `rounded-md` (10px), `rounded-lg` (14px), `rounded-xl` (20px), `rounded-full`

### Rules:
- **No raw hex colors** — use Tailwind color classes
- **No CSS modules** — everything is Tailwind
- **No inline styles** except for truly dynamic values (computed positions, dynamic widths)
- Platform brand colors in `PLATFORM_COLORS` (PlatformLogo.jsx) are the only hex exception
- Before creating new components, check `src/components/` for existing patterns

## Environments

- **Production**: https://demo-v2-production.up.railway.app (auto-deploys from `main`)
- **Preview**: Railway Preview Environments (auto-deploy per PR — provide the full preview URL after every push)
