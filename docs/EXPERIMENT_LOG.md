# Enhanced Events Experiment Log

Branch: feature/enhanced-events
Status: In progress

## Completed Parts

### Part 5 — Admin Detail Guest Responses (complete)

- Updated `src/app/(admin)/admin/registrations/[id]/page.tsx`: `registration_guests` select extended to include `id`; `guestResponseRows` fetched from `guest_field_responses` after main query; `responsesByGuestId` Map built from results; Guests section JSX updated to render per-guest attendee responses below each guest name using `pl-4` flex rows (matching `InfoRow` styling); sorted by `display_order`; no "No responses" text when empty.

### Part 2 — Admin Field Scope Toggle (complete)

- Updated `EventFieldsBuilder.tsx`: added scope toggle (Whole order / Per person) to SortableFieldRow; toggle hidden for `file_upload` and `long_text` (always registration-scoped); active pill styled `border-sn-gold text-sn-gold`; gold "Per person" badge shown in row header when `field_scope === "attendee"`
- Updated `saveEventFields` in `event-actions.ts`: `field_scope` now included in insert payload

### Part 1 — Branch and Schema (complete)

- Created branch `feature/enhanced-events`
- Created `supabase/migrations/20260618000000_per_attendee_fields.sql` (NOT applied)
- Patched `src/types/supabase.ts`: added `field_scope` to event_fields, `guest_email`/`guest_phone` to registration_guests, added `guest_field_responses` table definition
- Updated `src/types/database.ts`: added `GuestFieldResponseRow/Insert/Update` exports, added `FieldScope` enum union
- Updated `src/components/admin/EventFieldsBuilder.tsx`: added `field_scope: FieldScope` to `EventFieldDraft`, updated `newField()` default
- Updated `src/components/admin/EventForm.tsx`: `fieldRowsToDrafts()` maps `field_scope` from DB row
- Fixed three server pages to include `field_scope` in their event_fields select strings

## Autonomous Decisions

1. **Migration timestamp 20260618000000** — today's date; avoids collision with the previously applied-then-deleted 20260617000000 security revokes migration.

2. **field_scope cast via ternary in fieldRowsToDrafts** — `r.field_scope === "attendee" ? "attendee" : "registration"` avoids a bare `as FieldScope` cast; any unknown DB value safely defaults to "registration".

3. **guest_field_responses inserted before event_field_responses in supabase.ts** — alphabetical ordering; consistent with the rest of the file.

## TypeScript Check Results

### After Part 1

`tsc --noEmit` — clean (0 errors)

### After Part 2

`tsc --noEmit` — clean (0 errors)

### After Part 3

`tsc --noEmit` — clean (0 errors)

### After Part 4

`tsc --noEmit` — clean (0 errors after fixing unused `totalAttendees` var and `attendee` undefined guard)

### After Part 5

`tsc --noEmit` — clean (0 errors)

### Part 6 — Docs and Final Checks (complete)

- Created `docs/ENHANCED_EVENTS_TESTING.md` with 6 QA test cases (admin scope toggle, alumni form, guest form, no-attendee-fields path, admin detail display, Stripe metadata)
- Added "Active Experiment Branch" section to `CLAUDE.md` covering: what changed, new files/tables, key runtime decisions, and merge checklist
- Added "Per-Attendee Field Scoping" entry to `docs/BACKLOG.md` (In Progress — feature/enhanced-events branch) with built items and pre-merge TODOs
- Final `tsc --noEmit` — clean (0 errors)
- `git diff --name-only main`: 17 modified files, 3 untracked new files (migration, testing guide, experiment log) — all on `feature/enhanced-events` branch, nothing pushed

### Part 7 — Member Receipt Guest Field Responses (complete)

- Updated `src/app/(member)/my-events/[registrationId]/page.tsx`:
  - Imported `createAdminClient`
  - Added `id` to the `registration_guests` select in the main query
  - After ownership-verified main query, fetches `guest_field_responses` via admin client using guest IDs (`.in("guest_id", guestIds)`)
  - Builds `guestResponsesByGuestId` Map (keyed by guest UUID, sorted by `display_order`)
  - Guests section updated: each guest renders its attendee-scoped field responses below its name with `pl-4` indentation using `InfoRow`; guests with no responses show no extra content
  - Existing "Additional Information" section (registrant's own field responses) left unchanged
- `tsc --noEmit` — clean (0 errors)

### Verification note — Fixes 1, 2, 3 (confirmed already implemented)

- FIX 1 (Stripe metadata): `actions.ts` and `guestActions.ts` already had `labelToKey()`, field label fetch, and per-attendee metadata loop with 50-key cap
- FIX 2 (admin redirect after field save): `EventForm.tsx` already had `router.push("/admin/events")` + `router.refresh()` at lines 193–194
- FIX 3 (guest_field_responses DB writes): both action files already used `.select("id")` on guest insert and built `guestResponseRows`

## Outstanding Issues

- `stripe_customer_id` column not yet added to `members` table — current implementation looks up Stripe Customer by email on each alumni checkout. TODO comment in `src/lib/registration/actions.ts`. Flagged for main branch review before merge.
- Migration `20260618000000_per_attendee_fields.sql` is NOT applied to production (or any environment). Must be applied before testing any of the new functionality.
