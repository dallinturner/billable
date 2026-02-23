# Billable - Project Context

---

## Product Vision

**Billable is a billable hours tracker built specifically for lawyers and law firms.**

Lawyers lose thousands of dollars in revenue every year not because they don't do the work, but because they forget to log it. A quick phone call, a ten-minute email, a hallway conversation — these add up fast and almost never make it onto a timesheet. Billable solves this by making time tracking frictionless: one click to start, one click to stop, and a simple notes flow to capture what was done.

### The Core Product
The centerpiece is a **browser extension widget** that lives in the corner of the lawyer's screen while they work. It shows a list of all their active clients. They click a client to start the timer, and click stop when they're done. A quick notes popup captures the task type and any details via typing or voice-to-text. Time is automatically rounded to the firm's billing increment (e.g., 6-minute increments). That's it — no manual entry, no forgetting, no lost revenue.

Everything syncs to a **web app** with two dashboards:
- **Lawyer dashboard** — full history of tracked time, ability to edit drafts, submit hours to admin, and request edits to already-submitted entries
- **Admin dashboard** — firm-wide view of all submitted hours across all lawyers, filterable by lawyer/client/task/date, with an edit request approval flow

### Who It's For
- **Solo practitioners** — manage themselves, track their own hours, see their own stats
- **Law firms** — admin sets up the firm (clients, billing increment, task types, team), lawyers track and submit hours, admin reviews and approves

### The Problem It Solves
Traditional time tracking for lawyers is painful — either done at the end of the day from memory (losing hours), or requires switching to a separate app mid-work (friction that leads to skipping it). Billable lives where lawyers already work (the browser) and gets out of the way.

### Design Philosophy
- **Monochrome** — clean, professional, no distracting colors. Lawyers work in a formal environment and the tool should match.
- **One-click interactions** — every core action (start timer, stop timer, switch client) is a single click
- **Frictionless** — the extension is always one click away, voice-to-text reduces typing, billing math is automatic

### Current Phase
MVP is fully built, deployed, and live at **https://billable-three.vercel.app**. Core flows tested end-to-end. Actively iterating on polish and additional features.

---

## Session Log

### February 23, 2026
**Goal:** Debug and fully fix lawyer invite flow. Improve UX.

**What we did:**
- Debugged why invite form was silently failing — Vercel's GitHub auto-deploy had stopped triggering. Fixed by deploying manually with `vercel --prod --scope dallin-turners-projects`. Root cause: GitHub integration had quietly broken.
- Fixed toast/flash notifications — were rendering in the page flow (invisible when scrolled down). Switched to inline `position: fixed` styles so they always appear at the top of the viewport regardless of scroll position. Applied to both `/admin/settings` and `/dashboard/settings`.
- Discovered invite was failing with "Database error saving new user" — caused by the `on_auth_user_created` trigger conflicting with Supabase's auth user creation. Dropped the trigger and updated the server action to directly insert into `public.users` using the admin client after `inviteUserByEmail` succeeds.
- Fixed middleware intercepting `/auth/callback` when user was already logged in as admin — the middleware was redirecting admins to `/admin` before the callback could run. Added exception for `/auth/callback`.
- Fixed callback reading stale admin session — removed role check from `/auth/callback`, now always redirects to `/dashboard`. Moved admin redirect logic to middleware (admins hitting `/dashboard` get sent to `/admin`).
- Fixed invite link landing on wrong page — Supabase invite emails use **implicit flow** (hash fragment tokens: `#access_token=...`) not PKCE code flow. Our server-side callback can't read hash fragments. Created new client-side page at `/auth/confirm` that reads hash params, calls `supabase.auth.setSession()`, and redirects to `/dashboard`. Updated `redirectTo` in server action to point to `/auth/confirm`. Added `/auth/confirm` to Supabase allowed redirect URLs.
- Fixed Supabase Site URL — was set to old deployment URL `https://billable-web-seven.vercel.app`. Updated to `https://billable-three.vercel.app`.
- **Invite flow fully working end-to-end** ✅ — admin invites lawyer, email arrives, lawyer clicks link, lands on lawyer dashboard.
- Added lawyer stats dashboard to future features list.

**Files changed:**
- `src/app/admin/settings/actions.ts` — drop trigger approach, insert profile directly; point redirectTo to /auth/confirm
- `src/app/admin/settings/page.tsx` — fixed toast positioning with inline styles
- `src/app/dashboard/settings/page.tsx` — fixed toast positioning with inline styles
- `src/app/auth/confirm/page.tsx` — NEW: client page to handle implicit flow invite tokens
- `src/app/auth/callback/route.ts` — removed role check, always redirect to /dashboard
- `src/middleware.ts` — exclude /auth/callback and /auth/confirm from auth redirect; redirect admins from /dashboard to /admin

**Supabase changes:**
- Dropped `on_auth_user_created` trigger and `handle_new_user()` function
- Updated Site URL to `https://billable-three.vercel.app`
- Added `https://billable-three.vercel.app/auth/confirm` to allowed redirect URLs

---

### February 22, 2026
**Goal:** Test edit request flow, update extension URL, start lawyer invite flow.

**What we did:**
- Fixed bug in edit request flow — `handleEditRequest` in `dashboard/page.tsx` wasn't calling `loadData()` after inserting the edit request, so the "Edit requested" badge didn't appear until manual page refresh. Added `await loadData()` after insert.
- Tested edit request flow end-to-end ✅ — lawyer requests edit, badge appears immediately, admin sees it in Edit Requests tab, approve/deny works, badge clears after resolution.
- Updated extension `WEBAPP_URL` from `http://localhost:3000` to `https://billable-three.vercel.app` in `extension/.env`. Rebuilt extension with `npm run build`. Tested end-to-end ✅.
- Implemented real lawyer invite flow:
  - Created `src/lib/supabase/admin.ts` — Supabase client using service role key
  - Created `src/app/admin/settings/actions.ts` — server action calling `auth.admin.inviteUserByEmail()` with `full_name`, `firm_id`, `role` metadata
  - Added `SUPABASE_SERVICE_ROLE_KEY` to `billable-web/.env.local` and Vercel production env vars (via CLI)
  - Created `on_auth_user_created` Postgres trigger to auto-create `users` row on invite (later dropped Feb 23 — caused errors)
  - Added error handling to surface invite failures (was previously failing silently)

**Files changed:**
- `src/app/dashboard/page.tsx` — added `await loadData()` after edit request insert
- `src/lib/supabase/admin.ts` — NEW: service role admin client
- `src/app/admin/settings/actions.ts` — NEW: `inviteLawyer` server action
- `src/app/admin/settings/page.tsx` — wired up real invite handler

**Supabase changes (Feb 22, later rolled back Feb 23):**
- Created `handle_new_user()` function and `on_auth_user_created` trigger (dropped next session)

---

### February 20, 2026
**Goal:** Complete MVP — fix remaining bugs, polish UI, deploy.

**What we did:**
- Fixed signup bug — client-side inserts to `firms` and `users` were failing because `auth.uid()` wasn't available in RLS context immediately after `signUp()`. Created `handle_signup()` Postgres function with `SECURITY DEFINER` that creates both firm and user profile atomically. Signup page now calls `supabase.rpc('handle_signup', ...)`.
- Fixed "Submit all" bug — `time_entries` UPDATE policy was missing a `WITH CHECK` clause, causing submits to silently fail. Fixed by dropping and recreating the policy with `WITH CHECK (user_id = auth.uid())`.
- Added "Edit requested" orange badge to submitted entries with pending edit requests on the lawyer dashboard.
- Full UI polish pass:
  - Light/dark mode toggle persisted in localStorage
  - Full web app redesign — monochrome, no indigo/blue anywhere
  - Extension redesigned — dark `bg-gray-950` header, initials avatars, SVG chevrons
  - Dark mode toggle moved to Settings pages (lawyer + admin)
  - Lawyer settings page created at `/dashboard/settings`
- End-to-end tested core web app loop ✅
- Built browser extension, loaded into Chrome, tested end-to-end ✅
- Deployed web app to Vercel ✅ → https://billable-three.vercel.app

**Supabase changes:**
- Created `handle_signup()` SECURITY DEFINER function
- Fixed `time_entries` UPDATE policy with `WITH CHECK` clause
- RLS disabled on `firms` table (intentional — see Known Issues)

---

## Current State

### What's Working ✅
- Full lawyer dashboard — timer, client grid, notes, manual entry, submit all, edit requests
- Full admin dashboard — submitted entries, filters, edit request approve/deny
- Lawyer invite flow — admin invites by email, lawyer receives invite, clicks link, lands on dashboard
- Browser extension — client list, timer, notes, voice-to-text, syncs with web app
- Light/dark mode on all pages
- Auth — signup, login, role-based redirect, protected routes

### Known Issues
1. **RLS disabled on `firms` table** — low risk (table only has name + billing_increment). Could re-enable later with a permissive read policy.
2. **Middleware deprecation warning** — Next.js 16 shows `The "middleware" file convention is deprecated. Please use "proxy" instead.` Not breaking, but needs rename eventually: `src/middleware.ts` → `src/proxy.ts`.
3. **Invite email customization** — invite email uses Supabase's default template. User wants to customize the look and content.

---

## Next Steps (Priority Order)

1. [ ] Fix middleware deprecation warning — rename `src/middleware.ts` → `src/proxy.ts`
2. [ ] Customize invite email template in Supabase (Auth > Email Templates)
3. [ ] Build lawyer stats dashboard — hours per client, hours per week, breakdown by task type
4. [ ] Bulk lawyer onboarding — CSV import or bulk invite form

---

## Future Features (Post-MVP)

- **Lawyer stats dashboard** — personal analytics section: hours per client, hours per week, breakdown by task type
- **Bulk lawyer onboarding** — CSV import or bulk invite instead of one at a time
- **Invite email customization** — branded email with custom content
- AI auto-categorization of task types from notes
- Smart inactivity detection to auto-pause timers
- Integrations with legal billing software (Clio, MyCase, QuickBooks, etc.)
- Mobile native app with home screen widget (iOS and Android)
- Invoice generation

---

## Product Decisions Made
- Widget is essential to the core value prop — quick one-click switching between clients
- Notes are private to the lawyer until they submit to admin
- Submissions go straight to admin (no approval on initial submit, only on edits)
- Clients vs. matters handled at setup — admin inputs billable line items
- Stop button triggers notes popup (smart auto-pause is post-MVP)
- Monochrome design system — no color accents anywhere

## Monetization
- Base fee + per seat pricing (subject to change)

---

## Reference

### Live URLs
- **Production:** https://billable-three.vercel.app
- **Vercel Project:** https://vercel.com/dallin-turners-projects/billable
- **GitHub Repo:** https://github.com/dallinturner/billable (public)
- **Supabase Dashboard:** https://supabase.com/dashboard/project/pzdbsnrxnpszvznrlftc

### Tech Stack
- **Framework:** Next.js 16 (App Router) + TypeScript
- **Database & Auth:** Supabase (PostgreSQL + Supabase Auth)
- **Styling:** Tailwind CSS v4 (class-based dark mode via `@custom-variant dark`)
- **Browser Extension:** Chrome Extension (Manifest V3) + React + Webpack
- **Voice-to-text:** Web Speech API (built into Chrome, free)

### Supabase Project
- **URL:** https://pzdbsnrxnpszvznrlftc.supabase.co
- **Anon key:** stored in `billable-web/.env.local` (local) and Vercel env vars (production)
- **Service role key:** stored in `billable-web/.env.local` (local) and Vercel production env vars
- **Email confirmations:** disabled (Auth > Providers > Email)
- **Auth redirect URLs:** `https://billable-three.vercel.app` and `https://billable-three.vercel.app/auth/confirm`
- **Site URL:** `https://billable-three.vercel.app`

### Deployment
- Hosted on Vercel under "Dallin Turner's projects" team
- GitHub auto-deploy connected but has broken before — if it stops working, deploy manually:
  ```bash
  cd "/Users/dallinturner/Desktop/STRAT 490R/Projects/Billable"
  vercel --prod --scope dallin-turners-projects
  ```
- Vercel project name: `billable` (NOT `billable-web`)
- Root directory in Vercel: `billable-web`
- **Adding env vars** — use CLI to avoid newline injection bugs:
  ```bash
  echo "value" | vercel env add KEY production --scope dallin-turners-projects
  ```

### Commands
```bash
# Start web app locally
cd "/Users/dallinturner/Desktop/STRAT 490R/Projects/Billable/billable-web"
npm run dev

# Deploy to production
cd "/Users/dallinturner/Desktop/STRAT 490R/Projects/Billable"
vercel --prod --scope dallin-turners-projects

# Rebuild extension after changes
cd "/Users/dallinturner/Desktop/STRAT 490R/Projects/Billable/extension"
npm run build
# Then refresh the extension at chrome://extensions
```

### Test Accounts
- **Admin:** main signup account at https://billable-three.vercel.app
- **Lawyer (manual):** sign up as Individual at https://billable-three.vercel.app/auth/signup, then set `firm_id` in Supabase Table Editor to match admin's firm_id
- **Lawyer (invite):** use Admin Settings > Team > Invite lawyer. Use `yourname+lawyer1@gmail.com` format to receive invite in your own Gmail inbox.

### Project File Structure
```
Billable/
├── CLAUDE.md
├── billable-web/                  # Next.js web app
│   ├── .env.local                 # Supabase credentials (not committed)
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx           # Root redirect
│   │   │   ├── layout.tsx         # Root layout with ThemeProvider + FOUC script
│   │   │   ├── globals.css        # Tailwind v4 + @custom-variant dark
│   │   │   ├── auth/login/        # Login page
│   │   │   ├── auth/signup/       # Signup page
│   │   │   ├── auth/callback/     # PKCE code exchange (standard login/signup)
│   │   │   ├── auth/confirm/      # Implicit flow handler (invite links)
│   │   │   ├── dashboard/         # Lawyer dashboard + settings
│   │   │   └── admin/             # Admin dashboard + settings
│   │   ├── components/
│   │   │   ├── Navbar.tsx         # Always dark header, role-based nav links
│   │   │   ├── ThemeProvider.tsx  # React context for light/dark mode
│   │   │   ├── dashboard/         # TimerCard, TimeEntryRow, NotesModal, etc.
│   │   │   └── admin/             # FilterBar, EntriesTable, EditRequestCard
│   │   ├── lib/
│   │   │   ├── supabase/          # client.ts + server.ts + admin.ts (service role)
│   │   │   └── time.ts            # Time formatting utilities
│   │   ├── middleware.ts          # Route protection + role-based redirects
│   │   └── types/database.ts     # TypeScript types
│   └── supabase/migrations/       # SQL migration files
└── extension/                     # Chrome extension
    ├── manifest.json
    ├── src/
    │   ├── popup.tsx              # Full React UI
    │   ├── background.ts          # Service worker / timer persistence
    │   ├── supabase.ts            # Supabase client for extension
    │   └── types.ts               # TypeScript types
    └── webpack.config.js
```
