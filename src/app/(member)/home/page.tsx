import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { AnnouncementCard } from "@/components/home/AnnouncementCard";

export const metadata: Metadata = { title: "Home — Sigma Nu Mu Xi Alumni" };

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const admin = createAdminClient();

  // Parallel fetches: member info, upcoming events, birthdays, announcements
  const [memberResult, eventsResult, birthdayResult, announcementsResult] = await Promise.all([
    supabase
      .from("members")
      .select("first_name, status")
      .eq("id", user!.id)
      .single(),

    supabase
      .from("events")
      .select("id, title, event_date, location, ticket_price")
      .eq("status", "published")
      .gte("event_date", new Date().toISOString())
      .order("event_date", { ascending: true })
      .limit(3),

    // Fetch all members with birthday set and show_birthday=true
    // Birthday month filtering done client-side (birthday stored as YYYY-MM-DD text)
    admin
      .from("members")
      .select("id, first_name, last_name, birthday")
      .eq("show_birthday", true)
      .not("birthday", "is", null),

    supabase
      .from("announcements")
      .select("id, title, body, created_at")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const member       = memberResult.data;
  const events       = eventsResult.data ?? [];
  const allBirthdays = birthdayResult.data ?? [];
  const announcements = announcementsResult.data ?? [];

  // Filter birthdays to current month
  const nowMonth = new Date().getMonth() + 1; // 1-indexed
  const birthdays = allBirthdays.filter((m) => {
    if (m.birthday === null || m.birthday === undefined) return false;
    const parts = m.birthday.split("-");
    const monthPart = parts[1];
    if (parts.length < 2 || monthPart === undefined) return false;
    return parseInt(monthPart, 10) === nowMonth;
  });

  const alumnisFbUrl  = process.env.NEXT_PUBLIC_ALUMNI_FB_URL ?? "";
  const chapterFbUrl  = process.env.NEXT_PUBLIC_ACTIVE_CHAPTER_FB_URL ?? "";

  return (
    <div className="space-y-8">
      {/* Welcome header */}
      <div>
        <h1 className="text-white text-3xl font-bold">
          Welcome back{member?.first_name ? `, ${member.first_name}` : ""}
        </h1>
        <p className="text-white/50 text-sm mt-1">
          Sigma Nu · Mu Xi Chapter Alumni Hub
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main column */}
        <div className="lg:col-span-2 space-y-6">

          {/* Upcoming events */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-white font-semibold">Upcoming Events</h2>
              <Link
                href="/events"
                className="text-sn-gold text-xs hover:text-sn-gold-light transition-colors"
              >
                View all →
              </Link>
            </div>
            {events.length === 0 ? (
              <div className="bg-sn-black rounded-xl border border-sn-gold/20 px-5 py-8 text-center">
                <p className="text-white/40 text-sm">No upcoming events.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {events.map((event) => {
                  const eventDate = new Date(event.event_date);
                  return (
                    <Link
                      key={event.id}
                      href={`/events/${event.id}`}
                      className="block bg-sn-black rounded-xl border border-sn-gold/20 px-5 py-4 hover:border-sn-gold/40 transition-colors group"
                    >
                      <div className="flex items-start gap-4">
                        {/* Date badge */}
                        <div className="shrink-0 text-center bg-sn-gold/10 border border-sn-gold/20 rounded-lg px-3 py-2 min-w-[52px]">
                          <p className="text-sn-gold text-xs font-medium uppercase">
                            {eventDate.toLocaleDateString("en-US", { month: "short" })}
                          </p>
                          <p className="text-white font-bold text-lg leading-tight">
                            {eventDate.getDate()}
                          </p>
                        </div>
                        {/* Details */}
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-medium text-sm group-hover:text-sn-gold-light transition-colors">
                            {event.title}
                          </p>
                          {event.location !== null && (
                            <p className="text-white/50 text-xs mt-0.5">{event.location}</p>
                          )}
                          <p className="text-white/40 text-xs mt-1">
                            {event.ticket_price > 0
                              ? `$${event.ticket_price.toFixed(2)}`
                              : "Free"}
                          </p>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </section>

          {/* Announcements */}
          {announcements.length > 0 && (
            <section>
              <h2 className="text-white font-semibold mb-3">Announcements</h2>
              <div className="space-y-3">
                {announcements.map((a) => (
                  <AnnouncementCard
                    key={a.id}
                    title={a.title}
                    body={a.body}
                    date={a.created_at}
                  />
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">

          {/* Birthdays this month */}
          <section>
            <h2 className="text-white font-semibold mb-3">
              Birthdays This Month
            </h2>
            <div className="bg-sn-black rounded-xl border border-sn-gold/20 overflow-hidden">
              {birthdays.length === 0 ? (
                <p className="text-white/40 text-sm text-center py-6">
                  No birthdays this month.
                </p>
              ) : (
                <div className="divide-y divide-white/5">
                  {birthdays.map((m) => {
                    const parts = (m.birthday ?? "").split("-");
                    const day = parts[2] ? parseInt(parts[2], 10) : null;
                    return (
                      <div
                        key={m.id}
                        className="px-4 py-2.5 flex items-center justify-between gap-2"
                      >
                        <Link
                          href={`/profile/${m.id}`}
                          className="text-white text-sm hover:text-sn-gold-light transition-colors"
                        >
                          {m.first_name} {m.last_name}
                        </Link>
                        {day !== null && (
                          <span className="text-white/40 text-xs">
                            {new Date(0, nowMonth - 1, day).toLocaleDateString("en-US", {
                              month: "short", day: "numeric",
                            })}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>

          {/* Quick links */}
          <section>
            <h2 className="text-white font-semibold mb-3">Quick Links</h2>
            <div className="bg-sn-black rounded-xl border border-sn-gold/20 overflow-hidden divide-y divide-white/5">
              <QuickLink href="/directory" label="Brother Directory" />
              <QuickLink href="/family-tree" label="Family Tree" />
              <QuickLink href="/profile" label="My Profile" />
              <QuickLink href="/my-events" label="My Events" />
              {alumnisFbUrl !== "" && (
                <QuickLink href={alumnisFbUrl} label="Alumni Facebook Group" external />
              )}
              {chapterFbUrl !== "" && (
                <QuickLink href={chapterFbUrl} label="Active Chapter Facebook" external />
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function QuickLink({
  href,
  label,
  external = false,
}: {
  href: string;
  label: string;
  external?: boolean;
}) {
  return (
    <Link
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      className="flex items-center justify-between px-4 py-2.5 text-white/70 hover:text-white hover:bg-white/5 transition-colors text-sm"
    >
      <span>{label}</span>
      <span className="text-white/30 text-xs">{external ? "↗" : "→"}</span>
    </Link>
  );
}
