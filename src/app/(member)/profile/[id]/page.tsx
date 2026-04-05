import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("members")
    .select("first_name, last_name")
    .eq("id", id)
    .single();

  if (data === null) return { title: "Member Not Found" };
  return { title: `${data.first_name} ${data.last_name}` };
}

export default async function MemberProfilePage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user === null) redirect("/login");

  // Redirect to own profile rather than viewing as a stranger.
  if (id === user.id) redirect("/profile");

  const { data: member } = await supabase
    .from("members")
    .select(
      "first_name, last_name, nickname, pledge_class, pin_number, phone, city, state, linkedin_url, profile_photo_url, status"
    )
    .eq("id", id)
    .in("status", ["member", "admin"])
    .single();

  if (member === null) notFound();

  // Resolve signed photo URL.
  let photoUrl: string | null = null;
  if (member.profile_photo_url !== null && member.profile_photo_url !== "") {
    const { data: signed } = await supabase.storage
      .from("profile-photos")
      .createSignedUrl(member.profile_photo_url, 3600);
    photoUrl = signed?.signedUrl ?? null;
  }

  const { data: badges } = await supabase
    .from("badges")
    .select("id, badge_type")
    .eq("member_id", id);

  const fullName = [member.first_name, member.last_name].join(" ");
  const location =
    member.city !== null && member.state !== null
      ? `${member.city}, ${member.state}`
      : (member.city ?? member.state ?? null);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link
        href="/directory"
        className="inline-block text-white/50 hover:text-white text-sm transition-colors"
      >
        ← Back to directory
      </Link>

      {/* Header card */}
      <div className="bg-sn-navy rounded-xl border border-sn-gold/20 p-6 flex items-start gap-6">
        {/* Avatar */}
        <div className="w-20 h-20 shrink-0 rounded-full overflow-hidden bg-sn-navy-dark border-2 border-sn-gold/40 flex items-center justify-center select-none">
          {photoUrl !== null ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photoUrl}
              alt={fullName}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-sn-gold text-2xl font-bold">ΣΝ</span>
          )}
        </div>

        {/* Name + meta */}
        <div className="flex-1 min-w-0">
          <h1 className="text-white text-xl font-semibold leading-tight">
            {fullName}
            {member.nickname !== null && member.nickname !== "" && (
              <span className="text-sn-gold text-base font-normal ml-2">
                &ldquo;{member.nickname}&rdquo;
              </span>
            )}
          </h1>
          {member.pledge_class !== null && (
            <p className="text-white/60 text-sm mt-0.5">
              {member.pledge_class} Class
            </p>
          )}
          {location !== null && (
            <p className="text-white/50 text-sm">{location}</p>
          )}

          {/* Badges */}
          {badges !== null && badges.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {badges.map((b) => (
                <span
                  key={b.id}
                  className="inline-flex items-center rounded-full bg-sn-gold/15 border border-sn-gold/30 px-2 py-0.5 text-xs text-sn-gold"
                >
                  {b.badge_type}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Details card */}
      <div className="bg-sn-navy rounded-xl border border-sn-gold/20 p-6 space-y-4">
        <h2 className="text-white/70 text-xs font-semibold uppercase tracking-wider">
          Contact &amp; Details
        </h2>

        <dl className="space-y-3">
          <Row label="Phone" value={member.phone} />
          <Row label="Pin number" value={member.pin_number} />
          {member.linkedin_url !== null && member.linkedin_url !== "" && (
            <div className="flex gap-3">
              <dt className="w-28 shrink-0 text-white/50 text-sm">LinkedIn</dt>
              <dd>
                <a
                  href={member.linkedin_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sn-gold text-sm hover:underline"
                >
                  View profile
                </a>
              </dd>
            </div>
          )}
        </dl>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <div className="flex gap-3">
      <dt className="w-28 shrink-0 text-white/50 text-sm">{label}</dt>
      <dd className="text-white text-sm break-all">{value}</dd>
    </div>
  );
}
