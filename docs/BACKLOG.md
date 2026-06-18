# Sigma Nu Alumni Hub — Feature Backlog

> This file is the source of truth for all planned, in-progress, and deferred features.
> Update this file within the same Claude Code session whenever a backlog item is completed or a new one is added.
> Reference this file at the start of any planning or build session.

---

## Status Key

| Status | Meaning |
|---|---|
| `Blocked` | Cannot proceed — waiting on an external dependency |
| `Compliance` | Legal or regulatory requirement — prioritize before launch |
| `Incomplete` | Data layer exists but UI or functionality is missing |
| `Partial` | Feature exists but is not fully wired end-to-end |
| `Scoped` | Decisions made, not yet built |
| `New` | Recently identified, not yet scoped in detail |
| `Concept` | Idea only — no schema, design, or scope |
| `Future` | Deferred — not needed for initial launch |
| `Done` | Fully implemented and deployed |

---

## Blocked — Waiting on External Process

### Phase 24 — SMS Invites
**Status:** Blocked
Schema partially decided: 8-char token, nullable email/phone on referrals, `delivery_method` enum, sender ID `MuXiChapter`. Blocked on Brevo TFN (toll-free number) carrier registration — a 4–6 week external process with no workaround. Resume once TFN registration clears.
SMS message template format locked: `[First] [Last] (Mu Xi [badge]) invited you to the Mu Xi Alumni Hub. Claim your profile: [URL]`.

---

## Compliance and Legal

### Newsletter Opt-Out
**Status:** Done
`newsletter_opt_out boolean default false` added to `members` table (migration 20260516000000). ProfileEditForm "Email Preferences" section with PrivacyToggle. updateProfile action includes it.

### Privacy Policy Page — `/privacy`
**Status:** Done
Public-facing `/privacy` page rendering all 13 sections from `docs/privacy-policy.md`. No auth required. Added to PUBLIC_ROUTES in proxy.ts. Linked from all footers.

### Terms of Service Page — `/terms`
**Status:** Done
Public-facing `/terms` page rendering all 15 sections from `docs/terms-of-service.md`. No auth required. Added to PUBLIC_ROUTES in proxy.ts. Linked from all footers.

### Site Footer
**Status:** Done
Footer added to member layout with copyright year, Privacy Policy, Terms of Service, and contact email links. Also added to landing page (`/`) footer.

---

## Scoped / Recently Completed

### Rich Text Announcements
**Status:** Done
Admin announcement create and edit forms use RichTextEditor (Tiptap). AnnouncementCard renders via RichTextContent with CSS max-h-24 collapse (no JS truncation on HTML). "Read more" toggles max-h-none. XSS-safe via existing RichTextContent sanitizer.

### Settings System — Email & Password Change
**Status:** Done
`/settings` page with ChangeEmailForm (requires current password, sends confirmation to new email) and ChangePasswordForm (requires current password, 8+ chars). settings-actions.ts uses signInWithPassword to verify then updateUser. Navbar Settings link added to desktop dropdown and mobile drawer.

### First Login Onboarding Modal
**Status:** Done
`members.onboarding_dismissed boolean` migration (20260516000001). OnboardingModal with 6 checklist items (profile photo, pledge class, big, badge number, family tree, directory), progress bar, dismiss action. Mounted in (member)/layout.tsx.

### Announcement Login Splash
**Status:** Done
`dismissed_announcements` table migration (20260516000002) with RLS. `show_on_login` boolean on announcements. Admin Presentation icon toggle in AnnouncementControls. dismissAnnouncement server action. AnnouncementSplash full-screen overlay shown on home page for first undismissed splash announcement.

### Notification Bell — Computed Badge
**Status:** Partially done
AnnouncementSplash effectively surfaces important announcements. Full bell badge (with count and dropdown) is deferred — not needed for initial launch. The dismissed_announcements table exists and is ready to drive it if needed in the future.

### Email and Password Change
**Status:** Done
See Settings System above.

### Security Hardening — Column-Level Access Control

**Status:** Scoped

Investigation revealed two distinct problems:

1. **UPDATE revokes (actionable):** Four column-level UPDATE revokes are effective
   because authenticated holds no table-level UPDATE grant on members:
   - members.status UPDATE
   - members.pin_number UPDATE
   - members.id UPDATE
   - members.created_at UPDATE
   These should be committed in a migration once the broader issue below is resolved.

2. **referred_by exposure (requires schema change):** members.referred_by is readable
   by any authenticated member via the "members: member+ can read all" RLS policy.
   RLS is row-level only — it cannot scope individual columns. Column-level SELECT
   revokes are no-ops due to Supabase's table-level SELECT grant on authenticated.
   The correct fix is Option D: move referred_by into a separate admin-only table
   (e.g. admin_member_metadata) with restrictive RLS. This is a schema migration
   with downstream query changes in admin panel routes.

3. **stripe_payment_id and referrals.token:** Lower risk. stripe_payment_id is never
   selected in member-facing queries. referrals.token is protected by RLS limiting
   members to their own referral rows (referred_by = auth.uid()). Neither requires
   urgent action but should be documented.

Do not attempt a partial fix. Scope the admin_member_metadata approach as a
dedicated session before implementing anything.

### Admin Notification Preferences
**Status:** Scoped
Admins currently receive operational emails at `info@csusigmanu.com` only, but not all admins have access to that inbox. The refund admin notification (`sendRefundProcessedAdminAlert`) is the first known case sending to that hardcoded inbox as the To address. Two changes needed:

1. **Immediate fix (query change):** Admin notification emails (refund processed, new member registered, referral claimed, etc.) should query `members` where `status = 'admin'` and send to those email addresses directly, using `info@csusigmanu.com` as the From address — same pattern already used elsewhere in the codebase for other admin notifications (e.g. `notifyAdminsNewMember`, `sendBigBrotherSetNotification`).
2. **Settings system integration:** Per-admin notification preferences stored on the `members` table or a separate `admin_notification_preferences` table. Each admin can toggle which operational emails they receive (refund processed, new registration, referral claimed, member approved, etc.). When firing any admin notification, query for admins where that preference is enabled. This depends on the broader Settings System — Two-Tier Preferences Model (see Future Features below) and should be scoped together with it.

Interim workaround in place: an email forwarding rule on `info@csusigmanu.com` routes relevant emails to admin accounts directly.

### Per-Attendee Field Scoping

**Status:** In Progress — `feature/enhanced-events` branch

Adds `field_scope: "registration" | "attendee"` to custom event fields. Attendee-scoped fields are collected once per person (registrant + each guest) instead of once per order.

**What's built (branch only, not merged):**

- Migration `20260618000000_per_attendee_fields.sql`: `event_fields.field_scope` column, `registration_guests.guest_email/guest_phone` columns, `guest_field_responses` table
- EventFieldsBuilder: scope toggle (Whole order / Per person) for eligible field types
- RegistrationForm + GuestRegistrationForm: Section C (per-attendee cards) when attendee-scoped fields exist
- `createRegistration` + `createGuestRegistration`: stores per-guest responses in `guest_field_responses`; per-attendee Stripe line items and metadata
- Admin registration detail: displays per-guest responses below each guest name
- Testing guide: `docs/ENHANCED_EVENTS_TESTING.md`

**To complete before merge:**

- Apply migration to production Supabase
- QA per `docs/ENHANCED_EVENTS_TESTING.md`
- Decide on `stripe_customer_id` column addition to `members` table (see TODO in `src/lib/registration/actions.ts`)

---

## Data Layer Exists — UI Missing

### Waitlist Admin Management
**Status:** Done
`/admin/events/[id]/waitlist` page with table (position, name/email, joined date). `promoteFromWaitlist` server action creates a registration, deletes the waitlist row, and sends a notification email. PromoteWaitlistButton uses two-step confirm. Admin events list shows "Waitlist (X)" link for waitlist-mode events.

### Stripe Refund Automation
**Status:** Done
`markRegistrationRefunded` now calls `stripe.refunds.create({ payment_intent })` before updating DB. Null payment_intent (free events) skips Stripe. Stripe error blocks DB update and surfaces to admin UI.

### Member-Initiated Cancellation
**Status:** Done
`cancelRegistration` server action (ownership check, blocks paid registrations, checks registration_open). ManageRegistration renders two-step cancel button for unpaid registrations when event is still open. Paid cancellations require admin intervention — error message directs member to contact us.

---

## Future Features — Nothing Built

### Photo Gallery
**Status:** Concept
Chapter or event photo gallery. Would require a Supabase Storage bucket, admin upload interface, and a public-facing display page. No schema, design, or scope defined.

### Document and File Library
**Status:** Concept
Storage and serving of chapter documents — bylaws, historical materials, meeting minutes, etc. Similar pattern to the photo gallery. No schema, design, or scope defined.

### E2E Test Coverage
**Status:** Future
No Playwright or Cypress tests exist anywhere in the project. The payment and Stripe webhook flows are the highest-risk paths and have zero automated coverage. Not a feature gap but a stability requirement — should be addressed before the platform is considered fully production-stable.

### Phase 25 — Donations System
**Status:** Concept
Standalone vertical, separate from events/registrations. Suggested-amount UI ($25/$50/$100/$250 + custom), optional campaign association (`donation_campaigns` table with goal amount + progress bar), anonymous donation option, Stripe Checkout payment flow, admin `/admin/donations` page with CSV export, donor history on admin member detail page, homepage revenue card split into event revenue + donations, email receipt via Resend on webhook. Not tied to member approval — `member` and `admin` status only.

### Settings System — Two-Tier Preferences Model
**Status:** Concept
Admin global toggles + per-member preferences within admin-defined limits. Sections: notifications, privacy, account. Distinct from the existing `/settings` email/password change flow (already Done above) — needs a dedicated scoping conversation before implementation.

### "Chapter Hub" Rebrand
**Status:** Concept
Rename from "Alumni Hub" to "Chapter Hub" across the platform. Needs a dedicated scoping conversation.

### Hero Image — Animated Constellation Canvas
**Status:** Concept
Animated canvas with the Sigma Nu serpent spine rendered as a constellation network (Option L series). Decision deferred. Distinct from the existing `NEXT_PUBLIC_HERO_IMAGE_URL` static background image.

### TypeScript Type Generation from Supabase CLI
**Status:** Concept
Automate `supabase.ts` generation via the Supabase CLI. A manual patch step would still be needed afterward for CHECK-constraint enums, which the CLI does not capture (only Postgres enum types).

### Potential Commercialization for Other Greek Organizations
**Status:** Concept
Architecture consideration for multi-tenancy if the platform were offered to other chapters or fraternities/sororities. No scope or schema defined.

---

## Ops / Infrastructure Parking Lot

### `ADMIN_NOTIFICATION_EMAIL` Env Var
**Status:** New
Separate from `CHAPTER_CONTACT_EMAIL` — would route operational alerts (failures, errors) distinctly from general chapter contact communications.

### Webhook Failure Alerting
**Status:** New
Silent failures in webhook handlers (e.g. Stripe webhook) currently have no admin notification path.

### Resend Webhook Listener
**Status:** New
No visibility into bounced or failed transactional email delivery — would require a Resend webhook endpoint to track delivery status.

### `charge.dispute.created` Webhook Handler
**Status:** New
Flag a registration as disputed in the DB and notify admin when a chargeback is filed against a Stripe charge.

### Partial Refund Support
**Status:** New
Current refund flow (`markRegistrationRefunded`) assumes full refunds only — no UI for partial amounts (e.g. refunding one guest from a multi-guest registration).

### Refund Reason Field
**Status:** New
Optional admin note on why a refund was issued, stored on the registration record.

### Admin Action Audit Log
**Status:** New
Record which admin performed sensitive actions (refunds, deletions, status changes) and when.

### Bulk Refund Capability
**Status:** New
Refund all paid registrations for a cancelled event in one action. The confirmation dialog must surface exact financial impact before execution: total amount to be refunded, aggregate Stripe transaction fees from all original payments (non-refundable, retrieved from Stripe balance transactions), and net balance impact. Fee data should be retrieved from Stripe before the dialog opens, same pattern as the individual Process Refund dialog (see `getRefundFeeDetails` in `src/lib/admin/actions.ts`). Admin must explicitly confirm after seeing the full financial breakdown.

### Event Cancellation Flow
**Status:** New
Cancel an event, auto-refund all paid registrations, and notify all registrants.

### Stripe Idempotency Keys on Refund Calls
**Status:** New
Prevent double-refund edge cases on retries of `stripe.refunds.create()`.

---

*Last updated: June 16, 2026*
