// event routing: dynamic, no hardcoded IDs
import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { AnnouncementCard } from "@/components/home/AnnouncementCard";
import { AnnouncementSplash } from "@/components/home/AnnouncementSplash";
import { NextEventTile } from "@/components/home/NextEventTile";
import { LineageTile } from "@/components/home/LineageTile";
import { StatTile } from "@/components/home/StatTile";
import { eventHref } from "@/lib/events/slug";
import { Users, GitBranch, User, Calendar, ExternalLink } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export const metadata: Metadata = { title: "Home — Sigma Nu Mu Xi Alumni" };

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const admin = createAdminClient();
  const yearStart = new Date(new Date().getFullYear(), 0, 1).toISOString();

  // Parallel fetches: member info, upcoming events, birthdays, announcements, bento stats
  const [
    memberResult, eventsResult, birthdayResult, announcementsResult, dismissedResult,
    littlesResult, brothersCountResult, brothersThisYearResult, eventsBadgeResult,
  ] = await Promise.all([
    supabase
      .from("members")
      .select("first_name, last_name, status, big_id, pledge_class")
      .eq("id", user!.id)
      .single(),

    supabase
      .from("events")
      .select("id, slug, title, event_date, location, ticket_price, registration_open, capacity, capacity_mode")
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
      .select("id, title, body, slug, created_at, is_pinned, show_on_login")
      .eq("is_active", true)
      .order("is_pinned", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(5),

    // Dismissed announcement IDs for the current user (for splash filtering)
    supabase
      .from("dismissed_announcements")
      .select("announcement_id")
      .eq("member_id", user!.id),

    // Littles: members whose big_id points to the current user
    supabase
      .from("members")
      .select("id, first_name, last_name")
      .eq("big_id", user!.id),

    supabase
      .from("members")
      .select("id", { count: "exact", head: true })
      .in("status", ["member", "admin"]),

    supabase
      .from("members")
      .select("id", { count: "exact", head: true })
      .in("status", ["member", "admin"])
      .gte("created_at", yearStart),

    supabase
      .from("events")
      .select("id", { count: "exact", head: true })
      .eq("status", "published")
      .eq("registration_open", true)
      .gte("event_date", new Date().toISOString()),
  ]);

  const member        = memberResult.data;
  const events        = eventsResult.data ?? [];
  const allBirthdays  = birthdayResult.data ?? [];
  const announcements = announcementsResult.data ?? [];
  const dismissedIds  = new Set((dismissedResult.data ?? []).map((d) => d.announcement_id));
  const littles        = littlesResult.data ?? [];
  const brothersCount  = brothersCountResult.count ?? 0;
  const brothersThisYear = brothersThisYearResult.count ?? 0;
  const eventsBadgeCount = eventsBadgeResult.count ?? 0;

  const nextEvent = events[0] ?? null;

  const [bigResult, nextEventPaidResult] = await Promise.all([
    member?.big_id
      ? supabase.from("members").select("id, first_name, last_name").eq("id", member.big_id).single()
      : Promise.resolve({ data: null }),
    nextEvent !== null
      ? admin.from("registrations").select("id", { count: "exact", head: true }).eq("event_id", nextEvent.id).eq("payment_status", "paid")
      : Promise.resolve({ count: 0 }),
  ]);
  const bigMember = bigResult.data;
  const nextEventRegisteredCount = "count" in nextEventPaidResult ? (nextEventPaidResult.count ?? 0) : 0;

  // First undismissed show_on_login announcement to display as a splash.
  const splashAnnouncement = announcements.find(
    (a) => a.show_on_login && !dismissedIds.has(a.id)
  ) ?? null;

  // Fetch this user's registration for the next event shown in the bento's hero tile.
  const myRegistrations = nextEvent !== null
    ? ((
        await supabase
          .from("registrations")
          .select("id, event_id")
          .eq("member_id", user!.id)
          .eq("event_id", nextEvent.id)
      ).data ?? [])
    : ([] as { id: string; event_id: string }[]);

  // Filter birthdays to current month
  const nowMonth = new Date().getMonth() + 1; // 1-indexed
  const birthdays = allBirthdays.filter((m) => {
    if (m.birthday === null || m.birthday === undefined) return false;
    const parts = m.birthday.split("-");
    if (parts.length < 3) return false;
    const monthPart = parts[1];
    if (monthPart === undefined) return false;
    return parseInt(monthPart, 10) === nowMonth;
  }).sort((a, b) => {
    const dayA = parseInt((a.birthday ?? "").split("-")[2] ?? "0", 10);
    const dayB = parseInt((b.birthday ?? "").split("-")[2] ?? "0", 10);
    return dayA - dayB;
  });

  const alumnisFbUrl  = process.env.NEXT_PUBLIC_ALUMNI_FB_URL ?? "";
  const chapterFbUrl  = process.env.NEXT_PUBLIC_ACTIVE_CHAPTER_FB_URL ?? "";
  const isRegisteredForNextEvent = nextEvent !== null && myRegistrations.some((r) => r.event_id === nextEvent.id);
  const pinnedAnnouncement = announcements[0] ?? null;
  const now = new Date();
  const dateLabel = now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  return (
    <div className="space-y-4">
      {/* Announcement login splash */}
      {splashAnnouncement !== null && (
        <AnnouncementSplash
          announcementId={splashAnnouncement.id}
          title={splashAnnouncement.title}
          body={splashAnnouncement.body}
        />
      )}

      {/* Greeting row */}
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-heading text-sn-off-white text-[26px] leading-tight">
            Welcome back{member?.first_name ? `, ${member.first_name}` : ""}
          </h1>
          <p className="text-sn-gray-medium text-[12.5px] mt-1">
            {dateLabel} · {eventsBadgeCount} {eventsBadgeCount === 1 ? "event" : "events"} open for registration
          </p>
        </div>
        {nextEvent !== null && (
          <Link
            href={eventHref(nextEvent)}
            className="bg-sn-gold text-sn-black-secondary font-semibold text-[12.5px] rounded-lg px-3.75 py-2.25 hover:bg-sn-gold-light transition-colors"
          >
            {isRegisteredForNextEvent ? "Manage registration" : `Register for ${nextEvent.title}`}
          </Link>
        )}
      </div>

      {/* Bento grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.25">
        {nextEvent !== null ? (
          <NextEventTile
            event={nextEvent}
            registeredCount={nextEventRegisteredCount}
            isRegistered={isRegisteredForNextEvent}
          />
        ) : (
          <div className="md:col-span-2 lg:row-span-2 bg-sn-surface border border-white/8 rounded-2xl p-5 flex items-center justify-center text-center">
            <p className="text-sn-gray-text text-sm">No upcoming events at this time. Check back soon.</p>
          </div>
        )}

        <LineageTile
          you={{ id: user!.id, first_name: member?.first_name ?? "You", last_name: member?.last_name ?? "" }}
          big={bigMember}
          littles={littles}
        />

        <StatTile eyebrow="Brothers" numeral={brothersCount.toLocaleString()} caption={`+${brothersThisYear} this year`} />
        <StatTile
          eyebrow="Birthdays"
          numeral={birthdays.length}
          caption={birthdays.length > 0 ? birthdays.map((m) => m.last_name).join(", ") : "None this month"}
        />

        {pinnedAnnouncement !== null && (
          <div className="md:col-span-2 lg:col-span-3">
            <AnnouncementCard
              id={pinnedAnnouncement.id}
              slug={pinnedAnnouncement.slug ?? null}
              title={pinnedAnnouncement.title}
              body={pinnedAnnouncement.body}
              date={pinnedAnnouncement.created_at}
              isPinned={pinnedAnnouncement.is_pinned}
            />
          </div>
        )}

        <div className="bg-sn-surface border border-white/8 rounded-2xl overflow-hidden divide-y divide-white/5">
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
      </div>

      {/* Remaining announcements beyond the pinned bento tile — eyebrow label matches the
          bento system's micro-label typography (NextEventTile/StatTile) rather than the
          old plain-heading pattern, so it reads as part of the redesign, not bolted on. */}
      {announcements.length > 1 && (
        <section className="pt-2 space-y-3">
          <p className="text-sn-gray-medium text-[10px] font-semibold tracking-[0.16em] uppercase px-0.5">
            More Announcements
          </p>
          <div className="space-y-3">
            {announcements.slice(1).map((a) => (
              <AnnouncementCard
                key={a.id}
                id={a.id}
                slug={a.slug ?? null}
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
