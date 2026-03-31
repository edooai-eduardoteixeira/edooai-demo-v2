# Design Guidelines

These are **rules** — not suggestions. Follow them exactly for all CSS and UI work in this project.

## Brand Identity

**Name**: Vincor (not "Vincor AI" — dropped "AI" for brand confidence)
**Logo**: Custom crystalline/crown mark + "Vincor" in Playfair Display serif
**Brand color**: Pure Wine #66001F — a pure, zero-brown wine red
**Font system**: Playfair Display (brand/display) + Inter (product UI)

**Personality**: Premium, confident, warm. Think Cartier meets Stripe — luxury meets fintech. The product is an agentic referral engine. The design should feel calm, intelligent, and inevitable.

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
| `text-[48px]` | 48px | Landing hero (desktop) — Inter |
| `text-[56px]` | 56px | Landing hero (desktop) — Playfair Display (size-compensated) |
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

**Landing page exception:** The hero headline uses `text-brand` in Playfair Display (`font-display text-[56px]`). The landing IS the brand moment — the headline speaks in the brand voice. This is the only place brand color appears as text.

**Brand color never does (in the product UI):**
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

Always use the `<Chart>` component (`src/components/Chart.jsx`). Never hand-code SVG charts. The component enforces all specs below automatically.

**Line:**
- Color: `var(--color-brand)` — brand carries the data story
- Thickness: 2px
- Interpolation: monotone cubic (smooth curves through data points)
- Caps/joins: round

**Area fills** (opt-in via `fill` prop):
- `var(--color-brand)` at 7% opacity — subtle brand tint
- Gradient fades to 0% at 60% height

**Pre-threshold / uncertain data**: Warm taupe `#A89E94` dashed lines (opt-in via `threshold` prop)

**Axes and gridlines:**
- Axis labels: 11px Inter, `var(--text-tertiary)`, tabular numerals, rendered as HTML (not SVG) for consistent sizing
- Gridlines: dashed, `var(--border-light)`, 0.45 opacity — barely visible
- No X-axis baseline — gridlines are sufficient
- Y-axis values: compact formatting for 1000+ (e.g. "1.4k")

**Endpoint:**
- Dot: 3.5px radius, `var(--color-brand)`, always visible
- Label: opt-in via `endpointLabel` prop, 11px semibold brand color

**Tooltip (on hover):**
- Background: `var(--text-primary)`, white text, 8px border-radius, soft shadow
- Hover dot: hollow (white fill, brand stroke, 4px radius)
- Crosshair: dashed vertical line, `var(--color-gray-300)`
- Flips below the point when near the chart top edge
- Multi-series: shows all values with colored circles

**Legend** (opt-in via `legend` prop):
- Position: above chart, right-aligned, normal flow (not absolute)
- Format: 6px colored circle + 11px muted label, 16px gap between items

**Sizing:**
- Default: chart determines its own height from the viewBox aspect ratio
- `cssHeight` prop (e.g., `"100%"`, `"300px"`): chart fills the specified height, adjusting its internal coordinate system to match. No distortion — uniform scaling preserved. Use for dashboard layouts where the container dictates the size.

**Animation:**
- Line draws left-to-right (600ms ease-out)
- Area fills fade in (300ms)
- Endpoint dot fades in (200ms, 400ms delay)
- Threshold charts: fade in (500ms)

**Multi-series** (via `series` prop):
- First series is primary (gets area fill, endpoint dot, animation)
- Secondary series render as supporting lines
- Each series: `{ data, color, dashed, dotted, width, opacity, label }`
- Cohort charts: use warm gray sequential palette (gray-300 → gray-800 → brand)

**Funnel charts:**
Always use the `<FunnelChart>` component (`src/components/FunnelChart.jsx`).
- Left-aligned horizontal bars
- Stage label above each bar (11px, medium weight)
- Number outside bar, right side (13px, semibold)
- 4px border-radius, 8px gap between bars
- Last stage uses `bg-brand` with white text
- Square root proportion for bar width (handles extreme value ratios like 600:1)

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
| `p-20` | 80px | Landing hero top padding |

**Never** use arbitrary spacing values like `p-[11px]` or `m-[23px]`. Stick to the Tailwind scale.

### Landing page spacing

| Element | Spacing | Tailwind | Rationale |
|---|---|---|---|
| Header bottom margin | 24px | `mb-6` | Same as all pages |
| Hero section top | 80px | `pt-20` | Fixed distance from header — not vertically centered |
| Headline → subtitle | 32px | `mb-8` | Unified hero message — tight coupling |
| Subtitle → CTA | 40px | `mb-10` | Visual pause before the action |
| Hero text max-width | 660px | `max-w-[660px]` | Leaves room for visual card (280px) + gap (~64px) |

**Subtitle line break**: On desktop (`lg:`), a responsive `<br>` splits the subtitle at the sentence boundary (one thought per line). On mobile, the `<br>` is hidden and text flows naturally. This is a semantic break between two distinct messages, not a brittle word-level break.

### Landing page hero layout

Text left, animated visual right. The visual is absolutely positioned — it doesn't affect page flow, scroll, or footer position.

```
section: pt-20 relative
  main: max-w-[660px] w-full (headline + subtitle + CTA)
  HeroVisual: absolute bottom-0 right-0 hidden lg:block
```

**Visual card positioning**: `absolute bottom-0 right-0` — card bottom aligns with CTA bottom, creating a shared baseline that closes the composition. Hidden below `lg` breakpoint (1024px).

**Visual card surface**: `bg-accent-subtle rounded-xl` — not `bg-surface`. White cards pop; the visual should recede. No shadow, no border.

**Visual card height**: Fixed (`h-[160px]` list area). Content animates inside the container. The card never expands or shifts the layout.

**Landing page text hierarchy**:

| Element | Classes | Rationale |
|---|---|---|
| Headline | `font-display text-[56px] font-bold text-brand` | The brand moment — only place brand is text |
| Subtitle | `text-[22px] font-medium text-foreground` | Primary readable text, explains value prop |
| Footer | `text-[15px] font-normal text-foreground-faint` | Mission line, recedes |

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

The header sits inside the page container (see Layout Patterns) in **normal flow** — it takes its height, content starts after it. No absolute positioning.

| Page type | Logo variant | Behavior |
|---|---|---|
| **Landing** | `full` (icon + "Vincor") | Full logo with Playfair Display wordmark |
| **Internal** (strategy, connection, dashboard) | `mark` (icon only) | Mark only, same size as landing icon |

**Logo always aligns with content** because both share the same container and padding. Never position the header separately from the content container.

**Header bottom margin**: `mb-6` (24px) on all pages — consistent breathing room between logo and first content.

### Sidebar layout (connection page)

The sidebar is a layout variant, not an exception to the design system.

- Sidebar width: **280px** (fixed column in a CSS grid: `grid-cols-[280px_1fr]`)
- Sidebar sits **inside** the shared `max-w-[1100px] px-12` container
- Sidebar content aligns with the logo — **no extra left padding** on the sidebar
- Sidebar has `border-r border-border-light` to separate from main content
- Active nav items use `border-l-[3px] border-l-brand` + `text-brand`
- Sidebar is **contextual** (setup wizard), not permanent navigation — stays neutral, not branded
- Sidebar title uses `text-sm font-medium text-foreground-muted` — orients without competing with main column headings

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

### Page container — consistent across ALL pages
```
max-w-[1100px] mx-auto px-12 w-full
```

| Token | Value | Rule |
|---|---|---|
| Max-width | `max-w-[1100px]` | Same on every page — never varies |
| Side padding | `px-12` (48px) | Same on every page — header and content share this |
| Centering | `mx-auto w-full` | Always centered |

**The header sits inside the same max-width container as the content.** This ensures the logo left edge always aligns with the content left edge regardless of screen width. Never position the header at the viewport edge with a different padding.

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

### Agent status indicator
Used to show an autonomous agent is actively operating. Brand color only on the dot (active state). Everything else neutral.

**Dot** (8px, solid brand):
```
w-2 h-2 rounded-full bg-brand
```

**Pulse ring** (8px, border-only, scales outward and fades):
```
w-2 h-2 rounded-full border-[1.5px] border-brand animate-[agent-glow_2s_ease-out_infinite]
```

**Status text**:
```
text-[13px] font-semibold text-foreground
```

**Container** (wraps dot + text):
```
flex items-center gap-2.5
```

See `agent-glow` keyframe in `src/styles/global.css`.

### Form Input
```
w-full px-3.5 py-3 border-[1.5px] border-border rounded-md text-[15px] bg-surface text-foreground transition-all duration-200 ease-out focus:border-accent focus:shadow-glow
```

### Badge (use Badge component with CVA)
```
inline-flex items-center px-3 py-1 text-[11px] font-semibold rounded-full whitespace-nowrap
```

### Modal (use Modal component — `src/components/Modal.jsx`)

Always use the `<Modal>` component. Never build one-off modal markup.

| Element | Spec |
|---|---|
| Overlay | `fixed inset-0 bg-black/40 z-[100] animate-fade-in` |
| Box | `bg-surface rounded-xl shadow-xl animate-modal-slide` |
| Box width | `max-w-[440px]` default, `max-w-[680px]` wide (pass `wide` prop) |
| Padding | `pt-10 px-8 pb-6` (generous top for close button, tighter bottom) |
| Close button | `absolute top-5 right-5 w-8 h-8` |
| Header | Use `<Modal.Header icon={} title="" subtitle="" />` |
| Footer | Use `<Modal.Footer securityText="">` wrapping the confirm button |
| Confirm button | Brand-outlined: `w-full bg-surface text-brand border-2 border-brand` |
| Dismiss | Click overlay or X button — both call `onClose` |

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
- Agent status: `bg-brand` dot (8px) + `border-brand` pulse ring (see Agent status indicator recipe)

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
| `agent-glow` (via `animate-[agent-glow_2s_ease-out_infinite]`) | Agent status pulse ring — sonar/radar pattern |

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

---

## File References

- Design tokens: `src/styles/global.css` @theme block
- Logo component: `src/components/Logo.jsx`
- Button component: `src/components/CTAButton.jsx`
- Modal component: `src/components/Modal.jsx`
- Brand mark: `public/vincor svg.svg`
- Hero visual: `src/components/HeroVisual.jsx`
- Chart component: `src/components/Chart.jsx`
- Funnel chart component: `src/components/FunnelChart.jsx`
