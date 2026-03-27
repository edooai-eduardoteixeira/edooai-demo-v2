# Design Guidelines

These are **rules** — not suggestions. Follow them exactly for all CSS and UI work in this project.

## Important: Use Tailwind Classes

All new code must use **Tailwind utility classes** — never inline `style={{}}`. Use the `cn()` helper from `src/lib/utils.js` for conditional classes. Use CVA (`class-variance-authority`) for component variants.

---

## Typography

**Font**: Inter (configured as `font-sans` in Tailwind theme)

**Base**: 16px (`text-base`), line-height 1.6

### Allowed font sizes

| Tailwind Class | Size | Use case |
|---------------|------|----------|
| `text-[11px]` | 11px | Tiny labels, uppercase section headers |
| `text-xs` | 12px | Captions, badges, source labels |
| `text-[13px]` | 13px | Compact text, table cells |
| `text-sm` | 14px | Buttons, inputs, secondary content |
| `text-[15px]` | 15px | Body text |
| `text-base` | 16px | Subheadings |
| `text-[17px]` | 17px | Section titles |
| `text-lg` | 18px | Modal titles |
| `text-[22px]` | 22px | Section page titles |
| `text-2xl` | 24px | Large headers |
| `text-[28px]` | 28px | Page h1 |
| `text-[32px]` | 32px | Hero stats |
| `text-4xl` | 36px | Landing hero (mobile) |
| `fontSize: 40` | 40px | Large input number (budget) — inline style only |
| `text-[48px]` | 48px | Landing hero (desktop) |
| `fontSize: 64` | 64px | Hero KPI (strategy page) — inline style only |

### Font weights

| Tailwind Class | Weight | Use case |
|---------------|--------|----------|
| `font-normal` | 400 | Body text, descriptions |
| `font-medium` | 500 | Buttons, nav items |
| `font-semibold` | 600 | Card titles, badges, labels |
| `font-bold` | 700 | Headings |
| `font-extrabold` | 800 | Hero numbers only |

### Letter spacing

| Tailwind Class | Value | Use case |
|---------------|-------|----------|
| `tracking-[-0.03em]` | -0.03em | h1 headings |
| `tracking-tight` | -0.02em | h2 headings |
| `tracking-[-0.01em]` | -0.01em | Card titles and buttons |
| `tracking-normal` | 0 | Body text |
| `tracking-[0.05em]` | 0.05em | Uppercase labels |

### Uppercase labels recipe
```
text-[11px] font-semibold tracking-[0.05em] text-foreground-faint uppercase
```

---

## Colors

All colors live in a **warm family**. No cool grays, no blue-tinted neutrals. The entire palette descends from warm cream → warm brown, with Pure Wine (#66001F) as the brand accent.

**NEVER use raw hex colors.** Always use Tailwind color classes or CSS variables.

### Brand color: Pure Wine (#66001F)

| Token | Hex | Tailwind Class | Purpose |
|---|---|---|---|
| `--color-brand` | #66001F | `text-brand` / `bg-brand` | Brand accent — see usage rules below |
| `--color-brand-light` | #F0E8E5 | `bg-brand-light` | Hover/selected backgrounds for brand elements |

**Brand color has exactly 3 jobs in the product UI:**
1. **Primary CTA buttons** — the one key action per screen
2. **Chart lines and data visualization** — the product's intelligence, visualized
3. **Active/selected states** — toggles on, active nav items, focus indicators

**Brand color never does:**
- Text for numbers, headings, labels, or body copy
- Multiple buttons on the same screen
- Borders, decorative backgrounds, or large filled areas
- Compete with semantic colors (success, danger, warning)

**Error vs. brand**: Our danger red (#EF4444) is bright and cool — visually distinct from our warm, dark brand wine. Never use brand color for error or destructive states.

### Text colors

| Token | Hex | Tailwind Class | Purpose |
|---|---|---|---|
| `--foreground` | #2C2320 | `text-foreground` | Hero numbers, primary data, key content |
| `--foreground-muted` | #6B5E54 | `text-foreground-muted` | Page headings, body text, descriptions |
| `--foreground-faint` | #A89E94 | `text-foreground-faint` | Labels, metadata, placeholders, timestamps |
| — | — | `text-white` | On dark backgrounds (buttons, tooltips) |

**Typography hierarchy rule**: Hero metrics (the biggest number on the page) get `text-foreground`. Page titles and headings get `text-foreground-muted` — they're structural, not the star. Labels get `text-foreground-faint`.

### Background and surface colors

| Token | Hex | Tailwind Class | Purpose |
|---|---|---|---|
| `--bg` | #FAF7F2 | — (set on body) | Page background — warm cream |
| `--surface` | #FFFFFF | `bg-surface` | Cards, modals, drawers, inputs — white on cream creates depth |
| `--accent-subtle` | #F5F1EB | `bg-accent-subtle` | Subtle section backgrounds |
| `--accent-light` | #EFEBE5 | `bg-accent-light` | Hover backgrounds |
| `--accent` | #2C2320 | `bg-accent` | Primary buttons, dark backgrounds |

### Border colors

| Token | Hex | Tailwind Class | Purpose |
|---|---|---|---|
| `--border` | #E4DDD5 | `border-border` | Standard borders — warm sand |
| `--border-light` | #EFEBE5 | `border-border-light` | Subtle dividers |
| — | — | `border-gray-300` | Secondary button borders |

### Interactive text colors

| Type | Tailwind Class | Examples |
|---|---|---|
| Brand / primary action | `text-brand` | "Add rule with AI", sparkle actions |
| Standard text action | `text-gray-600` | "Add step", "Back", "Skip" |
| Destructive text action | `text-danger` | "Remove", "Disconnect" |

### Semantic colors

| Token | Hex | Tailwind Class | Purpose |
|---|---|---|---|
| `--success` | #059669 | `text-success` / `bg-success` | Success states |
| `--danger` | #EF4444 | `text-danger` / `bg-danger` | Error states — bright cool red, distinct from brand |
| `--danger-light` | #FEF2F2 | `bg-danger-light` | Light destructive hover background |
| `--warn` | #F59E0B | `text-warn` / `bg-warn` | Warning states |
| — | — | `text-green-600` / `bg-green-50` | Connected/active indicators |

### Badge color pairs (use EXACT combos)

| State | Classes |
|---|---|
| Success / Active | `bg-[#d1fae5] text-[#065f46]` |
| Warning / Draft | `bg-[#fef3c7] text-[#92400e]` |
| Error / Failed | `bg-[#fee2e2] text-[#991b1b]` |
| Neutral / Disabled | `bg-border-light text-foreground-muted` |
| Brand / AI | `bg-brand-light text-brand` |

### Gray scale (warm sand family)

All grays are warm. No blue or cool undertones.

| Tailwind Class | Hex | Use |
|---|---|---|
| `gray-50` | #F7F3ED | Lightest background |
| `gray-100` | #EFEBE5 | Hover backgrounds, accent-light |
| `gray-200` | #E4DDD5 | Borders |
| `gray-300` | #D1C8BE | Secondary button borders, dividers |
| `gray-400` | #A89E94 | Placeholder text, disabled states |
| `gray-500` | #7D7368 | Secondary icons |
| `gray-600` | #6B5E54 | Body text, descriptions |
| `gray-700` | #4A3F37 | Strong secondary text |
| `gray-800` | #2C2320 | Primary text, headings |
| `gray-900` | #1A1512 | Maximum contrast |

### Chart and data visualization

- **Chart lines**: `var(--color-brand)` — brand carries the data story
- **Area fills**: Warm taupe at low opacity (`#A89E94` at 0.10-0.14) — not colored, not cool gray
- **Pre-threshold / uncertain data**: Warm taupe `#A89E94` dashed lines
- **Axis labels**: `var(--text-tertiary)`
- **Gridlines**: `var(--border-light)`
- **Tooltips**: `var(--text-primary)` background with white text

---

## Spacing

Use Tailwind's spacing scale. Common values:

| Tailwind | Pixels | Common use |
|----------|--------|------------|
| `p-1` / `gap-1` | 4px | Tight gaps |
| `p-1.5` / `gap-1.5` | 6px | Badge padding |
| `p-2` / `gap-2` | 8px | Icon gaps |
| `p-2.5` / `gap-2.5` | 10px | Small spacing |
| `p-3` / `gap-3` | 12px | Input padding, compact rows |
| `p-4` / `gap-4` | 16px | Standard card padding |
| `p-5` / `gap-5` | 20px | Logo gaps |
| `p-6` / `gap-6` | 24px | Section spacing |
| `p-8` / `gap-8` | 32px | Card padding, large spacing |
| `p-10` / `gap-10` | 40px | Section padding |
| `p-12` / `gap-12` | 48px | Page padding |
| `p-16` | 64px | Large sections |
| `p-20` | 80px | Landing page side margins |
| `p-20` | 80px | Hero spacing |

**Never** use arbitrary spacing values like `p-[11px]` or `m-[23px]`. Stick to the Tailwind scale.

---

## Border Radius

| Tailwind Class | Value | Use case |
|---------------|-------|----------|
| `rounded-sm` | 6px | Tabs, small buttons, chips |
| `rounded-md` | 10px | Inputs, cards, standard buttons |
| `rounded-lg` | 14px | Panels, list containers |
| `rounded-xl` | 20px | Modals, prominent cards |
| `rounded-full` | 9999px | Pill badges, avatars |

---

## Header

**Icon**: 24×24px (uses viewBox scaling from 28×28 SVG)
**Height**: 44px total (10px vertical padding + 24px icon)
**Horizontal padding**: 48px (matches main content)

| Page type | Logo variant | Positioning | Behavior |
|---|---|---|---|
| **Landing** | `full` (icon + "Vincor AI") | Static (normal flow) | Acts as a section — content starts after it |
| **Internal** (strategy, connection, dashboard) | `mark` (icon only) | `position: absolute` | Infrastructure — content flows from top independently, header floats in corner |

**Content top padding is independent of the header.** The main content uses `padding-top: 2rem` (32px) as its own comfortable breathing room — not calculated from the header height. The header and content are separate design tokens. This matches Stripe (32px), Mercury (32px), and Linear (24px) benchmarks.

---

## Shadows

| Tailwind Class | Use case |
|---------------|----------|
| `shadow-xs` | Button resting state |
| `shadow-sm` | Cards, containers |
| `shadow-md` | Hover elevation, dropdowns |
| `shadow-lg` | Tooltips |
| `shadow-xl` | Modals |
| `shadow-glow` | Input focus ring |

---

## Layout Patterns

### Page container
```
max-w-[820px] mx-auto px-8 py-12 pb-16
```
Mobile: `px-5` at 480px, `px-6` at 768px

### Full-height page
```
min-h-screen flex flex-col
```

### Centered hero section
```
flex-1 flex items-center justify-center px-12
```

### Card grid (responsive)
```
grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6
```

### Sidebar + content
```
grid grid-cols-[280px_1fr]
```
Collapse at 768px: `flex flex-col`

### Flex row with wrapping
```
flex flex-wrap gap-5
```

---

## Component Recipes

### Button sizes — 3 sizes only

| Size | Padding | Font | Radius | Width | Use |
|---|---|---|---|---|---|
| **Large** | `py-3.5 px-8` | 16px (`text-base`) semibold | `rounded-md` | `min-w-[200px]` on page, `w-full` in modals | Page CTAs (brand filled), modal confirms (brand outlined) |
| **Medium** | `py-2 px-4` | 13px (`text-[13px]`) semibold | `rounded-sm` | `min-w-[120px]` | Section-level actions: "Map Fields", "Generate Script", inline form actions |
| **Small** | `py-1 px-2.5` | 11px (`text-[11px]`) semibold | `rounded-sm` | Content-width (no minimum) | Utility actions: "Copy", "Reveal", compact triggers |

**Width rules:**
- Large buttons on a page: `min-w-[200px]` — ensures CTA presence regardless of label length
- Large buttons inside a modal or card: `w-full` — fills the container
- Medium buttons: `min-w-[120px]` — prevents tiny pill appearance
- Small buttons: no minimum — utility actions should be compact

**No in-between sizes.** Every button must be one of these three.

### Large button variants (use CTAButton component)

**Primary** (dark):
```
inline-flex items-center justify-center min-w-[200px] px-8 py-3.5 text-base font-semibold rounded-md bg-accent text-white hover:-translate-y-px hover:shadow-md
```

**Brand** (Pure Wine — page CTA, one per screen max):
```
inline-flex items-center justify-center min-w-[200px] px-8 py-3.5 text-base font-semibold rounded-md bg-brand text-white hover:-translate-y-px hover:shadow-md
```

**Brand outline** (modal confirms — prominent but not filled):
```
w-full py-3.5 text-base font-semibold rounded-md bg-surface text-brand border-2 border-brand hover:-translate-y-px hover:shadow-md
```

**Secondary** (outlined):
```
inline-flex items-center justify-center min-w-[200px] px-8 py-3.5 text-base font-semibold rounded-md bg-surface text-foreground border border-border hover:bg-accent-subtle
```

### Medium button
```
inline-flex items-center justify-center min-w-[120px] py-2 px-4 text-[13px] font-semibold rounded-sm bg-surface text-foreground border border-border hover:bg-accent-subtle
```

### Small button
```
inline-flex items-center justify-center py-1 px-2.5 text-[11px] font-semibold rounded-sm bg-surface text-foreground-muted border border-border hover:bg-accent-subtle hover:text-foreground
```

### Container surfaces (inside drawers/panels)

| Type | Treatment | Padding | Use |
|---|---|---|---|
| **User controls** (dropdowns, steppers, selectable cards) | `bg-surface border border-border` | varies by control | Interactive elements the user changes |
| **Computed context** (eligibility, pacing, summaries) | `bg-accent-subtle rounded-lg` | `py-3 px-4` | System-derived data, should recede |
| **Floating popovers** (dropdown menus) | `bg-surface border border-border shadow-md` | `py-1` | Temporary overlays |

**Rule**: Computed context recedes (subtle bg, no border). User controls pop (white, bordered). Never invert this.

### Card
```
bg-surface border border-border rounded-lg shadow-sm overflow-hidden
```

### Form Input
```
w-full px-3.5 py-3 border-[1.5px] border-border rounded-md text-[15px] bg-surface text-foreground transition-all duration-200 ease-out focus:border-accent focus:shadow-glow
```

### Badge (use Badge component with CVA)
```
inline-flex items-center px-3 py-1 text-[11px] font-semibold rounded-full whitespace-nowrap
```

### Modal
- Overlay: `fixed inset-0 bg-black/50 flex items-center justify-center animate-fade-in`
- Box: `max-w-[520px] w-full rounded-xl shadow-xl animate-modal-slide`

### Spinner
```
w-5 h-5 border-[2.5px] border-border border-t-accent rounded-full animate-spin
```

### Skeleton loading
```
bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%] animate-shimmer rounded-md
```

---

## Interactive States

### Hover patterns
- Primary button: `hover:-translate-y-px hover:shadow-md`
- Card: `hover:shadow-md hover:-translate-y-px`
- List row: `hover:bg-accent-subtle`
- Link text: `hover:text-foreground`
- Icon button: `hover:bg-accent-light`

### Disabled states
- Button: `disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-gray-300`
- Input: `disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-50`

### Focus states
- Buttons: `focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2`
- Inputs: `focus:border-accent focus:shadow-glow`

### Active/selected states
- Nav item: `border-l-[3px] border-l-brand text-brand bg-accent-light font-semibold`
- Tab: `border-b-2 border-b-accent text-foreground font-medium`
- Toggle on: `bg-brand`
- Toggle off: `bg-gray-300`

### Loading states
- Replace content with spinner (see Spinner recipe above)
- Or use skeleton placeholder (see Skeleton recipe above)
- Disable interactions with `pointer-events-none opacity-60`

---

## Animations

| Tailwind Class | Use case |
|---------------|----------|
| `animate-page-enter` | Page entrance (fade up) |
| `animate-fade-in` | Simple fade in |
| `animate-modal-slide` | Modal entrance (slide down + scale) |
| `animate-msg-in` | Chat message entrance |
| `animate-spin` | Loading spinners |
| `animate-pulse` | Skeleton breathing |
| `animate-shimmer` | Skeleton loading bars |
| `animate-tooltip-fade-in` | Tooltip appearance |

---

## Transitions

| Tailwind Classes | Duration | Use case |
|-----------------|----------|----------|
| `duration-150 ease-out` | 0.15s | Fast interactions (color, border, opacity) |
| `duration-200 ease-out` | 0.2s | Standard interactions (buttons, inputs, cards) |
| `duration-300 ease-out` | 0.3s | Slower transitions (progress bars, expandables) |

Always pair with `transition-all` or specific properties (`transition-colors`, `transition-transform`, etc.)

---

## Responsive Breakpoints

| Tailwind Prefix | Breakpoint | Behavior |
|----------------|------------|----------|
| (default) | < 480px | Mobile: smaller text, tight padding |
| `sm:` | ≥ 480px | Small mobile: slightly more room |
| `md:` | ≥ 768px | Tablet: two-column layouts, sidebars |
| `lg:` | ≥ 1024px | Desktop: full layouts |
| `xl:` | ≥ 1200px | Wide desktop: max column widths |

---

## Accessibility

- **Focus visible**: Every interactive element must have a visible focus ring
- **Color contrast**: Text on colored backgrounds must meet WCAG AA (4.5:1 for body, 3:1 for large text)
- **Touch targets**: Minimum 44x44px for mobile tap targets
- **Reduced motion**: Wrap animations in `motion-safe:` when possible

---

## Design Philosophy

1. **Warm everything** — no cool grays, no blue undertones. The entire palette is warm cream/sand/taupe. Pure Wine (#66001F) is the most saturated member of the same warm family, not a foreign accent.
2. **Spacious over cramped** — use more padding when in doubt
3. **Brand color is rare** — Pure Wine has exactly 3 jobs (primary CTA, chart lines, active states). Maximum ~3-5 brand moments per screen. Restraint signals premium.
4. **Text is never brand-colored** — numbers, headings, body text are always in the warm neutral hierarchy. The brand speaks through UI controls and data visualization, not typography.
5. **Warm brown-black (#2C2320) as the primary accent** — for buttons, strong text, tooltips
6. **Subtle soft shadows** — never heavy drop shadows
7. **Every interactive element gets a transition** (duration-200 ease-out)
8. **Focus states on everything** — never remove outlines without replacing them
9. **Mobile-first** — design for small screens, enhance for large
