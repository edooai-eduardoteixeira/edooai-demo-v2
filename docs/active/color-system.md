# Vincor Brand & Design System

## Brand Identity

**Name**: Vincor (not "Vincor AI" — dropped "AI" for brand confidence)
**Logo**: Custom crystalline/crown mark + "Vincor" in Playfair Display serif
**Brand color**: Pure Wine #66001F — a pure, zero-brown wine red
**Font system**: Playfair Display (brand/display) + Inter (product UI)

## Brand Personality

Premium, confident, warm. Think Cartier meets Stripe — luxury meets fintech.
The product is an agentic referral engine. The design should feel calm, intelligent, and inevitable.

## Color System

### The Foundation: Warm Everything

The entire palette is warm — cream backgrounds, warm brown text, warm sand borders.
No cool grays, no blue undertones anywhere. Pure Wine is the most saturated member of the same warm family.

| Token | Hex | Role |
|---|---|---|
| `--color-brand` | #66001F | Pure Wine — CTAs, charts, active states |
| `--color-brand-light` | #F0E8E5 | Hover/selected backgrounds for brand elements |
| `--bg` | #FAF7F2 | Page background — warm cream |
| `--surface` | #FFFFFF | Cards, modals, drawers — white on cream = depth |
| `--foreground` | #2C2320 | Hero numbers, primary data |
| `--foreground-muted` | #6B5E54 | Page headings, body text, descriptions |
| `--foreground-faint` | #A89E94 | Labels, metadata, placeholders |
| `--border` | #E4DDD5 | Standard borders — warm sand |
| `--border-light` | #EFEBE5 | Subtle dividers |
| `--accent` | #2C2320 | Primary dark buttons |
| `--accent-subtle` | #F5F1EB | Subtle section backgrounds |
| `--danger` | #EF4444 | Error — bright cool red, distinct from brand |
| `--success` | #059669 | Success — emerald |
| `--warn` | #F59E0B | Warning — amber |

### Gray Scale (Warm Sand Family)

50: #F7F3ED → 100: #EFEBE5 → 200: #E4DDD5 → 300: #D1C8BE → 400: #A89E94 → 500: #7D7368 → 600: #6B5E54 → 700: #4A3F37 → 800: #2C2320 → 900: #1A1512

### Brand Color Rules

**Brand color has exactly 3 jobs in the product UI:**
1. Primary CTA buttons (one per screen)
2. Chart lines and data visualization
3. Active/selected states (toggles, nav items, radio dots)

**Brand color never does** (in product UI): text for numbers/headings/labels, multiple buttons per screen, borders, decorative backgrounds.

**Landing page exception**: Hero headline uses `text-brand` in Playfair Display. The landing IS the brand moment.

## Typography

### Font Families
- **Playfair Display** (`font-display`): Logo wordmark, landing page hero headline ONLY
- **Inter** (`font-sans`): Everything else — all product UI, body text, buttons, labels

### Hierarchy Rule
- Hero metrics (biggest number on page): `text-foreground` (#2C2320)
- Page titles and headings: `text-foreground-muted` (#6B5E54) — structural, not the star
- Labels, metadata: `text-foreground-faint` (#A89E94)

### Size Rules
- Minimum font size: 11px (for uppercase labels/badges only)
- Body sentences: 12px minimum, 13px for compact contexts
- Playfair requires ~15% size compensation vs Inter at same visual weight

## Layout System

### Shared Container
Every page uses: `max-w-[1100px] mx-auto w-full px-12`

### Header
- Normal flow (not absolute) inside the shared container
- `py-2.5 mb-6` on all pages
- Landing: full logo (icon + "Vincor" in Playfair Display)
- Internal pages: mark only (icon)
- Logo click navigates home

### Page Types
- **Landing**: Left-aligned hero, `pt-20` fixed top, `max-w-[800px]` content
- **Single column** (strategy, dashboard): Content starts after header
- **Sidebar + content** (connection): 280px sidebar inside shared container, sidebar content aligns with logo

## Button System

### 4 Tiers

| Tier | Size | Font | Width | Use |
|---|---|---|---|---|
| **Large** | py-3.5 px-8 | 16px semibold | min-w-[200px] page / w-full modal | Page CTAs, modal confirms |
| **Medium** | py-2 px-4 | 13px semibold | min-w-[120px] | Section actions |
| **Small** | py-1 px-2.5 | 11px semibold | Content-width | Utility (copy, reveal) |
| **Text link** | No padding | 13px medium | Content-width | Navigation, triggers |

### Button Color Variants
- **Brand** (`bg-brand text-white`): Page-level CTAs — one per screen
- **Brand outline** (`border-2 border-brand text-brand bg-surface`): Modal confirm buttons
- **Primary** (`bg-accent text-white`): Dark buttons where brand is too strong
- **Secondary** (`bg-surface text-foreground border border-border`): Secondary actions

### CTA Alignment
- Left-aligned with content on all pages
- Exception: strategy page CTA centered inside "What Users See" section

## Container Surfaces

| Type | Treatment | Use |
|---|---|---|
| User controls (dropdowns, steppers) | `bg-surface border border-border` | Interactive elements |
| Computed context (eligibility, pacing) | `bg-accent-subtle rounded-lg py-3 px-4` | System-derived data, should recede |
| Floating popovers (dropdown menus) | `bg-surface border border-border shadow-md` | Temporary overlays |

**Rule**: Computed context recedes (subtle bg, no border). User controls pop (white, bordered).

## Modal System

Reusable `Modal` component enforces:
- Backdrop: `bg-black/40`
- Container: `rounded-xl pt-10 px-8 pb-6 shadow-xl`
- Close button: `top-5 right-5 w-8 h-8`
- Subcomponents: `Modal.Header`, `Modal.Footer`
- Confirm buttons use `brand-outline` variant (not filled brand)

## Charts & Data Visualization

- Chart lines: `var(--color-brand)` — brand carries the data story
- Area fills: `var(--color-brand)` at 7% opacity — subtle brand tint that connects fill to line
- Pre-threshold/uncertain: Warm taupe dashed lines
- Axis labels: `var(--text-tertiary)`
- Tooltips: Dark bg with white text

## Key Design Principles

1. **Warm everything** — no cool grays, no blue undertones
2. **Brand is rare** — 3 jobs max, 3-5 moments per screen. Restraint = premium
3. **Text is never brand-colored** (except landing hero headline)
4. **Input and output on different surfaces** when possible
5. **Spacious over cramped**
6. **One font for brand (Playfair), one for product (Inter)**
7. **Logo icon + wordmark on landing, icon only on internal pages**
8. **Left-aligned content** across all pages
9. **Consistent margins** — shared max-w-[1100px] px-12 container everywhere

## Design Decisions Log

1. Brand color: started #6B1D2A → tested #531C22, #7A2E3A, #850020 → settled on #66001F (Pure Wine)
2. Background: pure white → #FAFAF9 (gray) → #FAF7F2 (warm cream) — cream was the breakthrough
3. Neutral palette: cool Tailwind slate → warm stone → warm sand family
4. Logo: "V" letter → custom crystalline mark, Playfair Display wordmark, dropped "AI"
5. Typography: single font (Inter) → dual font (Playfair Display for brand, Inter for product)
6. Heading hierarchy: all same color → section titles demoted to foreground-muted
7. Chart area fill: colored → gray → warm taupe → Pure Wine 7% (brand tint that connects fill to line)
8. No secondary accent color — one brand color, used with restraint
9. No pink/blush — brand-light is warm linen #F0E8E5
10. Modals: extracted to reusable component with brand-outline confirm buttons

## File References

- Design tokens: `src/styles/global.css` @theme block
- Design guidelines: `DESIGN_GUIDELINES.md` (detailed rules with Tailwind classes)
- Logo component: `src/components/Logo.jsx`
- Button component: `src/components/CTAButton.jsx`
- Modal component: `src/components/Modal.jsx`
- Brand mark: `public/vincor svg.svg`
