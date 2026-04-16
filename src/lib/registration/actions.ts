"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe/client";
import type { RegistrationInput } from "@/lib/registration/schemas";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL;

export async function createRegistration(
  eventId: string,
  data: RegistrationInput,
  fieldResponses?: Record<string, string>
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
  const { data: existing } = await supabase
    .from("registrations")
    .select("id")
    .eq("event_id", eventId)
    .eq("member_id", user.id)
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

  const guestCount     = data.guest_names.length;
  const totalAttendees = 1 + guestCount;

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

  // Insert guest rows.
  if (guestCount > 0) {
    const guestRows = data.guest_names.map((name) => ({
      registration_id: registration.id,
      guest_name:      name,
    }));
    const { error: guestError } = await admin
      .from("registration_guests")
      .insert(guestRows);
    if (guestError !== null) {
      console.error("Failed to insert guest rows:", guestError.message);
    }
  }

  // Insert custom field responses.
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

  // Paid event — create Stripe Checkout session using resolved applied_price.
  const session = await stripe.checkout.sessions.create({
    mode:       "payment",
    line_items: [
      {
        price_data: {
          currency:     "usd",
          product_data: { name: `${event.title} — Ticket` },
          unit_amount:  Math.round(appliedPrice * 100),
        },
        quantity: totalAttendees,
      },
    ],
    metadata:    { registration_id: registration.id },
    success_url: `${APP_URL}/register/confirmation?registration_id=${registration.id}&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url:  `${APP_URL}/events/${eventId}/register?cancelled=1`,
  });

  if (session.url === null) {
    return { error: "Failed to create checkout session. Please try again." };
  }

  return { checkoutUrl: session.url };
}
