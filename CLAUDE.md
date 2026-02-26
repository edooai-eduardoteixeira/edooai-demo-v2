# Edoo AI Demo v2

## Design System

Follow the design system rules in `DESIGN_GUIDELINES.md` exactly. Never improvise CSS values — use only the tokens and patterns defined there.

Key rules:
- **No raw hex colors** for text, backgrounds, borders, or accents — always use CSS variables from `src/styles/global.css`
- **No invented spacing values** — only use the allowed scale (2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 40, 48, 64, 80px)
- **No hardcoded shadows** — use `var(--shadow-xs)` through `var(--shadow-xl)`
- **No inline transition durations** — use `var(--transition-fast)`, `var(--transition-base)`, or `var(--transition-slow)`
- Platform brand colors in `PLATFORM_COLORS` are the only exception to the "no raw hex" rule
