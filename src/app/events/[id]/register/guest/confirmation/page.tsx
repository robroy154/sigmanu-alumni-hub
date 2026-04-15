import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe/client";
import { GuestSignupCTA } from "@/components/registration/GuestSignupCTA";

export const metadata: Metadata = { title: "Registration Confirmed" };

interface Props {
  params:       Promise<{ id: string }>;
  searchParams: Promise<{ session_id?: string; registration_id?: string }>;
}

export default async function GuestConfirmationPage({ params, searchParams }: Props) {
  const { id: eventId }                         = await params;
  const { session_id, registration_id: regIdParam } = await searchParams;

  // Require at least one of the two params.
  if (
    (session_id === undefined || session_id === "") &&
    (regIdParam === undefined || regIdParam === "")
  ) {
    redirect("/events");
  }

  const admin = createAdminClient();
  let registrationId: string;
  let isPaid: boolean;

  if (session_id !== undefined && session_id !== "") {
    // Paid path: verify with Stripe and retrieve registration_id from metadata.
    const session = await stripe.checkout.sessions.retrieve(session_id);
    const metaId  = session.metadata?.registration_id;

    if (metaId === undefined || metaId === null || metaId === "") {
      redirect("/events");
    }

    registrationId = metaId;
    isPaid         = session.payment_status === "paid";
  } else {
    // Free path: use registration_id directly.
    registrationId = regIdParam as string;
    isPaid         = true; // Free registrations are marked paid immediately by the server action.
  }

  // Fetch registration — guest rows have member_id = null.
  const { data: registration } = await admin
    .from("registrations")
    .select("id, registrant_name, email, phone, tshirt_size, guest_count, payment_status, event_id, submitted_at")
    .eq("id", registrationId)
    .is("member_id", null)
    .single();

  if (registration === null) redirect("/events");

  const { data: event } = await admin
    .from("events")
    .select("title, event_date, location, ticket_price")
    .eq("id", registration.event_id)
    .single();

  const { data: guests } = await admin
    .from("registration_guests")
    .select("guest_name")
    .eq("registration_id", registrationId);

  const totalAttendees = 1 + (registration.guest_count ?? 0);
  const totalPrice     = totalAttendees * (event?.ticket_price ?? 0);

  const eventDate     = event !== null ? new Date(event.event_date) : null;
  const formattedDate =
    eventDate !== null
      ? eventDate.toLocaleDateString("en-US", {
          weekday: "long",
          year:    "numeric",
          month:   "long",
          day:     "numeric",
        })
      : "";
  const formattedTime =
    eventDate !== null
      ? eventDate.toLocaleTimeString("en-US", {
          hour:         "numeric",
          minute:       "2-digit",
          timeZoneName: "short",
        })
      : "";

  return (
    <div className="min-h-screen bg-sn-black-secondary flex flex-col">
      <header className="bg-sn-black border-b border-sn-gold/20 px-6 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-sn-gold flex items-center justify-center text-sn-black font-bold text-xs select-none">
              ΣΝ
            </div>
            <span className="text-sn-gold font-semibold text-sm">
              Sigma Nu · Mu Xi
            </span>
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-8 space-y-6">
        {/* Status banner */}
        {isPaid ? (
          <div className="rounded-xl border border-green-500/30 bg-green-500/10 px-5 py-4 flex items-center gap-3">
            <span className="text-green-400 text-2xl">✓</span>
            <div>
              <p className="text-green-400 font-semibold">You&apos;re registered!</p>
              <p className="text-white/60 text-sm">
                A confirmation has been sent to {registration.email}.
              </p>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-amber-400/30 bg-amber-400/10 px-5 py-4 flex items-center gap-3">
            <span className="text-amber-400 text-2xl">⏳</span>
            <div>
              <p className="text-amber-400 font-semibold">Payment processing</p>
              <p className="text-white/60 text-sm">
                Your payment is being processed. Check back shortly.
              </p>
            </div>
          </div>
        )}

        {/* Registration summary */}
        <div className="bg-sn-black rounded-xl border border-sn-gold/20 p-6 space-y-4">
          <h2 className="text-white/70 text-xs font-semibold uppercase tracking-wider">
            Registration Summary
          </h2>

          <dl className="space-y-2.5">
            {event !== null && <Row label="Event" value={event.title} />}
            {formattedDate !== "" && (
              <Row label="Date" value={`${formattedDate} · ${formattedTime}`} />
            )}
            {event?.location !== null && event?.location !== undefined && (
              <Row label="Location" value={event.location} />
            )}
            <Row label="Name"  value={registration.registrant_name} />
            <Row label="Email" value={registration.email} />
            {registration.tshirt_size !== null && (
              <Row label="T-shirt" value={registration.tshirt_size} />
            )}
          </dl>

          {guests !== null && guests.length > 0 && (
            <div className="space-y-1 pt-1">
              <p className="text-white/50 text-xs uppercase tracking-wider">
                Additional guests
              </p>
              {guests.map((g, i) => (
                <p key={i} className="text-white text-sm">
                  {g.guest_name}
                </p>
              ))}
            </div>
          )}

          {(event?.ticket_price ?? 0) > 0 && (
            <div className="border-t border-sn-gold/20 pt-3 flex justify-between">
              <span className="text-white/60 text-sm">
                {totalAttendees} attendee{totalAttendees !== 1 ? "s" : ""}
              </span>
              <span className="text-white font-semibold text-sm">
                ${totalPrice.toFixed(2)}
              </span>
            </div>
          )}
        </div>

        {/* Alumni sign-up CTA */}
        <GuestSignupCTA
          registrantName={registration.registrant_name}
          email={registration.email}
          phone={registration.phone ?? undefined}
        />

        {/* Contact line for guests who need to make changes */}
        <p className="text-white/40 text-sm text-center">
          Need to make changes to your registration?{" "}
          <a
            href="mailto:info@csusigmanu.com"
            className="text-sn-gold hover:text-sn-gold-light underline"
          >
            Email us at info@csusigmanu.com
          </a>
        </p>

        {/* Navigation */}
        <div className="flex gap-3">
          <Link
            href="/"
            className="flex-1 inline-flex h-9 items-center justify-center rounded-sm border border-white/20 text-sm text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            Back to home
          </Link>
          <Link
            href={`/events/${eventId}`}
            className="flex-1 inline-flex h-9 items-center justify-center rounded-sm border border-white/20 text-sm text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            Back to event
          </Link>
        </div>
      </main>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3">
      <dt className="w-24 shrink-0 text-white/50 text-sm">{label}</dt>
      <dd className="text-white text-sm">{value}</dd>
    </div>
  );
}
