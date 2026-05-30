# Uchenab — Design system

Visual and UX reference for the **Uchenab** admin UI: dashboard monitoring, document upload/listing, and light operational tooling. **Tokens & CSS classes:** [`theme-and-tokens.md`](theme-and-tokens.md). **Components & page patterns:** [`design-components.md`](design-components.md).

**Implementation source of truth:** `src/styles/globals.css`

---

## Design intent

Compact **operations dashboard** UI: dense, calm, data-forward — tuned for status at a glance and simple document workflows.

| Principle | Expression |
|-----------|--------------|
| Density | 12px (`--space-3`) padding rhythm, 13.5px body, 30px controls |
| Hierarchy | Four text steps (`--text` → `--text-4`), uppercase micro-labels |
| Brand | Blue `--accent` on stone neutrals (default palette) |
| Type | **Geist** UI, **Geist Mono** for IDs, money, KPIs |
| Chrome | Sunk sidebar, elevated cards, subtle borders |

**Landing** uses the same tokens with larger type, more whitespace, and static mocks (`.preview`, `.feature-visual`, `.doc-mock`).

---

## Theming

| Attribute | Values | Applied to |
|-----------|--------|------------|
| Mode | `light` · `dark` | `<html data-theme>` |
| Palette | `default` · `indigo-gold` · `cosmic-night` · `vercel` · `midnight-bloom` | `<html data-palette>` |

**User controls**

- Dashboard topbar → Appearance (mode + palette)
- Landing nav → light/dark toggle only

**Semantic tokens (always use in new UI)**

| Token pair | Use |
|------------|-----|
| `--emphasis-bg` / `--on-emphasis` | Inverted cards (testimonial, featured pill, user chat bubble) |
| `--paper-bg` / `--paper-text` / `--paper-hl` | Document previews |
| `--brand-mark-bg` / `--brand-mark-fg` | Logo squares (sidebar, landing) |

Never pair `background: var(--text)` with `color: #fff` alone — it inverts incorrectly in dark mode.

---

## Surfaces & layout shells

### Dashboard

```
┌─────────────┬────────────────────────────────────────┐
│  Sidebar    │  Topbar (52px, sticky, blurred)        │
│  232px      ├────────────────────────────────────────┤
│  --bg-sunk  │  .page / .page-narrow (--bg)           │
│             │  .card · .table-wrap · .drawer         │
└─────────────┴────────────────────────────────────────┘
         ↑ collapse → 58px rail
```

| Region | Background | Key classes |
|--------|------------|-------------|
| Sidebar | `--bg-sunk` | `.sidebar`, `.nav-item`, `.nav-section` |
| Topbar | `--topbar-bg` + blur | `.topbar` |
| Content | `--bg` | `.content`, `.page` |
| Cards / tables | `--bg-elev` | `.card`, `.table-wrap` |

### Landing

| Region | Classes | Notes |
|--------|---------|-------|
| Nav | `.nav`, `.nav-sticky-bg` | 60px inner height, theme toggle |
| Hero | `.hero`, `.hero-grid` | 2-col ≥1024px |
| Sections | `.section` | 88px vertical padding |
| Container | `.container` | 1200px max, 32px horizontal pad |

### Auth

| Region | Classes | Notes |
|--------|---------|-------|
| Split | `.login-grid` | Brand hidden &lt;960px |
| Brand | `.brand-pane` | Fixed dark `#18181b` column |
| Form | `.creds`, `.field`, `.submit-btn` | 44px primary CTA |

---

## Color semantics

| Role | Token | Typical use |
|------|--------|-------------|
| Canvas | `--bg` | Page |
| Recess | `--bg-sunk` | Sidebar, table head, AI bubbles |
| Elevate | `--bg-elev` | Cards, inputs, dialogs |
| Hover | `--bg-hover` | Buttons, links |
| Copy | `--text` … `--text-4` | Primary → disabled |
| Action | `--accent`, `--accent-strong` | CTA, links, focus ring |
| Status | `--success`, `--warn`, `--danger`, `--violet` | Badges, charts, rings |

Full light/dark values and palettes: **`theme-and-tokens.md` §2–3**.

---

## Typography

### Dashboard scale

| Class / element | Size | Weight |
|-----------------|------|--------|
| Body | 13.5px | 400 |
| `.h-page` | 18px | 600 |
| `.h-section` | 12px | 600, uppercase |
| `.h-card` | 13px | 600 |
| `.num-xl` | 28px mono | 500 |
| `.field label` | 11px | 500, uppercase |

### Landing scale

| Element | Size |
|---------|------|
| `.hero h1` | `clamp(40px, 5.4vw, 64px)` · 700 |
| `.section-header h2` | `clamp(28px, 3.6vw, 40px)` |
| `.feature-row h3` | 28px |
| `.stat .v` | 36px mono |

Utilities: `.mono`, `.tnum`, `.muted`, `.muted-2`, `.truncate`.

---

## Core building blocks

| Need | Use |
|------|-----|
| Panel | `.card` + `.card-pad` |
| Primary action | `.btn.btn-primary` or `.btn-accent` |
| Secondary | `.btn` or `.btn-ghost` |
| Small / icon | `.btn-sm`, `.btn-icon` |
| Form field | `.field` > `label` + `.input` / `.select` |
| Status pill | `.badge.{tone}` + `.badge-dot` |
| Data grid | `.table-wrap` + `table.tbl` or `DataTable` |
| Filter toggle | `.seg` or `Segmented` |
| Empty state | `EmptyState` / `.empty` |
| Loading | `Skeleton` / `.skel` |
| Modal | `Dialog` / `.scrim` `.dialog` |
| Side panel | `Drawer` / `.drawer` |
| Toast | `useToast` / `.toast` |

Detailed props, compositions, and page recipes: **`design-components.md`**.

---

## Icons

- **Library:** Lucide via `@/components/icons`
- **Default:** 16px, stroke 2
- **Sidebar:** 15px, stroke 1.75
- **Rule:** `stroke="currentColor"` — set `color` on parent

---

## Key feature visuals

### Sidebar & topbar

Active nav: white elev tile, accent-colored icon. Collapsed: icon-only rail, tooltips on hover. Primary sections: **Dashboard**, **Documents**, **Health** (or equivalent).

### Dashboard monitoring

`KpiCard` row for ingest counts, storage, API health. Charts in `.card.card-pad` (line or bar). Status via `.badge` + `.badge-dot`.

### Documents

`.table-wrap` + `table.tbl` for document list; upload via `.btn-accent` or drawer form. Preview pane uses `--paper-*` on `.doc-mock` / `.doc-page`.

### Health & activity

Compact health panel: service rows, last-checked mono timestamps, `.badge.green` / `.badge.red` for up/down.

### Auth & marketing (optional)

`.login-grid`, `.brand-pane`, `.creds` — keep minimal; no heavy marketing chrome required for v1.

### Landing mocks (optional)

| Mock | Classes |
|------|---------|
| App window | `.preview`, `.preview-bar`, `.preview-kpi` |
| Document sample | `.doc-mock` with `--paper-*` |
| Testimonial | `.quote-block` with `--emphasis-*` |

---

## Motion & accessibility

| Pattern | Timing |
|---------|--------|
| Hover bg/border | 60–80ms |
| Sidebar width | 220ms cubic-bezier |
| `.fade-in` (marketing/auth only) | 220ms ease-out |
| Theme button press | scale 0.96, 150ms |

Respect `prefers-reduced-motion: reduce` — animations disabled in globals.

**Do not** add `.fade-in` on dashboard pages inside `.content` (intentionally disabled).

---

## Responsiveness

| Breakpoint | Effects |
|------------|---------|
| ≤768px | Landing stats 4→2 cols |
| ≤880px | Steps, footer, some grids 2-col |
| ≤900px | Pricing 1-col |
| ≤960px | Auth brand hidden; doc studio 1-col |
| ≤1023px | Feature row reverse order reset |
| ≥1024px | Hero + features 2-col |

Drawer: container queries `@container drawer` at 380–500px for form stacking.

Dashboard tables: horizontal scroll in `.content`.

---

## Z-index (visual stacking)

| Layer | z-index |
|-------|---------|
| Topbar | 20 |
| Landing nav / sidebar toggle | 30 |
| Dialog scrim | 50 |
| Toast stack | 60 |

---

## New UI checklist

- [ ] Semantic CSS variables only (see anti-patterns in `theme-and-tokens.md` §18)
- [ ] Reuse `.card`, `.btn`, `.badge`, `.table-wrap`
- [ ] Icons via `Icons` with context-appropriate size
- [ ] Verified in **dark** + **default** palette
- [ ] Document new tokens/classes in `theme-and-tokens.md`
- [ ] Document new patterns in `design-components.md` if introducing a reusable block

---

## Design doc index

| Document | Contents |
|----------|----------|
| **design.md** (this file) | Intent, shells, semantics, checklist |
| **theme-and-tokens.md** | Variables, palettes, CSS class reference |
| **design-components.md** | React primitives, page compositions, recipes |
