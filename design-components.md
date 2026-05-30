# Design — components & visual patterns

Companion to **`design.md`** (overview) and **`theme-and-tokens.md`** (tokens & CSS classes).  
**Source of truth:** `src/styles/globals.css` + `src/components/ui/*` (as implemented).

---

## How to use this doc

| Need | Read |
|------|------|
| Colors, spacing, breakpoints | `theme-and-tokens.md` |
| Product tone & layout shells | `design.md` |
| Which component/class for a UI | **this file** |

Prefer **existing classes** over inline styles. Inline layout is acceptable for one-off grids (e.g. KPI row) when tokens are still used for colors.

---

## 1. UI primitives (`src/components/ui/`)

### Layout & feedback

| Component | Visual role | Classes / tokens |
|-----------|-------------|----------------|
| **EmptyState** | Centered empty panel | `.empty` + 40px sunk circle icon, `--text`, `--text-3` hint |
| **Skeleton** | Loading placeholder | `.skel` shimmer using `--bg-sunk` / `--skel-mid` |
| **Spinner** | Inline / centered loader | Uses accent border spin (see component) |
| **Tooltip** | Portal tooltip | Dark elev panel, 12px text; placements top/bottom/left/right/auto |

### Actions & inputs

| Component | Visual role | Classes |
|-----------|-------------|---------|
| **Segmented** | Filter toggle group | `.seg` + `button.active` |
| **Checkbox** | Custom 14×14 box | `.checkbox`, `.checked`, `.indeterminate` → `--accent` fill |
| **FieldError** | Validation line | 12px `--danger` under field |
| **Menu** | Dropdown from trigger | Elev panel: `--bg-elev`, `--border`, `shadow-md`, 8px radius; danger items `--danger` |

### Data display

| Component | Visual role | Classes |
|-----------|-------------|---------|
| **DataTable** | Sortable table + pagination | `.table-wrap`, `table.tbl`; optional `frame={false}` inside existing card |
| **KpiCard** | Metric tile | `.card.card-pad`, `.num-xl`, optional **Sparkline**, delta `.badge` |
| **Sparkline** | Mini chart in KPI | SVG stroke `var(--accent)` |
| **MiniBars** | Bar micro-chart | Uses `--accent` / sunk bars |
| **ScoreRing** | Match % ring | `.score-ring` or inline SVG; color by score: ≥85 success, ≥70 accent, ≥55 warn, else danger |
| **StatusBadge** | Service / document status | `.badge` + tone: green/blue/violet/amber/red/gray |
| **Avatar** | User initials | `.avatar` 24px, `.avatar.lg` 32px, sunk + border |

### Overlays

| Component | Visual role | Classes |
|-----------|-------------|---------|
| **Dialog** | Centered modal | `.scrim` + `.dialog` 480px max 92vw; `.dialog-head` / `.dialog-body` / `.dialog-foot` (foot on `--bg-sunk`) |
| **Drawer** | Right panel, resizable | `.drawer-scrim`, `.drawer`, `.drawer-head`, `.drawer-body`; default width **540px**; resize handle on left edge |
| **TableBulkDeleteBar** | Sticky selection bar | Sunk bar above table (see component + globals) |

### Specialized

| Component | Visual role |
|-----------|-------------|
| **ScoreRing** | Circular progress for match scores |
| **Drawer** form layouts | `.drawer-form-grid`, `.drawer-tabs`, `.drawer-actions` (globals) |

---

## 2. Theme UI

| Piece | Classes | Behavior |
|-------|---------|----------|
| **ThemePickerModal** | `.appearance-popover-host`, `.appearance-panel` | Popover: palette swatches (3-color preview), light/dark `.appearance-mode-btn` |
| **Landing toggle** | `.landing-theme-toggle` on `.btn-ghost.btn-icon` | Moon/sun only (no palette on marketing) |
| **Topbar toggle** | `.topbar-theme-toggle` | Opens full appearance panel |

Palette swatch: `.appearance-palette`, selected `.appearance-palette--selected`, preview stripes use palette preview colors from `palettes.ts`.

---

## 3. App chrome

### Sidebar (`Sidebar.tsx`)

| Element | Spec |
|---------|------|
| Container | `.sidebar`, `--bg-sunk`, sticky full height |
| Brand | `.sidebar-brand`, `.sidebar-brand-mark` 28×28 radius 7px |
| Sections | `.nav-section` 10.5px uppercase |
| Items | `.nav-item`, `.active` → elev + accent icon |
| Icons | 15px, stroke 1.75 via `NavIcon` wrapper |
| User row | Avatar + `.sidebar-user-meta` at bottom |

Collapsed: `.app--sidebar-collapsed` hides labels, centers icons.

### Topbar (`Topbar.tsx`)

| Element | Spec |
|---------|------|
| Bar | `.topbar`, 52px, `--topbar-bg`, blur 8px |
| Breadcrumb | `.row.gap-6.muted` 12.5px → current segment `--text` weight 500 |
| Collapse | `.sidebar-edge-toggle` white 20px circle on seam |
| Quick actions | `.btn.btn-sm` e.g. Upload document |
| Theme | Appearance popover trigger |

---

## 4. Page visual patterns

### Dashboard home

| Block | Composition |
|-------|-------------|
| Header | Greeting + `.h-page` + subtitle `--text-2` |
| Period filter | `.seg` (7d / 30d / 90d) |
| KPI row | `KpiGrid` → multiple `KpiCard` |
| Charts | `.card.card-pad`; optional Recharts using `--chart-*` when palette defines them |
| Categories | Icon + label rows, mono counts |

### Documents

| Block | Composition |
|-------|-------------|
| Toolbar | `.row` + search `.input` + `.btn-accent` upload |
| Table view | `DataTable` + `StatusBadge` (indexed, pending, failed) |
| Drawer detail | `Drawer` + metadata `.field` grid |
| Preview | `.doc-mock` / `.doc-page` with `--paper-*` tokens |

Document row: mono source/id, title 13–14px weight 500, `.badge` for access level, timestamp `.muted`.

### Health & monitoring

| Block | Composition |
|-------|-------------|
| KPI row | `KpiGrid` — documents, chunks, API/DB status |
| Service table | `.table-wrap` + `StatusBadge` per dependency |
| Activity | Recent ingest events in `.card.card-pad` |

### Optional: AI chat (if enabled later)

| Block | Composition |
|-------|-------------|
| Messages | `.chat-msg.user` (accent bg), `.chat-msg.ai` (sunk bg) |
| Composer | Sunk input area, send `.btn-accent` |

### Auth

| Block | Composition |
|-------|-------------|
| Brand column | `.brand-pane` fixed `#18181b`, white type (marketing only) |
| Form | `.creds`, `.field`, `.submit-btn` 44px |
| Password | `PasswordField` with toggle icon button ghost |

### Reports / admin

Same dashboard density: `.page` + `.h-page` + `.table-wrap` or `.card.card-pad` forms.

---

## 5. CSS-only patterns (no React wrapper)

### Chips & filters

```html
<span class="chip">Filter value <button type="button">×</button></span>
```

24px height, pill, `--bg-elev`, removable via ghost button.

### Thumbnail placeholder

```html
<div class="thumb"></div>
<div class="thumb lg"></div>
<div class="thumb xl"></div>
```

Diagonal stripe placeholder (light gray); use real `<img>` over hero in cards. **Note:** `.thumb` gradient is light-only — prefer image or `--bg-sunk` for dark-safe empty state.

### Progress

```html
<div class="pbar"><div style="width:60%"></div></div>
```

6px track `--bg-sunk`, fill `--accent`.

### Tabs

```html
<div class="tabs">
  <button class="active">Tab</button>
</div>
```

Underline active with `--accent` 2px bottom border.

### Toast (via `useToast`)

`.toast-stack` bottom-right; `.toast` dark pill (themed in dark mode in globals).

### Chat bubbles (marketing)

`.chat-bubble.user` / `.chat-bubble.ai` — see `theme-and-tokens.md` emphasis tokens.

---

## 6. Status → badge tone map

`StatusBadge` (`Badge.tsx`) — use these tones for consistency:

| Tone | Example statuses |
|------|------------------|
| **blue** | New, Active, INITIAL CONTACT |
| **violet** | Processing, indexing, in progress |
| **amber** | NEGOTIATION, CLIENT MEETING, Negotiating, Under Offer |
| **green** | CLOSING, DEAL LOCK, Available, Closed, Fulfilled |
| **red** | Lost |
| **gray** | COMMISSION, On Hold, Sold, Off Market, Withdrawn, Not Available |

Always include `.badge-dot` inside for status pills.

---

## 7. Icon size guide

| Context | `size` | `sw` |
|---------|--------|------|
| Sidebar nav | 15 | 1.75 |
| Topbar / table actions | 12–14 | 2 |
| Buttons default | 16 | 2 |
| KPI card | 14 | 2 |
| Empty state | 18–20 | 2 |
| Landing feature bullets | 16 | 2.5 |
| Dialog close | 14 | 2 |
| Sidebar collapse chevron | 10 | 2.25 |

Import: `import Icons from '@/components/icons'`

---

## 8. Spacing utilities (dashboard)

Aligned to **12px** rhythm (`--space-3`):

| Class | Effect |
|-------|--------|
| `.p-3`, `.px-3`, `.py-3`, `.m-3`, `.mt-3`, `.mb-3`, … | 12px |
| `.gap-3` | flex/grid gap 12px |
| `.gap-6` … `.gap-24` | 6–24px fixed gaps |
| `.row` | flex row, align center |
| `.col` | flex column |
| `.grow` | flex 1 min-width 0 |
| `.space-y-3` | stack children +12px margin-top |

Page shell: `.page` padding `var(--space-3)`; narrow content `.page-narrow` max **1280px**.

---

## 9. Composition recipes

### Standard list page

```
.page.fade-in (only if full-page marketing — NOT inside .content)
  .row-between (title + actions)
    .h-page
    .row.gap-8 → .btn / .btn-primary
  .card.card-pad OR .table-wrap
    DataTable / content
```

### Card with section header

```
.card.card-pad
  .row-between.mb-3
    .h-section
    .btn-ghost.btn-sm
  …content
```

### Filter bar

```
.row.gap-8.flex-wrap
  .input (search)
  .seg (view mode)
  .chip (active filters)
```

### Confirm destructive action

`Dialog` with `.btn-ghost` cancel + `.btn-danger` or primary confirm in `.dialog-foot`.

### Record create/edit

`Drawer` + `.drawer-form-grid` + `.field` rows + `.drawer-actions` footer with `.btn-primary` Save.

---

## 10. Domain component → visual role

| Component | Visual purpose |
|-----------|----------------|
| `DashboardPage` | KPIs, charts, recent activity |
| `DocumentsPage` | List/upload documents |
| `HealthPanel` | API, DB, graph dependency status |
| `DocumentPreview` | Paper-style preview using `--paper-*` |
| `AuthBrandPane` | Auth split column (brand + short product line) |

---

## 11. Dark mode checklist (per new UI)

- [ ] Backgrounds use `--bg`, `--bg-elev`, `--bg-sunk` — not `#fff`
- [ ] Text uses `--text` hierarchy — not `#666` / `#1a1a1a`
- [ ] Inverted promos use `--emphasis-*`
- [ ] Document previews use `--paper-*`
- [ ] Borders use `--border` / `--border-strong`
- [ ] Icons inherit `currentColor`
- [ ] Test `data-theme="dark"` + `data-palette="default"`

---

## 12. Related files (design only)

| File | Content |
|------|---------|
| `src/styles/globals.css` | All classes |
| `src/components/ui/*` | React primitives |
| `src/components/icons/index.tsx` | Icon map |
| `src/lib/themes/palettes.ts` | Palette preview colors |
| `design.md` | Overview & shells |
| `theme-and-tokens.md` | Token tables & CSS reference |
