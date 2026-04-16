// event routing: dynamic, accepts UUID or slug
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RichTextContent } from "@/components/ui/RichTextContent";
import { ICalButton } from "@/components/events/ICalButton";
import { WaitlistForm } from "@/components/events/WaitlistForm";
import { eventLookupFilter } from "@/lib/events/slug";
import { CalendarDays, MapPin, Ticket, ExternalLink } from "lucide-react";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id }   = await params;
  const admin    = createAdminClient();
  const filter   = eventLookupFilter(id);
  const { data: event } = await (
    filter.column === "id"
      ? admin.from("events").select("title").eq("id", filter.value).eq("status", "published")
      : admin.from("events").select("title").eq("slug", filter.value).eq("status", "published")
  ).maybeSingle();
  return { title: event !== null ? `${event.title} — Sigma Nu Mu Xi` : "Event" };
}

export default async function EventDetailPage({ params }: Props) {
  const { id } = await params;
  const admin  = createAdminClient();
  const filter = eventLookupFilter(id);

  const { data: event } = await (
    filter.column === "id"
      ? admin.from("events")
          .select("id, title, slug, description, rich_description, event_date, location, ticket_price, capacity, capacity_mode, status, registration_open, banner_image_url, event_type, early_bird_price, early_bird_ends_at, registration_closes_at")
          .eq("id", filter.value).eq("status", "published")
      : admin.from("events")
          .select("id, title, slug, description, rich_description, event_date, location, ticket_price, capacity, capacity_mode, status, registration_open, banner_image_url, event_type, early_bird_price, early_bird_ends_at, registration_closes_at")
          .eq("slug", filter.value).eq("status", "published")
  ).maybeSingle();

  if (event === null) notFound();

  // Count paid registrations for capacity check
  const { count: paidCount } = await admin
    .from("registrations")
    .select("id", { count: "exact", head: true })
    .eq("event_id", event.id)
    .eq("payment_status", "paid");

  // Auth state for CTA rendering
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const isLoggedIn = user !== null;

  // Pre-fill for waitlist form (authenticated users)
  let prefillName  = "";
  let prefillEmail = user?.email ?? "";
  if (isLoggedIn && user !== null) {
    const { data: member } = await supabase
      .from("members")
      .select("first_name, last_name")
      .eq("id", user.id)
      .single();
    if (member !== null) {
      prefillName = `${member.first_name} ${member.last_name}`.trim();
    }
  }

  // ── Computed booleans ────────────────────────────────────────────────────────
  const now = new Date();

  const earlyBirdActive =
    event.early_bird_price !== null &&
    event.early_bird_ends_at !== null &&
    new Date(event.early_bird_ends_at) > now;

  const registrationDeadlinePassed =
    event.registration_closes_at !== null &&
    new Date(event.registration_closes_at) <= now;

  const registrationDeadlineFuture =
    event.registration_closes_at !== null &&
    new Date(event.registration_closes_at) > now;

  const isFull =
    (event.capacity_mode === "capped" || event.capacity_mode === "waitlist") &&
    event.capacity !== null &&
    (paidCount ?? 0) >= event.capacity;

  const registrationEffectivelyOpen =
    event.registration_open &&
    !registrationDeadlinePassed &&
    !(event.capacity_mode === "capped" && isFull);

  const showWaitlist = event.capacity_mode === "waitlist" && isFull;

  // ── Date formatting ──────────────────────────────────────────────────────────
  const eventDate      = new Date(event.event_date);
  const formattedDate  = eventDate.toLocaleDateString("en-US", {
    weekday: "long",
    year:    "numeric",
    month:   "long",
    day:     "numeric",
  });
  const formattedTime  = eventDate.toLocaleTimeString("en-US", {
    hour:         "numeric",
    minute:       "2-digit",
    timeZoneName: "short",
  });

  // Google Calendar link
  const gcalStart  = eventDate.toISOString().replace(/[-:]/g, "").replace(".000", "");
  const gcalEnd    = new Date(eventDate.getTime() + 3 * 60 * 60 * 1000)
    .toISOString().replace(/[-:]/g, "").replace(".000", "");
  const gcalUrl =
    `https://calendar.google.com/calendar/render?action=TEMPLATE` +
    `&text=${encodeURIComponent(event.title)}` +
    `&dates=${gcalStart}/${gcalEnd}` +
    (event.location !== null ? `&location=${encodeURIComponent(event.location)}` : "") +
    (event.description !== null ? `&details=${encodeURIComponent(event.description.slice(0, 500))}` : "");

  // Displayed price (early bird takes precedence when active)
  const displayPrice = earlyBirdActive
    ? Number(event.early_bird_price)
    : event.ticket_price;

  const slug = event.slug ?? event.id;

  return (
    <div className="min-h-screen bg-sn-black flex flex-col">

      {/* Header */}
      <header className="border-b border-sn-gold/20 px-6 py-4 relative z-10">
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

      {/* Banner image */}
      {event.banner_image_url !== null && (
        <div
          className="w-full h-56 md:h-72 bg-cover bg-center relative"
          style={{ backgroundImage: `url(${event.banner_image_url})` }}
        >
          <div className="absolute inset-0 bg-black/50" />
        </div>
      )}

      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-12 space-y-8">

        {/* Event hero */}
        <div className="space-y-5">
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
            <span className="flex items-center gap-1.5">
              <CalendarDays size={14} className="text-sn-gray-medium" />
              {formattedDate} · {formattedTime}
            </span>
            {event.location !== null && (
              <span className="flex items-center gap-1.5">
                <MapPin size={14} className="text-sn-gray-medium" />
                {event.location}
              </span>
            )}
          </div>

          {/* Pricing */}
          <div className="space-y-1">
            {event.ticket_price === 0 ? (
              <p className="text-green-400 font-medium flex items-center gap-1.5">
                <Ticket size={14} />
                Free admission
              </p>
            ) : earlyBirdActive ? (
              <div className="space-y-0.5">
                <p className="text-sn-gold font-semibold flex items-center gap-1.5">
                  <Ticket size={14} />
                  ${displayPrice.toFixed(2)} per person
                  <Badge className="bg-sn-gold/20 text-sn-gold border border-sn-gold/30 text-xs ml-1">
                    Early bird
                  </Badge>
                </p>
                <p className="text-white/40 text-sm line-through pl-5">
                  ${event.ticket_price.toFixed(2)} regular price
                </p>
                <p className="text-amber-400 text-xs pl-5">
                  Early bird pricing ends{" "}
                  {new Date(event.early_bird_ends_at!).toLocaleDateString("en-US", {
                    month: "long", day: "numeric", year: "numeric",
                  })}
                </p>
              </div>
            ) : (
              <p className="text-sn-gold font-medium flex items-center gap-1.5">
                <Ticket size={14} />
                ${event.ticket_price.toFixed(2)} per person
              </p>
            )}
          </div>

          {/* Registration deadline notice */}
          {registrationDeadlineFuture && (
            <p className="text-amber-400 text-sm">
              Registration closes{" "}
              {new Date(event.registration_closes_at!).toLocaleDateString("en-US", {
                month: "long", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit",
              })}
            </p>
          )}

          {/* Capacity notice */}
          {event.capacity !== null && (
            <p className="text-white/40 text-sm">
              {event.capacity} capacity
              {paidCount !== null && paidCount > 0
                ? ` · ${event.capacity - paidCount} spots remaining`
                : ""}
            </p>
          )}
        </div>

        {/* Description */}
        {(event.rich_description !== null || event.description !== null) && (
          <div className="border-t border-white/5 pt-8">
            {event.rich_description !== null ? (
              <RichTextContent content={event.rich_description} />
            ) : (
              <p className="text-white/70 text-base leading-relaxed">
                {event.description}
              </p>
            )}
          </div>
        )}

        {/* CTA section */}
        <div className="border-t border-white/5 pt-8 space-y-4">
          {showWaitlist ? (
            <WaitlistForm
              eventId={event.id}
              prefillName={prefillName}
              prefillEmail={prefillEmail}
            />
          ) : !registrationEffectivelyOpen ? (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10">
              <span className="text-white/50 text-sm">Registration closed</span>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row gap-4">
              {isLoggedIn ? (
                <Link href={`/events/${slug}/register`}>
                  <Button size="lg" className="bg-sn-gold text-sn-black hover:bg-sn-gold-light font-semibold px-8">
                    Register as Alumni
                  </Button>
                </Link>
              ) : (
                <>
                  <Link href={`/login?redirectTo=/events/${slug}/register`}>
                    <Button size="lg" className="bg-sn-gold text-sn-black hover:bg-sn-gold-light font-semibold px-8">
                      Register as Alumni
                    </Button>
                  </Link>
                  <Link href={`/events/${slug}/register/guest`}>
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

          {/* Calendar add options */}
          <div className="flex flex-wrap items-center gap-2">
            <ICalButton
              event={{
                id:          event.id,
                title:       event.title,
                description: event.description,
                event_date:  event.event_date,
                location:    event.location,
              }}
            />
            <a
              href={gcalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-white/60 hover:text-white text-sm px-3 py-1.5 rounded hover:bg-white/10 transition-colors"
            >
              <ExternalLink size={13} />
              Add to Google Calendar
            </a>
          </div>
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
