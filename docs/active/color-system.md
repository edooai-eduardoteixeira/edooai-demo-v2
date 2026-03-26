# Color System — Finalized

## Status: Open PR #127 on branch `claude/color-system-burgundy-v2`

## The Design System

Source of truth: `DESIGN_GUIDELINES.md` (updated with full color system)

### Brand color: Pure Wine #66001F
- Zero brown, zero cool undertones. Pure wine-red.
- Has exactly 3 jobs: primary CTA buttons, chart lines, active/selected states
- Never used for text, numbers, headings, borders, or decorative backgrounds

### Warm palette (the breakthrough)
The entire product lives in a warm cream/sand/taupe world. No cool grays anywhere.
- Background: #FAF7F2 (warm cream)
- Surface: #FFFFFF (white cards on cream = depth)
- Text: #2C2320 (warm brown-black) → #6B5E54 (warm taupe) → #A89E94 (warm sand)
- Borders: #E4DDD5 (warm sand)
- Gray scale: warm sand family, not Tailwind slate or stone

### Why this works
Burgundy/wine was always fighting because it was the only warm element in a cold gray world.
Now everything is warm. The brand color is just the most saturated member of the same family.

### Typography hierarchy
- Hero metrics: `--text-primary` (#2C2320) — the star
- Page titles: `--text-secondary` (#6B5E54) — structural, not competing
- Labels: `--text-tertiary` (#A89E94) — quiet

## Decisions log
1. Brand #6B1D2A → tested #531C22, #7A2E3A, #850020 → settled on #66001F (Pure Wine)
2. Background: pure white → #FAFAF9 (gray) → #FAF7F2 (cream) — cream was the "wow"
3. Neutral palette: cool slate → warm stone → warm sand family (current)
4. Chart gradients: colored → gray → warm taupe (matching the environment)
5. No secondary accent color. One brand color, used with restraint.
6. No pink/blush in the system. Brand-light is warm linen #F0E8E5.

## Remaining screens to verify
- [x] Strategy page — validated
- [ ] Connection page
- [ ] Landing page
- [ ] Drawer/right panel
