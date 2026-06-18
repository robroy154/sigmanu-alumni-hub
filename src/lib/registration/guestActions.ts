"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe/client";
import type { GuestRegistrationInput, GuestFieldResponsesInput } from "@/lib/registration/schemas";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL;

function labelToKey(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .trim()
    .replace(/\s+/g, "_");
}

export async function createGuestRegistration(
  eventId: string,
  data: GuestRegistrationInput,
  fieldResponses?: Record<string, string>,
  guestFieldResponses?: GuestFieldResponsesInput
): Promise<{ checkoutUrl: string } | { confirmationUrl: string } | { error: string }> {
  const admin = createAdminClient();

  // Validate event exists, is published, and registration is open.
  const { data: event } = await admin
    .from("events")
    .select("id, title, ticket_price, early_bird_price, early_bird_ends_at, registration_closes_at, status, registration_open")
    .eq("id", eventId)
    .maybeSingle();

  if (event === null || event.status !== "published" || event.registration_open !== true) {
    return { error: "This event is not currently open for registration." };
  }

  if (event.registration_closes_at !== null && new Date(event.registration_closes_at) <= new Date()) {
    return { error: "Registration for this event has closed." };
  }

  // Guard against duplicate registration by email + event.
  // Only block if a *paid* registration exists — unpaid rows are abandoned
  // checkouts and should not prevent a fresh registration attempt.
  const { data: existing } = await admin
    .from("registrations")
    .select("id")
    .eq("event_id", eventId)
    .eq("email", data.email)
    .eq("payment_status", "paid")
    .maybeSingle();

  if (existing !== null) {
    return { error: "A registration with this email address already exists for this event." };
  }

  // Resolve applied price server-side.
  const now = new Date();
  const appliedPrice =
    event.early_bird_price !== null &&
    event.early_bird_ends_at !== null &&
    new Date(event.early_bird_ends_at) > now
      ? Number(event.early_bird_price)
      : event.ticket_price;

  const guestCount = data.guest_names.length;
  const registrantName = `${data.first_name} ${data.last_name}`.trim();

  // Insert the registration row with member_id = null.
  const { data: registration, error: regError } = await admin
    .from("registrations")
    .insert({
      event_id:             eventId,
      member_id:            null,
      registrant_name:      registrantName,
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
    console.error("[createGuestRegistration] NEXT_PUBLIC_APP_URL is not set");
    return { error: "Server configuration error. Please contact an administrator." };
  }

  // Free event — mark paid immediately, skip Stripe.
  if (appliedPrice === 0) {
    await admin
      .from("registrations")
      .update({ payment_status: "paid", amount_paid: 0 })
      .eq("id", registration.id);

    return {
      confirmationUrl: `${APP_URL}/events/${eventId}/register/guest/confirmation?registration_id=${registration.id}`,
    };
  }

  // ── Paid event — Stripe Checkout ──────────────────────────────────────────

  // Fetch field labels for human-readable metadata keys.
  const { data: eventFieldRows } = await admin
    .from("event_fields")
    .select("id, field_label")
    .eq("event_id", eventId);

  const fieldLabelMap: Record<string, string> = {};
  for (const f of eventFieldRows ?? []) {
    fieldLabelMap[f.id] = f.field_label;
  }

  // Build per-attendee metadata (max 50 key-value pairs).
  const metadataEntries: [string, string][] = [
    ["registration_id", registration.id],
  ];

  const allAttendees = [
    { name: registrantName, responses: fieldResponses ?? {} },
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

  // Per-attendee line items — one item per person, quantity 1 each.
  const lineItems = [
    {
      price_data: {
        currency:     "usd",
        product_data: {
          name:     `${event.title} — ${registrantName}`,
          metadata: { attendee_index: "0", attendee_name: registrantName },
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
    line_items: lineItems,
    metadata,
    success_url: `${APP_URL}/events/${eventId}/register/guest/confirmation?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url:  `${APP_URL}/events/${eventId}/register/guest`,
  });

  if (session.url === null) {
    return { error: "Failed to create checkout session. Please try again." };
  }

  return { checkoutUrl: session.url };
}
