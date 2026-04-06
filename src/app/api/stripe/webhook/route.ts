import { type NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe/client";
import { createAdminClient } from "@/lib/supabase/admin";

// Stripe sends webhooks as raw body — do NOT parse as JSON here.
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature") ?? "";
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (webhookSecret === undefined || webhookSecret === "") {
    console.error("STRIPE_WEBHOOK_SECRET is not set.");
    return NextResponse.json({ error: "Webhook secret not configured." }, { status: 500 });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Stripe webhook signature verification failed:", message);
    return NextResponse.json({ error: `Webhook error: ${message}` }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const registrationId = session.metadata?.registration_id;

    if (registrationId === undefined || registrationId === "") {
      console.error("checkout.session.completed missing registration_id metadata:", session.id);
      return NextResponse.json({ error: "Missing registration_id" }, { status: 400 });
    }

    const paymentIntentId =
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : (session.payment_intent?.id ?? null);

    // Use admin client — webhook is unauthenticated, no session to check.
    const admin = createAdminClient();
    const { error } = await admin
      .from("registrations")
      .update({
        payment_status:    "paid",
        stripe_payment_id: paymentIntentId,
      })
      .eq("id", registrationId);

    if (error !== null) {
      console.error("Failed to update registration after payment:", error.message);
      // Return 200 anyway — returning 4xx/5xx causes Stripe to retry.
    } else {
      // Fetch registration + event details for the confirmation email.
      const { data: reg } = await admin
        .from("registrations")
        .select("registrant_name, email, guest_count, event_id, events(title, event_date, location, ticket_price)")
        .eq("id", registrationId)
        .single();

      if (reg !== null && reg.events !== null) {
        const ev         = Array.isArray(reg.events) ? reg.events[0] : reg.events;
        const totalPaid  = Number(ev.ticket_price) * (1 + reg.guest_count);
        const eventDate  = new Date(ev.event_date).toLocaleDateString("en-US", {
          weekday: "long", month: "long", day: "numeric", year: "numeric",
        });

        void import("@/lib/email").then(({ sendRegistrationConfirmation }) =>
          sendRegistrationConfirmation({
            to:            reg.email,
            name:          reg.registrant_name,
            eventTitle:    ev.title,
            eventDate,
            eventLocation: ev.location,
            guestCount:    reg.guest_count,
            totalPaid,
          })
        );
      }
    }
  }

  return NextResponse.json({ received: true });
}
