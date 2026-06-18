"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe/client";
import type { RegistrationInput, GuestFieldResponsesInput } from "@/lib/registration/schemas";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL;

// Convert a field label to a compact snake_case key safe for Stripe metadata.
// "T-Shirt Size" → "tshirt_size"
function labelToKey(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .trim()
    .replace(/\s+/g, "_");
}

export async function createRegistration(
  eventId: string,
  data: RegistrationInput,
  fieldResponses?: Record<string, string>,
  guestFieldResponses?: GuestFieldResponsesInput
): Promise<{ checkoutUrl: string } | { confirmationUrl: string } | { error: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user === null) {
    return { error: "You must be signed in to register." };
  }

  // Verify the event exists, is published, and fetch pricing fields.
  const { data: event } = await supabase
    .from("events")
    .select("id, title, ticket_price, early_bird_price, early_bird_ends_at, registration_closes_at, status, capacity, registration_open")
    .eq("id", eventId)
    .single();

  if (event === null || event.status !== "published" || event.registration_open !== true) {
    return { error: "This event is not currently open for registration." };
  }

  if (event.registration_closes_at !== null && new Date(event.registration_closes_at) <= new Date()) {
    return { error: "Registration for this event has closed." };
  }

  // Guard against double-registration for the same member + event.
  // Only block if a *paid* registration exists — unpaid rows are orphaned
  // abandoned checkouts and should not prevent a fresh registration attempt.
  const { data: existing } = await supabase
    .from("registrations")
    .select("id")
    .eq("event_id", eventId)
    .eq("member_id", user.id)
    .eq("payment_status", "paid")
    .maybeSingle();

  if (existing !== null) {
    return { error: "You are already registered for this event." };
  }

  // ── Resolve applied price (server-side, at checkout creation time) ─────────
  const now = new Date();
  const appliedPrice =
    event.early_bird_price !== null &&
    event.early_bird_ends_at !== null &&
    new Date(event.early_bird_ends_at) > now
      ? Number(event.early_bird_price)
      : event.ticket_price;

  const guestCount = data.guest_names.length;

  // Insert the registration row.
  const admin = createAdminClient();
  const { data: registration, error: regError } = await admin
    .from("registrations")
    .insert({
      event_id:             eventId,
      member_id:            user.id,
      registrant_name:      data.registrant_name,
      email:                data.email,
      phone:                data.phone ?? null,
      guest_count:          guestCount,
      payment_status:       "unpaid",
      applied_price:        appliedPrice,
    })
    .select("id")
    .single();

  if (regError !== null || registration === null) {
    return { error: "Failed to create registration. Please try again." };
  }

  // Insert guest rows and capture IDs (ordered to match guestFieldResponses indices).
  let guestIds: string[] = [];
  if (guestCount > 0) {
    const guestRows = data.guest_names.map((name) => ({
      registration_id: registration.id,
      guest_name:      name,
    }));
    const { data: insertedGuests, error: guestError } = await admin
      .from("registration_guests")
      .insert(guestRows)
      .select("id");
    if (guestError !== null) {
      console.error("Failed to insert guest rows:", guestError.message);
    } else if (insertedGuests !== null) {
      guestIds = insertedGuests.map((g) => g.id);
    }
  }

  // Insert registration-scoped and registrant attendee-scoped field responses.
  if (fieldResponses !== undefined) {
    const responseRows = Object.entries(fieldResponses)
      .filter(([, value]) => value !== "")
      .map(([fieldId, value]) => ({
        registration_id: registration.id,
        field_id:        fieldId,
        response_value:  value,
      }));
    if (responseRows.length > 0) {
      await admin.from("event_field_responses").insert(responseRows);
    }
  }

  // Insert per-guest attendee-scoped field responses.
  if (guestFieldResponses !== undefined && guestIds.length > 0) {
    const guestResponseRows = guestFieldResponses.flatMap((responses, guestIndex) => {
      const guestId = guestIds[guestIndex];
      if (guestId === undefined) return [];
      return Object.entries(responses)
        .filter(([, value]) => value !== "")
        .map(([fieldId, value]) => ({
          guest_id:       guestId,
          field_id:       fieldId,
          response_value: value,
        }));
    });
    if (guestResponseRows.length > 0) {
      await admin.from("guest_field_responses").insert(guestResponseRows);
    }
  }

  if (APP_URL === undefined || APP_URL === "") {
    console.error("[createRegistration] NEXT_PUBLIC_APP_URL is not set");
    return { error: "Server configuration error. Please contact an administrator." };
  }

  // Free event — mark paid immediately, skip Stripe.
  if (appliedPrice === 0) {
    await admin
      .from("registrations")
      .update({ payment_status: "paid", amount_paid: 0 })
      .eq("id", registration.id);

    return {
      confirmationUrl: `${APP_URL}/register/confirmation?registration_id=${registration.id}`,
    };
  }

  // ── Paid event — Stripe Checkout ──────────────────────────────────────────

  // Fetch field labels so we can embed human-readable keys in session metadata.
  const { data: eventFieldRows } = await admin
    .from("event_fields")
    .select("id, field_label")
    .eq("event_id", eventId);

  const fieldLabelMap: Record<string, string> = {};
  for (const f of eventFieldRows ?? []) {
    fieldLabelMap[f.id] = f.field_label;
  }

  // Build per-attendee metadata (max 50 Stripe key-value pairs).
  // registration_id is always first. Remaining slots fill attendee data in order.
  const metadataEntries: [string, string][] = [
    ["registration_id", registration.id],
  ];

  const allAttendees = [
    { name: data.registrant_name, responses: fieldResponses ?? {} },
    ...data.guest_names.map((name, i) => ({
      name,
      responses: guestFieldResponses?.[i] ?? {},
    })),
  ];

  let truncated = 0;
  for (let ai = 0; ai < allAttendees.length; ai++) {
    const attendee = allAttendees[ai];
    if (attendee === undefined) continue;
    if (metadataEntries.length >= 50) { truncated += 1 + Object.keys(attendee.responses).length; continue; }
    metadataEntries.push([`attendee_${ai}_name`, attendee.name]);
    for (const [fieldId, value] of Object.entries(attendee.responses)) {
      if (value === "") continue;
      if (metadataEntries.length >= 50) { truncated++; continue; }
      const label = fieldLabelMap[fieldId];
      if (label === undefined) continue;
      metadataEntries.push([`attendee_${ai}_${labelToKey(label)}`, value.slice(0, 500)]);
    }
  }

  if (truncated > 0) {
    console.log(`[Stripe metadata] Truncated at 50 keys — ${truncated} values omitted`);
  }

  const metadata = Object.fromEntries(metadataEntries);

  // Create or retrieve Stripe Customer for this member so payment history is
  // linked to a customer record in the Stripe dashboard.
  // TODO: Store customerId on member record when stripe_customer_id column
  // is added to members table — deferred to main branch review
  const existingCustomers = await stripe.customers.list({
    email: data.email,
    limit: 1,
  });
  const customerId =
    existingCustomers.data[0]?.id ??
    (
      await stripe.customers.create({
        email:    data.email,
        name:     data.registrant_name,
        metadata: { member_id: user.id },
      })
    ).id;

  // Per-attendee line items — one item per person, quantity 1 each.
  // The webhook computes amount_paid from DB values (applied_price × (1 + guest_count)),
  // so changing line item shape here has no effect on DB-side accounting.
  const lineItems = [
    {
      price_data: {
        currency:     "usd",
        product_data: {
          name:     `${event.title} — ${data.registrant_name}`,
          metadata: { attendee_index: "0", attendee_name: data.registrant_name },
        },
        unit_amount: Math.round(appliedPrice * 100),
      },
      quantity: 1,
    },
    ...data.guest_names.map((name, i) => ({
      price_data: {
        currency:     "usd",
        product_data: {
          name:     `${event.title} — ${name}`,
          metadata: { attendee_index: String(i + 1), attendee_name: name },
        },
        unit_amount: Math.round(appliedPrice * 100),
      },
      quantity: 1,
    })),
  ];

  const session = await stripe.checkout.sessions.create({
    mode:       "payment",
    customer:   customerId,
    line_items: lineItems,
    metadata,
    success_url: `${APP_URL}/register/confirmation?registration_id=${registration.id}&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url:  `${APP_URL}/events/${eventId}/register?cancelled=1`,
  });

  if (session.url === null) {
    return { error: "Failed to create checkout session. Please try again." };
  }

  return { checkoutUrl: session.url };
}
