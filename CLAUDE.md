# CLAUDE.md — Sigma Nu Mu Xi Alumni Hub

This file is read automatically by Claude Code at the start of every session.
Full architecture details are in `docs/ARCHITECTURE.md`. Read that file before writing any code.

---

## Project Identity

**Sigma Nu Fraternity, Mu Xi Chapter — Columbus State University**
Production web application. Not a prototype. Code must be production-quality.

---

## Locked Stack

| Layer | Decision |
|---|---|
| Framework | Next.js 14+ — App Router, TypeScript strict mode |
| Database | Supabase (managed PostgreSQL) |
| Auth | Supabase Auth — email/password + Google, Facebook, Apple OAuth |
| Storage | Supabase Storage (profile photos) |
| Family Tree | React Flow |
| Payments | Stripe |
| Hosting | Vercel |
| Styling | Tailwind CSS + shadcn/ui |

Do not suggest alternatives to any of these without flagging it explicitly.

---

## Key Data Model Facts

- `members` table has a `big_id` nullable self-referencing FK — this drives the entire family tree
- `members.status` enum: `pending` | `member` | `admin` — default is `pending`
- `members.pledge_class` is a text field selected from a generated ordered enum (Alpha → Omega, then Beta Alpha → Omega Omega, 600 total). No year field. Names never repeat.
- `registrations.member_id` is nullable — pending users can register before approval
- `registrations.payment_status` enum: `unpaid` | `paid` | `refunded`
- `registration_guests` is a separate table — not a comma-separated text field on registrations
- `badges` table is admin-assigned only — members cannot assign their own badges
- `members.pin_number` is unique (DB constraint), set once by the member, editable by admins only afterward. Visible to all authenticated users.
- See `docs/ARCHITECTURE.md` Section 3 for full column definitions and query patterns

---

## Access Control

| Status | Access |
|---|---|
| Public (unauthenticated) | Event landing page only |
| `pending` | Event registration form and confirmation only |
| `member` | Full access — directory, family tree, profiles, registration |
| `admin` | Everything + admin panel |

- Enforce in Next.js middleware — never client-side only
- See `docs/ARCHITECTURE.md` Section 4 for full details

---

## Code Standards

- TypeScript strict mode throughout. No `any` types.
- All Supabase queries through typed client. No raw SQL strings in components.
- Auth checks enforced in middleware, not just on the client.
- No TODO stubs in shipped code. No shortcuts.
- Every API route validates the caller's session and status before doing anything.

---

## Branding

- Sigma Nu colors: Black, White, and Gold (navy was never an official color)
- Primary Black: `#0B0B0C` — token `sn-black`
- Secondary Black: `#121214` — token `sn-black-secondary`
- Gold: `#C6A75E` — token `sn-gold`
- Gold Light: `#E0C97F` — token `sn-gold-light`
- Gray Dark: `#2A2A2E` — token `sn-gray-dark`
- Gray Medium: `#6B6B73` — token `sn-gray-medium`
- Gray Light: `#D1D1D6` — token `sn-gray-light`
- Off White: `#F5F5F7` — token `sn-off-white`
- shadcn/ui as base component library with Sigma Nu theming on top
- Must not look like a generic template

---

## Current Build Phase

> **Update this section at the start of each session to reflect where you are.**

All 17 phases complete. Build clean at 34 routes.

Last completed: Phase 17 — Guest Registration Flow + Navigation fixes.

Completed phases summary:

- Phase 1–2: Scaffold, Supabase schema/RLS/storage
- Phase 3: Auth (email/password, OAuth callback, pending enforcement)
- Phase 4: Member profiles (view/edit, photo upload, one-time pin)
- Phase 5: Event registration + Stripe checkout/webhook
- Phase 6: Admin panel (members, registrations, badges, CSV export)
- Big Brother selector added: members set own big_id freely (circular ref guard)
- Phase 7: Brother directory (search name/nickname/pin, pledge class filter)
- Phase 8: Family tree (React Flow + dagre, node selection/lineage highlight, search-to-fly)
- Demo seed: 50 members via `npm run seed:demo`
- Phase 9: Email notifications via Resend (welcome, registration confirm, admin alert)
- Phase 10: Google OAuth button, custom 404, profile completeness nudge, Big/Littles on profiles
- Phase 11: Event manager refactor — multi-event system, /events/[id] routes, admin event CRUD, status enum (draft/published/archived)
- Phase 12: Auth hardening — forgot password flow, reset password page, duplicate email interception on signup
- Phase 13: Profile expansion — street_address/zip/country/birthday/show_* columns; Google Places autocomplete; privacy toggles; react-image-crop before upload
- Phase 14: Referral/invite system — referrals table, /join?token= public route, JoinForm, POST /api/referrals, completeReferral server action, invite section on profile page, admin referred_by display, /admin/referrals list with cancel
- Phase 15: Authenticated homepage (/home) — welcome header, upcoming events, birthdays this month, announcements, quick links; /my-events with react-day-picker calendar; announcements table + admin CRUD (/admin/announcements)
- Phase 16: Design and UX modernization — Syne/Inter fonts, sn-surface token, rounded-sm buttons, 4 button variants, card elevation, sonner toasts, skeleton loaders, Lucide icons, family tree restyling + touch + zoom, Supabase Realtime on payments, mobile overflow fix, focus rings
- Phase 17: Guest registration flow — /events/[id]/register/guest (public form + confirmation), GuestRegistrationForm, GuestSignupCTA, guestActions.ts (admin client, email+event duplicate check), sessionStorage prefill on /signup; homepage "Register Now" → /events/[id]; ΣΝ logo clickable on all auth/join layouts

Key runtime decisions:

- Next.js 16.2.2 (not 14) — uses proxy.ts not middleware.ts, export named `proxy`
- Tailwind v4 CSS-based config — @theme inline {} in globals.css
- shadcn base-nova uses @base-ui/react — no Radix asChild, no form.tsx wrapper
- exactOptionalPropertyTypes: true — optional props need explicit `| undefined`
- Stripe API version: "2026-03-25.dahlia" (stripe npm v22)
- pin_number: set once by member (admin client action), unique DB constraint
- Profile photos: stored as path in members.profile_photo_url, signed URLs (1hr) server-side; cropped 1:1 at 512px before upload via react-image-crop
- proxy.ts PUBLIC_ROUTES: `["/", "/auth/callback", "/auth/forgot-password", "/auth/reset-password", "/api/stripe", "/events", "/join"]`
- proxy.ts PENDING_ALLOWED: `["/register", "/events"]`
- Post-login redirect: `/home` (was `/`)
- Birthdays this month on /home: fetched via admin client (show_birthday=true), month-filtered client-side in JS (birthday stored YYYY-MM-DD text)
- react-day-picker v9 used in EventsCalendar; custom inline styles for dark theme (CSS vars override)
- Email: RESEND_API_KEY required; RESEND_FROM_EMAIL optional (defaults to `onboarding@resend.dev`)
- Google OAuth: on by default; Facebook/Apple need NEXT_PUBLIC_*_OAUTH_ENABLED=true
- Events use status enum (draft/published/archived) for visibility; registration_open boolean controls whether CTA buttons appear on /events/[id]
- Canonical event routes: /events/[id] (public detail), /events/[id]/register (auth-required alumni form), /events/[id]/register/guest (public guest form)
- Alumni register at /events/[id]/register lives in src/app/events/[id]/register/(alumni)/ route group — (alumni) layout auth-gates it without blocking the guest/ sibling
- Guest registration: member_id=null, duplicate check by email+event_id, uses createAdminClient(); Stripe success_url → /events/[id]/register/guest/confirmation?session_id=...
- GuestSignupCTA: writes sessionStorage "guest_prefill" {first_name, last_name, email, phone} then router.push("/signup")
- SignupForm: reads "guest_prefill" from sessionStorage on mount, prefills fields, renders email as readOnly with note; removes key immediately
- Homepage "Register Now" links to /events/[id] (event detail page) not directly to /register
- ΣΝ logo in (auth)/layout.tsx, auth/layout.tsx, join/layout.tsx is wrapped in a Next.js Link to "/" — clickable back to landing
- /register redirects to the next published event (legacy compat for pending-approval flow)
- Privacy toggles (show_phone, show_address, show_birthday) enforced in app-layer queries; RLS grants SELECT to authenticated for these columns; admins bypass via admin client
- Google Places API key: NEXT_PUBLIC_GOOGLE_PLACES_API_KEY — optional; degrades to plain text input without it
- Social links: NEXT_PUBLIC_ALUMNI_FB_URL and NEXT_PUBLIC_ACTIVE_CHAPTER_FB_URL — optional; links hidden if unset on /home quick links
- Referral tokens: one-time UUIDs, 7-day expiry, stored in referrals table; /join?token= is public
- referred_by on members: admin-only, SELECT revoked from authenticated role; only service role (admin client) can read it
- CHAPTER_CONTACT_EMAIL env var: shown on expired/invalid invite error pages; hidden if unset
- Token expiry maintenance: pg_cron nightly job — SQL in migration file comments, manual setup via Supabase dashboard
- Fonts: Syne Bold (headings) and Inter (body/UI) via next/font/google; CSS vars --font-syne and --font-inter
- New color tokens: sn-surface (#1a1a1d) for card backgrounds; sn-gray-text (#a1a1a6) for secondary text
- Buttons: rounded-sm base, 4 canonical variants (default/outline/ghost/destructive); gold focus ring via focus-visible
- Cards: bg-sn-surface lifts above bg-sn-black page backgrounds; event+announcement cards use border-t-2 border-t-sn-gold
- Toast: sonner library, dark theme, bottom-right, toastSuccess/toastError wrappers in src/lib/toast.ts
- Skeleton: src/components/ui/skeleton.tsx; loading.tsx files for home, directory, profile, my-events, admin, admin/members
- Family tree nodes: sn-surface bg, rounded-sm, gold left border on selected; photo-only avatar (no initials fallback)
- Family tree touch: panOnDrag=true (any touch pans; tree fills viewport so single-finger page scroll is moot), zoomOnPinch, preventScrolling, panOnScroll=false
- Family tree node click: fitView to clicked node + direct littles (duration 600ms)
- Family tree search reset: fitView to all on empty/no-match query
- Supabase Realtime: registrations UPDATE subscription in MyEventsClient and ConfirmationStatus — payment badge updates without reload
- MyEventsClient.tsx: client component at src/components/my-events/MyEventsClient.tsx, server page passes rows+userId
- ConfirmationStatus.tsx: client component at src/components/register/ConfirmationStatus.tsx for payment banner

---

## Full Reference

All schema tables, query patterns, Stripe flow, build order, hosting details, and decision log are in:
**`docs/ARCHITECTURE.md`**

Read it before writing anything structural.
