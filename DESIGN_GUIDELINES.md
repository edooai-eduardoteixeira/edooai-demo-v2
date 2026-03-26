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
| `text-[48px]` | 48px | Landing hero (desktop) |

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

**NEVER use raw hex colors.** Always use Tailwind color classes.

### Text colors

| Tailwind Class | Purpose |
|---------------|---------|
| `text-foreground` | Headings, important text |
| `text-foreground-muted` | Descriptions, body text |
| `text-foreground-faint` | Metadata, placeholders, disabled |
| `text-white` | On dark backgrounds |
| `text-black` | Maximum contrast |

### Background colors

| Tailwind Class | Purpose |
|---------------|---------|
| `bg-white` | Page background |
| `bg-surface` | Cards, modals, inputs |
| `bg-accent-subtle` | Subtle section backgrounds |
| `bg-accent-light` | Hover backgrounds |
| `bg-accent` | Primary buttons, dark backgrounds |

### Border colors

| Tailwind Class | Purpose |
|---------------|---------|
| `border-border` | Standard borders |
| `border-border-light` | Subtle dividers |
| `border-gray-300` | Secondary button borders |

### Semantic colors

| Tailwind Class | Purpose |
|---------------|---------|
| `text-success` / `bg-success` | Success states |
| `text-danger` / `bg-danger` | Error states |
| `text-warn` / `bg-warn` | Warning states |
| `text-green-600` / `bg-green-50` | Connected/active indicators |

### Badge color pairs (use EXACT combos)

| State | Classes |
|-------|---------|
| Success / Active | `bg-[#d1fae5] text-[#065f46]` |
| Warning / Draft | `bg-[#fef3c7] text-[#92400e]` |
| Error / Failed | `bg-[#fee2e2] text-[#991b1b]` |
| Info / Sent | `bg-[#dbeafe] text-[#1e40af]` |
| Neutral / Disabled | `bg-border-light text-foreground-muted` |

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

### Primary Button (use CTAButton component)
```
inline-flex items-center justify-center px-8 py-3.5 text-base font-semibold rounded-md bg-black text-white transition-all duration-200 ease-out
```

### Secondary Button
```
inline-flex items-center justify-center px-8 py-3.5 text-base font-semibold rounded-md bg-white text-black border border-gray-300 transition-all duration-200 ease-out
```

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
- Nav item: `border-l-[3px] border-l-black bg-accent-light font-semibold`
- Tab: `border-b-2 border-b-accent text-foreground font-medium`

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

1. **Spacious over cramped** — use more padding when in doubt
2. **Color only for semantics** (success, error, warning) — never decorative
3. **Black (#1a1a1a) as the primary accent** — not blue or purple
4. **Subtle soft shadows** — never heavy drop shadows
5. **Every interactive element gets a transition** (duration-200 ease-out)
6. **Focus states on everything** — never remove outlines without replacing them
7. **Mobile-first** — design for small screens, enhance for large
