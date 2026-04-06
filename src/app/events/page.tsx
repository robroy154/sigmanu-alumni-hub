import Link from "next/link";
import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { MapPin, Ticket, CalendarOff } from "lucide-react";

export const metadata: Metadata = { title: "Events — Sigma Nu Mu Xi Alumni" };

export default async function EventsPage() {
  const admin = createAdminClient();

  const { data: allEvents } = await admin
    .from("events")
    .select("id, title, event_date, location, ticket_price, description")
    .eq("status", "published")
    .order("event_date", { ascending: true });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const isLoggedIn = user !== null;

  const now = new Date();
  const events = allEvents ?? [];
  const upcoming = events.filter((e) => new Date(e.event_date) >= now);
  const past     = events.filter((e) => new Date(e.event_date) <  now).reverse();

  return (
    <div className="min-h-screen bg-sn-black flex flex-col">
      {/* Header */}
      <header className="border-b border-sn-gold/20 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-sn-gold flex items-center justify-center text-sn-black font-bold text-xs select-none">
              ΣΝ
            </div>
            <div>
              <p className="text-sn-gold font-semibold text-sm leading-none">Sigma Nu Fraternity</p>
              <p className="text-white/50 text-xs leading-none mt-0.5">Mu Xi Chapter · Columbus State University</p>
            </div>
          </Link>
          <nav className="flex items-center gap-3">
            {isLoggedIn ? (
              <Link href="/home">
                <Button size="sm" className="bg-sn-gold text-sn-black hover:bg-sn-gold-light font-semibold">
                  Member Home
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" size="sm" className="text-white/80 hover:text-white hover:bg-white/10">
                    Member Login
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button size="sm" className="bg-sn-gold text-sn-black hover:bg-sn-gold-light font-semibold">
                    Create Account
                  </Button>
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-12 space-y-12">
        {/* Page title */}
        <div>
          <h1 className="text-3xl font-bold text-sn-off-white">Events</h1>
          <p className="text-sn-gray-text text-sm mt-1">
            Upcoming events hosted by Sigma Nu Mu Xi Alumni
          </p>
        </div>

        {/* Upcoming */}
        <section className="space-y-4">
          <h2 className="text-sn-off-white font-semibold text-lg">Upcoming</h2>
          {upcoming.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <CalendarOff className="w-8 h-8 text-sn-gray-medium" />
              <p className="text-sn-gray-text text-sm">No upcoming events at this time. Check back soon.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcoming.map((event) => (
                <EventCard key={event.id} event={event} isLoggedIn={isLoggedIn} />
              ))}
            </div>
          )}
        </section>

        {/* Past */}
        {past.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-sn-off-white font-semibold text-lg">Past Events</h2>
            <div className="space-y-3">
              {past.map((event) => (
                <EventCard key={event.id} event={event} isLoggedIn={isLoggedIn} past />
              ))}
            </div>
          </section>
        )}
      </main>

      <footer className="border-t border-sn-gold/20 px-6 py-6 text-center">
        <p className="text-white/40 text-sm">
          Sigma Nu Fraternity · Mu Xi Chapter · Columbus State University
        </p>
      </footer>
    </div>
  );
}

interface EventCardProps {
  event: {
    id:           string;
    title:        string;
    event_date:   string;
    location:     string | null;
    ticket_price: number;
    description:  string | null;
  };
  isLoggedIn: boolean;
  past?: boolean;
}

function EventCard({ event, isLoggedIn, past = false }: EventCardProps) {
  const eventDate = new Date(event.event_date);

  return (
    <div className={`bg-sn-surface rounded-sm border-t-2 ${past ? "border-t-sn-gray-dark" : "border-t-sn-gold"} px-5 py-5`}>
      <div className="flex items-start gap-4">
        {/* Date badge */}
        <div className={`shrink-0 text-center rounded-sm px-3 py-2 min-w-[52px] border ${
          past
            ? "bg-white/5 border-white/10"
            : "bg-sn-gold/10 border-sn-gold/20"
        }`}>
          <p className={`text-xs font-medium uppercase ${past ? "text-sn-gray-medium" : "text-sn-gold"}`}>
            {eventDate.toLocaleDateString("en-US", { month: "short" })}
          </p>
          <p className={`font-bold text-xl leading-tight ${past ? "text-sn-gray-medium" : "text-sn-off-white"}`}>
            {eventDate.getDate()}
          </p>
          <p className={`text-xs ${past ? "text-sn-gray-medium/60" : "text-sn-gray-text"}`}>
            {eventDate.getFullYear()}
          </p>
        </div>

        {/* Details */}
        <div className="flex-1 min-w-0 space-y-1.5">
          <p className={`font-semibold text-base ${past ? "text-sn-gray-text" : "text-sn-off-white"}`}>
            {event.title}
          </p>

          <div className="flex flex-wrap gap-x-4 gap-y-1">
            <p className="text-sn-gray-text text-xs">
              {eventDate.toLocaleDateString("en-US", {
                weekday: "long",
                hour:    "numeric",
                minute:  "2-digit",
              })}
            </p>
            {event.location !== null && (
              <p className="flex items-center gap-1 text-sn-gray-text text-xs">
                <MapPin className="w-3 h-3 text-sn-gray-medium" />
                {event.location}
              </p>
            )}
            <p className="flex items-center gap-1 text-sn-gray-text text-xs">
              <Ticket className="w-3 h-3 text-sn-gray-medium" />
              {event.ticket_price > 0 ? `$${event.ticket_price.toFixed(2)} per person` : "Free"}
            </p>
          </div>

          {event.description !== null && event.description !== "" && (
            <p className="text-sn-gray-text text-sm leading-relaxed line-clamp-2">
              {event.description}
            </p>
          )}
        </div>

        {/* CTA */}
        {!past && (
          <div className="shrink-0">
            <Link href={`/events/${event.id}`}>
              <Button size="sm" className="bg-sn-gold text-sn-black hover:bg-sn-gold-light font-semibold whitespace-nowrap">
                {isLoggedIn ? "Register" : "Learn more"}
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
