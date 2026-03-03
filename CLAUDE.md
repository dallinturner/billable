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

### February 26, 2026 (voice recording session)
**Goal:** Add mic button to extension popup so lawyers can record voice notes without leaving the browser.

**What we did:**

**Phase 1 — Built the feature on web dashboard (worked)**
- Created `VoiceRecorderCard.tsx` — recording component with live timer, live transcript preview, Stop/Discard buttons. Uses `SpeechRecognition` with `continuous: true`; restarts on `onend` to handle Chrome's ~60s timeout.
- Created `/record` page at `src/app/record/page.tsx` — standalone full-screen recording page for the extension popup window.
- Created `src/app/record/actions.ts` — server actions for the record page.
- Added `initialNotes?: string` prop to `NotesModal.tsx` so transcript pre-fills the notes field.
- Added mic button to `dashboard/page.tsx` client grid — opens `VoiceRecorderCard` inline, on Stop opens `NotesModal` pre-filled with transcript.
- Added `/record` to `proxy.ts` protected routes and matcher.

**Phase 2 — Extension mic (multiple rounds of debugging)**
- **Attempt 1:** Added Web Speech API inside popup. Recorded nothing. Tried `"microphone"` in manifest permissions → extension load error (not a valid MV3 permission).
- **Attempt 2:** Added `getUserMedia()` before `SpeechRecognition.start()` to trigger mic permission. Popup closed when Chrome showed the permission dialog (defocuses popup → Chrome auto-closes it).
- **Attempt 3:** Removed `getUserMedia`. Got "Microphone access denied" — Web Speech API is blocked on `chrome-extension://` origin entirely (Chrome security policy).
- **Attempt 4:** Switched to `chrome.windows.create({ type: 'popup' })` opening the HTTPS `/record` page. Popup opened but showed admin dashboard instead → proxy was redirecting admins from `/record`. Fixed by removing that rule.
- **Attempt 5:** "Client not found" error. Root cause: RLS policy on `clients` uses `get_my_firm_id()` which calls `auth.uid()`. Browser Supabase client in the popup window had null `auth.uid()` in PostgREST context.
- **Attempt 6:** Server action with `createClient()` — same error. Still used browser session.
- **Attempt 7:** Server action with `createAdminClient()` — got "Not authorized." This meant client WAS found but belonged to a different firm. Root cause confirmed: **extension and browser are logged in as different users**.

**Phase 3 — Entry-based flow (fix for auth mismatch)**
Core insight: the extension has its own auth context (localStorage), the browser window has a different session (cookies). Browser can't validate the extension user's clients.

Fix: **extension creates the `time_entries` row first** using its own authenticated client, then passes `?entry=ENTRY_ID` to `/record`. The record page uses service-role admin client to look up everything by entry ID — no browser auth required at all.

- `extension/src/popup.tsx` — `openVoiceWindow` is now async; creates entry, opens `?entry=${entry.id}`
- `record/actions.ts` — added `getRecordDataByEntry(entryId)`, `saveRecordEntry(...)`, `deleteRecordEntry(entryId)` all using admin client
- `record/page.tsx` — reads `?entry=` param, calls `getRecordDataByEntry`, passes `existingEntryId`/`existingStartedAt` to `VoiceRecorderCard`, uses server actions for save/delete
- `VoiceRecorderCard.tsx` — added optional `existingEntryId?` and `existingStartedAt?` props. When provided: skips entry creation, uses passed start time, doesn't delete on discard (parent handles cleanup)

Web app deployed to production ✅. **Extension rebuilt but won't load in Chrome** — left for next session.

**Files changed:**
- `billable-web/src/components/dashboard/VoiceRecorderCard.tsx` — NEW: voice recording component (supports both owned-entry and pre-existing-entry modes)
- `billable-web/src/app/record/page.tsx` — NEW: standalone recording page (entry-based flow)
- `billable-web/src/app/record/actions.ts` — NEW: `getRecordDataByEntry`, `saveRecordEntry`, `deleteRecordEntry` (admin client, no browser auth needed); also original `getRecordData` kept
- `billable-web/src/components/dashboard/NotesModal.tsx` — added `initialNotes?: string` prop
- `billable-web/src/app/dashboard/page.tsx` — added mic button to client grid, VoiceRecorderCard integration
- `billable-web/src/proxy.ts` — `/record` added to protected routes (unauthenticated → login); admin redirect for `/record` intentionally NOT added
- `extension/src/popup.tsx` — `openVoiceWindow` now async, creates entry first, passes `?entry=ID`

**🚨 STOPPED HERE — Extension won't load after rebuild**
Next session must debug this first before anything else.

Debugging checklist:
1. Go to `chrome://extensions`, look at the exact error shown under the Billable extension
2. If popup error: right-click the extension icon → Inspect popup → check Console tab
3. If service worker error: click "Inspect views: service worker" link on the extension card
4. The webpack build succeeded with 0 errors (only size warnings) — likely a runtime error, not a build error
5. If all else fails: try removing the extension and re-adding the unpacked folder at `extension/`

---

### February 26, 2026
**Goal:** Phase 1 polish + onboarding wizard.

**What we did:**
- Built onboarding wizard at `/onboarding` — 3 steps: firm name + billing increment, add clients, invite lawyers. Progress indicator, skip options, success/fail states on invites.
- New admins are redirected to `/onboarding` automatically after signup (admin page checks `firm.onboarding_complete`; redirects if false).
- On wizard completion, sets `onboarding_complete = true` on the firm, redirects to `/admin`.
- Updated proxy.ts to protect `/onboarding` (unauthenticated → login, non-admins → dashboard).
- Removed billing increment from signup page — it was duplicated in the wizard. Signup now defaults to 0.1 and wizard sets the real value.
- Added `onboarding_complete boolean DEFAULT false` column to `firms` table. Ran `UPDATE firms SET onboarding_complete = true` to mark existing firms as already onboarded.
- **Tested end-to-end** ✅ — new firm signup → onboarding wizard → admin dashboard.

**Also in this session (Phase 1 polish):**
- Created `/dashboard/stats` page with time range selector, summary cards, 8-week bar chart, hours by client, hours by task type.
- Added "Stats" link to Navbar, renamed "Dashboard" → "Hours", added active state via usePathname.
- Added inline client rename in admin settings.
- Confirmed middleware cleanup complete (`src/middleware.ts` gone, `src/proxy.ts` only).

**Files changed:**
- `billable-web/src/app/onboarding/page.tsx` — NEW: onboarding wizard
- `billable-web/src/app/dashboard/stats/page.tsx` — NEW: lawyer stats dashboard
- `billable-web/src/components/Navbar.tsx` — Stats link, active states, Hours rename
- `billable-web/src/app/admin/settings/page.tsx` — inline client rename
- `billable-web/src/app/admin/page.tsx` — onboarding redirect if !firm.onboarding_complete
- `billable-web/src/app/auth/signup/page.tsx` — removed billing increment field
- `billable-web/src/proxy.ts` — added /onboarding protection + matcher
- `billable-web/src/types/database.ts` — added onboarding_complete to Firm type

**Supabase changes:**
- `ALTER TABLE firms ADD COLUMN IF NOT EXISTS onboarding_complete boolean DEFAULT false`
- `UPDATE firms SET onboarding_complete = true` (marks existing firms as onboarded)

---

### February 26, 2026 (earlier — Phase 1 start)
**Goal:** Phase 1 polish — lawyer stats dashboard, client name editing, navbar active states.

**What we did:**
- Created `/dashboard/stats` page with:
  - Time range selector: This week / This month / 3 months / All time
  - Summary cards: total billed hours, total sessions, unique clients
  - 8-week bar chart (current week highlighted dark, past weeks gray)
  - Hours by client (horizontal progress bars, sorted descending)
  - Hours by task type (same)
- Added "Stats" link to Navbar for individual/lawyer role
- Renamed "Dashboard" nav link to "Hours" for clarity
- Added active state highlighting to all Navbar links (`usePathname`)
- Added inline client rename to admin settings: Rename button opens an inline input, saves on submit, cancels on escape
- Confirmed `src/middleware.ts` is deleted — only `src/proxy.ts` exists (known issue resolved)

**Files changed:**
- `billable-web/src/app/dashboard/stats/page.tsx` — NEW: lawyer stats dashboard
- `billable-web/src/components/Navbar.tsx` — added Stats link, active state via usePathname, renamed "Dashboard" to "Hours"
- `billable-web/src/app/admin/settings/page.tsx` — added inline client rename (editingClientId state + handleRenameClient)

---

### February 23, 2026 (second session)
**Goal:** Redesign invite email template and push it live to Supabase.

**What we did:**
- Iterated on `billable-invite-email.html` through multiple rounds of feedback:
  - Fixed black text on black background — Gmail strips `color:#ffffff` from heading tags. Fix requires `color:... !important` AND wrapping all text in `<font color="...">` tags as a double layer.
  - Fixed font mismatch — email was using Georgia/serif; website uses Geist Sans. Replaced all fonts with `'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif` throughout. Fixed "Billable" wordmark to match Navbar: `font-weight:600; letter-spacing:-0.3px` (not uppercase, not bold 700, no letter-spacing gap).
  - Added full app mockup images inside each of the three feature cards:
    - **Feature 1 (One-click timers):** Mini navbar + client grid with SA card inverted/dark (active) + green `● Active` badge + timer card below
    - **Feature 2 (Voice notes):** Center modal (notes popup with task type dropdown, transcribed text, red `● Recording...` button) flanked by dimmed faded background
    - **Feature 3 (Auto-rounded hours):** Entries table with CLIENT & TASK | ACTUAL TIME | BILLED columns + footer with billing increment
  - Added Chrome extension section: full macOS desktop (`#1c1c1e`) wrapping a 600px Chrome browser (title bar with traffic lights, tab bar, toolbar with address bar + highlighted Billable ⏱ icon with blue ring). Two-column content area: webpage on left, popup at exactly 256px (w-64) on right, with CSS triangle pointing up to the icon.
  - Made all inner boxes have `border-radius` set explicitly on both outer tables and inner `<td>` cells with backgrounds.
- **Pushed invite email to Supabase via CLI:**
  - Installed Supabase CLI via Homebrew (`brew install supabase/tap/supabase`)
  - Authenticated with `supabase login`
  - Created `billable-web/supabase/config.toml` and `billable-web/supabase/templates/invite.html`
  - **Gotcha:** First `config push` accidentally overwrote production settings with local dev defaults (`site_url = http://127.0.0.1:3000`). Fixed by adding all correct production values to `config.toml` and pushing again.
  - Invite email is now live in Supabase with the custom HTML template.
  - **Note:** User wants further email design iteration in a future session.

**Files changed:**
- `billable-invite-email.html` — full rewrite with mockups, rounded corners, active client highlight, Chrome desktop view
- `billable-web/supabase/config.toml` — NEW: Supabase config with production auth settings + email template reference
- `billable-web/supabase/templates/invite.html` — NEW: copy of invite email HTML used by Supabase CLI

---

### February 23, 2026 (first session)
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
- Full lawyer dashboard — timer, client grid, notes, manual entry, submit all, edit requests, mic button for voice recording
- Full admin dashboard — submitted entries, filters, edit request approve/deny
- Lawyer invite flow — admin invites by email, lawyer receives invite, clicks link, lands on dashboard
- `/record` page — standalone recording page for extension popup, fully deployed, entry-based flow (no browser auth dependency)
- Browser extension — client list, timer, notes, syncs with web app (mic button code written but extension currently broken)
- Light/dark mode on all pages
- Auth — signup, login, role-based redirect, protected routes
- Custom invite email — fully branded HTML template live in Supabase
- Onboarding wizard — new firm signup → 3-step wizard → admin dashboard
- Lawyer stats dashboard — time range selector, bar chart, hours by client/task type

### Known Issues
1. **🚨 Extension won't load** — After rebuilding with voice recording changes (`openVoiceWindow` now async + entry creation), extension fails to load in Chrome. Exact error unknown — must check `chrome://extensions` next session.
2. **RLS disabled on `firms` table** — low risk (table only has name + billing_increment). Could re-enable later with a permissive read policy.
3. **Invite email — more design iteration planned** — current template is live and functional but user wants further design changes in a future session.

---

## Next Steps (Priority Order)

### Immediate — unblock extension
1. [ ] **Debug extension load failure** — check `chrome://extensions` error, inspect popup DevTools console, fix and rebuild

### Phase 1 remaining
2. [ ] Iterate on invite email design (user has more changes in mind — edit `billable-invite-email.html`, copy to `billable-web/supabase/templates/invite.html`, run `supabase config push`)

### Phase 5 — Onboarding & Setup
3. [ ] Onboarding wizard — post-signup flow: name firm → billing increment → add clients → invite first lawyer
4. [ ] Bulk lawyer invite — paste list of emails or CSV upload

### Phase 2 — Marketing
5. [ ] Landing page at root URL (currently redirects straight to login)
6. [ ] Pricing page

### Phase 3 — Monetization
7. [ ] Stripe integration — subscription billing, per-seat pricing
8. [ ] Free trial logic — gate dashboard after 14 days without subscription

### Phase 4 — Export & Reporting
9. [ ] CSV/PDF export of time entries
10. [ ] Invoice generation (hours × rate = invoice PDF)
11. [ ] Admin analytics — firm-wide reporting by lawyer, client, month

---

## Future Features (Post-MVP)

- **Lawyer stats dashboard** — personal analytics section: hours per client, hours per week, breakdown by task type
- **Bulk lawyer onboarding** — CSV import or bulk invite instead of one at a time
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

# Update invite email template in Supabase
# 1. Edit billable-invite-email.html (source of truth)
# 2. Copy it to the supabase templates folder:
cp "/Users/dallinturner/Desktop/STRAT 490R/Projects/Billable/billable-invite-email.html" \
   "/Users/dallinturner/Desktop/STRAT 490R/Projects/Billable/billable-web/supabase/templates/invite.html"
# 3. Push to Supabase:
cd "/Users/dallinturner/Desktop/STRAT 490R/Projects/Billable/billable-web"
supabase config push --project-ref pzdbsnrxnpszvznrlftc
# NOTE: supabase config push overwrites ALL auth settings with config.toml values.
# Always keep config.toml up to date with correct production values before pushing.
# If you accidentally push local dev defaults, re-push with the correct values in config.toml.
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
│   │   ├── proxy.ts               # Route protection + role-based redirects (renamed from middleware.ts)
│   │   └── types/database.ts      # TypeScript types
│   └── supabase/
│       ├── config.toml            # Supabase CLI config (auth settings + email template reference)
│       ├── templates/
│       │   └── invite.html        # Custom invite email HTML (copy of billable-invite-email.html)
│       └── migrations/            # SQL migration files
└── extension/                     # Chrome extension
    ├── manifest.json
    ├── src/
    │   ├── popup.tsx              # Full React UI
    │   ├── background.ts          # Service worker / timer persistence
    │   ├── supabase.ts            # Supabase client for extension
    │   └── types.ts               # TypeScript types
    └── webpack.config.js
```
