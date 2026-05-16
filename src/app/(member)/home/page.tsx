// event routing: dynamic, no hardcoded IDs
import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { AnnouncementCard } from "@/components/home/AnnouncementCard";
import { AnnouncementSplash } from "@/components/home/AnnouncementSplash";
import { HomeEventsSection } from "@/components/home/HomeEventsSection";
import { Users, GitBranch, User, Calendar, ExternalLink } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export const metadata: Metadata = { title: "Home — Sigma Nu Mu Xi Alumni" };

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const admin = createAdminClient();

  // Parallel fetches: member info, upcoming events, birthdays, announcements
  const [memberResult, eventsResult, birthdayResult, announcementsResult, dismissedResult] = await Promise.all([
    supabase
      .from("members")
      .select("first_name, status")
      .eq("id", user!.id)
      .single(),

    supabase
      .from("events")
      .select("id, slug, title, event_date, location, ticket_price, registration_open")
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
      .select("id, title, body, created_at, is_pinned, show_on_login")
      .eq("is_active", true)
      .order("is_pinned", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(5),

    // Dismissed announcement IDs for the current user (for splash filtering)
    supabase
      .from("dismissed_announcements")
      .select("announcement_id")
      .eq("member_id", user!.id),
  ]);

  const member        = memberResult.data;
  const events        = eventsResult.data ?? [];
  const allBirthdays  = birthdayResult.data ?? [];
  const announcements = announcementsResult.data ?? [];
  const dismissedIds  = new Set((dismissedResult.data ?? []).map((d) => d.announcement_id));

  // First undismissed show_on_login announcement to display as a splash.
  const splashAnnouncement = announcements.find(
    (a) => a.show_on_login && !dismissedIds.has(a.id)
  ) ?? null;

  // Fetch this user's registrations for the upcoming events shown on the home page.
  const eventIds = events.map((e) => e.id);
  const myRegistrations =
    eventIds.length > 0
      ? ((
          await supabase
            .from("registrations")
            .select("id, event_id, guest_count, payment_status")
            .eq("member_id", user!.id)
            .in("event_id", eventIds)
        ).data ?? [])
      : ([] as { id: string; event_id: string; guest_count: number; payment_status: string }[]);

  const regIds = myRegistrations.map((r) => r.id);
  const myGuests =
    regIds.length > 0
      ? ((
          await supabase
            .from("registration_guests")
            .select("id, registration_id, guest_name")
            .in("registration_id", regIds)
        ).data ?? [])
      : ([] as { id: string; registration_id: string; guest_name: string }[]);

  // Filter birthdays to current month
  const nowMonth = new Date().getMonth() + 1; // 1-indexed
  const birthdays = allBirthdays.filter((m) => {
    if (m.birthday === null || m.birthday === undefined) return false;
    const parts = m.birthday.split("-");
    const monthPart = parts[1];
    if (parts.length < 2 || monthPart === undefined) return false;
    return parseInt(monthPart, 10) === nowMonth;
  }).sort((a, b) => {
    const dayA = parseInt((a.birthday ?? "").split("-")[2] ?? "0", 10);
    const dayB = parseInt((b.birthday ?? "").split("-")[2] ?? "0", 10);
    return dayA - dayB;
  });

  const alumnisFbUrl  = process.env.NEXT_PUBLIC_ALUMNI_FB_URL ?? "";
  const chapterFbUrl  = process.env.NEXT_PUBLIC_ACTIVE_CHAPTER_FB_URL ?? "";

  return (
    <div className="space-y-12">
      {/* Announcement login splash */}
      {splashAnnouncement !== null && (
        <AnnouncementSplash
          announcementId={splashAnnouncement.id}
          title={splashAnnouncement.title}
          body={splashAnnouncement.body}
        />
      )}

      {/* Welcome header */}
      <div>
        <h1 className="text-sn-off-white text-3xl font-bold">
          Welcome back{member?.first_name ? `, ${member.first_name}` : ""}
        </h1>
        <p className="text-sn-gray-medium text-sm mt-1">
          Sigma Nu · Mu Xi Chapter Alumni Hub
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main column */}
        <div className="lg:col-span-2 space-y-8">

          {/* Upcoming events */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sn-off-white font-semibold">Upcoming Events</h2>
              <Link
                href="/events"
                className="text-sn-gold text-xs hover:text-sn-gold-light transition-colors"
              >
                View all →
              </Link>
            </div>
            <HomeEventsSection
              events={events}
              myRegistrations={myRegistrations}
              myGuests={myGuests}
            />
          </section>

          {/* Announcements */}
          {announcements.length > 0 && (
            <section>
              <h2 className="text-sn-off-white font-semibold mb-4">Announcements</h2>
              <div className="space-y-3">
                {announcements.map((a) => (
                  <AnnouncementCard
                    key={a.id}
                    title={a.title}
                    body={a.body}
                    date={a.created_at}
                    isPinned={a.is_pinned}
                  />
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-8">

          {/* Birthdays this month */}
          <section>
            <h2 className="text-sn-off-white font-semibold mb-3">
              Birthdays This Month
            </h2>
            <div className="bg-sn-surface rounded-xl overflow-hidden">
              {birthdays.length === 0 ? (
                <p className="text-sn-gray-medium text-sm text-center py-6">
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
                          className="text-sn-off-white text-sm hover:text-sn-gold-light transition-colors"
                        >
                          {m.first_name} {m.last_name}
                        </Link>
                        {day !== null && (
                          <span className="text-sn-gray-medium text-xs">
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
            <h2 className="text-sn-off-white font-semibold mb-3">Quick Links</h2>
            <div className="bg-sn-surface rounded-xl overflow-hidden divide-y divide-white/5">
              <QuickLink href="/directory"   label="Brother Directory"         Icon={Users} />
              <QuickLink href="/family-tree" label="Family Tree"               Icon={GitBranch} />
              <QuickLink href="/profile"     label="My Profile"                Icon={User} />
              <QuickLink href="/my-events"   label="My Events"                 Icon={Calendar} />
              {alumnisFbUrl !== "" && (
                <QuickLink href={alumnisFbUrl} label="Alumni Facebook Group"   Icon={ExternalLink} external />
              )}
              {chapterFbUrl !== "" && (
                <QuickLink href={chapterFbUrl} label="Active Chapter Facebook" Icon={ExternalLink} external />
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
  Icon,
  external = false,
}: {
  href: string;
  label: string;
  Icon: LucideIcon;
  external?: boolean;
}) {
  return (
    <Link
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      className="flex items-center gap-3 px-4 py-2.5 text-sn-gray-text hover:text-sn-off-white hover:bg-white/5 transition-colors text-sm"
    >
      <Icon className="w-4 h-4 text-sn-gold shrink-0" />
      <span className="flex-1">{label}</span>
      <span className="text-sn-gray-medium text-xs">{external ? "↗" : "→"}</span>
    </Link>
  );
}
