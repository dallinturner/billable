# Billable - Project Context

## What This Product Is
A billable hours tracking tool for lawyers and law firms. Solves the problem of lawyers losing revenue by missing billable hours. Built for solo practitioners and law firms of all sizes.

## Current Status
- **Phase:** MVP fully built and verified end-to-end. Ready for polish and deployment.
- **Last Session:** February 19, 2026
- **Next Step:** UI polish pass (extension width + light/dark mode toggle), then test edit request flow, then deploy to Vercel.

## Tech Stack
- **Framework:** Next.js 16 (App Router) + TypeScript
- **Database & Auth:** Supabase (PostgreSQL + Supabase Auth)
- **Styling:** Tailwind CSS
- **Browser Extension:** Chrome Extension (Manifest V3) + React + Webpack
- **Voice-to-text:** Web Speech API (built into Chrome, free)

## Supabase Project
- **URL:** https://pzdbsnrxnpszvznrlftc.supabase.co
- **Anon key:** stored in `billable-web/.env.local`
- **Email confirmations:** disabled (turned off in Auth > Providers > Email)

## What Has Been Built

### Web App (`/billable-web`)
- **Next.js 16** project with TypeScript, Tailwind CSS, App Router
- **Supabase client** set up in `src/lib/supabase/client.ts` (browser) and `src/lib/supabase/server.ts` (server)
- **Types** defined in `src/types/database.ts` (Firm, User, Client, TaskType, TimeEntry, EditRequest)
- **Time utilities** in `src/lib/time.ts` (rounding, formatting, grouping)

**Auth**
- `/auth/login` — email/password login with role-based redirect (admin → /admin, lawyer/individual → /dashboard)
- `/auth/signup` — account type selector (Individual or Law Firm), creates firm + user records on signup
- `/auth/callback` — Supabase OAuth callback handler
- `src/middleware.ts` — protects `/dashboard` and `/admin` routes, redirects unauthenticated users to login

**Lawyer Dashboard (`/dashboard`)**
- Live timer card with elapsed counter (`TimerCard.tsx`)
- One-click client grid to start timers
- Stop / Switch Client buttons → open notes popup
- Notes popup (`NotesModal.tsx`) with task type dropdown + voice-to-text (Web Speech API)
- Full entry history grouped by date (`TimeEntryRow.tsx`) with inline editing of draft entries
- Manual entry form (`ManualEntryForm.tsx`) for after-the-fact time entries
- "Submit all" button to push all draft entries to admin
- Edit request modal (`EditRequestModal.tsx`) for requesting changes to submitted entries

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

**Shared**
- `Navbar.tsx` — top nav with sign out, links to admin/dashboard based on role

### Database (`/billable-web/supabase/migrations/001_initial_schema.sql`)
- **Fully migrated to Supabase** — all tables created and verified
- Tables: `firms`, `users`, `clients`, `task_types`, `time_entries`, `edit_requests`
- Enums: `user_role`, `entry_status`, `edit_request_status`
- RLS enabled on all tables with policies for lawyers and admins
- Helper functions: `get_my_firm_id()`, `get_my_role()` (security definer)
- 10 global default task types seeded
- **Note:** RLS is disabled on `firms` table (was blocking signup flow — see known issues below)
- Indexes on all FK and commonly filtered columns

### Browser Extension (`/extension`)
- `manifest.json` — Manifest V3, permissions: storage + alarms
- `src/background.ts` — service worker, persists timer state across popup close via `chrome.storage.local`
- `src/popup.tsx` — full React UI: logged-out state → client list → active timer view → notes form with voice-to-text
- `src/supabase.ts` — Supabase client using `chrome.storage.local` for auth token persistence
- `src/types.ts` — shared TypeScript types for the extension
- `webpack.config.js` — bundles React + TypeScript for the extension
- **Status:** Code written, dependencies installed. Not yet built or loaded into Chrome.

## Known Issues / In Progress

### 1. RLS disabled on firms table
- **Why:** Client-side inserts to `firms` and `users` during signup were failing because `auth.uid()` wasn't available in RLS context immediately after `signUp()`
- **Fix applied:** Created a `handle_signup()` Postgres function with `SECURITY DEFINER` that creates both the firm and user profile atomically, bypassing RLS. Signup page now calls `supabase.rpc('handle_signup', ...)` instead of doing two separate inserts.
- **Remaining:** RLS is still disabled on `firms` table. Low risk (firms table only has name + billing_increment), but could re-enable with a permissive policy once the SECURITY DEFINER flow is the only write path.

### 2. Extension UI is narrow and needs polish
- The popup is functional but visually cramped
- Planned fix: widen the popup, improve layout and spacing
- Will be done in the same pass as the light/dark mode work

### 3. Middleware deprecation warning
- Next.js 16 shows: `The "middleware" file convention is deprecated. Please use "proxy" instead.`
- Not breaking, but will need to rename `src/middleware.ts` → `src/proxy.ts` eventually

## Remaining Steps

- [x] Fix signup bug (handle_signup SECURITY DEFINER function)
- [x] End-to-end test core web app loop:
  - Sign up as firm admin ✅
  - Add clients in settings ✅
  - Start/stop timer on lawyer dashboard ✅
  - Fill notes popup, save draft entry ✅
  - Submit draft → appears in admin dashboard with notes ✅
- [x] Build and load browser extension into Chrome
- [x] End-to-end test extension loop:
  - Sign in via extension login form ✅
  - Start timer from client list ✅
  - Stop timer, fill notes ✅
  - Confirm draft entry appears in lawyer dashboard ✅
  - Submit → confirm appears in admin dashboard ✅
- [ ] **UI polish pass** (do these together):
  - Add light/dark mode toggle (user preference, persisted) — white/black themes
  - Fix extension popup width and layout
  - General spacing and visual cleanup
- [ ] Test edit request flow end-to-end:
  - Lawyer clicks "Request edit" on a submitted entry
  - Admin sees it in the Edit Requests tab
  - Admin approves/denies and changes apply
- [ ] Fix middleware deprecation warning (rename `src/middleware.ts` → `src/proxy.ts`)
- [ ] Deploy web app to Vercel
- [ ] Update extension `.env` `WEBAPP_URL` to production URL before distributing

## How to Resume Development

### Start the web app
```bash
cd "/Users/dallinturner/Desktop/STRAT 490R/Projects/Billable/billable-web"
npm run dev
# Opens at http://localhost:3000
```

### Rebuild the extension after code changes
```bash
cd "/Users/dallinturner/Desktop/STRAT 490R/Projects/Billable/extension"
npm run build
# Then go to chrome://extensions and click the refresh icon on the Billable card
```

### Test accounts
- Admin account is whatever you signed up with at http://localhost:3000/auth/signup
- To add a lawyer account: sign up with a new email at /auth/signup, select "Individual", then manually update their `firm_id` in Supabase Table Editor → users to match your firm's ID

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
│   │   │   ├── auth/login/        # Login page
│   │   │   ├── auth/signup/       # Signup page
│   │   │   ├── auth/callback/     # Supabase auth callback
│   │   │   ├── dashboard/         # Lawyer dashboard
│   │   │   └── admin/             # Admin dashboard + settings
│   │   ├── components/
│   │   │   ├── Navbar.tsx
│   │   │   ├── dashboard/         # TimerCard, TimeEntryRow, NotesModal, etc.
│   │   │   └── admin/             # FilterBar, EntriesTable, EditRequestCard
│   │   ├── lib/
│   │   │   ├── supabase/          # client.ts + server.ts
│   │   │   └── time.ts            # Time formatting utilities
│   │   ├── middleware.ts           # Route protection
│   │   └── types/database.ts      # TypeScript types
│   └── supabase/migrations/       # SQL migration files
└── extension/                     # Chrome extension
    ├── manifest.json
    ├── src/
    │   ├── popup.tsx
    │   ├── background.ts
    │   ├── supabase.ts
    │   └── types.ts
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
