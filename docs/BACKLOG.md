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

---

## Blocked — Waiting on External Process

### Phase 24 — SMS Invites
**Status:** Blocked
Schema partially decided: 8-char token, nullable email/phone on referrals, `delivery_method` enum, sender ID `MuXiChapter`. Blocked on Brevo TFN (toll-free number) carrier registration — a 4–6 week external process with no workaround. Resume once TFN registration clears.

---

## Compliance and Legal

### Newsletter Opt-Out
**Status:** Compliance
Add `newsletter_opt_out boolean default false` to `members` table. Required for CAN-SPAM compliance. No migration or UI exists yet. Low effort — must be in place before any bulk email sends go out.

### Privacy Policy Page — `/privacy`
**Status:** New
Render the drafted Privacy Policy as a public-facing page. Must be publicly accessible (no auth required). Link from site footer and signup flow. Content is drafted and ready in `docs/privacy-policy.md`.

### Terms of Service Page — `/terms`
**Status:** New
Render the drafted Terms of Service as a public-facing page. Must be publicly accessible. Link from site footer, signup flow, and Stripe checkout page (Stripe requires a ToS link). Content is drafted and ready in `docs/terms-of-service.md`.

### Site Footer
**Status:** New
No footer currently exists on the public layout. Needs to be added with links to `/privacy` and `/terms` at minimum. Also appropriate for a contact email (`info@csusigmanu.com`) and a copyright line. Required before launch to support the legal pages.

---

## Scoped, Not Started

### Rich Text Announcements
**Status:** Scoped
Swap admin announcements form to use Tiptap (already installed and used for event descriptions). Add `announcement-images` Supabase Storage bucket for image uploads. Change `announcements.body` column from plain text to HTML. Update `AnnouncementCard` to render via `RichTextContent` with DOMPurify sanitization.

### Settings System
**Status:** Scoped
Full admin and member settings UI broken into named sections. Two-tier notification preference model: admin sets global toggles, members can adjust within admin-defined limits. Deliberately deferred as a future phase — touches many surfaces. No schema work started.

---

## New — Recently Identified

### First Login Onboarding Modal
**Status:** New
A checklist popup shown on every login until the member explicitly dismisses it with "don't show again." Covers what to do first and how to navigate the hub. Store dismissal state as `onboarding_dismissed boolean default false` on the `members` row.

### Announcement Login Splash
**Status:** New
Admin can toggle per-announcement whether it appears as a full splash modal on login. Members can dismiss individual splashes with "don't show again." Requires a `dismissed_announcements` junction table (`member_id`, `announcement_id`, `dismissed_at`) to track per-member dismissal state. The same table drives the notification bell's unread announcement count.

### Notification Bell — Computed Badge
**Status:** New
Bell icon in the navbar with a badge count derived entirely from existing data — no separate notifications table needed. Badge sources:
- **All members:** Incomplete profile fields (pledge class, phone, city, big_id null)
- **All members:** Unread announcements (published announcements not in `dismissed_announcements`)
- **All members:** Birthday this month (already computed on `/home`)
- **All members:** Upcoming registered event within 7 days
- **All members:** New little brother claimed you (lightweight — store `new_little_since_last_login` timestamp on `members` row, or lean on the existing email)
- **Admins only:** Pending member approvals count

Dropdown lists active nudges with actionable links. Badge clears when the underlying condition is resolved or the item is dismissed.

### Email and Password Change
**Status:** New
Members can update their email address or password from their account settings. Both require the member to enter their current password first. Implementation: `supabase.auth.reauthenticate()` to verify current credentials, then `supabase.auth.updateUser()` to apply the change. Entirely separate from the forgot password / reset flow.

---

## Data Layer Exists — UI Missing

### Waitlist Admin Management
**Status:** Incomplete
The `waitlist` table exists and `WaitlistForm` is implemented for members to join. Missing entirely: admin UI to view the waitlist per event, promote members off the waitlist when capacity opens, and trigger an email notification when a spot becomes available. Highest-priority incomplete feature relative to what was built around it.

### Stripe Refund Automation
**Status:** Partial
`markRegistrationRefunded` server action exists and updates `payment_status` to `refunded` in the database. However it does not call `stripe.refunds.create()` — the actual Stripe refund still has to be issued manually in the Stripe dashboard. The two steps (Stripe refund + DB status update) should be unified into a single admin action.

### Member-Initiated Cancellation
**Status:** Partial
No self-serve cancel or withdraw flow exists for members. Members can manage guests and view registrations but cannot cancel. Whether self-serve cancellation is desirable for a paid event is a product decision. Currently requires admin intervention to cancel a registration.

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

---

*Last updated: May 15, 2026*
