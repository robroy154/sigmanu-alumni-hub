import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";

interface Props {
  params: Promise<{ registrationId: string }>;
}

export const metadata: Metadata = { title: "Receipt — My Events" };

export default async function RegistrationReceiptPage({ params }: Props) {
  const { registrationId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user === null) redirect("/login");

  // RLS on registrations enforces ownership (member_id = auth.uid()).
  // The .eq("member_id", ...) filter is defense-in-depth: if this user doesn't
  // own the registration, the row is filtered out and we redirect to /my-events.
  const { data: reg } = await supabase
    .from("registrations")
    .select(`
      id, registrant_name, email, phone, guest_count, payment_status,
      stripe_payment_id, submitted_at, amount_paid, applied_price,
      events(title, event_date, location, ticket_price),
      registration_guests(guest_name),
      event_field_responses(response_value, event_fields(field_label, display_order)),
      registration_payments(id, amount, created_at, stripe_payment_id)
    `)
    .eq("id", registrationId)
    .eq("member_id", user.id)
    .single();

  if (reg === null) redirect("/my-events");

  const event = reg.events as {
    title:        string;
    event_date:   string;
    location:     string | null;
    ticket_price: number;
  } | null;

  const guests = (reg.registration_guests ?? []) as { guest_name: string }[];

  const fieldResponses = ((reg.event_field_responses ?? []) as {
    response_value: string | null;
    event_fields:   { field_label: string; display_order: number } | null;
  }[]).sort(
    (a, b) => (a.event_fields?.display_order ?? 0) - (b.event_fields?.display_order ?? 0)
  );

  const additionalPayments = (reg.registration_payments ?? []) as {
    id:                string;
    amount:            number;
    created_at:        string;
    stripe_payment_id: string;
  }[];

  const amountPaid = reg.amount_paid !== null && reg.amount_paid !== undefined
    ? Number(reg.amount_paid)
    : null;
  const totalAdditional = additionalPayments.reduce((sum, p) => sum + Number(p.amount), 0);
  const total = amountPaid !== null ? amountPaid + totalAdditional : null;

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <Link
        href="/my-events"
        className="inline-block text-sn-gray-text hover:text-sn-off-white text-sm transition-colors"
      >
        ← Back to My Events
      </Link>

      <div>
        <h1 className="text-sn-off-white text-2xl font-bold">Registration Receipt</h1>
        {event !== null && (
          <p className="text-sn-gray-text text-sm mt-1">{event.title}</p>
        )}
      </div>

      {/* Event */}
      {event !== null && (
        <Section title="Event">
          <InfoRow label="Event"    value={event.title} />
          <InfoRow
            label="Date"
            value={new Date(event.event_date).toLocaleDateString("en-US", {
              weekday: "long",
              year:    "numeric",
              month:   "long",
              day:     "numeric",
            })}
          />
          {event.location !== null && event.location !== "" && (
            <InfoRow label="Location" value={event.location} />
          )}
        </Section>
      )}

      {/* Registrant */}
      <Section title="Registrant">
        <InfoRow label="Name"  value={reg.registrant_name} />
        <InfoRow label="Email" value={reg.email} />
        {reg.phone !== null && reg.phone !== "" && (
          <InfoRow label="Phone" value={reg.phone} />
        )}
      </Section>

      {/* Guests */}
      <Section title="Guests">
        {guests.length === 0 ? (
          <p className="text-sn-gray-text text-sm">No additional guests.</p>
        ) : (
          <ul className="space-y-1.5">
            {guests.map((g, i) => (
              <li key={i} className="text-sn-off-white text-sm">
                {g.guest_name}
              </li>
            ))}
          </ul>
        )}
      </Section>

      {/* Custom field responses */}
      {fieldResponses.length > 0 && (
        <Section title="Additional Information">
          {fieldResponses.map((r, i) => (
            <InfoRow
              key={i}
              label={r.event_fields?.field_label ?? "—"}
              value={r.response_value ?? "—"}
            />
          ))}
        </Section>
      )}

      {/* Payment */}
      <Section title="Payment">
        <div className="flex gap-3">
          <span className="w-32 shrink-0 text-sn-gray-text text-sm">Status</span>
          <span><PaymentBadge status={reg.payment_status} /></span>
        </div>
        {amountPaid !== null && (
          <InfoRow label="Amount paid" value={`$${amountPaid.toFixed(2)}`} />
        )}
        {additionalPayments.map((p) => (
          <InfoRow
            key={p.id}
            label={`Additional (${new Date(p.created_at).toLocaleDateString("en-US", {
              month: "short",
              day:   "numeric",
            })})`}
            value={`$${Number(p.amount).toFixed(2)}`}
          />
        ))}
        {total !== null && additionalPayments.length > 0 && (
          <div className="flex gap-3 pt-1 border-t border-white/10">
            <span className="w-32 shrink-0 text-sn-gray-text text-sm font-medium">Total</span>
            <span className="text-sn-gold text-sm font-semibold">${total.toFixed(2)}</span>
          </div>
        )}
        <InfoRow
          label="Registered"
          value={new Date(reg.submitted_at).toLocaleDateString("en-US", {
            year:  "numeric",
            month: "long",
            day:   "numeric",
          })}
        />
      </Section>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-sn-surface rounded-xl p-6 space-y-3">
      <h2 className="text-sn-gray-text text-xs font-semibold uppercase tracking-wider">
        {title}
      </h2>
      {children}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3">
      <span className="w-32 shrink-0 text-sn-gray-text text-sm">{label}</span>
      <span className="text-sn-off-white text-sm break-all">{value}</span>
    </div>
  );
}

function PaymentBadge({ status }: { status: string }) {
  if (status === "paid") {
    return (
      <span className="inline-flex items-center rounded-full bg-green-400/10 border border-green-400/30 px-2 py-0.5 text-xs text-green-400">
        Paid
      </span>
    );
  }
  if (status === "refunded") {
    return (
      <span className="inline-flex items-center rounded-full bg-white/5 border border-white/15 px-2 py-0.5 text-xs text-white/40">
        Refunded
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-yellow-400/10 border border-yellow-400/30 px-2 py-0.5 text-xs text-yellow-400">
      Unpaid
    </span>
  );
}
