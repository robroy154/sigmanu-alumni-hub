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
  if (id === user.id) redirect("/profile");

  // Fetch viewer's status to determine if admin (admins bypass privacy filters).
  const { data: viewer } = await supabase
    .from("members")
    .select("status")
    .eq("id", user.id)
    .single();

  const isAdmin = viewer?.status === "admin";

  const [{ data: member }, { data: littles }] = await Promise.all([
    supabase
      .from("members")
      .select(
        "first_name, last_name, nickname, pledge_class, pin_number, phone, city, state, linkedin_url, profile_photo_url, status, big_id, street_address, zip, country, birthday, show_address, show_birthday, show_phone"
      )
      .eq("id", id)
      .in("status", ["member", "admin"])
      .single(),
    supabase
      .from("members")
      .select("id, first_name, last_name, nickname")
      .eq("big_id", id)
      .in("status", ["member", "admin"])
      .order("last_name"),
  ]);

  if (member === null) notFound();

  // Apply privacy filters (admins see everything).
  const showPhone    = isAdmin || member.show_phone;
  const showAddress  = isAdmin || member.show_address;
  const showBirthday = isAdmin || member.show_birthday;

  // Resolve signed photo URL.
  let photoUrl: string | null = null;
  if (member.profile_photo_url !== null && member.profile_photo_url !== "") {
    const { data: signed } = await supabase.storage
      .from("profile-photos")
      .createSignedUrl(member.profile_photo_url, 3600);
    photoUrl = signed?.signedUrl ?? null;
  }

  const [{ data: badges }, { data: bigMember }] = await Promise.all([
    supabase.from("badges").select("id, badge_type").eq("member_id", id),
    member.big_id !== null
      ? supabase
          .from("members")
          .select("id, first_name, last_name")
          .eq("id", member.big_id)
          .in("status", ["member", "admin"])
          .single()
      : Promise.resolve({ data: null }),
  ]);

  const fullName = [member.first_name, member.last_name].join(" ");
  const location =
    member.city !== null && member.state !== null
      ? `${member.city}, ${member.state}`
      : (member.city ?? member.state ?? null);

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <Link
        href="/directory"
        className="inline-block text-sn-gray-text hover:text-sn-off-white text-sm transition-colors"
      >
        ← Back to directory
      </Link>

      {/* Header card */}
      <div className="bg-sn-surface rounded-xl p-6 flex items-start gap-6">
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
          <h1 className="text-sn-off-white text-xl font-semibold leading-tight">
            {fullName}
            {member.nickname !== null && member.nickname !== "" && (
              <span className="text-sn-gold text-base font-normal ml-2">
                &ldquo;{member.nickname}&rdquo;
              </span>
            )}
          </h1>
          {member.pledge_class !== null && (
            <p className="text-sn-gray-text text-sm mt-0.5">{member.pledge_class} Class</p>
          )}
          {location !== null && (
            <p className="text-sn-gray-text text-sm">{location}</p>
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

      {/* Contact details */}
      <div className="bg-sn-surface rounded-xl p-6 space-y-4">
        <h2 className="text-sn-gray-text text-xs font-semibold uppercase tracking-wider">
          Contact &amp; Details
        </h2>
        <dl className="space-y-3">
          {showPhone && <Row label="Phone" value={member.phone} />}
          {showBirthday && member.birthday !== null && member.birthday !== undefined && (
            <Row
              label="Birthday"
              value={new Date(member.birthday + "T00:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
            />
          )}
          <Row label="Pin number" value={member.pin_number} />
          {showAddress && member.street_address !== null && member.street_address !== undefined && member.street_address !== "" && (
            <div className="flex gap-3">
              <dt className="w-28 shrink-0 text-sn-gray-text text-sm">Address</dt>
              <dd className="text-sn-off-white text-sm">
                <span>{member.street_address}</span>
                {(member.city !== null || member.state !== null || member.zip !== null) && (
                  <span className="block">
                    {[member.city, member.state].filter(Boolean).join(", ")}
                    {member.zip !== null && member.zip !== "" ? ` ${member.zip}` : ""}
                  </span>
                )}
                {member.country !== null && member.country !== "" && member.country !== "USA" && (
                  <span className="block">{member.country}</span>
                )}
              </dd>
            </div>
          )}
          {member.linkedin_url !== null && member.linkedin_url !== "" && (
            <div className="flex gap-3">
              <dt className="w-28 shrink-0 text-sn-gray-text text-sm">LinkedIn</dt>
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
        <div className="bg-sn-surface rounded-xl p-6 space-y-4">
          <h2 className="text-sn-gray-text text-xs font-semibold uppercase tracking-wider">
            Family Line
          </h2>

          {bigMember !== null && (
            <div>
              <p className="text-sn-gray-text text-xs uppercase tracking-wider mb-1.5">Big Brother</p>
              <Link
                href={`/profile/${bigMember.id}`}
                className="inline-flex items-center gap-2 text-sn-off-white text-sm font-medium hover:text-sn-gold transition-colors"
              >
                {bigMember.first_name} {bigMember.last_name}
                <span className="text-sn-gray-medium">→</span>
              </Link>
            </div>
          )}

          {littles !== null && littles.length > 0 && (
            <div>
              <p className="text-sn-gray-text text-xs uppercase tracking-wider mb-2">
                Little Brother{littles.length !== 1 ? "s" : ""}
              </p>
              <div className="space-y-1.5">
                {littles.map((l) => (
                  <Link
                    key={l.id}
                    href={`/profile/${l.id}`}
                    className="flex items-center gap-2 text-sn-off-white text-sm hover:text-sn-gold transition-colors"
                  >
                    {l.first_name} {l.last_name}
                    {l.nickname !== null && l.nickname !== "" && (
                      <span className="text-sn-gray-medium text-xs">&ldquo;{l.nickname}&rdquo;</span>
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
      <dt className="w-28 shrink-0 text-sn-gray-text text-sm">{label}</dt>
      <dd className="text-sn-off-white text-sm break-all">{value}</dd>
    </div>
  );
}
