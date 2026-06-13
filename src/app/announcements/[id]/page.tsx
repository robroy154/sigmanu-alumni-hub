import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { isUuid } from "@/lib/events/slug";
import { RichTextContent } from "@/components/ui/RichTextContent";

interface Props {
  params: Promise<{ id: string }>;
}

async function getAnnouncement(idOrSlug: string) {
  const admin = createAdminClient();
  const column = isUuid(idOrSlug) ? "id" : "slug";
  const { data } = await admin
    .from("announcements")
    .select("id, title, body, slug, created_at, is_active")
    .eq(column, idOrSlug)
    .eq("is_active", true)
    .maybeSingle();
  return data;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const a = await getAnnouncement(id);
  if (a === null) return {};

  const plainText = a.body.replace(/<[^>]+>/g, "").slice(0, 160);
  const canonicalSlug = a.slug ?? a.id;

  return {
    title: `${a.title} — Sigma Nu Mu Xi`,
    description: plainText,
    openGraph: {
      title: a.title,
      description: plainText,
      url: `${process.env.NEXT_PUBLIC_APP_URL}/announcements/${canonicalSlug}`,
      siteName: "Sigma Nu Mu Xi Chapter Alumni Hub",
      type: "article",
    },
  };
}

export default async function AnnouncementPermalinkPage({ params }: Props) {
  const { id } = await params;
  const a = await getAnnouncement(id);
  if (a === null) notFound();

  // Fetch next upcoming published event for the CTA
  const admin = createAdminClient();
  const { data: nextEvent } = await admin
    .from("events")
    .select("id, slug, title")
    .eq("status", "published")
    .gte("event_date", new Date().toISOString().split("T")[0])
    .order("event_date", { ascending: true })
    .limit(1)
    .maybeSingle();

  const eventHref = nextEvent !== null
    ? `/events/${nextEvent.slug ?? nextEvent.id}`
    : "/events";

  return (
    <div className="bg-sn-black min-h-screen py-12 px-4">
      <div className="mx-auto max-w-[680px]">

        {/* Chapter label */}
        <p className="text-sn-gold text-xs font-semibold uppercase tracking-[0.2em] text-center mb-4">
          Sigma Nu &middot; Mu Xi Chapter
        </p>

        <hr className="border-sn-gold/30 mb-8" />

        {/* Title */}
        <h1
          className="text-sn-off-white text-3xl font-bold mb-2"
          style={{ fontFamily: "var(--font-syne)" }}
        >
          {a.title}
        </h1>

        {/* Date */}
        <p className="text-sn-gray-text text-sm mb-8">
          {new Date(a.created_at).toLocaleDateString("en-US", {
            month: "long", day: "numeric", year: "numeric",
          })}
        </p>

        {/* Body */}
        <RichTextContent content={a.body} className="rich-text-content" />

        <hr className="border-sn-gold/30 mt-10 mb-8" />

        {/* CTAs */}
        <div className="flex flex-wrap gap-4 justify-center mb-10">
          <a
            href={eventHref}
            className="inline-flex items-center px-5 py-2.5 rounded-sm bg-sn-gold text-sn-black font-semibold text-sm hover:bg-sn-gold-light transition-colors"
          >
            Register for the Gala →
          </a>
          <a
            href="/signup"
            className="inline-flex items-center px-5 py-2.5 rounded-sm border border-sn-gold text-sn-gold font-semibold text-sm hover:bg-sn-gold/10 transition-colors"
          >
            Join the Alumni Hub →
          </a>
        </div>

        {/* Footer */}
        <p className="text-sn-gray-medium text-xs text-center">
          This announcement was sent to Mu Xi Chapter alumni. Visit{" "}
          <a href="https://csusigmanu.com" className="text-sn-gold hover:underline">
            csusigmanu.com
          </a>{" "}
          to join the Hub.
        </p>

      </div>
    </div>
  );
}
