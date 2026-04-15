"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe/client";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export async function updateGuestNames(
  registrationId: string,
  guests: { id: string; guest_name: string }[]
): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user === null) {
    return { error: "You must be signed in to update guests." };
  }

  // Verify the calling user owns this registration.
  const { data: registration } = await supabase
    .from("registrations")
    .select("id, event_id")
    .eq("id", registrationId)
    .eq("member_id", user.id)
    .maybeSingle();

  if (registration === null) {
    return { error: "Registration not found." };
  }

  // Verify registration is still open for changes.
  const { data: event } = await supabase
    .from("events")
    .select("registration_open")
    .eq("id", registration.event_id)
    .maybeSingle();

  if (event === null || event.registration_open !== true) {
    return { error: "Registration is closed. No changes can be made." };
  }

  const admin = createAdminClient();

  // Update each guest individually. The registration_id filter prevents
  // any blind cross-registration id abuse — only rows owned by this registration
  // will be touched regardless of what ids the client sends.
  for (const guest of guests) {
    const { error } = await admin
      .from("registration_guests")
      .update({ guest_name: guest.guest_name })
      .eq("id", guest.id)
      .eq("registration_id", registrationId);

    if (error !== null) {
      console.error("Failed to update guest row:", error.message);
      return { error: "Failed to save changes. Please try again." };
    }
  }

  return { success: true };
}

export async function addGuestsToRegistration(
  registrationId: string,
  guestNames: string[]
): Promise<{ checkoutUrl: string } | { confirmationUrl: string } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user === null) {
    return { error: "You must be signed in to add guests." };
  }

  // Verify the calling user owns this registration.
  const { data: registration } = await supabase
    .from("registrations")
    .select("id, event_id")
    .eq("id", registrationId)
    .eq("member_id", user.id)
    .maybeSingle();

  if (registration === null) {
    return { error: "Registration not found." };
  }

  // Verify event is open and fetch pricing.
  const { data: event } = await supabase
    .from("events")
    .select("id, title, ticket_price, registration_open")
    .eq("id", registration.event_id)
    .maybeSingle();

  if (event === null || event.registration_open !== true) {
    return { error: "Registration is closed. Guests cannot be added." };
  }

  const admin = createAdminClient();

  // Free path — insert guests directly and increment guest_count.
  if (event.ticket_price === 0) {
    const guestRows = guestNames.map((name) => ({
      registration_id: registrationId,
      guest_name:      name,
    }));

    const { error: insertError } = await admin
      .from("registration_guests")
      .insert(guestRows);

    if (insertError !== null) {
      console.error("Failed to insert guest rows:", insertError.message);
      return { error: "Failed to add guests. Please try again." };
    }

    // Fetch current count then increment (Supabase JS doesn't have native increment).
    const { data: current } = await admin
      .from("registrations")
      .select("guest_count")
      .eq("id", registrationId)
      .single();

    await admin
      .from("registrations")
      .update({ guest_count: (current?.guest_count ?? 0) + guestNames.length })
      .eq("id", registrationId);

    return {
      confirmationUrl: `${APP_URL}/register/confirmation?registration_id=${registrationId}`,
    };
  }

  // Paid path — write pending_guests and create Stripe session.
  const { error: pendingError } = await admin
    .from("registrations")
    .update({ pending_guests: guestNames })
    .eq("id", registrationId);

  if (pendingError !== null) {
    console.error("Failed to write pending_guests:", pendingError.message);
    return { error: "Failed to initiate checkout. Please try again." };
  }

  const session = await stripe.checkout.sessions.create({
    mode:       "payment",
    line_items: [
      {
        price_data: {
          currency:     "usd",
          product_data: { name: `${event.title} — Additional Guest${guestNames.length !== 1 ? "s" : ""}` },
          unit_amount:  Math.round(event.ticket_price * 100),
        },
        quantity: guestNames.length,
      },
    ],
    metadata:    { registration_id: registrationId },
    success_url: `${APP_URL}/register/confirmation?registration_id=${registrationId}&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url:  `${APP_URL}/register/confirmation?registration_id=${registrationId}`,
  });

  if (session.url === null) {
    return { error: "Failed to create checkout session. Please try again." };
  }

  return { checkoutUrl: session.url };
}
