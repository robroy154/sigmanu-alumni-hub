import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

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
  const admin = createAdminClient();

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

  const { data: member } = await supabase
    .from("members")
    .select(
      "first_name, last_name, nickname, pledge_class, pin_number, phone, email, city, state, linkedin_url, profile_photo_url, status, big_id, street_address, zip, country, birthday, show_address, show_birthday, show_phone"
    )
    .eq("id", id)
    .in("status", ["member", "admin"])
    .single();

  if (member === null) notFound();

  // Apply privacy filters (admins see everything).
  const showPhone    = isAdmin || member.show_phone;
  const showAddress  = isAdmin || member.show_address;
  const showBirthday = isAdmin || member.show_birthday;

  // Resolve signed photo URL for the viewed member.
  let photoUrl: string | null = null;
  if (member.profile_photo_url !== null && member.profile_photo_url !== "") {
    const { data: signed } = await supabase.storage
      .from("profile-photos")
      .createSignedUrl(member.profile_photo_url, 3600);
    photoUrl = signed?.signedUrl ?? null;
  }

  // Fetch badges and lineage in parallel.
  // Lineage uses admin client so stubs are included.
  const [{ data: badges }, { data: bigMember }, { data: littles }] =
    await Promise.all([
      supabase.from("badges").select("id, badge_type").eq("member_id", id),
      member.big_id !== null
        ? admin
            .from("members")
            .select("id, first_name, last_name, pledge_class, status, profile_photo_url")
            .eq("id", member.big_id)
            .single()
        : Promise.resolve({ data: null }),
      admin
        .from("members")
        .select("id, first_name, last_name, pledge_class, status, profile_photo_url")
        .eq("big_id", id)
        .order("last_name"),
    ]);

  // Resolve signed URLs for big and little brother photos.
  const lineagePhotoPaths = [
    ...(bigMember?.profile_photo_url !== null && bigMember?.profile_photo_url !== undefined && bigMember.profile_photo_url !== ""
      ? [bigMember.profile_photo_url]
      : []),
    ...(littles ?? [])
      .map((l) => l.profile_photo_url)
      .filter((p): p is string => p !== null && p !== ""),
  ];

  const lineagePhotoMap: Record<string, string> = {};
  if (lineagePhotoPaths.length > 0) {
    const { data: signed } = await admin.storage
      .from("profile-photos")
      .createSignedUrls(lineagePhotoPaths, 3600);
    signed?.forEach(({ path, signedUrl, error }) => {
      if (error === null && path !== null && path !== undefined && signedUrl !== null) {
        lineagePhotoMap[path] = signedUrl;
      }
    });
  }

  const fullName = [member.first_name, member.last_name].join(" ");
  const location =
    member.city !== null && member.state !== null
      ? `${member.city}, ${member.state}`
      : (member.city ?? member.state ?? null);

  const pinDisplay =
    member.pin_number !== null && member.pin_number !== ""
      ? `ΜΞ ${String(member.pin_number).padStart(3, "0")}`
      : null;

  const hasLineage = bigMember !== null || (littles !== null && littles.length > 0);

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

      {/* Family line — between header and contact */}
      {hasLineage && (
        <div className="bg-sn-surface rounded-xl p-6 space-y-5">
          <h2 className="text-sn-gray-text text-xs font-semibold uppercase tracking-wider">
            Family Line
          </h2>

          {bigMember !== null && (
            <div>
              <p className="text-sn-gray-text text-xs uppercase tracking-wider mb-2">
                Big Brother
              </p>
              <LineagePerson
                person={bigMember}
                photoUrl={bigMember.profile_photo_url !== null && bigMember.profile_photo_url !== ""
                  ? (lineagePhotoMap[bigMember.profile_photo_url] ?? null)
                  : null}
              />
            </div>
          )}

          {littles !== null && littles.length > 0 && (
            <div>
              <p className="text-sn-gray-text text-xs uppercase tracking-wider mb-2">
                Little Brother{littles.length !== 1 ? "s" : ""}
              </p>
              <div className="flex flex-wrap gap-3">
                {littles.map((l) => (
                  <LineagePerson
                    key={l.id}
                    person={l}
                    photoUrl={l.profile_photo_url !== null && l.profile_photo_url !== ""
                      ? (lineagePhotoMap[l.profile_photo_url] ?? null)
                      : null}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Contact details */}
      <div className="bg-sn-surface rounded-xl p-6 space-y-4">
        <h2 className="text-sn-gray-text text-xs font-semibold uppercase tracking-wider">
          Contact &amp; Details
        </h2>
        <dl className="space-y-3">
          {member.email !== null && member.email !== undefined && member.email !== "" && (
            <div className="flex gap-3">
              <dt className="w-28 shrink-0 text-sn-gray-text text-sm">Email</dt>
              <dd>
                <a
                  href={`mailto:${member.email}`}
                  className="text-sn-gold text-sm hover:underline break-all"
                >
                  {member.email}
                </a>
              </dd>
            </div>
          )}
          {showPhone && <Row label="Phone" value={member.phone} />}
          {showBirthday && member.birthday !== null && member.birthday !== undefined && (
            <Row
              label="Birthday"
              value={new Date(member.birthday + "T00:00:00").toLocaleDateString(
                "en-US",
                isAdmin
                  ? { month: "long", day: "numeric", year: "numeric" }
                  : { month: "long", day: "numeric" },
              )}
            />
          )}
          <Row label="Badge number" value={pinDisplay} />
          {showAddress && isAdmin && member.street_address !== null && member.street_address !== undefined && member.street_address !== "" && (
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
          {showAddress && !isAdmin && (member.city !== null || member.state !== null) && (
            <Row
              label="Location"
              value={[member.city, member.state].filter(Boolean).join(", ")}
            />
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
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shared sub-components
// ---------------------------------------------------------------------------

interface LineagePersonProps {
  person: {
    id: string;
    first_name: string;
    last_name: string;
    pledge_class: string | null;
    status: "pending" | "member" | "admin" | "stub";
  };
  photoUrl: string | null;
}

function LineagePerson({ person, photoUrl }: LineagePersonProps) {
  const initials = (person.first_name[0] ?? "") + (person.last_name[0] ?? "");
  const isReal = person.status === "member" || person.status === "admin";

  const inner = (
    <div className="flex items-center gap-2.5">
      <div className="w-9 h-9 rounded-full overflow-hidden bg-sn-black-secondary border border-sn-gold/30 flex items-center justify-center shrink-0 select-none">
        {photoUrl !== null ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photoUrl} alt={`${person.first_name} ${person.last_name}`} className="w-full h-full object-cover" />
        ) : (
          <span className="text-sn-gold text-xs font-bold">{initials}</span>
        )}
      </div>
      <div className="min-w-0">
        <p className={[
          "text-sm font-medium leading-tight",
          isReal ? "text-sn-off-white" : "text-sn-off-white/60",
        ].join(" ")}>
          {person.first_name} {person.last_name}
        </p>
        {person.pledge_class !== null && (
          <p className="text-sn-gray-text text-xs mt-0.5">{person.pledge_class} Class</p>
        )}
      </div>
    </div>
  );

  if (isReal) {
    return (
      <Link
        href={`/profile/${person.id}`}
        className="inline-block hover:opacity-80 transition-opacity"
      >
        {inner}
      </Link>
    );
  }

  return <div>{inner}</div>;
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
