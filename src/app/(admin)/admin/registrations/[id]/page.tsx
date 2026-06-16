import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { DeleteRegistrationButton } from "@/components/admin/DeleteRegistrationButton";
import { MarkRefundedButton } from "@/components/admin/MarkRefundedButton";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const admin = createAdminClient();
  const { data } = await admin
    .from("registrations")
    .select("registrant_name")
    .eq("id", id)
    .single();
  if (data === null) return { title: "Registration Not Found — Admin" };
  return { title: `${data.registrant_name} — Registration — Admin` };
}

export default async function AdminRegistrationDetailPage({ params }: Props) {
  const { id } = await params;
  const admin = createAdminClient();

  const [{ data: reg }, { data: paymentRows }] = await Promise.all([
    admin
      .from("registrations")
      .select(`
        id, registrant_name, email, phone, guest_count, payment_status,
        stripe_payment_id, submitted_at, amount_paid, applied_price, member_id,
        events(title, event_date, location, ticket_price),
        registration_guests(guest_name),
        event_field_responses(response_value, event_fields(field_label, display_order))
      `)
      .eq("id", id)
      .single(),
    admin
      .from("registration_payments")
      .select("id, amount, guest_count_delta, stripe_payment_id, created_at")
      .eq("registration_id", id)
      .order("created_at"),
  ]);

  if (reg === null) notFound();

  const event = reg.events as {
    title: string;
    event_date: string;
    location: string | null;
    ticket_price: number;
  } | null;

  const guests = (reg.registration_guests ?? []) as { guest_name: string }[];

  const fieldResponses = ((reg.event_field_responses ?? []) as {
    response_value: string | null;
    event_fields: { field_label: string; display_order: number } | null;
  }[]).sort(
    (a, b) => (a.event_fields?.display_order ?? 0) - (b.event_fields?.display_order ?? 0)
  );

  const additionalPayments = (paymentRows ?? []) as {
    id: string;
    amount: number;
    guest_count_delta: number;
    stripe_payment_id: string;
    created_at: string;
  }[];

  const amountPaid = reg.amount_paid !== null && reg.amount_paid !== undefined
    ? Number(reg.amount_paid)
    : null;
  const totalAdditional = additionalPayments.reduce((sum, p) => sum + Number(p.amount), 0);
  const total = amountPaid !== null ? amountPaid + totalAdditional : null;

  const eventTitle = event?.title ?? "—";

  return (
    <div className="max-w-2xl space-y-6">
      <Link
        href="/admin/registrations"
        className="inline-block text-sn-gray-text hover:text-sn-off-white text-sm transition-colors"
      >
        ← Registrations
      </Link>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-sn-off-white text-2xl font-bold">{reg.registrant_name}</h1>
          {event !== null && (
            <p className="text-sn-gray-text text-sm mt-0.5">{event.title}</p>
          )}
        </div>
        <PaymentBadge status={reg.payment_status} />
      </div>

      {/* Event */}
      {event !== null && (
        <Section title="Event">
          <InfoRow label="Title" value={event.title} />
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
          <InfoRow
            label="Ticket price"
            value={event.ticket_price > 0 ? `$${Number(event.ticket_price).toFixed(2)}` : "Free"}
          />
        </Section>
      )}

      {/* Registrant */}
      <Section title="Registrant">
        {reg.member_id !== null && reg.member_id !== undefined ? (
          <div className="flex gap-3">
            <span className="w-32 shrink-0 text-sn-gray-text text-sm">Member</span>
            <Link
              href={`/admin/members/${reg.member_id}`}
              className="text-sn-gold text-sm hover:underline"
            >
              View member profile →
            </Link>
          </div>
        ) : (
          <InfoRow label="Type" value="Guest (no account)" />
        )}
        <InfoRow label="Name"  value={reg.registrant_name} />
        <div className="flex gap-3">
          <span className="w-32 shrink-0 text-sn-gray-text text-sm">Email</span>
          <a
            href={`mailto:${reg.email}`}
            className="text-sn-off-white text-sm hover:text-sn-gold transition-colors break-all"
          >
            {reg.email}
          </a>
        </div>
        {reg.phone !== null && reg.phone !== "" && (
          <InfoRow label="Phone" value={reg.phone} />
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
      <Section title="Custom Responses">
        {fieldResponses.length === 0 ? (
          <p className="text-sn-gray-text text-sm">No custom responses.</p>
        ) : (
          fieldResponses.map((r, i) => (
            <InfoRow
              key={i}
              label={r.event_fields?.field_label ?? "—"}
              value={r.response_value ?? "—"}
            />
          ))
        )}
      </Section>

      {/* Payment */}
      <Section title="Payment">
        <div className="flex gap-3">
          <span className="w-32 shrink-0 text-sn-gray-text text-sm">Status</span>
          <span><PaymentBadge status={reg.payment_status} /></span>
        </div>
        {amountPaid !== null && (
          <InfoRow label="Original" value={`$${amountPaid.toFixed(2)}`} />
        )}
        {additionalPayments.map((p) => (
          <InfoRow
            key={p.id}
            label={`+ ${p.guest_count_delta} guest${p.guest_count_delta !== 1 ? "s" : ""} (${new Date(p.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })})`}
            value={`$${Number(p.amount).toFixed(2)}`}
          />
        ))}
        {total !== null && additionalPayments.length > 0 && (
          <div className="flex gap-3 pt-1 border-t border-white/10">
            <span className="w-32 shrink-0 text-sn-gray-text text-sm font-medium">Total</span>
            <span className="text-sn-gold text-sm font-semibold">${total.toFixed(2)}</span>
          </div>
        )}
        {reg.stripe_payment_id !== null && reg.stripe_payment_id !== "" && (
          <InfoRow label="Stripe ref" value={reg.stripe_payment_id} />
        )}
        {reg.payment_status === "paid" && (
          <div className="flex gap-3 pt-1 border-t border-white/10">
            <span className="w-32 shrink-0 text-sn-gray-text text-sm">Actions</span>
            <MarkRefundedButton registrationId={reg.id} />
          </div>
        )}
      </Section>

      {/* Danger zone */}
      <div className="rounded-xl border border-red-500/20 p-5 space-y-3">
        <h2 className="text-red-400/80 text-sm font-semibold">Danger Zone</h2>
        <DeleteRegistrationButton
          registrationId={reg.id}
          registrantName={reg.registrant_name}
          eventTitle={eventTitle}
          paymentStatus={reg.payment_status}
          redirectAfter="/admin/registrations"
          showStatusNote
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-sn-black rounded-xl border border-sn-gold/20 p-6 space-y-3">
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
  const styles: Record<string, string> = {
    paid:     "bg-green-500/20 text-green-400 border-green-500/30",
    unpaid:   "bg-amber-500/20 text-amber-400 border-amber-500/30",
    refunded: "bg-white/10 text-white/50 border-white/20",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs capitalize ${
        styles[status] ?? "bg-white/10 text-white/50 border-white/20"
      }`}
    >
      {status}
    </span>
  );
}
