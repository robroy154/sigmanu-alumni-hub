import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata: Metadata = { title: "Registration Confirmed" };

interface Props {
  searchParams: Promise<{ registration_id?: string; session_id?: string }>;
}

export default async function ConfirmationPage({ searchParams }: Props) {
  const { registration_id } = await searchParams;

  if (registration_id === undefined || registration_id === "") {
    redirect("/register");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user === null) redirect("/login");

  // Use admin client so we can read the registration regardless of payment_status.
  const admin = createAdminClient();
  const { data: registration } = await admin
    .from("registrations")
    .select(
      "id, registrant_name, email, tshirt_size, guest_count, payment_status, event_id, submitted_at"
    )
    .eq("id", registration_id)
    .eq("member_id", user.id) // Ensure the registration belongs to this user.
    .single();

  if (registration === null) redirect("/register");

  const { data: event } = await admin
    .from("events")
    .select("title, event_date, location, ticket_price")
    .eq("id", registration.event_id)
    .single();

  const { data: guests } = await admin
    .from("registration_guests")
    .select("guest_name")
    .eq("registration_id", registration_id);

  const isPaid = registration.payment_status === "paid";
  const totalAttendees = 1 + (registration.guest_count ?? 0);
  const totalPrice = totalAttendees * (event?.ticket_price ?? 0);

  const eventDate = event !== null ? new Date(event.event_date) : null;
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
    <div className="max-w-xl mx-auto space-y-6">
      {/* Status banner */}
      {isPaid ? (
        <div className="rounded-xl bg-green-500/10 border border-green-500/30 p-6 text-center space-y-2">
          <div className="text-green-400 text-3xl">✓</div>
          <h1 className="text-white text-xl font-bold">You&apos;re registered!</h1>
          <p className="text-white/60 text-sm">
            Payment confirmed. We&apos;ll see you there, brother.
          </p>
        </div>
      ) : (
        <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 p-6 text-center space-y-2">
          <div className="text-amber-400 text-3xl">⏳</div>
          <h1 className="text-white text-xl font-bold">Payment Processing</h1>
          <p className="text-white/60 text-sm">
            Your registration is saved. Payment confirmation may take a moment
            to arrive — refresh this page if needed.
          </p>
        </div>
      )}

      {/* Registration summary */}
      <div className="bg-sn-navy rounded-xl border border-sn-gold/20 p-6 space-y-4">
        <h2 className="text-white/70 text-xs font-semibold uppercase tracking-wider">
          Registration Summary
        </h2>

        <dl className="space-y-2.5">
          {event !== null && (
            <Row label="Event" value={event.title} />
          )}
          {formattedDate !== "" && (
            <Row label="Date" value={`${formattedDate} · ${formattedTime}`} />
          )}
          {event?.location !== null && event?.location !== undefined && (
            <Row label="Location" value={event.location} />
          )}
          <Row label="Name" value={registration.registrant_name} />
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

      {/* Navigation */}
      <div className="flex gap-3">
        <Link
          href="/"
          className="flex-1 inline-flex h-9 items-center justify-center rounded-lg border border-white/20 text-sm text-white/70 hover:text-white hover:bg-white/10 transition-colors"
        >
          Back to home
        </Link>
        <Link
          href="/directory"
          className="flex-1 inline-flex h-9 items-center justify-center rounded-lg bg-sn-gold text-sn-navy text-sm font-semibold hover:bg-sn-gold-light transition-colors"
        >
          Member directory
        </Link>
      </div>
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
