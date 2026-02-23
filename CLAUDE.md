# Billable - Project Context

## What This Product Is
A billable hours tracking tool for lawyers and law firms. Solves the problem of lawyers losing revenue by missing billable hours. Built for solo practitioners and law firms of all sizes.

## Current Status
- **Phase:** MVP fully built, deployed, and live. Core flows tested end-to-end.
- **Last Session:** February 23, 2026
- **Next Step:** Confirm invite email arrives in lawyer's inbox. Then fix middleware deprecation warning (rename `src/middleware.ts` → `src/proxy.ts`).

## Live URLs
- **Production:** https://billable-three.vercel.app
- **Vercel Project:** https://vercel.com/dallin-turners-projects/billable
- **GitHub Repo:** https://github.com/dallinturner/billable (public)

## Deployment
- Hosted on Vercel under "Dallin Turner's projects" team
- GitHub auto-deploy IS connected (pushes to `main` trigger auto-deploy)
- If auto-deploy ever fails, run manually from repo root:
  ```bash
  cd "/Users/dallinturner/Desktop/STRAT 490R/Projects/Billable"
  vercel --prod --scope dallin-turners-projects
  ```
- Vercel project name: `billable` (NOT `billable-web` — that was an old failed project)
- Root directory in Vercel is set to `billable-web`
- Environment variables set in Vercel dashboard (Production + Preview + Development):
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Important:** When adding env vars via Vercel dashboard UI, paste carefully — the anon key previously got a newline injected mid-value which broke auth. Use CLI instead:
  ```bash
  echo "value" | vercel env add KEY production --scope dallin-turners-projects
  ```

## Tech Stack
- **Framework:** Next.js 16 (App Router) + TypeScript
- **Database & Auth:** Supabase (PostgreSQL + Supabase Auth)
- **Styling:** Tailwind CSS v4 (class-based dark mode via `@custom-variant dark`)
- **Browser Extension:** Chrome Extension (Manifest V3) + React + Webpack
- **Voice-to-text:** Web Speech API (built into Chrome, free)

## Supabase Project
- **URL:** https://pzdbsnrxnpszvznrlftc.supabase.co
- **Anon key:** stored in `billable-web/.env.local` (local) and Vercel env vars (production)
- **Email confirmations:** disabled (turned off in Auth > Providers > Email)
- **Auth redirect URLs:** https://billable-three.vercel.app added to allowed URLs

## What Has Been Built

### Web App (`/billable-web`)
- **Next.js 16** project with TypeScript, Tailwind CSS, App Router
- **Supabase client** set up in `src/lib/supabase/client.ts` (browser) and `src/lib/supabase/server.ts` (server)
- **Types** defined in `src/types/database.ts` (Firm, User, Client, TaskType, TimeEntry, EditRequest)
- **Time utilities** in `src/lib/time.ts` (rounding, formatting, grouping)
- **ThemeProvider** in `src/components/ThemeProvider.tsx` — React context, persists to localStorage, applies `.dark` class to `<html>`

**Design System**
- Monochrome — no indigo/blue accents anywhere
- Navbar: always `bg-gray-950` (dark), regardless of theme
- Light mode: white/gray-50 backgrounds, gray-900 text
- Dark mode: gray-950/gray-900 backgrounds, white text
- Client lists use initials avatars + SVG chevrons (matching extension style)
- `@custom-variant dark (&:where(.dark, .dark *))` in globals.css enables class-based dark mode

**Auth**
- `/auth/login` — email/password login with role-based redirect (admin → /admin, lawyer/individual → /dashboard)
- `/auth/signup` — account type selector (Individual or Law Firm), creates firm + user records on signup
- `/auth/callback` — Supabase OAuth callback handler
- `src/middleware.ts` — protects `/dashboard` and `/admin` routes, redirects unauthenticated users to login

**Lawyer Dashboard (`/dashboard`)**
- Live timer card with elapsed counter (`TimerCard.tsx`) — always dark bg-gray-950
- One-click client grid with initials avatars to start timers
- Stop / Switch Client buttons → open notes popup
- Notes popup (`NotesModal.tsx`) with task type dropdown + voice-to-text (Web Speech API)
- Full entry history grouped by date (`TimeEntryRow.tsx`) with inline editing of draft entries
- "Edit requested" orange badge on submitted entries with a pending edit request
- "Request edit" button disabled when a pending edit request already exists
- Manual entry form (`ManualEntryForm.tsx`) for after-the-fact time entries
- "Submit all" button to push all draft entries to admin
- Edit request modal (`EditRequestModal.tsx`) for requesting changes to submitted entries
- Navbar shows: Dashboard + Settings links (role="individual" hardcoded — prevents admin users from seeing admin nav)

**Lawyer Settings (`/dashboard/settings`)**
- Appearance section: light/dark mode toggle
- Profile section: update display name
- Email shown (pulled from authUser.email, not User type)

**Admin Dashboard (`/admin`)**
- Stats overview: submitted entries, billable hours, lawyer count, pending edit requests
- Filter bar by lawyer / client / task type / date range (`FilterBar.tsx`)
- Entries table with totals (`EntriesTable.tsx`)
- Edit requests tab with approve/deny actions that apply proposed changes to the entry (`EditRequestCard.tsx`)

**Admin Settings (`/admin/settings`)**
- Set billing increment (0.1, 0.25, 0.5, 1.0 hr)
- Add/deactivate clients and matters
- Add/deactivate task types
- Team member list and invite flow
- Appearance section: light/dark mode toggle

**Shared**
- `Navbar.tsx` — top nav with sign out. Shows admin links when `role="admin"`, lawyer links when `role="individual"`

### Database (`/billable-web/supabase/migrations/001_initial_schema.sql`)
- **Fully migrated to Supabase** — all tables created and verified
- Tables: `firms`, `users`, `clients`, `task_types`, `time_entries`, `edit_requests`
- Enums: `user_role`, `entry_status`, `edit_request_status`
- RLS enabled on all tables with policies for lawyers and admins
- Helper functions: `get_my_firm_id()`, `get_my_role()` (security definer)
- 10 global default task types seeded
- **Note:** RLS is disabled on `firms` table (was blocking signup flow — see known issues below)
- Indexes on all FK and commonly filtered columns

**RLS Fix Applied (Feb 20):**
The `time_entries` update policy was missing a `WITH CHECK` clause, causing `Submit all` to silently fail. Fixed by running:
```sql
DROP POLICY "Users can update own draft entries" ON time_entries;
CREATE POLICY "Users can update own draft entries"
  ON time_entries FOR UPDATE
  USING (user_id = auth.uid() AND status = 'draft')
  WITH CHECK (user_id = auth.uid());
```

### Browser Extension (`/extension`)
- `manifest.json` — Manifest V3, permissions: storage + alarms
- `src/background.ts` — service worker, persists timer state across popup close via `chrome.storage.local`
- `src/popup.tsx` — full React UI: logged-out state → client list → active timer view → notes form with voice-to-text
- `src/supabase.ts` — Supabase client using `chrome.storage.local` for auth token persistence
- `src/types.ts` — shared TypeScript types for the extension
- `webpack.config.js` — bundles React + TypeScript for the extension
- **Status:** Built and tested end-to-end. `WEBAPP_URL` updated to `https://billable-three.vercel.app` ✅
- **Extension design:** Dark `bg-gray-950` header, client initials avatars, SVG chevrons, `w-64` width

## Known Issues / In Progress

### 1. RLS disabled on firms table
- **Why:** Client-side inserts to `firms` and `users` during signup were failing because `auth.uid()` wasn't available in RLS context immediately after `signUp()`
- **Fix applied:** Created a `handle_signup()` Postgres function with `SECURITY DEFINER` that creates both the firm and user profile atomically, bypassing RLS. Signup page now calls `supabase.rpc('handle_signup', ...)` instead of doing two separate inserts.
- **Remaining:** RLS is still disabled on `firms` table. Low risk (firms table only has name + billing_increment), but could re-enable with a permissive policy once the SECURITY DEFINER flow is the only write path.

### 2. Middleware deprecation warning
- Next.js 16 shows: `The "middleware" file convention is deprecated. Please use "proxy" instead.`
- Not breaking, but will need to rename `src/middleware.ts` → `src/proxy.ts` eventually

### 3. Lawyer invite flow — working, email delivery unconfirmed
- Server action (`/admin/settings/actions.ts`) uses `auth.admin.inviteUserByEmail()` with service role key
- After invite, server action inserts directly into `public.users` using admin client (bypasses RLS)
- `SUPABASE_SERVICE_ROLE_KEY` added to `.env.local` and Vercel production env vars
- Admin client at `src/lib/supabase/admin.ts`
- Invited user confirmed appearing in Supabase Auth > Users ✅
- **Unconfirmed:** Invite email delivery not yet verified — check inbox/spam next session

## Remaining Steps

- [x] Fix signup bug (handle_signup SECURITY DEFINER function)
- [x] End-to-end test core web app loop ✅
- [x] Build and load browser extension into Chrome ✅
- [x] End-to-end test extension loop ✅
- [x] UI polish pass:
  - Light/dark mode toggle (persisted in localStorage) ✅
  - Full web app redesign — monochrome, no indigo ✅
  - Extension redesigned — dark header, initials avatars, SVG chevrons ✅
  - Dark mode toggle moved to Settings pages (lawyer + admin) ✅
  - Lawyer settings page created at `/dashboard/settings` ✅
- [x] Fix Submit all bug (RLS WITH CHECK clause) ✅
- [x] Add "Edit requested" badge to lawyer dashboard ✅
- [x] Deploy web app to Vercel ✅ → https://billable-three.vercel.app
- [x] Test edit request flow end-to-end ✅
  - Fixed bug: `handleEditRequest` wasn't calling `loadData()` after insert, so badge didn't appear immediately
- [x] Update extension `.env` `WEBAPP_URL` to `https://billable-three.vercel.app` ✅
- [x] Lawyer invite flow — server action working, user appears in Supabase ✅ (email delivery unconfirmed)
- [ ] **Confirm invite email arrives** in lawyer's inbox
- [ ] Fix middleware deprecation warning (rename `src/middleware.ts` → `src/proxy.ts`)

## How to Resume Development

### Start the web app locally
```bash
cd "/Users/dallinturner/Desktop/STRAT 490R/Projects/Billable/billable-web"
npm run dev
# Opens at http://localhost:3000
```

### Deploy to production
```bash
cd "/Users/dallinturner/Desktop/STRAT 490R/Projects/Billable"
git add -p
git commit -m "your message"
git push
# Vercel auto-deploys from GitHub push
# If auto-deploy fails, run: vercel --prod --scope dallin-turners-projects
```

### Rebuild the extension after code changes
```bash
cd "/Users/dallinturner/Desktop/STRAT 490R/Projects/Billable/extension"
npm run build
# Then go to chrome://extensions and click the refresh icon on the Billable card
```

### Test accounts
- **Admin:** your main signup account at https://billable-three.vercel.app
- **Lawyer:** signed up with `yourname+lawyer@gmail.com`, role "Individual", `firm_id` manually set in Supabase Table Editor to match admin's firm_id
- To create more lawyer accounts: same process — sign up as Individual, set firm_id in Supabase
- **Invite flow (in progress):** Admin Settings > Team > Invite lawyer — sends invite via Supabase. Email delivery unconfirmed — debug next session.

### Supabase
- Dashboard: https://supabase.com/dashboard/project/pzdbsnrxnpszvznrlftc
- SQL Editor: for running any schema changes
- Table Editor: for inspecting data while debugging

## Project File Structure
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
│   │   │   ├── auth/callback/     # Supabase auth callback
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
│   │   ├── middleware.ts           # Route protection
│   │   └── types/database.ts      # TypeScript types
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

---

## MVP Scope

### Platform
- **Browser extension** (desktop widget) — built first
- **Web app** for dashboards
- **Mobile native app** with widget — later, post-MVP

### Core Interaction (Browser Extension Widget)
- Widget lists all billable clients/matters
- Click a client to start the timer
- Click stop or switch to another client to end the timer
- Notes popup appears with:
  - Task type dropdown (predefined list)
  - Voice-to-text option for recording what was done
- Time displayed as both exact time and rounded to the firm's billing increment

### Account Types

**Individual Account**
- Solo practitioner managing themselves

**Firm Account**
- Admin/manager sets up the account
- Admin manages: lawyers, clients/matters, billing increments, task type list
- Admin sees all submitted lawyer dashboards
- Admin can drill down into any individual lawyer's data

### Lawyer Personal Dashboard
- Full history of all tracked sessions including notes
- Edit time, notes, and task type before submitting to admin
- Manually add billable hours after the fact
- Submit hours to the admin dashboard
- After submission, can request edits — admin is notified and approves or denies

### Admin Dashboard
- Sees all submitted hours across all lawyers
- Drill down into individual lawyer records
- Filter and view by: client, lawyer, task type, and more
- Approves or denies lawyer edit requests post-submission

### Task Types
- Start with a predefined list (e.g., Research, Drafting, Client Call, Court Appearance, etc.)
- Admin can add to or remove from the list
- **Future:** AI auto-categorization from notes

### Billing Increments
- Admin sets the firm's billing increment (e.g., 0.1 hour / 6-minute increments)
- Dashboard shows both exact time worked and calculated billable hours side by side

## Monetization
- Base fee + per seat pricing (subject to change)

## Future Features (Post-MVP)
- **Lawyer stats dashboard** — section on the lawyer dashboard showing personal analytics: hours worked per client, hours per week, breakdown by task type, etc. Gives lawyers visibility into their own billing patterns at a glance.
- **Bulk lawyer onboarding** — way for a law firm to upload all their lawyers and info quickly (CSV import or bulk invite form) instead of inviting one at a time
- AI auto-categorization of task types from notes
- Smart inactivity detection to auto-pause timers
- Integrations with legal billing software (Clio, MyCase, QuickBooks, etc.)
- Mobile native app with home screen widget (iOS and Android)
- Invoice generation

## Key Product Decisions Made
- Widget is essential to the core value prop — it enables quick one-click switching between clients
- Notes are private to the lawyer until they submit to the admin dashboard
- Submissions go straight to the admin dashboard (no approval step on initial submission, only on edits)
- Clients vs. matters are handled at setup — admin inputs billable line items, which become what appears in the widget
- Stop button triggers the notes popup (smart auto-pause comes later)
