import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "My Profile" };

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user === null) redirect("/login");

  const [{ data: member }, { data: littles }] = await Promise.all([
    supabase
      .from("members")
      .select(
        "first_name, last_name, nickname, pledge_class, pin_number, phone, city, state, linkedin_url, profile_photo_url, status, big_id"
      )
      .eq("id", user.id)
      .single(),
    supabase
      .from("members")
      .select("id, first_name, last_name, nickname")
      .eq("big_id", user.id)
      .in("status", ["member", "admin"])
      .order("last_name"),
  ]);

  if (member === null) redirect("/login");

  // Resolve signed URL for photo if one is stored.
  let photoUrl: string | null = null;
  if (member.profile_photo_url !== null && member.profile_photo_url !== "") {
    const { data: signed } = await supabase.storage
      .from("profile-photos")
      .createSignedUrl(member.profile_photo_url, 3600);
    photoUrl = signed?.signedUrl ?? null;
  }

  const [{ data: badges }, { data: bigMember }] = await Promise.all([
    supabase.from("badges").select("id, badge_type").eq("member_id", user.id),
    member.big_id !== null
      ? supabase
          .from("members")
          .select("id, first_name, last_name")
          .eq("id", member.big_id)
          .single()
      : Promise.resolve({ data: null }),
  ]);

  const fullName = [member.first_name, member.last_name].join(" ");
  const location =
    member.city !== null && member.state !== null
      ? `${member.city}, ${member.state}`
      : (member.city ?? member.state ?? null);

  // Completeness: flag missing key profile fields
  const missingFields: string[] = [];
  if (member.profile_photo_url === null || member.profile_photo_url === "")
    missingFields.push("profile photo");
  if (member.pledge_class === null || member.pledge_class === "")
    missingFields.push("pledge class");
  if (member.city === null && member.state === null) missingFields.push("location");
  if (member.phone === null || member.phone === "") missingFields.push("phone");
  if (member.nickname === null || member.nickname === "") missingFields.push("nickname");

  const isIncomplete = missingFields.length > 0;

  return (
    <div className="max-w-2xl mx-auto space-y-6">

      {/* Completeness nudge */}
      {isIncomplete && (
        <div className="rounded-xl border border-sn-gold/30 bg-sn-gold/8 px-4 py-3 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sn-gold text-sm font-semibold leading-snug">
              Your profile is incomplete
            </p>
            <p className="text-white/50 text-xs mt-0.5 leading-relaxed">
              Missing: {missingFields.join(", ")}
            </p>
          </div>
          <Link
            href="/profile/edit"
            className="shrink-0 inline-flex h-8 items-center justify-center rounded-lg bg-sn-gold px-3 text-xs font-semibold text-sn-black hover:bg-sn-gold-light transition-colors"
          >
            Complete →
          </Link>
        </div>
      )}

      {/* Header card */}
      <div className="bg-sn-black rounded-xl border border-sn-gold/20 p-6 flex items-start gap-6">
        {/* Avatar */}
        <div className="w-20 h-20 shrink-0 rounded-full overflow-hidden bg-sn-black-secondary border-2 border-sn-gold/40 flex items-center justify-center select-none">
          {photoUrl !== null ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photoUrl} alt={fullName} className="w-full h-full object-cover" />
          ) : (
            <span className="text-sn-gold text-2xl font-bold">ΣΝ</span>
          )}
        </div>

        {/* Name + meta */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-white text-xl font-semibold leading-tight">
                {fullName}
                {member.nickname !== null && member.nickname !== "" && (
                  <span className="text-sn-gold text-base font-normal ml-2">
                    &ldquo;{member.nickname}&rdquo;
                  </span>
                )}
              </h1>
              {member.pledge_class !== null && (
                <p className="text-white/60 text-sm mt-0.5">{member.pledge_class} Class</p>
              )}
              {location !== null && (
                <p className="text-white/50 text-sm">{location}</p>
              )}
            </div>
            <Link
              href="/profile/edit"
              className="shrink-0 inline-flex h-8 items-center justify-center rounded-lg border border-sn-gold/40 px-3 text-sm text-sn-gold hover:bg-sn-gold/10 transition-colors"
            >
              Edit profile
            </Link>
          </div>

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

      {/* Contact details */}
      <div className="bg-sn-black rounded-xl border border-sn-gold/20 p-6 space-y-4">
        <h2 className="text-white/70 text-xs font-semibold uppercase tracking-wider">
          Contact &amp; Details
        </h2>
        <dl className="space-y-3">
          <Row label="Email"      value={user.email ?? null} />
          <Row label="Phone"      value={member.phone} />
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

      {/* Family line */}
      {(bigMember !== null || (littles !== null && littles.length > 0)) && (
        <div className="bg-sn-black rounded-xl border border-sn-gold/20 p-6 space-y-4">
          <h2 className="text-white/70 text-xs font-semibold uppercase tracking-wider">
            Family Line
          </h2>

          {bigMember !== null && (
            <div>
              <p className="text-white/50 text-xs uppercase tracking-wider mb-1.5">Big Brother</p>
              <Link
                href={`/profile/${bigMember.id}`}
                className="inline-flex items-center gap-2 text-white text-sm font-medium hover:text-sn-gold transition-colors"
              >
                {bigMember.first_name} {bigMember.last_name}
                <span className="text-white/30">→</span>
              </Link>
            </div>
          )}

          {littles !== null && littles.length > 0 && (
            <div>
              <p className="text-white/50 text-xs uppercase tracking-wider mb-2">
                Little Brother{littles.length !== 1 ? "s" : ""}
              </p>
              <div className="space-y-1.5">
                {littles.map((l) => (
                  <Link
                    key={l.id}
                    href={`/profile/${l.id}`}
                    className="flex items-center gap-2 text-white text-sm hover:text-sn-gold transition-colors"
                  >
                    {l.first_name} {l.last_name}
                    {l.nickname !== null && l.nickname !== "" && (
                      <span className="text-white/40 text-xs">&ldquo;{l.nickname}&rdquo;</span>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string | null | undefined }) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <div className="flex gap-3">
      <dt className="w-28 shrink-0 text-white/50 text-sm">{label}</dt>
      <dd className="text-white text-sm break-all">{value}</dd>
    </div>
  );
}
