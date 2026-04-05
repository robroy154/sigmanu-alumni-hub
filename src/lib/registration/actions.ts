"use server";

import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe/client";
import type { RegistrationInput } from "@/lib/registration/schemas";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export async function createRegistration(
  eventId: string,
  data: RegistrationInput
): Promise<{ checkoutUrl: string } | { confirmationUrl: string } | { error: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user === null) {
    return { error: "You must be signed in to register." };
  }

  // Verify the event exists and registration is open.
  const { data: event } = await supabase
    .from("events")
    .select("id, title, ticket_price, registration_open, capacity")
    .eq("id", eventId)
    .single();

  if (event === null || !event.registration_open) {
    return { error: "This event is not currently open for registration." };
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

  const guestCount = data.guest_names.length;
  const totalAttendees = 1 + guestCount;

  // Insert the registration row.
  const { data: registration, error: regError } = await supabase
    .from("registrations")
    .insert({
      event_id:             eventId,
      member_id:            user.id,
      registrant_name:      data.registrant_name,
      email:                data.email,
      phone:                data.phone ?? null,
      dietary_restrictions: data.dietary_restrictions ?? null,
      tshirt_size:          data.tshirt_size,
      guest_count:          guestCount,
      payment_status:       "unpaid",
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

    const { error: guestError } = await supabase
      .from("registration_guests")
      .insert(guestRows);

    if (guestError !== null) {
      // Non-fatal: the registration is created; guests missing is recoverable.
      console.error("Failed to insert guest rows:", guestError.message);
    }
  }

  // Free event — mark paid immediately, skip Stripe.
  if (event.ticket_price === 0) {
    await supabase
      .from("registrations")
      .update({ payment_status: "paid" })
      .eq("id", registration.id);

    return {
      confirmationUrl: `${APP_URL}/register/confirmation?registration_id=${registration.id}`,
    };
  }

  // Paid event — create Stripe Checkout session.
  const session = await stripe.checkout.sessions.create({
    mode:        "payment",
    line_items:  [
      {
        price_data: {
          currency:     "usd",
          product_data: { name: `${event.title} — Ticket` },
          unit_amount:  Math.round(event.ticket_price * 100), // cents
        },
        quantity: totalAttendees,
      },
    ],
    metadata: { registration_id: registration.id },
    success_url: `${APP_URL}/register/confirmation?registration_id=${registration.id}&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url:  `${APP_URL}/register?cancelled=1`,
  });

  if (session.url === null) {
    return { error: "Failed to create checkout session. Please try again." };
  }

  return { checkoutUrl: session.url };
}
