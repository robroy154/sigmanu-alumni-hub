import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const admin = createAdminClient();
  const { data: event } = await admin
    .from("events")
    .select("title")
    .eq("id", id)
    .eq("status", "published")
    .maybeSingle();

  return { title: event !== null ? event.title : "Event" };
}

export default async function EventDetailPage({ params }: Props) {
  const { id } = await params;
  const admin = createAdminClient();

  const { data: event } = await admin
    .from("events")
    .select("id, title, description, event_date, location, ticket_price, capacity, status, registration_open")
    .eq("id", id)
    .eq("status", "published")
    .maybeSingle();

  if (event === null) notFound();

  // Check auth state for CTA button.
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const isLoggedIn = user !== null;
  const canRegister = event.registration_open === true;

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
              <Link href="/profile">
                <Button size="sm" className="bg-sn-gold text-sn-black hover:bg-sn-gold-light font-semibold">
                  My Profile
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

      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-12">
        {/* Event hero */}
        <div className="space-y-6">
          <Badge
            variant="outline"
            className="border-sn-gold/40 text-sn-gold text-xs tracking-widest uppercase"
          >
            Upcoming Event
          </Badge>

          <h1 className="text-3xl md:text-5xl font-bold text-white leading-tight">
            {event.title}
          </h1>

          {/* Meta row */}
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-white/60 text-sm">
            <span>{formattedDate} · {formattedTime}</span>
            {event.location !== null && <span>{event.location}</span>}
            {event.ticket_price > 0 && (
              <span className="text-sn-gold font-medium">
                ${event.ticket_price.toFixed(2)} per person
              </span>
            )}
            {event.ticket_price === 0 && (
              <span className="text-green-400 font-medium">Free admission</span>
            )}
            {event.capacity !== null && (
              <span>{event.capacity} capacity</span>
            )}
          </div>

          {event.description !== null && (
            <p className="text-white/70 text-base leading-relaxed max-w-2xl">
              {event.description}
            </p>
          )}

          {/* CTA */}
          {canRegister && (
            <div className="pt-4 flex flex-col sm:flex-row gap-4">
              {isLoggedIn ? (
                <Link href={`/events/${event.id}/register`}>
                  <Button size="lg" className="bg-sn-gold text-sn-black hover:bg-sn-gold-light font-semibold px-8">
                    Register as Alumni
                  </Button>
                </Link>
              ) : (
                <>
                  <Link href={`/login?redirectTo=/events/${event.id}/register`}>
                    <Button size="lg" className="bg-sn-gold text-sn-black hover:bg-sn-gold-light font-semibold px-8">
                      Register as Alumni
                    </Button>
                  </Link>
                  <Link href={`/events/${event.id}/register/guest`}>
                    <Button
                      size="lg"
                      variant="outline"
                      className="bg-transparent border-white/30 text-white hover:bg-white/10 px-8"
                    >
                      Register as Guest
                    </Button>
                  </Link>
                </>
              )}
            </div>
          )}
        </div>
      </main>

      <footer className="border-t border-sn-gold/20 px-6 py-6 text-center">
        <p className="text-white/40 text-sm">
          Sigma Nu Fraternity · Mu Xi Chapter · Columbus State University
        </p>
      </footer>
    </div>
  );
}
