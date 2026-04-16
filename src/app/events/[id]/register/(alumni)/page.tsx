// event routing: dynamic, accepts UUID or slug
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { RegistrationForm } from "@/components/registration/RegistrationForm";
import { eventLookupFilter } from "@/lib/events/slug";

export const metadata: Metadata = { title: "Register for Event" };

interface Props {
  params:       Promise<{ id: string }>;
  searchParams: Promise<{ cancelled?: string }>;
}

export default async function EventRegisterPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { cancelled } = await searchParams;

  // Load the event. Accepts UUID or slug. Use admin client so pending users can see event details.
  const admin  = createAdminClient();
  const filter = eventLookupFilter(id);
  const { data: event } = await (
    filter.column === "id"
      ? admin.from("events").select("id, title, description, event_date, location, ticket_price").eq("id", filter.value).eq("status", "published")
      : admin.from("events").select("id, title, description, event_date, location, ticket_price").eq("slug", filter.value).eq("status", "published")
  ).maybeSingle();

  if (event === null) notFound();

  // Fetch custom fields for this event.
  const { data: eventFields } = await admin
    .from("event_fields")
    .select("id, event_id, field_label, field_type, field_options, required, display_order, created_at")
    .eq("event_id", event.id)
    .order("display_order");

  // Pre-fill from member profile.
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: member } = user !== null
    ? await supabase
        .from("members")
        .select("first_name, last_name, email")
        .eq("id", user.id)
        .single()
    : { data: null };

  const defaultName =
    member !== null
      ? `${member.first_name} ${member.last_name}`.trim()
      : "";
  const defaultEmail = user?.email ?? "";

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
    <div className="space-y-6">
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

      {/* Cancelled notice */}
      {cancelled === "1" && (
        <p className="text-amber-400 text-sm bg-amber-400/10 border border-amber-400/20 rounded-md px-3 py-2">
          Your payment was cancelled. Your registration has not been completed.
          You can try again below.
        </p>
      )}

      {/* Registration form */}
      <div className="bg-sn-black rounded-xl border border-sn-gold/20 p-6 space-y-4">
        <h2 className="text-white font-semibold">Your registration</h2>
        <RegistrationForm
          eventId={event.id}
          ticketPrice={event.ticket_price}
          defaultName={defaultName}
          defaultEmail={defaultEmail}
          eventFields={eventFields ?? []}
        />
      </div>
    </div>
  );
}
