import Link from "next/link";
import { Button } from "@/components/ui/button";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { Users, GitBranch, Calendar, ArrowRight } from "lucide-react";
import { eventHref } from "@/lib/events/slug";

// event routing: dynamic, no hardcoded IDs

export default async function LandingPage() {
  const admin = createAdminClient();

  // Check auth state for nav + CTA rendering (best-effort, never redirect).
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isLoggedIn = user !== null;

  // Featured event: next upcoming published event by date.
  const { data: featuredEvent } = await admin
    .from("events")
    .select("id, slug, title, event_date, location, ticket_price")
    .eq("status", "published")
    .order("event_date", { ascending: true })
    .limit(1)
    .maybeSingle();

  // Upcoming events section: all published events from now forward.
  const { data: upcomingEvents } = await admin
    .from("events")
    .select("id, slug, title, event_date, location, ticket_price")
    .eq("status", "published")
    .gte("event_date", new Date().toISOString())
    .order("event_date", { ascending: true });

  const heroImageUrl = process.env.NEXT_PUBLIC_HERO_IMAGE_URL ?? null;

  function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "long",
      day:   "numeric",
      year:  "numeric",
    });
  }

  return (
    <div className="bg-sn-black text-sn-off-white">

      {/* ── Section 1: Hero (full viewport) ──────────────────────────────────── */}
      <section className="relative min-h-screen flex flex-col">

        {/* Optional background image with dark overlay */}
        {heroImageUrl !== null && (
          <>
            <div
              className="absolute inset-0 bg-cover bg-center bg-no-repeat"
              style={{ backgroundImage: `url(${heroImageUrl})` }}
            />
            <div className="absolute inset-0 bg-black/60" />
          </>
        )}

        {/* Header */}
        <header className="relative z-10 border-b border-sn-gold/20 px-6 py-4">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-sn-gold flex items-center justify-center text-sn-black font-bold text-sm select-none">
                ΣΝ
              </div>
              <div>
                <p className="text-sn-gold font-semibold text-sm leading-none">
                  Sigma Nu Fraternity
                </p>
                <p className="text-sn-gray-text text-xs leading-none mt-0.5">
                  Mu Xi Chapter · Columbus State University
                </p>
              </div>
            </div>
            <nav className="flex items-center gap-3">
              {isLoggedIn ? (
                <Link href="/home">
                  <Button
                    size="sm"
                    className="bg-sn-gold text-sn-black hover:bg-sn-gold-light font-semibold"
                  >
                    My Hub
                  </Button>
                </Link>
              ) : (
                <>
                  <Link href="/login">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-white/80 hover:text-white hover:bg-white/10"
                    >
                      Member Login
                    </Button>
                  </Link>
                  <Link href="/signup">
                    <Button
                      size="sm"
                      className="bg-sn-gold text-sn-black hover:bg-sn-gold-light font-semibold"
                    >
                      Create Account
                    </Button>
                  </Link>
                </>
              )}
            </nav>
          </div>
        </header>

        {/* Hero content */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-16 text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-sn-off-white max-w-3xl leading-tight">
            Welcome Home,{" "}
            <span className="text-sn-gold">Brothers</span>
          </h1>
          <p className="mt-6 text-lg text-sn-gray-text max-w-xl leading-relaxed">
            The Mu Xi Chapter alumni platform — your hub for events, the
            brother directory, and our chapter&apos;s family lineage.
          </p>

          {/* Featured event card */}
          {featuredEvent !== null && (
            <div className="mt-10 bg-sn-surface border border-sn-gold/20 border-t-2 border-t-sn-gold rounded-sm px-6 py-5 max-w-md w-full text-left">
              <p className="text-sn-gold text-xs font-semibold uppercase tracking-widest mb-2">
                Featured Event
              </p>
              <p className="text-sn-off-white font-bold text-lg leading-snug">
                {featuredEvent.title}
              </p>
              <div className="mt-2 flex flex-col gap-0.5 text-sn-gray-text text-sm">
                <span>{formatDate(featuredEvent.event_date)}</span>
                {featuredEvent.location !== null && (
                  <span>{featuredEvent.location}</span>
                )}
                {featuredEvent.ticket_price > 0 ? (
                  <span className="text-sn-gold font-medium">
                    ${featuredEvent.ticket_price.toFixed(2)} per person
                  </span>
                ) : (
                  <span className="text-green-400 font-medium">Free</span>
                )}
              </div>
              <div className="mt-4">
                <Link href={eventHref(featuredEvent)}>
                  <Button
                    size="sm"
                    className="bg-sn-gold text-sn-black hover:bg-sn-gold-light font-semibold"
                  >
                    Register Now
                  </Button>
                </Link>
              </div>
            </div>
          )}

          {/* Nav CTAs */}
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            {isLoggedIn ? (
              <Link href="/home">
                <Button
                  size="lg"
                  variant="outline"
                  className="bg-transparent border-white/30 text-white hover:bg-white/10 px-8"
                >
                  Go to My Hub
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/login">
                  <Button
                    size="lg"
                    variant="outline"
                    className="bg-transparent border-white/30 text-white hover:bg-white/10 px-8"
                  >
                    Member Login
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button
                    size="lg"
                    variant="outline"
                    className="bg-transparent border-sn-gold/50 text-sn-gold hover:bg-sn-gold/10 px-8"
                  >
                    Create Account
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* ── Section 2: Upcoming Events ────────────────────────────────────────── */}
      <section className="px-6 py-20 bg-sn-black-secondary">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-sn-off-white text-3xl md:text-4xl font-bold mb-10">
            Upcoming Events
          </h2>

          {(upcomingEvents ?? []).length === 0 ? (
            <p className="text-sn-gray-text text-base">
              No upcoming events at this time. Check back soon.
            </p>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {(upcomingEvents ?? []).map((ev) => (
                  <div
                    key={ev.id}
                    className="bg-sn-surface border border-sn-gold/20 border-t-2 border-t-sn-gold rounded-sm p-6 flex flex-col gap-4"
                  >
                    <div className="flex-1 space-y-1.5">
                      <p className="text-sn-off-white font-bold text-lg leading-snug">
                        {ev.title}
                      </p>
                      <p className="text-sn-gray-text text-sm">
                        {formatDate(ev.event_date)}
                      </p>
                      {ev.location !== null && (
                        <p className="text-sn-gray-text text-sm">{ev.location}</p>
                      )}
                      {ev.ticket_price > 0 ? (
                        <p className="text-sn-gold text-sm font-medium">
                          ${ev.ticket_price.toFixed(2)} per person
                        </p>
                      ) : (
                        <p className="text-green-400 text-sm font-medium">Free</p>
                      )}
                    </div>
                    <Link href={eventHref(ev)}>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full bg-transparent border-sn-gold/40 text-sn-gold hover:bg-sn-gold/10 hover:border-sn-gold/60"
                      >
                        View Event
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
              <div className="mt-8 text-right">
                <Link
                  href="/events"
                  className="inline-flex items-center gap-1.5 text-sn-gold hover:text-sn-gold-light text-sm transition-colors"
                >
                  Browse all events
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </>
          )}
        </div>
      </section>

      {/* ── Section 3: Platform features ──────────────────────────────────────── */}
      <section className="px-6 py-20 bg-sn-black">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-sn-off-white text-3xl md:text-4xl font-bold mb-4">
            Your Alumni Hub
          </h2>
          <p className="text-sn-gray-text text-base max-w-2xl mb-12 leading-relaxed">
            Connect with brothers, explore your chapter&apos;s lineage, and stay up to date
            on events — all in one place.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-10">
            <Link href="/directory" className="space-y-3 group hover:opacity-80 transition-opacity">
              <Users className="w-8 h-8 text-sn-gold" />
              <p className="text-sn-off-white font-bold text-lg group-hover:text-sn-gold-light transition-colors">Directory</p>
              <p className="text-sn-gray-text text-sm leading-relaxed">
                Search and browse the full alumni roster with contact info,
                pledge class, and profile photos.
              </p>
            </Link>
            <Link href="/family-tree" className="space-y-3 group hover:opacity-80 transition-opacity">
              <GitBranch className="w-8 h-8 text-sn-gold" />
              <p className="text-sn-off-white font-bold text-lg group-hover:text-sn-gold-light transition-colors">Family Tree</p>
              <p className="text-sn-gray-text text-sm leading-relaxed">
                Visualize the full Big/Little lineage across every generation
                of the Mu Xi Chapter.
              </p>
            </Link>
            <Link href="/events" className="space-y-3 group hover:opacity-80 transition-opacity">
              <Calendar className="w-8 h-8 text-sn-gold" />
              <p className="text-sn-off-white font-bold text-lg group-hover:text-sn-gold-light transition-colors">Events</p>
              <p className="text-sn-gray-text text-sm leading-relaxed">
                Register for chapter events, track your registrations, and
                manage guests — all from one place.
              </p>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────────────── */}
      <footer className="border-t border-sn-gold/20 px-6 py-6 text-center">
        <p className="text-sn-gray-medium text-sm">
          © {new Date().getFullYear()} Sigma Nu Fraternity · Mu Xi Chapter · Columbus State University
        </p>
        <div className="flex items-center justify-center gap-4 mt-1.5 text-xs text-sn-gray-medium/60">
          <Link href="/privacy" className="hover:text-sn-gray-medium transition-colors">Privacy Policy</Link>
          <span>·</span>
          <Link href="/terms" className="hover:text-sn-gray-medium transition-colors">Terms of Service</Link>
          <span>·</span>
          <a href="mailto:info@csusigmanu.com" className="hover:text-sn-gray-medium transition-colors">info@csusigmanu.com</a>
        </div>
      </footer>

    </div>
  );
}
