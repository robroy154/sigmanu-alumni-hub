// event routing: dynamic, no hardcoded IDs
import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { GuestRegistrationForm } from "@/components/registration/GuestRegistrationForm";

export const metadata: Metadata = { title: "Guest Registration" };

interface Props {
  params: Promise<{ id: string }>;
}

export default async function GuestRegisterPage({ params }: Props) {
  const { id } = await params;
  const admin = createAdminClient();

  const { data: event } = await admin
    .from("events")
    .select("id, title, description, event_date, location, ticket_price, registration_open")
    .eq("id", id)
    .eq("status", "published")
    .maybeSingle();

  if (event === null || event.registration_open !== true) {
    redirect("/events");
  }

  const eventDate = new Date(event.event_date);
  const formattedDate = eventDate.toLocaleDateString("en-US", {
    weekday: "long",
    year:    "numeric",
    month:   "long",
    day:     "numeric",
  });
  const formattedTime = eventDate.toLocaleTimeString("en-US", {
    hour:        "numeric",
    minute:      "2-digit",
    timeZoneName: "short",
  });

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
          <Link
            href={`/login?redirectTo=/events/${id}/register`}
            className="text-white/50 hover:text-white text-sm transition-colors"
          >
            Alumni sign in
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-8 space-y-6">
        {/* Event header */}
        <div className="bg-sn-black rounded-xl border border-sn-gold/20 p-6 space-y-2">
          <h1 className="text-white text-2xl font-bold">{event.title}</h1>
          <div className="flex flex-wrap gap-x-6 gap-y-1 text-white/60 text-sm">
            <span>{formattedDate} · {formattedTime}</span>
            {event.location !== null && <span>{event.location}</span>}
            {event.ticket_price > 0 && (
              <span className="text-sn-gold font-medium">
                ${event.ticket_price.toFixed(2)} per person
              </span>
            )}
          </div>
          {event.description !== null && (
            <p className="text-white/50 text-sm leading-relaxed pt-1">
              {event.description}
            </p>
          )}
        </div>

        {/* Guest registration form */}
        <div className="bg-sn-black rounded-xl border border-sn-gold/20 p-6 space-y-4">
          <div>
            <h2 className="text-white font-semibold">Guest registration</h2>
            <p className="text-white/50 text-sm mt-0.5">
              Registering as a non-member guest.
            </p>
          </div>
          <GuestRegistrationForm
            eventId={event.id}
            ticketPrice={event.ticket_price}
          />
        </div>
      </main>
    </div>
  );
}
