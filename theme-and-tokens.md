# Theme & design tokens reference

**Source of truth:** `src/styles/globals.css`  
**Runtime:** `<html data-theme="light|dark" data-palette="…">`  
**React:** `useTheme()` from `@/context/ThemeContext`  
**Storage:** `uchenab-theme`, `uchenab-palette` in `localStorage`

Use this file to reproduce Uchenab styling in new components, Figma specs, or AI prompts without re-reading the full CSS.

---

## 1. Architecture

```
index.html (inline script)  →  sets data-theme / data-palette on <html> (FOUC guard)
ThemeProvider (client)    →  syncs state + localStorage
globals.css               →  :root + [data-theme] + [data-palette] overrides
Components                →  class names + var(--token)
```

**Tailwind:** `@import "tailwindcss"` is present; the app shell is primarily **custom CSS classes**. Tailwind utilities are sparse — prefer tokens below.

---

## 2. Global CSS variables

### 2.1 Spacing & layout

| Token | Default | Usage |
|-------|---------|--------|
| `--space-3` | `12px` | Dashboard padding rhythm (`.page`, `.card-pad`, gaps) |
| `--sidebar-w` | `232px` | Expanded sidebar |
| `--sidebar-w-collapsed` | `58px` | Collapsed rail |
| `--header-h` | `52px` | Topbar height |
| `--radius` | `6px` | Buttons, inputs, nav items |
| `--radius-lg` | `10px` | Cards, table wrap, landing steps |

### 2.2 Surfaces (default palette, light)

| Token | Light value | Role |
|-------|-------------|------|
| `--bg` | `#fafaf9` | Page background |
| `--bg-sunk` | `#f4f4f2` | Sidebar, recessed panels |
| `--bg-elev` | `#ffffff` | Cards, inputs, elevated UI |
| `--bg-hover` | `#f4f4f2` | Hover states |
| `--border` | `rgba(20,20,19,0.08)` | Default borders |
| `--border-strong` | `rgba(20,20,19,0.16)` | Emphasized borders |

### 2.3 Text (default palette, light)

| Token | Light value | Role |
|-------|-------------|------|
| `--text` | `#18181b` | Primary text |
| `--text-2` | `#52525b` | Secondary body |
| `--text-3` | `#8a8a93` | Labels, table headers |
| `--text-4` | `#b8b8bd` | Placeholders, disabled hints |

### 2.4 Brand & actions (default palette, light)

| Token | Light value | Role |
|-------|-------------|------|
| `--accent` | `oklch(53% 0.18 257)` | Primary brand blue |
| `--accent-2` | accent @ 10% | Focus rings, selected rows |
| `--accent-strong` | `oklch(46% 0.18 257)` | Hover on accent buttons |
| `--accent-fg` | `#fff` (fallback) | Text on accent buttons |
| `--success` | `oklch(58% 0.13 150)` | Positive status |
| `--success-bg` | success @ 10% | Badge backgrounds |
| `--warn` | `oklch(70% 0.14 75)` | Warning / negotiation |
| `--warn-bg` | warn @ 14% | Badge backgrounds |
| `--danger` | `oklch(58% 0.19 25)` | Errors, destructive |
| `--danger-bg` | danger @ 10% | Badge backgrounds |
| `--violet` | `oklch(56% 0.18 305)` | Secondary accent / in-progress status |
| `--violet-bg` | violet @ 10% | Badge backgrounds |

### 2.5 Shadows (light)

| Token | Value |
|-------|--------|
| `--shadow-sm` | `0 1px 2px rgba(20,20,19,0.04)` |
| `--shadow-md` | `0 4px 16px …, 0 1px 2px …` |
| `--shadow-lg` | `0 12px 40px …, 0 2px 6px …` |

### 2.6 Chrome-specific

| Token | Light | Role |
|-------|-------|------|
| `--nav-item-hover` | `rgba(0,0,0,0.045)` | Sidebar nav hover |
| `--topbar-bg` | `rgba(250,250,249,0.88)` | Topbar + backdrop blur |
| `--nav-sticky-bg` | `rgba(250,250,249,0.78)` | Landing nav |
| `--brand-mark-bg` | `#18181b` | Logo mark square |
| `--brand-mark-fg` | `#ffffff` | Logo mark icon |
| `--skel-mid` | `#ececea` | Skeleton shimmer mid-tone |

### 2.7 Semantic inversion (theme-aware)

Use for blocks that invert against the page (NOT `background: var(--text); color: #fff` alone).

| Token | Light | Dark (default) |
|-------|-------|----------------|
| `--emphasis-bg` | `var(--text)` → dark | `oklch(94% 0.015 95)` → light |
| `--on-emphasis` | `#ffffff` | `oklch(18% 0.02 95)` |

**Used by:** `.quote-block`, `.price-card.featured::before`, `.chat-bubble.user`

### 2.8 Document / paper preview

| Token | Light | Dark (default) |
|-------|-------|----------------|
| `--paper-bg` | `#ffffff` | `oklch(31% 0.012 95)` |
| `--paper-text` | `#1a1a1a` | `oklch(94% 0.008 95)` |
| `--paper-text-muted` | `#666666` | `oklch(72% 0.012 95)` |
| `--paper-text-subtle` | `#555555` | `oklch(68% 0.012 95)` |
| `--paper-hl` | `oklch(96% 0.06 95)` | `oklch(52% 0.1 75)` |

**Used by:** `.doc-mock` (landing), consider for `.doc-page` when theming document studio

### 2.9 Default palette — dark mode overrides

When `[data-theme="dark"]` (palette `default`), surfaces flip to warm dark stone; text becomes light. Key values:

| Token | Dark (default) |
|-------|----------------|
| `--bg` | `oklch(23% 0.012 95)` |
| `--bg-sunk` | `oklch(19% 0.012 95)` |
| `--bg-elev` | `oklch(27% 0.012 95)` |
| `--text` | `oklch(96% 0.008 95)` |
| `--accent` | `oklch(62% 0.15 257)` |
| `--brand-mark-bg` | `oklch(58% 0.16 257)` |

**Dark-only component tweaks** in globals.css: `.btn-primary`, `.submit-btn`, sidebar/nav icon colors, scrollbars, `.seg`, `.toast`, etc.

---

## 3. Color palettes

Set via `data-palette` on `<html>`. Each palette overrides the token set for both light and dark.

| ID | Name | Character |
|----|------|-----------|
| `default` | Default | Stone neutrals + blue accent |
| `indigo-gold` | Indigo Gold | Indigo surfaces, gold primary in dark |
| `cosmic-night` | Cosmic Night | Violet / space tones |
| `vercel` | Vercel | High-contrast monochrome |
| `midnight-bloom` | Midnight Bloom | Charcoal + violet primary |

Definitions: `src/lib/themes/palettes.ts`  
Full variable blocks: `globals.css` sections `/* Indigo Gold */`, `/* Cosmic Night */`, etc.

Optional chart tokens on some palettes: `--chart-1` … `--chart-5`

---

## 4. Typography

### 4.1 Font families

```css
/* UI */
font-family: "Geist", ui-sans-serif, system-ui, -apple-system, sans-serif;

/* Mono / numbers / IDs */
font-family: "Geist Mono", ui-monospace, SFMono-Regular, Menlo, monospace;
```

Body: **13.5px**, line-height **1.45**, `font-feature-settings: "ss01", "cv11"`  
Mono: `font-feature-settings: "zero"` on `.mono`, `code`, `kbd`

Ensure Geist / Geist Mono are loaded in your deployment (referenced by name in CSS).

### 4.2 Type scale (dashboard)

| Class | Size | Weight | Extra |
|-------|------|--------|-------|
| (body) | 13.5px | 400 | — |
| `.h-page` | 18px | 600 | letter-spacing -0.015em |
| `.h-section` | 12px | 600 | uppercase, `--text-3` |
| `.h-card` | 13px | 600 | — |
| `.num-xl` | 28px | 500 | Geist Mono, `.tnum` |
| `.num-lg` | 20px | 500 | Geist Mono |
| `.field label` | 11px | 500 | uppercase, `--text-2` |

### 4.3 Type scale (landing)

| Element | Size |
|---------|------|
| `.hero h1` | `clamp(40px, 5.4vw, 64px)` weight 700 |
| `.hero p.lead` | 18px |
| `.section-header h2` | `clamp(28px, 3.6vw, 40px)` |
| `.feature-row h3` | 28px |
| `.logo-text` | 15px weight 600 |
| `.stat .v` | 36px mono |

### 4.4 Utilities

| Class | Effect |
|-------|--------|
| `.mono` | Geist Mono, nowrap |
| `.tnum` | `font-variant-numeric: tabular-nums` |
| `.muted` | `color: var(--text-3)` |
| `.muted-2` | `color: var(--text-2)` |
| `.truncate` | ellipsis overflow |

---

## 5. Buttons

| Class | Height | Background | Text |
|-------|--------|------------|------|
| `.btn` | 30px | `--bg-elev` | `--text` |
| `.btn-sm` | 26px | (same) | 12px font |
| `.btn-icon` | 30×30 | centered icon | |
| `.btn-icon.btn-sm` | 26×26 | | |
| `.btn-primary` | 30px | `--text` | `#fff` (dark mode overridden) |
| `.btn-accent` | 30px | `--accent` | `--accent-fg` |
| `.btn-ghost` | 30px | transparent | `--text-2` |
| `.btn-danger` | — | — | `--danger` |

Padding: `6px 11px` (default), `4px 8px` (sm)  
Gap between icon and label: **6px**  
Border radius: `var(--radius)`  
Transition: background/border **80ms**

Landing also uses `.btn-lg` (see globals.css marketing section).

---

## 6. Cards & surfaces

```css
.card {
  background: var(--bg-elev);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
}
.card-pad { padding: var(--space-3); }
```

**KpiCard** (`src/components/ui/KpiCard.tsx`): composes `.card.card-pad` + `.num-xl` + optional `.badge` delta.

**Quote / testimonial:**

```css
.quote-block {
  background: var(--emphasis-bg);
  color: var(--on-emphasis);
  border-radius: 14px;
  padding: 48px;
}
```

**Landing feature mock frame:**

```css
.feature-visual {
  background: var(--bg-elev);
  border: 1px solid var(--border);
  border-radius: 12px;
  box-shadow: var(--shadow-md);
}
```

---

## 7. Forms

| Element | Height | Notes |
|---------|--------|-------|
| `.input`, `.select` | 30px | `--bg-elev`, focus: `--accent` border + `--accent-2` ring |
| `.submit-btn` | 44px | Full-width auth CTA |
| `.field` | — | `gap: 5px` between label and control |

Placeholder: `var(--text-4)`  
Checkbox accent: `var(--accent)`

---

## 8. Badges

Base: `.badge` — height **20px**, font **11px**, pill radius, `--bg-sunk` / `--text-2`

| Modifier | Colors |
|----------|--------|
| `.badge.green` | `--success-bg` / `--success` |
| `.badge.amber` | `--warn-bg` / dark amber text |
| `.badge.red` | `--danger-bg` / `--danger` |
| `.badge.blue` | `--accent-2` / `--accent-strong` |
| `.badge.violet` | `--violet-bg` / `--violet` |
| `.badge.gray` | sunk / `--text-2` |

Include `.badge-dot` (5px circle) for status pills.

---

## 9. Tables

```html
<div class="table-wrap">
  <table class="tbl">…</table>
</div>
```

| Part | Style |
|------|--------|
| Header `th` | 11px uppercase, `--text-3`, `--bg-sunk`, sticky top |
| Body `td` | 13px, padding `6px var(--space-3)` |
| Row hover | `--bg-sunk` |
| Row selected | `--accent-2` |
| Checkbox column | 40px fixed |

---

## 10. Sidebar & navigation

### Dashboard sidebar (`.sidebar`)

- Width: grid column `var(--sidebar-w)` | collapsed `var(--sidebar-w-collapsed)`
- Background: `--bg-sunk`
- Base text color: `--text-2` (avoids harsh body `--text` on icons)

### Nav item (`.nav-item`)

| State | Background | Text | Icon |
|-------|------------|------|------|
| Default | transparent | `--text-2` | inherits |
| Hover | `--nav-item-hover` | `--text` | inherits |
| Active | `--bg-elev` + `--shadow-sm` | `--text` | `--accent` |

Padding: `4px 8px` · Font: **13px** weight **500** · Gap: **8px**

### Nav section (`.nav-section`)

10.5px uppercase, `--text-4`, weight 600

### Brand mark (`.sidebar-brand-mark`)

28×28px, radius **7px**, `--brand-mark-bg` / `--brand-mark-fg`

### Edge collapse toggle (`.sidebar-edge-toggle`)

Fixed **white** pill with dark chevron (intentional contrast on seam) — see globals.css ~695–756

---

## 11. Topbar

- Class: `.topbar`
- Height: `var(--header-h)` (52px)
- Background: `var(--topbar-bg)` + `backdrop-filter: blur(8px)`
- Padding: `0 var(--space-3)`
- Theme control: `.topbar-theme-toggle` on ghost icon button

---

## 12. Icons (`@/components/icons`)

Built on **lucide-react**, wrapped to use `stroke="currentColor"`.

| Context | Size | Stroke (`sw`) |
|---------|------|----------------|
| Default | 16px | 2 |
| Sidebar nav | 15px | 1.75 |
| Small actions | 12–14px | 2 |

**Rule:** Set `color` on parent; do not hardcode SVG stroke colors.

Common exports: `Icons.Brand`, `Icons.Dashboard`, `Icons.Doc`, `Icons.Moon`, `Icons.Sun`, …

---

## 13. Landing layout tokens

| Class | Key values |
|-------|------------|
| `.container` | max-width **1200px**, padding **0 32px** |
| `.container-narrow` | max-width **920px** |
| `.nav-inner` | height **60px** |
| `.section` | padding **88px 0** |
| `.hero` | padding **80px 0 60px** |
| `.stats-grid` | 4 cols → 2 cols `@media (max-width: 768px)` |
| `.pricing` | 3 cols → 1 col `@media (max-width: 900px)` |
| `.steps` | 4 cols → 2 cols `@media (max-width: 880px)` |
| `.footer-grid` | 5 cols → 2 cols `@media (max-width: 880px)` |

### Preview mock (hero)

- `.preview` — elev border, 14px radius, large shadow
- `.preview-bar` — sunk header, window dots
- `.preview-side` width **148px** (see globals)
- `.preview-kpi`, `.preview-funnel` — demo dashboard metrics

### Optional: column board mock (legacy CSS)

- `.pipe-mock` — horizontal columns
- `.pipe-mock-card` — deal cards in columns

### Document mock (feature)

- `.doc-mock` — uses `--paper-*` tokens, max-height **280px**, bottom fade via `::after`

---

## 14. Auth layout tokens

| Class | Notes |
|-------|-------|
| `.login-grid` | 1 col mobile; 2 col `min-width: 960px` |
| `.brand-pane` | `#18181b` bg, white text; hidden `<960px` |
| `.creds` | Form column padding |
| `.submit-btn` | 44px primary CTA |

---

## 15. Breakpoints summary

| px | Where used |
|----|------------|
| 380 | Drawer narrow tweaks |
| 768 | `.stats-grid` 2-col |
| 880 | `.steps`, `.footer-grid`, duplicate landing grids |
| 900 | `.pricing` 1-col |
| 960 | `.login-grid`, `.doc-studio-layout`, auth brand pane |
| 1023 | `.feature-row.reverse` order reset |
| 1024 | `.hero-grid`, `.feature-row` 2-column |

Container queries: `@container drawer` for drawer internals (380–500px).

---

## 16. Motion

| Name | Duration | Easing |
|------|----------|--------|
| `.fade-in` | 220ms | ease-out |
| Sidebar grid | 220ms | cubic-bezier(0.4, 0, 0.2, 1) |
| Button/nav | 60–80ms | default |
| Theme toggle scale | 150ms | active `scale(0.96)` |

`prefers-reduced-motion: reduce` disables fade-in, skeleton animations, and some scale effects.

---

## 17. Z-index stack (reference)

| Layer | z-index |
|-------|---------|
| Topbar | 20 |
| Landing nav | 30 |
| Sidebar edge toggle | 30 |
| Dialog `.scrim` | 50 |
| Toast `.toast-stack` | 60 |

---

## 18. Overlays & feedback

### Dialog (`.scrim` + `.dialog`)

| Part | Spec |
|------|------|
| Scrim | `fixed inset 0`, `rgba(20,20,19,0.32)`, flex center |
| Panel | `--bg-elev`, `--radius-lg`, `--shadow-lg`, width **480px**, `max-width: 92vw` |
| Head | `padding: var(--space-3)`, border-bottom `--border`, `.h-card` title |
| Body | `padding: var(--space-3)` |
| Foot | `--bg-sunk`, flex end, gap 12px, top border |

Variant: `.email-report-dialog` grid for export modal fields.

### Drawer (`.drawer-scrim` + `.drawer`)

| Part | Spec |
|------|------|
| Default width | **540px** (persisted `uchenab.drawer.width`) |
| Min width | **320px** (title-based via pretext measure) |
| Max width | **96vw** |
| Head | `.drawer-head`, title `.drawer-title` 13px weight 600 |
| Body | `.drawer-body` scroll, `.drawer-panel` sections |
| Resize | `.drawer-resize-handle` on left edge |
| Forms | `.drawer-form-grid`, `.span-2`, `.drawer-actions` |
| Tabs | `.drawer-body .tabs` |
| Empty | `.drawer-empty` centered muted copy |

Container queries: `@container drawer (max-width: 380–500px)` stack grids.

### Toast

| Class | Spec |
|-------|------|
| `.toast-stack` | `fixed` bottom-right, gap 12px, z-index 60 |
| `.toast` | Dark bg light text (dark theme overrides in globals) |

### Empty & skeleton

| Class | Spec |
|-------|------|
| `.empty` | Centered, padding 24px 12px, `--text-3` |
| `.skel` | Shimmer gradient `--bg-sunk` → `--skel-mid`, 1.4s loop |
| `.page-loading-inline` | opacity 0.72, no pointer events |

### Appearance popover

| Class | Spec |
|-------|------|
| `.appearance-panel` | Elev panel ~320px, shadow lg |
| `.appearance-palette` | Row: 3-stripe preview + name/desc |
| `.appearance-palette--selected` | Accent border |
| `.appearance-mode-btn` | Light/dark toggle buttons |
| `.appearance-mode-btn--active` | Selected state |

---

## 19. Feature-specific CSS

### Optional: kanban board (`.page--pipeline`, legacy CSS)

| Class | Spec |
|-------|------|
| `.pipeline-board` | Flex row, horizontal scroll, grab cursor, hidden scrollbar |
| `.pipe-col` | 248px fixed width, `--bg-sunk`, full height column |
| `.pipe-col__body` | Scrollable card list |
| `.pipe-card` | `--bg-elev`, 8px radius, grab, hover lift `-1px` + `--shadow-md` |
| `.pipe-card.dragging` | opacity 0.4 |

### Chat (dashboard AI)

| Class | Spec |
|-------|------|
| `.chat-msg` | max-width 92%, 13px, radius 8px |
| `.chat-msg.user` | `--accent` bg, white text (dark: `--accent-strong`) |
| `.chat-msg.ai` | `--bg-sunk`, `--text` |

### Optional: score ring (legacy CSS)

| Class | Spec |
|-------|------|
| `.match-row` | 3-col grid, hover sunk |
| `.match-row .score-chip` | Mono score pill |
| `.score-ring` | 44px default, mono label centered |

### Score ring colors (component logic)

| Score | Stroke |
|-------|--------|
| ≥85 | `var(--success)` |
| ≥70 | `var(--accent)` |
| ≥55 | warn amber `oklch(70% 0.14 75)` |
| &lt;55 | `var(--danger)` |

### Thumbnail placeholder (`.thumb`)

| Size | Dimensions |
|------|------------|
| default | 44×32, radius 5px |
| `.lg` | 96×64, radius 6px |
| `.xl` | 140×96, radius 8px |

Diagonal stripe gradient (light gray) — prefer real images or `--bg-sunk` for dark-safe empty heroes.

### Filter chip (`.chip`)

Height **24px**, pill, `--bg-elev`, removable × button `--text-3`.

### Progress (`.pbar`)

Track 6px `--bg-sunk`; fill `--accent`.

### Document studio

| Class | Spec |
|-------|------|
| `.doc-studio-layout` | Grid 2-col ≥960px |
| `.doc-studio-setup` | Sticky left wizard |
| `.doc-studio-step` | Step row with marker circle |
| `.doc-studio-step--current` | Marker uses inverted emphasis styling |
| `.doc-page` | Print-style page (white bg in light — use `--paper-*` when theming) |

### Optional: landing column mock

| Class | Spec |
|-------|------|
| `.pipe-mock` | Flex columns gap |
| `.pipe-mock-card` | Small deal card in column |

---

## 20. Layout utilities (dashboard)

| Class | Value |
|-------|--------|
| `.row` | flex, align center |
| `.col` | flex column |
| `.grow` | flex 1, min-width 0 |
| `.p-3`, `.px-3`, `.py-3`, `.m-3`, `.mt-3`, `.mb-3`, … | 12px (`--space-3`) |
| `.gap-3` | 12px |
| `.gap-4` … `.gap-24` | 4–24px |
| `.gap-6`, `.gap-8`, `.gap-12` | Common flex gaps |
| `.space-y-3` | child stack +12px |
| `.mt-4` … `.mt-24`, `.mb-4` … | Fixed margins |
| `.row-between` | space-between row |

---

## 21. Anti-patterns (dark mode)

| Don't | Do instead |
|-------|------------|
| `background: var(--text); color: #fff` | `--emphasis-bg` / `--on-emphasis` |
| `background: #fff` on mocks | `--paper-bg` or `--bg-elev` |
| Hardcoded `#666` text | `--paper-text-muted` or `--text-3` |
| `fade-in` on dashboard routes | Only marketing/auth roots |
| New colors outside palette blocks | Extend `globals.css` + document here |

---

## 22. Quick copy-paste snippets

**Elevated card:**

```html
<div class="card card-pad">
  <div class="h-section">Section</div>
  <div class="h-page">Title</div>
</div>
```

**Primary action:**

```html
<button type="button" class="btn btn-primary">Save</button>
```

**Theme-safe inverted banner:**

```css
.my-banner {
  background: var(--emphasis-bg);
  color: var(--on-emphasis);
}
```

**Theme-safe document preview:**

```css
.my-doc-preview {
  background: var(--paper-bg);
  color: var(--paper-text);
}
```

---

## 23. Related design docs

| File | Purpose |
|------|---------|
| `src/styles/globals.css` | All tokens + classes |
| `src/lib/themes/palettes.ts` | Palette names + preview swatches |
| `src/components/theme/ThemePickerModal.tsx` | Appearance panel UI |
| [`design.md`](design.md) | Design overview & shells |
| [`design-components.md`](design-components.md) | Components & page compositions |

When you change tokens or visual classes in CSS, **update this file** and `design-components.md` if behavior is user-visible.
