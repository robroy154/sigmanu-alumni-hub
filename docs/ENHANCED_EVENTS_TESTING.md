# Enhanced Events — Testing Guide

Branch: `feature/enhanced-events`
Migration: `supabase/migrations/20260618000000_per_attendee_fields.sql` (NOT YET APPLIED)

---

## Pre-Test Setup

1. Apply the migration in Supabase: `supabase/migrations/20260618000000_per_attendee_fields.sql`
2. Verify new columns exist:
   - `event_fields.field_scope` (text, default `'registration'`)
   - `registration_guests.guest_email` (text, nullable)
   - `registration_guests.guest_phone` (text, nullable)
   - `guest_field_responses` table with `id`, `guest_id`, `field_id`, `response_value`

---

## Test 1 — Admin: Event Field Scope Toggle

1. Go to `/admin/events/[id]/edit` for any event with custom fields.
2. In the "Event Fields" section, verify that `short_text`, `dropdown`, `multi_select`, and `checkbox` field types show a scope toggle ("Whole order" / "Per person").
3. Verify `long_text` and `file_upload` field types do NOT show a scope toggle.
4. Switch a field to "Per person". Confirm the gold "Per person" badge appears in the row header.
5. Switch the field type to `long_text`. Confirm the scope resets to "Whole order" and the badge disappears.
6. Save the event. Reload and confirm scope settings were persisted.

**Expected:** Scope toggle visible only for eligible types. DB `field_scope` column stores `"registration"` or `"attendee"`.

---

## Test 2 — Alumni Registration Form: Per-Attendee Sections

1. Create a test event with:
   - One `registration`-scoped field (e.g. "Dietary Notes" — `short_text`)
   - One `attendee`-scoped field (e.g. "T-Shirt Size" — `dropdown` with options S/M/L/XL)
2. Go to `/events/[id]/register` as an authenticated member.
3. Verify Section A shows the registrant's name and email (read-only).
4. Verify Section B shows only registration-scoped fields ("Dietary Notes").
5. Add one guest. Verify Section C appears with two attendee cards: one for the registrant, one for the guest.
6. Each card should show the "T-Shirt Size" dropdown.
7. Fill out all fields. Submit.

**Expected:**
- Registration-scoped response inserted into `event_field_responses`.
- Registrant's attendee-scoped response inserted into `event_field_responses`.
- Guest's attendee-scoped response inserted into `guest_field_responses` with the correct `guest_id`.

---

## Test 3 — Guest Registration Form: Per-Attendee Sections

1. Use the same test event from Test 2.
2. Go to `/events/[id]/register/guest` (public, unauthenticated).
3. Fill out registrant info. Add one additional guest.
4. Verify Section B (registration-scoped fields) and Section C (per-attendee cards) render correctly.
5. Complete checkout (or confirm free-event path).

**Expected:** Same DB write pattern as Test 2 but via guest path. `member_id` is null on the registration row.

---

## Test 4 — No Attendee Fields

1. Create or use an event with only registration-scoped fields (no `attendee`-scoped fields).
2. Register with one guest.
3. Verify Section C does NOT appear on either registration form.

**Expected:** No `guest_field_responses` rows written. UI shows no per-attendee section.

---

## Test 5 — Admin Registration Detail: Guest Responses Display

1. Using a registration created in Test 2 (or Test 3) with at least one guest and attendee-scoped responses.
2. Go to `/admin/registrations/[id]`.
3. In the "Guests" section, verify each guest name is followed by their attendee-scoped responses indented with `pl-4`.
4. Verify responses are sorted by `display_order`.
5. For a guest with no attendee responses, verify no extra rows appear below their name.

**Expected:**
```
1. Marcus Williams
     T-Shirt Size: XL
2. Sarah Johnson
     T-Shirt Size: M
```

---

## Test 6 — Stripe Metadata (paid events only)

1. Register for a paid event with one guest and attendee-scoped fields filled in.
2. After Stripe checkout, look up the `checkout.session` in the Stripe dashboard.
3. Verify metadata contains:
   - `registration_id`: UUID of the registration
   - `attendee_0_name`: registrant name
   - `attendee_0_<field_key>`: registrant's field value
   - `attendee_1_name`: guest name
   - `attendee_1_<field_key>`: guest's field value
4. Verify line items show one item per attendee, each with `quantity: 1`.

**Expected:** Up to 50 metadata keys total. Truncation logged to server console if exceeded.

---

## Rollback

To revert to the pre-experiment schema state, revert the migration and drop:
- `event_fields.field_scope` column
- `registration_guests.guest_email` column
- `registration_guests.guest_phone` column
- `guest_field_responses` table

No data migration is needed on rollback if no `attendee`-scoped fields have been used in production.
