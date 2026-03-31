# Project: Vincor Demo (demo-v2)

## Working Style

Challenge my requests when they conflict with the design system, introduce unnecessary complexity, skip required steps to ensure high-quality standards, have broken or untested logic. Don't just execute — tell me when something is a bad idea and why. Prefer "no, here's why" over silent compliance.

## Tech Stack

- **Frontend**: React 18, Vite, React Router DOM 7
- **Backend**: Express.js with SSE streaming
- **Language**: JavaScript (no TypeScript)
- **Styling**: Tailwind CSS v4 — no CSS modules, no inline `style={{}}`
- **UI Utilities**: class-variance-authority (CVA), clsx, tailwind-merge, lucide-react
- **Deployment**: Railway (auto-deploys `main` to production)
- **Production**: https://demo-v2-production.up.railway.app
- **Preview**: Created via PR — Railway auto-deploys per PR

## Styling

- Use CVA for component variants (see `Badge.jsx`, `CTAButton.jsx` for examples)
- Use `cn()` from `src/lib/utils.js` for conditional classes
- Before creating new components, check `src/components/` for existing patterns
- For design tokens, color rules, and component recipes, follow `DESIGN.md`

## Link Rules

- Always use full URLs (e.g., `https://github.com/eduardofteixeira/demo-v2/blob/main/src/components/Modal.jsx`), never relative paths
- The repo is private — do not link to GitHub raw/blob views as a way to preview changes

## Browse server (cloud sessions)

Before running any browse command (`/qa`, `/design-review`, `browse goto`, etc.),
start the browse server using the Bash tool with `run_in_background: true`:

```
CONTAINER=1 node ~/.claude/skills/gstack/browse/dist/server-node.mjs
```

Wait 5s for it to become healthy, then browse commands will work. The session-start
hook installs the CLI wrapper and patches automatically — this just starts the server.

## Skill routing

When the user's request matches an available skill, ALWAYS invoke it using the Skill
tool as your FIRST action. Do NOT answer directly, do NOT use other tools first.
The skill has specialized workflows that produce better results than ad-hoc answers.

Key routing rules:
- Product ideas, "is this worth building", brainstorming → invoke office-hours
- Bugs, errors, "why is this broken", 500 errors → invoke investigate
- Ship, deploy, push, create PR → invoke ship
- QA, test the site, find bugs → invoke qa
- Code review, check my diff → invoke review
- Update docs after shipping → invoke document-release
- Weekly retro → invoke retro
- Design system, brand → invoke design-consultation
- Visual audit, design polish → invoke design-review
- Architecture review → invoke plan-eng-review
