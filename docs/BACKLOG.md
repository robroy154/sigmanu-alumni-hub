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

---

*Last updated: May 16, 2026*
