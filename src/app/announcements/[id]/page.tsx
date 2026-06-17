import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { isUuid } from "@/lib/events/slug";
import { RichTextContent } from "@/components/ui/RichTextContent";
import { Button } from "@/components/ui/button";

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

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const isLoggedIn = user !== null;

  return (
    <div className="bg-sn-black min-h-screen flex flex-col">

      {/* Header nav */}
      <header className="border-b border-sn-gold/20 px-6 py-4">
        <div className="max-w-[680px] mx-auto flex items-center justify-between">
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

      <div className="mx-auto max-w-[680px] w-full px-4 py-12">

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
