# Uchenab — Frontend (agent guide)

AI assistants: read **`design.md`**, **`design-components.md`**, and **`theme-and-tokens.md`** before changing UI.

## Product scope

**Uchenab** is a small admin UI for:

- Dashboard monitoring (KPIs, health, activity)
- Document list / upload / basic management
- **Agent Conversations** — WhatsApp inbox: read user↔agent threads, reply
  manually (delivered on WhatsApp), and start a chat with any number
  (`ConversationsPage`, polling, `/api/v1/conversations*`)
- Auth (login, session)

Avoid real-estate, pipeline, or “matching” product patterns from older drafts.

## Stack

| Layer | Choice |
|--------|--------|
| Framework | React 19 + **Vite** |
| UI | CSS variables in `src/styles/globals.css` |
| Icons | Lucide via `@/components/icons` |
| Routing | react-router-dom |
| API | `fetch` to `/api/v1/*` (Vite dev proxy → backend :8058) |

## Repository layout

```
src/
  styles/globals.css     # Design system
  pages/                 # Login, dashboard, …
  components/            # auth, theme, icons
  context/               # ThemeContext, AuthContext
  lib/                   # api, tokenStorage
```

## Commands

```bash
npm run dev
npm run build
npm run lint
```

## Theming

- **Mode:** `light` | `dark` on `<html data-theme>`
- **Palette:** `default` (+ optional palettes in CSS)
- **Persistence:** `uchenab-theme`, `uchenab-palette` in `localStorage`
- **FOUC guard:** inline script in `index.html`

## API / auth

- Tokens: `uchenab-access-token`, `uchenab-refresh-token` via `@/lib/tokenStorage`
- Login: `POST /api/v1/auth/login`
- `useAuth()` for protected routes

## What not to do

- Do not use the old **PropMatch** name or real-estate copy in UI or docs.
- Do not hardcode `#fff` / `#1a1a1a` for themed surfaces.
- Do not use `fade-in` inside dashboard `.content` (auth/marketing only).
