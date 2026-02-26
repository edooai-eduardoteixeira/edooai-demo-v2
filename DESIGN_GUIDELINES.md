# Design Guidelines

These are **rules** — not suggestions. Follow them exactly for all CSS and UI work in this project.

---

## Typography

**Font**: `'Inter'` with system fallbacks (defined in `global.css` as `--font-family`)

**Base**: 15px, line-height 1.6

**Allowed font sizes** (use ONLY these):

| Size | Use case |
|------|----------|
| 11px | Tiny labels, uppercase headers |
| 12px | Captions, badges, source labels |
| 13px | Compact text, table cells |
| 14px | Buttons, inputs, secondary content |
| 15px | Body text |
| 16px | Subheadings |
| 17px | Section titles |
| 18px | Modal titles |
| 22px | Section page titles |
| 24px | Large headers |
| 28px | Page h1 |
| 32px | Hero stats |

**Allowed font weights** (use ONLY these):

| Weight | Use case |
|--------|----------|
| 400 | Body text, descriptions |
| 500 | Buttons, nav items |
| 600 | Card titles, badges, labels |
| 700 | Headings |
| 800 | Hero numbers only |

**Letter spacing**:
- `-0.03em` for h1
- `-0.02em` for h2
- `-0.01em` for card titles and buttons
- `0` for body text
- `0.05em` for uppercase labels

**Uppercase labels**: Always `11px`, `font-weight: 600–700`, `letter-spacing: 0.05em`, `color: var(--text-tertiary)`

---

## Colors

**NEVER use raw hex colors** for text, backgrounds, borders, or accents. Always use CSS variables from `global.css`.

### Text
- `var(--text-primary)` — headings, important text
- `var(--text-secondary)` — descriptions, body
- `var(--text-tertiary)` — metadata, placeholders, disabled

### Backgrounds
- `var(--bg)` — page background
- `var(--surface)` — cards, modals, inputs
- `var(--accent-subtle)` — subtle section backgrounds
- `var(--accent-light)` — hover backgrounds

### Borders
- `var(--border)` — standard borders
- `var(--border-light)` — subtle dividers

### Accent
- `var(--accent)` — primary buttons, main actions
- `var(--accent-hover)` — hover state for primary actions

### Semantic badge color pairs (use these EXACT combos):

| State | Background | Text color |
|-------|-----------|------------|
| Success / Active | `#d1fae5` | `#065f46` |
| Warning / Draft | `#fef3c7` | `#92400e` |
| Error / Failed | `#fee2e2` | `#991b1b` |
| Info / Sent | `#dbeafe` | `#1e40af` |
| Neutral / Disabled | `var(--border-light)` | `var(--text-secondary)` |

---

## Spacing

**Allowed values ONLY**: 2px, 4px, 6px, 8px, 10px, 12px, 14px, 16px, 18px, 20px, 24px, 28px, 32px, 36px, 40px, 48px, 64px, 80px

Never invent values like 11px, 23px, or 37px.

### Common patterns
- **Buttons**: `9px 18px` (standard), `5px 12px` (small), `14px 28px` (large)
- **Inputs**: `12px 14px`
- **Cards**: `20px 24px`
- **Page container**: `48px 32px 64px`, `max-width: 820px`, centered

---

## Border Radius

| Token | Value | Use case |
|-------|-------|----------|
| `var(--radius-sm)` | 6px | Tabs, small buttons, chips |
| `var(--radius-md)` | 10px | Inputs, cards, standard buttons |
| `var(--radius-lg)` | 14px | Panels, list containers |
| `var(--radius-xl)` | 20px | Modals, prominent cards |
| `100px` or `var(--radius-full)` | 9999px | Pill badges |

---

## Shadows

| Token | Use case |
|-------|----------|
| `var(--shadow-xs)` | Button resting state |
| `var(--shadow-sm)` | Cards, containers |
| `var(--shadow-md)` | Hover elevation, dropdowns |
| `var(--shadow-lg)` | Tooltips |
| `var(--shadow-xl)` | Modals |
| `var(--shadow-glow)` | Input focus ring |

---

## Component Recipes

### Default Button
```css
display: inline-flex;
align-items: center;
gap: 6px;
padding: 9px 18px;
border: 1px solid var(--border);
border-radius: var(--radius-md);
font-size: 14px;
font-weight: 500;
background: var(--surface);
color: var(--text-primary);
transition: all 0.2s ease;
box-shadow: var(--shadow-xs);
```
**Hover**: `background: var(--bg)`, `box-shadow: var(--shadow-sm)`

### Primary Button
```css
background: var(--accent);
color: #ffffff;
border-color: var(--accent);
box-shadow: var(--shadow-sm), 0 1px 2px rgba(0,0,0,0.15);
```
**Hover**: `background: var(--accent-hover)`, `transform: translateY(-1px)`, `box-shadow: var(--shadow-md)`

### Card
```css
background: var(--surface);
border: 1px solid var(--border);
border-radius: var(--radius-lg);
box-shadow: var(--shadow-sm);
overflow: hidden;
```

### Form Input
```css
padding: 12px 14px;
border: 1.5px solid var(--border);
border-radius: var(--radius-md);
font-size: 15px;
background: var(--surface);
color: var(--text-primary);
transition: all 0.2s ease;
```
**Focus**: `border-color: var(--accent)`, `box-shadow: var(--shadow-glow)`

### Modal
- Overlay: `rgba(0,0,0,0.5)` with `fadeIn 0.2s`
- Box: `max-width: 520px`, `border-radius: var(--radius-xl)`, `box-shadow: var(--shadow-xl)`
- Animation: `modalSlide 0.3s cubic-bezier(0.16, 1, 0.3, 1)`

### Table
- `th`: 11px uppercase, `letter-spacing: 0.05em`, `font-weight: 600`, `color: #6b7280`
- `td`: 13px
- Row hover: `background: #f9fafb`

### Empty State
- Centered, `padding: 80px 40px`
- `border-radius: var(--radius-xl)`
- Background gradient from `var(--surface)` to `var(--accent-subtle)`
- `box-shadow: var(--shadow-md)`

### Skeleton Loading
```css
background: linear-gradient(90deg, #e5e5e5 25%, #f0f0f0 50%, #e5e5e5 75%);
background-size: 200% 100%;
animation: shimmer 1.8s infinite linear;
```

### Spinner
```css
width: 20px;
height: 20px;
border: 2.5px solid var(--border);
border-top-color: var(--accent);
border-radius: 50%;
animation: spin 0.7s linear infinite;
```

---

## Transitions

| Duration | Use case |
|----------|----------|
| `var(--transition-fast)` / 0.15s ease | Fast interactions (color, border, opacity) |
| `var(--transition-base)` / 0.2s ease | Standard interactions (buttons, inputs, cards, hover) |
| `var(--transition-slow)` / 0.3s ease | Progress bars |
| `0.8s cubic-bezier(0.16, 1, 0.3, 1)` | Dramatic fills (pipeline bars) |

### Hover patterns
- Primary button: `translateY(-1px)`
- Chips: `translateY(-1px)`, border becomes `var(--accent)`
- List row: `background: var(--accent-subtle)`
- Page entry: `animation: pageEnter 0.4s ease`

---

## Responsive Breakpoints

| Breakpoint | Behavior |
|------------|----------|
| `max-width: 480px` | Extra-small mobile: reduce page padding, h1 to 22px |
| `max-width: 640px` | Form rows collapse to single column |
| `max-width: 768px` | Two-column layouts stack, sidebars go below main |
| `max-width: 900px` | Collapse sidebars, simplify grids |
| `max-width: 1200px` | Reduce grid columns (4 → 2) |

---

## Design Philosophy

1. **Spacious over cramped** — use more padding when in doubt
2. **Color only for semantics** (success, error, warning) — never decorative
3. **Black (#1a1a1a) as the primary accent** — not blue or purple
4. **Subtle soft shadows** — never heavy drop shadows
5. **Every interactive element gets a transition** at 0.2s ease
6. **Focus states**: `outline: 2px solid var(--accent); outline-offset: 2px` (or `box-shadow: var(--shadow-glow)` for inputs)
