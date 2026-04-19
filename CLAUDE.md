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

Phase 22 complete + hardening/UX pass + registration detail views + cleanup + big brother update admin notification. Pre-seeded alumni stub system: stub status, pg_trgm fuzzy search, signup claim flow, family tree stub nodes, admin CSV import. handle_new_user trigger fixed — UPDATE stub in place, no INSERT+DELETE, unique constraint violations eliminated. Birthday empty string guard added to SignupForm.tsx. Birthday display privacy: month/day only shown to non-owner members on /profile/[id]; full date for admins and self; birthday toggle helper text added to ProfileEditForm. Google OAuth post-signup stub claim at /auth/claim-stub. Admin merge tool on member detail page. Pre-launch audit fixes: C1 stub status in proxy (redirects to /pending-approval, no member access); C2 Stripe webhook idempotency (.eq payment_status=unpaid guard, confirmation email sent only once); C3 registration_closes_at enforced server-side in createRegistration and createGuestRegistration; C4 SignupForm profile update error surfaced via toast; C5 /auth/claim-stub added to PENDING_ALLOWED; C6 export route logs query errors; W3 merge action errors logged; W11 NEXT_PUBLIC_APP_URL guard in all three registration action files; W14 supabase.ts regenerated and members.status manually patched to union. UX fixes: family tree defaults to hide-unlinked on load; toggle label describes action ("Show Unlinked" when filter on, "Hide Unlinked" when filter off); unclaimed badge repositioned top-right with pr-16 on info div (never overlaps name); NODE_W=190; pin_number displays as ΜΞ 001 format in all read-only contexts (family tree nodes, both profile pages); profile pages (own + member view) show big/little lineage between header and contact section — uses admin client to include stubs, stubs rendered as non-linked avatars.

Last completed: Phase 22 — Pre-seeded alumni stub system. SQL migration adds 'stub' to members.status check constraint; enables pg_trgm extension with trigram index on member name; adds search_stubs() and find_member_by_name() SQL functions; updates handle_new_user trigger to support stub claiming via stub_id in auth metadata (stub fields copied to new member, stub row deleted if no registrations). Signup form adds optional Badge Number field (pin search hint, not written to DB on fresh signup) and inline stub claim UI with match cards. Family tree includes stub nodes (Unclaimed badge, initials avatar at opacity-50, not clickable). Admin /import page with papaparse client-side CSV preview and two-pass importStubs server action (duplicate check + big brother name resolution via trigram).

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
- Phase 18: Post-registration guest management — ManageRegistration component on confirmation/my-events/home; edit guest names; add guests with Stripe payment (pending_guests pattern); registration_payments table; webhook branching on pending_guests; guest confirmation contact line
- Phase 19: Hardening — pending confirmation email on signup/join; announcement batch notify (resend.batch.send); checkReferralToken pre-signUp guard; admin hard delete referrals (DeleteReferralButton); admin hard delete members (auth.admin.deleteUser cascade); docs/PRODUCTION_SETUP.md
- Phase 20: Landing page redesign (hero + upcoming events + platform features sections; NEXT_PUBLIC_HERO_IMAGE_URL optional env var); rejectMember server action + RejectMemberButton (amber, pending-only, next to ApproveButton in admin members list); event routing audit (7 files confirmed dynamic, comments added); scripts/cleanup-test-data.ts (dry run by default, --execute flag to apply)
- Phase 21: Event module overhaul — slug URLs (UUID-or-slug routing via eventLookupFilter); banner_image_url with public Supabase Storage bucket; rich_description via Tiptap RichTextEditor; event_type (internal/external); early_bird_price + early_bird_ends_at (resolved server-side in actions, stored as applied_price); registration_closes_at deadline; capacity_mode (unlimited/capped/waitlist) with WaitlistForm; custom event_fields with drag-and-drop EventFieldsBuilder; event_field_responses; registration-files private bucket for file_upload fields; amount_paid locked at Stripe webhook time; guest count display "X attendees (you + N guests)"; ICalButton + Google Calendar link on event detail page
- Phase 22: Pre-seeded alumni stub system — 'stub' added to members.status; pg_trgm extension + trigram index on member name; search_stubs() and find_member_by_name() SQL functions; handle_new_user trigger updated for stub claiming; SignupForm stub claim flow (findStubMatches server action, inline match cards, stub_id in signUp metadata); family tree stub nodes (Unclaimed badge, initials avatar, not clickable); admin /import page with papaparse CSV preview and two-pass importStubs action

Key runtime decisions:

- Next.js 16.2.2 (not 14) — uses proxy.ts not middleware.ts, export named `proxy`
- Tailwind v4 CSS-based config — @theme inline {} in globals.css
- shadcn base-nova uses @base-ui/react — no Radix asChild, no form.tsx wrapper
- exactOptionalPropertyTypes: true — optional props need explicit `| undefined`
- Stripe API version: "2026-03-25.dahlia" (stripe npm v22)
- pin_number: set once by member (admin client action), unique DB constraint
- Profile photos: stored as path in members.profile_photo_url, signed URLs (1hr) server-side; cropped 1:1 at 512px before upload via react-image-crop
- proxy.ts PUBLIC_ROUTES: `["/", "/auth/callback", "/auth/forgot-password", "/auth/reset-password", "/api/stripe", "/events", "/join"]`
- proxy.ts PENDING_ALLOWED: `["/register", "/events", "/auth/claim-stub"]`
- proxy.ts stub status: explicit branch redirects to /pending-approval; unknown status also redirects to /pending-approval (was /home, which granted member access)
- Stripe webhook idempotency: original payment path adds `.eq("payment_status", "unpaid")` to update filter + checks updatedRows.length before sending confirmation email
- registration_closes_at enforced server-side in createRegistration and createGuestRegistration (not just client-side UI); check added immediately after registration_open check
- NEXT_PUBLIC_APP_URL guard: checked at runtime in createRegistration, createGuestRegistration, addGuestsToRegistration — hard error returned if unset (no localhost fallback)
- supabase.ts members.status: manually patched to "pending"|"member"|"admin"|"stub" after CLI regeneration (CLI only captures pg enum types, not CHECK constraints); AdminMemberEditForm.Member prop accepts all four; form state preserves stub status as-is (no longer defaults stub→pending); stub option added to status dropdown as first option ("Stub (unclaimed import)"); adminUpdateMember action allows stub in status validation allowlist and type
- Post-login redirect: `/home` (was `/`)
- Birthdays this month on /home: fetched via admin client (show_birthday=true), month-filtered client-side in JS (birthday stored YYYY-MM-DD text)
- react-day-picker v9 used in EventsCalendar; custom inline styles for dark theme (CSS vars override)
- Email: RESEND_API_KEY required; RESEND_FROM_EMAIL optional (defaults to `onboarding@resend.dev`); all emails send with display name "Mu Xi Chapter of Sigma Nu Fraternity" — FROM constant wraps env var as `Mu Xi Chapter of Sigma Nu Fraternity <address>`
- Google OAuth: on by default; Facebook/Apple need NEXT_PUBLIC_*_OAUTH_ENABLED=true; Google button shows reassurance note below it: "Google sign-in routes through a secure Supabase authentication screen — this is expected and your data is safe." (text-xs text-white/40, Google-only, rendered inside OAuthButtons.tsx map)
- Favicon: public/favicon.svg — ΣΝ gold (#C6A75E) on black (#0B0B0C) circle, 32×32; referenced in root layout.tsx metadata icons field (icon/shortcut/apple all point to /favicon.svg)
- Member registration receipt at /my-events/[registrationId]: read-only, server component, regular supabase client + .eq("member_id", user.id) for ownership (RLS defense-in-depth); shows event, registrant, guests, custom field responses, payment breakdown; "View Receipt →" link added to each EventRow in MyEventsClient
- Admin registration detail at /admin/registrations/[id]: admin client; shows event, registrant with member profile link if member_id set, guests, custom responses, payment history (original + registration_payments rows), total; Danger Zone section with DeleteRegistrationButton
- deleteRegistration server action in admin/actions.ts: requireAdmin() guard, admin client, hard delete — cascade deletes registration_guests/event_field_responses/registration_payments via FK; revalidates /admin/registrations
- DeleteRegistrationButton client component: two-step confirm pattern; confirm message includes registrant name and event title; redirectAfter prop controls post-delete navigation (router.push if set, router.refresh otherwise)
- Duplicate registration check updated in createRegistration and createGuestRegistration: added .eq("payment_status", "paid") so unpaid/abandoned checkout rows do not block re-registration
- pg_cron cleanup job in migration 20260417000004: deletes unpaid registrations older than 24 hours at 3 AM UTC daily; requires pg_cron extension enabled in Supabase dashboard (Dashboard > Database > Extensions > pg_cron); migration uses CREATE EXTENSION IF NOT EXISTS pg_cron + safe unschedule-before-schedule pattern
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
- Referral emails: api/referrals/route.ts uses static imports for sendReferralInvite + sendReferralSentConfirmation (was dynamic import with voided calls — silent failures); both are now awaited with try/catch logging errors to console
- referred_by on members: admin-only, SELECT revoked from authenticated role; only service role (admin client) can read it
- CHAPTER_CONTACT_EMAIL env var: shown on expired/invalid invite error pages; hidden if unset
- Token expiry maintenance: pg_cron nightly job — SQL in migration file comments, manual setup via Supabase dashboard
- Fonts: Syne Bold (headings) and Inter (body/UI) via next/font/google; CSS vars --font-syne and --font-inter
- New color tokens: sn-surface (#1a1a1d) for card backgrounds; sn-gray-text (#a1a1a6) for secondary text
- Buttons: rounded-sm base, 4 canonical variants (default/outline/ghost/destructive); gold focus ring via focus-visible
- Cards: bg-sn-surface lifts above bg-sn-black page backgrounds; event+announcement cards use border-t-2 border-t-sn-gold
- Toast: sonner library, dark theme, bottom-right, toastSuccess/toastError wrappers in src/lib/toast.ts
- Skeleton: src/components/ui/skeleton.tsx; loading.tsx files for home, directory, profile, my-events, admin, admin/members
- Family tree overhauled (post-Phase 22): Variation 2 warm dark color scheme — canvas `#2e2010` with `#4a3418` dot grid; nodes `#0B0B0C` bg / `1px solid #3e2e14` border / `4px solid #C6A75E` left accent / `8px` radius; selected node `2px solid #C6A75E` + shadow; non-lineage opacity 0.25; edges `smoothstep` `rgba(198,167,94,0.35)` at rest, full gold `#C6A75E` strokeWidth=2 on lineage; minimap `#1a1208` bg gold nodes; NODE_W=220 NODE_H=90 dagre nodesep=80 ranksep=120; Unclaimed badge `top:-9px right:8px` outside node border
- Family tree side panel: node click opens 280px right-side panel (slide 0.2s); real member panel shows avatar/name/pledge/badge/big/littles count/View Full Profile link; stub panel shows Unclaimed badge + Invite to claim button (members/admins only) with tooltip showing first name + inline email form → POST /api/referrals; clicking big brother name in panel flies to their node; clicking "X littles" fitView to littles; click canvas closes panel
- Family tree enhanced search: debounced 200ms; searches first_name/last_name/nickname/pin_number (strip non-numeric for badge match); 1 result: fly+panel open; 2–8 results: dropdown below search bar; 0 results: "No brothers found"; 1 result also opens side panel
- Family tree generation rail: left-side 48px overlay showing Founders/1st Gen/2nd Gen etc at correct Y positions (flow→screen coords via useViewport); only renders when hideIsolated=true
- Family tree pledge class filter: `<select>` in control bar (distinct classes from loaded members); when selected, shows that class + all lineage ancestors/descendants; re-runs dagre layout; × clears filter
- Family tree additional controls: "Fit lineage" button (when node selected) fitView to full lineage padding 0.2; full screen toggle (Maximize2/Minimize2 icons, requestFullscreen on container div)
- Family tree mobile layout: useIsMobile hook (window resize listener, defaults false SSR); mobile breakpoint 768px; generation rail hidden on mobile; MiniMap hidden on mobile; side panel becomes bottom sheet on mobile (position absolute left/right/bottom-0, height 60vh, translateY slide, drag handle pill at top); nodes compact on mobile (NODE_W_MOBILE=160, NODE_H_MOBILE=76, dagre nodesep=50 ranksep=90, 32px avatar, 12/10px fonts); MemberNode.isMobile in data drives size; controls stack vertically on mobile (search full-width row 1, pledge class full-width row 2, toggle+fullscreen row 3, count badge row 4); desktop count badge top-right hidden on mobile; touch hint "Pinch to zoom · Drag to pan" shown once per device (localStorage key sn_tree_touch_hint_shown), fades after 3s; dims useMemo drives both buildLayout and displayNodes.isMobile; isFirstMount fitView effect includes isMobile in deps to re-fit on layout switch
- Post-login redirect: LoginForm.tsx defaults to /home (was /directory); auth/callback/route.ts next param defaults to /home (was /directory) — both paths now consistently redirect to /home after login
- Family tree touch: panOnDrag=true, zoomOnPinch, preventScrolling, panOnScroll=true
- Family tree node click: fitView to clicked node + big + direct littles (duration 600ms); side panel opens simultaneously
- Family tree search reset: fitView to all on empty query
- Supabase Realtime: registrations UPDATE subscription in MyEventsClient and ConfirmationStatus — payment badge updates without reload
- MyEventsClient.tsx: client component at src/components/my-events/MyEventsClient.tsx, server page passes rows+userId+guests
- ConfirmationStatus.tsx: client component at src/components/register/ConfirmationStatus.tsx for payment banner
- Post-registration guest management: members can edit guest names and add guests while `registration_open = true`. New payments write to `registration_payments` table, not `registrations.stripe_payment_id`. Pending guest names stored in `registrations.pending_guests jsonb` before Stripe redirect, consumed and nulled by webhook on confirmation.
- ManageRegistration component: shared client component at src/components/registration/ManageRegistration.tsx; mounted on alumni confirmation page, /my-events EventRow (toggle), and home page HomeEventsSection (toggle)
- HomeEventsSection: client component at src/components/home/HomeEventsSection.tsx — extracted from home page to enable toggle state; shows "✓ Registered" badge and "Manage registration" toggle for registered events
- registration_payments table: service-role-only inserts; RLS allows members to read own, admins read all
- manageActions.ts: uses session client for auth checks, admin client for writes; ownership verified via member_id = user.id on registration lookup
- Signup notifications: sendSignupNotifications() server action in src/lib/auth/signup-notifications.ts wraps sendPendingConfirmation + notifyAdminsNewMember; called fire-and-forget from SignupForm and JoinForm (client components cannot import "use server" email functions directly); passes firstName/lastName/email directly to notifyAdminsNewMember to bypass session lookup — session cookie is not reliably available on the server immediately after client-side signUp()
- Big brother update notification: sendBigBrotherSetNotification() in src/lib/email/index.ts — fires after every successful updateBigBrother() call in src/lib/profile/actions.ts; sends to all admins; shows member name+email, big full name (or "Cleared (relationship removed)" if bigId=null), ET timestamp, and "Review in Admin Panel →" link; current member fetched via session client, big brother fetched via createAdminClient() (stubs included); fire-and-forget via void import("@/lib/email").then(...) pattern; never throws, never blocks the member-facing response
- Little brother notification: sendLittleBrotherNotification() in src/lib/email/index.ts — fires after sendBigBrotherSetNotification() in updateBigBrother(); sent directly to the big brother's email (no admin client needed inside the function — address passed in); only fires when bigId is not null AND big's status is "member" or "admin" (stubs skipped); big's status reused from the existing bigMember fetch (select extended to include status); big's email fetched via a separate createAdminClient() single-column query; CTA links to /family-tree; subject: "[Little] claimed you as their Big Brother"
- proxy.ts Next-Action guard: server action POSTs carry a Next-Action header; proxy passes them through unconditionally before any redirect logic — without this, server actions invoked from auth route pages (e.g. /signup) get 307'd by the authenticated-user-on-auth-route redirect before the action code runs
- registration_open toggle added to event creation and edit forms in admin panel; default true on create, DB value on edit; explicitly included in both insert and update payloads in event-actions.ts — never relies on DB default
- Landing page (/) three sections: hero (min-h-screen, optional NEXT_PUBLIC_HERO_IMAGE_URL background with bg-black/60 overlay, featured event card, Member Login + Create Account CTAs), upcoming events grid (all published events with event_date >= now), platform features (Directory/Family Tree/Events with Lucide icons); all published events treated as public until event_type column added in a future phase
- rejectMember action: guards with requireAdmin(); blocks self-rejection; calls adminDb.auth.admin.deleteUser() same as deleteMember — hard deletes auth user and cascades to public.members; RejectMemberButton shown only for pending rows in admin members list alongside ApproveButton
- NEXT_PUBLIC_HERO_IMAGE_URL: optional env var for landing page hero background image; if unset, solid sn-black background renders instead; no broken layout when absent
- checkReferralToken: server action called in JoinForm before supabase.auth.signUp() — prevents dangling auth.users rows on expired tokens
- completeReferral fixed: removed incorrect sendWelcomeEmail call (approval email must only fire on admin approval, not on referral signup); replaced dynamic import fire-and-forget with static import + awaited sendReferralCompleted wrapped in try/catch
- deleteMember: calls adminDb.auth.admin.deleteUser(memberId) — cascades to public.members via FK; guards against self-deletion; DeleteMemberButton shown in danger zone on /admin/members/[id]
- deleteReferral: blocks completed referrals (membership history); hard deletes pending/expired; DeleteReferralButton in /admin/referrals actions column
- resendReferralInvite: server action in src/lib/referrals/actions.ts; fetches referral, validates still pending + not expired, re-sends invite email with existing token (no new record/token); ResendReferralButton client component in /admin/referrals row — only shown for pending non-expired rows; shows inline "Sent" / error message for 3s then resets
- Announcement notifications: notify_members boolean on announcements; createAnnouncement fires resend.batch.send() to all member+admin emails, chunked at 100
- Production setup reference: docs/PRODUCTION_SETUP.md — env vars, Supabase SMTP, Stripe webhook, Resend domain, Google OAuth, pg_cron, Vercel, pre-launch checklist
- Slug routing: eventLookupFilter() in src/lib/events/slug.ts; UUID regex check → query by "id", otherwise query by "slug"; all [id] route files use explicit branching (not union column) for Supabase type safety: `filter.column === "id" ? .eq("id", ...) : .eq("slug", ...)`; eventHref() returns `/events/[slug ?? id]`
- Event slugs: auto-generated from title on create (titleToSlug helper), editable in EventForm with uniqueness check via checkSlugAvailable server action; existing events backfilled by migration
- Early bird pricing: applied_price resolved server-side in createRegistration and createGuestRegistration at checkout time; stored on registration row; Stripe unit_amount uses applied_price not ticket_price; webhook reads applied_price (falls back to ticket_price) to compute amount_paid
- amount_paid: locked at webhook time (checkout.session.completed); computed as applied_price × (1 + guest_count); admin registrations page uses amount_paid when present, falls back to calculated estimate marked with an asterisk
- Custom event fields: event_fields table (field_label, field_type, field_options jsonb, required, display_order); responses in event_field_responses; EventFieldsBuilder uses @dnd-kit/sortable for reorder; saveEventFields deletes+reinserts all fields for event; file_upload fields upload to registration-files/pending/[tempId]/[fieldId]/[filename] via uploadRegistrationFile server action (base64 → Buffer); responses passed from RegistrationForm/GuestRegistrationForm to createRegistration/createGuestRegistration
- Waitlist: waitlist table with member_id (nullable) + guest_email for unauthenticated; WaitlistForm shown when capacity_mode=waitlist && isFull on event detail page; joinWaitlist deduplicates by member_id or guest_email per event
- Rich text: Tiptap editor in admin EventForm (RichTextEditor); read-only display via RichTextContent with inline HTML sanitizer (tag + attribute allowlist, javascript: href blocked); CSS class rich-text-content in globals.css; stored as HTML in rich_description column
- Banner images: uploaded to event-banners (public Supabase Storage bucket) via uploadEventBanner server action (base64); EventBannerUpload component in admin; displayed as background-image div with bg-black/50 overlay on event detail page
- iCal export: ICalButton client component generates .ics string (manual VCALENDAR/VEVENT construction), triggers Blob download via URL.createObjectURL; event end time = start + 3 hours
- Guest count display: "X attendees (you + N guests)" format used in MyEventsClient, admin registrations page; 1 attendee shows no parenthetical
- flyer_url column added to events; uploaded to event-banners bucket at [eventId]-flyer/flyer.[ext]; rendered below event description as a contained image with "View Full Size" link; EventFlyerUpload component in admin EventForm Details section
- Tiptap image extension enabled for inline images in rich text description; base64 disabled (externally hosted URLs only); Insert Image toolbar button prompts for URL via window.prompt; img tags allowed through RichTextContent sanitizer (src/alt/width/height attrs; javascript: src blocked)
- Stub member status: members.status now has 'stub' as a valid value (CHECK constraint updated in migration 20260420000000); MemberStatus type in database.ts includes "stub"
- pg_trgm: enabled in Phase 22 migration; trigram index on (first_name || ' ' || last_name); search_stubs() function searches stubs with similarity > 0.25; find_member_by_name() finds non-stub members with similarity > 0.6 for big brother resolution
- handle_new_user trigger finalized: reads stub_id from raw_user_meta_data; array_agg pattern — stores little brother IDs, NULLs their big_id to release FK constraint, UPDATEs stub row in place (id=new.id, email, names, status='pending'), then re-points all stored littles to new.id; safely handles FK constraints regardless of little brother status mix; no INSERT+DELETE, eliminates unique constraint violations on pin_number; normal signup path unchanged
- Diagnostic trigger (migration 20260421000000): adds RAISE LOG to handle_new_user to trace stub claim path; check Supabase dashboard > Logs > Postgres logs for 'handle_new_user' entries after a test signup with stub claim; remove RAISE LOG lines once confirmed working
- Stub claim in signup: both SignupForm and JoinForm call findStubMatches() before signUp(); stub claim UI extracted into shared StubClaimStep component (src/components/auth/StubClaimStep.tsx); if matches found, pauses signup and shows up to 3 cards; user selects "This is me" or "None of these are me"; stub_id passed via signUp options.data; StubClaimStep.onClaim now passes (stubId, bigId) — caller uses stubBigId as fallback big_id if user hasn't explicitly selected one; pin_number never masked anywhere; JoinForm passes firstName+lastName+pledgeClass (no badge number field on join form by design); SignupForm additionally passes pinEntry (badge number search hint); console.log('[SignupForm] stub_id being passed:') added just before signUp() call (same for JoinForm) to confirm value in Vercel logs
- Big brother search on signup/join: BigBrotherSearch component (src/components/auth/BigBrotherSearch.tsx) — searchable combobox on SignupForm and JoinForm; shows top 10 by badge number on focus, filters by name or badge number as user types (debounced 300ms); each option shows 'First Last — ΜΞ 001 · Pledge Class'; server actions in src/lib/auth/big-brother-search.ts: searchBigBrotherCandidates (admin client, status IN member/admin/stub), getBigBrotherById, setBigBrother (session ownership check); big_id written via client-side update in proceedWithSignup (same pattern as phone/pledge_class — session cookie timing issue prevents server action use here); stub claim onClaim carries stub's big_id as fallback if user didn't explicitly select one; search_stubs RPC updated (migration 20260421000000) to return big_id column
- StubMatch.bigId: added to interface in stub-search.ts; mapped from search_stubs RPC big_id column
- Family tree stub nodes: FamilyTreeMember.is_stub boolean added; stubs included in query (.in status includes 'stub'); nodes show 'Unclaimed' badge (top-right, subtle gray pill) and initials avatar at opacity-50; stub nodes are clickable for zoom (same zoom behavior as member nodes) but show no "View Profile →" link; count display lives inside FamilyTreeInner overlay (top-right pill), reflects hide-isolated state
- Family tree hide-isolated toggle: "Hide unlinked" button in canvas overlay (top-left, next to search); isolated = big_id IS NULL AND no littles; toggle filters visibleMembers, re-runs buildLayout(visibleMembers); useEffect+isFirstMount ref re-fits view on toggle; when active count shows "(filtered)" suffix
- Family tree no useNodesState: removed useNodesState/useEdgesState (nodes not draggable); displayNodes/displayEdges computed via useMemo from layoutNodes/layoutEdges directly — simpler and required for hide-isolated to work correctly
- Admin CSV import: papaparse parses CSV client-side; preview table shows up to 10 rows before import; importStubs server action does duplicate check (first+last+pledge_class) then two-pass insert+big_brother_name resolution; big brother resolution: exact ilike match first (all statuses — big brothers may themselves be stubs in the same CSV), then find_member_by_name() rpc fallback (threshold 0.4, no status filter per migration 20260420000001); unresolved big brothers logged as warnings (not hard errors); "Delete all stubs" danger zone calls deleteAllStubs() — only deletes status='stub' rows, never touches pending/member/admin
- Admin member detail big brother display: resolvedBigName resolved server-side in page.tsx across all statuses (including stubs); big brother dropdown now includes stubs (status IN member/admin/stub) — stubs shown as "First Last — ΜΞ 042 · Pledge Class (unclaimed)"; fallback "Currently linked to:" note below select only triggers when big_id points to a row not in allMembers (edge case)
- Profile edit big brother selector: allMembers query uses admin client + includes stub status; stubs shown as "First Last — ΜΞ 042 · Pledge Class (unclaimed)" in dropdown; currentBigName includes "(unclaimed)" suffix when big is a stub
- Signup/join BigBrotherSearch: already includes stubs (status IN member/admin/stub); formatDisplay updated to append "(unclaimed)" for stub candidates
- Alumni registration name/email read-only: RegistrationForm.tsx registrant_name and email fields are readOnly inputs (styled bg-white/5 text-white/50 cursor-default); values pre-filled from member profile via defaultValues; never editable by the member. GuestRegistrationForm is unaffected — guests still enter their own name and email.
- Family tree fitView: deferred via useEffect + hasFitViewRef (100ms) so all nodes register before first fit; re-fits on hideIsolated/pledgeClass toggle via separate useEffect (skips first mount); hideIsolated initializes to true
- Family tree FamilyTreeMember interface: id/first_name/last_name/nickname/pledge_class/pin_number/photo_url/big_id/is_stub/status — status field added in overhaul for panel link logic and invite button gating
- Empty string birthday on signup fixed: SignupForm profile update payload now guards birthday with `!== null` in addition to `!== undefined` and `!== ""` to prevent `invalid input syntax for type date` error when birthday is left blank; JoinForm delegates to completeReferral which already had the guard
- Birthday display privacy: /profile/[id] (other-member view) shows month and day only to non-admins (e.g. "April 19"); full date shown only to admins (isAdmin=true on that page); own /profile always shows full date; home page birthdays widget already shows month/day only; show_birthday column defaults to true (set in migration 20260405000004); birthday toggle in ProfileEditForm has helper text "Only your month and day will be visible to other members."
- Address display privacy: /profile/[id] shows city + state only (label "Location") to non-admins; admins see full street/city/state/zip/country (label "Address"); non-admin block triggers on city or state being non-null (not gated on street_address); address toggle in ProfileEditForm has helper text "Only your city and state are visible to other members."
- FamilyTreeClient props: members + viewerStatus ("member"|"admin") — viewerStatus fetched in page.tsx from viewer's own member row; controls "Invite to claim" button visibility
- Badge number format (ΜΞ prefix): pin_number displayed as `ΜΞ ${String(pin_number).padStart(3, "0")}` in all read-only contexts — family tree nodes, /profile (own), /profile/[id] (member view); admin edit inputs show raw value unchanged
- Profile lineage section: both profile/page.tsx and profile/[id]/page.tsx show Big Brother + Little Brothers between header card and Contact & Details; uses createAdminClient() so stubs are included; LineagePerson component shows avatar (photo or initials), name, pledge class; links to /profile/[id] only if status is member or admin (stubs render as plain div)

---

## Full Reference

All schema tables, query patterns, Stripe flow, build order, hosting details, and decision log are in:
**`docs/ARCHITECTURE.md`**

Read it before writing anything structural.
