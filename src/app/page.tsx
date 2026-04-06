import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export default async function HomePage() {
  // Use admin client — home page is public (unauthenticated), so RLS would
  // block the events query. We only expose open events.
  const admin = createAdminClient();

  // Check if the visitor is already authenticated (best-effort — never redirect).
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const isLoggedIn = user !== null;
  const { data: event } = await admin
    .from("events")
    .select("title, event_date, location, ticket_price, registration_open")
    .eq("registration_open", true)
    .order("event_date", { ascending: true })
    .limit(1)
    .maybeSingle();

  const eventDate = event !== null ? new Date(event.event_date) : null;
  const formattedDate =
    eventDate !== null
      ? eventDate.toLocaleDateString("en-US", {
          month: "long",
          day:   "numeric",
          year:  "numeric",
        })
      : null;

  return (
    <div className="min-h-screen bg-sn-navy flex flex-col">
      {/* Header */}
      <header className="border-b border-sn-gold/20 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-sn-gold flex items-center justify-center text-sn-navy font-bold text-sm select-none">
              ΣΝ
            </div>
            <div>
              <p className="text-sn-gold font-semibold text-sm leading-none">
                Sigma Nu Fraternity
              </p>
              <p className="text-white/60 text-xs leading-none mt-0.5">
                Mu Xi Chapter · Columbus State University
              </p>
            </div>
          </div>
          <nav className="flex items-center gap-3">
            {isLoggedIn ? (
              <Link href="/profile">
                <Button
                  size="sm"
                  className="bg-sn-gold text-sn-navy hover:bg-sn-gold-light font-semibold"
                >
                  My Profile
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
                    className="bg-sn-gold text-sn-navy hover:bg-sn-gold-light font-semibold"
                  >
                    Create Account
                  </Button>
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-20 text-center">
        {event !== null ? (
          <>
            <Badge
              variant="outline"
              className="border-sn-gold/40 text-sn-gold mb-6 text-xs tracking-widest uppercase"
            >
              {event.title}
            </Badge>

            <h1 className="text-4xl md:text-6xl font-bold text-white max-w-3xl leading-tight">
              Welcome Home,{" "}
              <span className="text-sn-gold">Brothers</span>
            </h1>

            <p className="mt-6 text-lg text-white/70 max-w-xl leading-relaxed">
              The Mu Xi Chapter alumni platform — your hub for events, the
              brother directory, and our chapter&apos;s family lineage.
            </p>

            {/* Event details */}
            <div className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-1 text-white/50 text-sm">
              {formattedDate !== null && <span>{formattedDate}</span>}
              {event.location !== null && <span>{event.location}</span>}
              {event.ticket_price > 0 && (
                <span className="text-sn-gold">
                  ${event.ticket_price.toFixed(2)} per person
                </span>
              )}
            </div>

            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register">
                <Button
                  size="lg"
                  className="bg-sn-gold text-sn-navy hover:bg-sn-gold-light font-semibold px-8"
                >
                  Register Now
                </Button>
              </Link>
              {isLoggedIn ? (
                <Link href="/profile">
                  <Button
                    size="lg"
                    variant="outline"
                    className="bg-transparent border-white/30 text-white hover:bg-white/10 px-8"
                  >
                    My Profile
                  </Button>
                </Link>
              ) : (
                <Link href="/login">
                  <Button
                    size="lg"
                    variant="outline"
                    className="bg-transparent border-white/30 text-white hover:bg-white/10 px-8"
                  >
                    Member Sign In
                  </Button>
                </Link>
              )}
            </div>
          </>
        ) : (
          <>
            <h1 className="text-4xl md:text-6xl font-bold text-white max-w-3xl leading-tight">
              Welcome Home,{" "}
              <span className="text-sn-gold">Brothers</span>
            </h1>
            <p className="mt-6 text-lg text-white/70 max-w-xl leading-relaxed">
              The Mu Xi Chapter alumni platform — your hub for events, the
              brother directory, and our chapter&apos;s family lineage.
            </p>
            <div className="mt-10">
              {isLoggedIn ? (
                <Link href="/profile">
                  <Button
                    size="lg"
                    className="bg-sn-gold text-sn-navy hover:bg-sn-gold-light font-semibold px-8"
                  >
                    My Profile
                  </Button>
                </Link>
              ) : (
                <Link href="/login">
                  <Button
                    size="lg"
                    className="bg-sn-gold text-sn-navy hover:bg-sn-gold-light font-semibold px-8"
                  >
                    Member Sign In
                  </Button>
                </Link>
              )}
            </div>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-sn-gold/20 px-6 py-6 text-center">
        <p className="text-white/40 text-sm">
          Sigma Nu Fraternity · Mu Xi Chapter · Columbus State University
        </p>
      </footer>
    </div>
  );
}
