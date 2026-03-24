# CLAUDE.md — Project Guide for AI Assistants

## Project Overview

Cricket Hub — a multi-tenant cricket team management app hosted on Cloudflare Pages. Shares a Supabase backend (same database, auth, storage buckets) with the companion toolkit app.

### Features
- **Team Dashboard** — Expense tracking, dues, settlements, season management per team
- **Player Management** — Roster with photos, roles, designations, signup linking
- **Moments Feed** — Team photo gallery with comments, likes, reactions, @mentions
- **Fee & Sponsorship Tracking** — Per-player fee status, pool fund balance
- **Coin Toss** — 3D cricket toss with sound effects
- **Public Dues Page** — Shareable link showing team dues (no auth required)
- **Super Admin Panel** — Create teams, manage members across all teams

### Multi-Tenant Architecture

| Concept | Implementation |
|---------|---------------|
| Team scoping | `team_id` FK on `cricket_players`, `cricket_seasons`, `cricket_expenses`, `cricket_settlements`, `cricket_gallery` |
| URL routing | `/t/[slug]` — path-based, zero DNS config per team |
| Roles | `super_admin` (profiles.is_admin), `team_admin` (cricket_team_members.role), `player` (cricket_team_members.role) |
| RLS | `is_team_member(team_id)` and `is_team_admin(team_id)` helper functions |
| React context | `TeamProvider` wraps `/t/[slug]` routes, provides `useTeamContext()` → `{ team, isTeamAdmin }` |
| Store scoping | `cricket-store.loadAll(teamId, userId)` adds `.eq('team_id', teamId)` to all queries |

A user can be `team_admin` of one team and `player` in another.

### URL Pattern
```
/                    → Login or team selector
/t/[slug]            → Team dashboard
/t/[slug]/dues       → Public dues page (no auth)
/admin               → Super admin panel
```

## Tech Stack

- **Framework:** Next.js 15 (App Router, static export via `output: 'export'`)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4 with CSS custom properties for theming
- **State:** Zustand
- **Charts:** recharts (expense breakdowns)
- **Animations:** motion (framer-motion v11+), @formkit/auto-animate
- **Bottom Sheets:** vaul (iOS-style draggable drawers)
- **Icons:** lucide-react (Moments feed), react-icons (rest of app)
- **Auth & Database:** Supabase (PostgreSQL + Auth + Row Level Security)
- **Hosting:** Cloudflare Pages (static export, auto-deploys from `main`)
- **Theme:** next-themes (dark/light)
- **PDF:** jspdf (share button PDF export)
- **Fonts:** geist (sans + mono)

## Project Structure

```
├── app/
│   ├── layout.tsx                  # Root layout: ThemeProvider, Shell
│   ├── page.tsx                    # Team selector (home)
│   ├── globals.css                 # Tailwind + dark/light CSS variables
│   ├── providers.tsx               # ThemeProvider wrapper
│   ├── admin/page.tsx              # Super admin panel
│   └── t/[slug]/
│       ├── layout.tsx              # Server layout with generateStaticParams
│       ├── layout-client.tsx       # Client layout: AuthGate + TeamProvider
│       ├── page.tsx                # Team dashboard (views: players, fees, expenses, charts, moments, toss, share)
│       ├── dues/                   # Public dues page (no auth)
│       │   ├── page.tsx            # Server wrapper
│       │   └── page-client.tsx     # Client component
│       ├── lib/                    # constants, utils (balance calcs), welcome-messages
│       └── components/             # All 16 cricket components
│           ├── PlayerManager.tsx   # Player CRUD, photo upload, admin access (~1120 lines)
│           ├── GalleryPost.tsx     # Gallery post card, comments, likes (~1082 lines)
│           ├── Gallery.tsx         # Gallery feed with stats
│           ├── GalleryUpload.tsx   # Photo upload drawer with @mentions
│           ├── ExpenseForm.tsx     # Add/edit expense modal
│           ├── ExpenseList.tsx     # Expense list with pool fund balance
│           ├── SeasonSelector.tsx  # Season dropdown + create
│           ├── FeeTracker.tsx      # Per-player fee tracking
│           ├── SponsorshipSection.tsx # Sponsorship management
│           ├── CategoryDonut.tsx   # Expense category chart
│           ├── MonthlyBar.tsx      # Monthly spending chart
│           ├── ShareButton.tsx     # PDF export + share
│           ├── NotificationBell.tsx # Notification dropdown
│           ├── SettleUpModal.tsx   # Settlement recording
│           ├── DuesSummary.tsx     # Player dues/balances
│           └── TossWidget.tsx      # Coin toss simulator
├── components/                     # Shared components
│   ├── Shell.tsx                   # App shell with header
│   ├── AuthGate.tsx                # Auth wrapper (login/signup)
│   ├── TeamContext.tsx             # TeamProvider + useTeamContext hook
│   ├── ThemeToggle.tsx             # Dark/light toggle
│   └── HamburgerMenu.tsx           # Side navigation
├── lib/
│   ├── supabase/client.ts          # Supabase browser client singleton
│   ├── auth.ts                     # Error sanitization, password validation, rate limiting
│   └── nav.ts                      # Navigation config
├── stores/
│   ├── auth-store.ts               # Auth state, login/signup/reset, isSuperAdmin
│   ├── team-store.ts               # Team selection, creation, member management
│   └── cricket-store.ts            # All cricket data scoped by teamId
├── types/cricket.ts                # All TypeScript types (with team_id)
├── docs/
│   ├── multi-tenant-schema.sql     # New tables + ALTER existing + RLS + RPCs
│   └── migration-sunrisers.sql     # Backfill existing Sunrisers data
├── tests/
│   ├── unit/
│   │   ├── cricket-store-core.test.ts    # Core store tests (local mode)
│   │   └── cricket-store-gallery.test.ts # Gallery store tests (local mode)
│   └── mocks/
│       ├── fixtures.ts             # Shared test data
│       └── supabase.ts             # Supabase query builder mock
└── public/
    └── _redirects                  # Cloudflare SPA fallback
```

## Commands

```bash
npm run dev        # Local dev server at http://localhost:3000
npm run build      # Static export to out/
npx serve out      # Preview production build
npm test           # Run all tests
npm run test:watch # Watch mode
```

## Environment Variables

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase publishable anon key |

## Database Schema

### New Tables (multi-tenant)
- `cricket_teams`: id, name, slug (UNIQUE), logo_url, primary_color, created_by, created_at
- `cricket_team_members`: id, team_id, user_id, role ('team_admin'|'player'), approved, joined_at, UNIQUE(team_id, user_id)

### Existing Tables (+ team_id column)
- `cricket_players`: + `team_id` FK → cricket_teams
- `cricket_seasons`: + `team_id` FK → cricket_teams
- `cricket_expenses`: + `team_id` FK → cricket_teams
- `cricket_settlements`: + `team_id` FK → cricket_teams
- `cricket_gallery`: + `team_id` FK → cricket_teams

### Child Tables (scoped via parent FK, no team_id needed)
- `cricket_expense_splits`, `cricket_season_fees`, `cricket_sponsorships`
- `cricket_gallery_tags`, `cricket_gallery_comments`, `cricket_gallery_likes`
- `cricket_comment_reactions`, `cricket_notifications`

### Player `user_id` Linking — CRITICAL
- `cricket_players.user_id` is **nullable**. Admin-created players start with `user_id: NULL`.
- Linked via **case-insensitive email match** (`ILIKE`) where `user_id IS NULL`.
- **Never set `user_id` to the admin's auth ID** when creating players.
- `user_id` resolves player avatars in Moments. Wrong `user_id` = wrong photo.

### Key RPCs
- `get_public_season_data(token)` — SECURITY DEFINER, returns season data for public dues page
- `get_my_teams()` — Returns teams the current user belongs to
- `get_team_by_slug(slug)` — Returns team + user's role for that team
- `is_team_member(team_id)` / `is_team_admin(team_id)` — RLS helper functions

Full SQL in `docs/multi-tenant-schema.sql`.

## Key Architecture

- **Static export** (`output: 'export'`) — no server-side code at runtime
- **SPA fallback** — `public/_redirects` serves `index.html` for all routes on Cloudflare
- **generateStaticParams** returns `[{ slug: '_' }]` as placeholder — real slugs resolved client-side
- **All Supabase calls are client-side** via `@supabase/ssr` browser client
- **TeamContext** — `TeamProvider` loads team by slug, initializes cricket data, provides `useTeamContext()` hook
- **Admin checks** — Components use `const { isTeamAdmin } = useTeamContext()` (NOT `userAccess.includes('admin')`)
- **Store reset** — `cricket-store.reset()` called when switching teams to clear stale data
- **Moments feed** — uses `motion/react`, `vaul`, `@formkit/auto-animate`, `lucide-react`
- **RLS enforced** — `is_team_member()` and `is_team_admin()` functions check `cricket_team_members`
- **Soft delete** — `deleted_at` for expenses, sponsorships, gallery posts; `is_active` for players

## Git Workflow

- Use **feature branches** (e.g., `feat/team-settings`), not direct push to main
- Main branch auto-deploys to Cloudflare Pages
- Commit convention: `feat:`, `fix:`, `docs:`, `style:`, `refactor:`, `test:`, `chore:`

## Testing — MANDATORY

**ALWAYS update or add unit tests when changing code.** Tests live in `tests/unit/` and use Vitest.

```bash
npm test                # Run all tests
npm run test:watch      # Watch mode during development
npm run test:coverage   # Tests + coverage report
npx next build          # Must pass before pushing
```

### Test Structure
| File | Coverage |
|------|----------|
| `tests/unit/cricket-store-core.test.ts` | Players, seasons, expenses, settlements, fees, sponsorships (local mode) |
| `tests/unit/cricket-store-gallery.test.ts` | Gallery posts, comments, likes, reactions, notifications (local mode) |

### Mock Setup
- Supabase client mocked via `vi.mock('@/lib/supabase/client')` — stores run in local-only mode
- Fixtures in `tests/mocks/fixtures.ts` — shared test data with `team_id` on all entities
- Supabase query builder mock in `tests/mocks/supabase.ts`

### Rules
- Every new store action MUST have a corresponding test
- Every bug fix SHOULD include a regression test
- Run `npx vitest run && npx next build` before every push

## Security — MANDATORY Pre-Commit Checks

1. **Scan for secrets** — no Supabase URLs, API keys, passwords, or emails in committed files
2. **Verify .gitignore** — `.env.local`, `.claude/`, `node_modules/`, `.next/`, `out/` must NEVER be committed
3. **Build check** — `npx next build` must pass with zero errors before pushing

## Documentation — MANDATORY Updates

When making changes, ALWAYS update these files if affected:
1. **`docs/multi-tenant-schema.sql`** — if any SQL changes
2. **`CLAUDE.md`** — if architecture, commands, or workflow changes
3. **`.env.example`** — if any new environment variables
