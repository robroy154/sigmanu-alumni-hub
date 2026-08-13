import { createClient } from "@/lib/supabase/server";
import { AppRail } from "./AppRail";
import { TabBar } from "./TabBar";
import { MobileHeader } from "./MobileHeader";

// Wraps /events pages in the member app shell when the visitor is signed in,
// so navigating there from /home doesn't feel like leaving the app. Renders
// children unchanged for anonymous visitors — /events must stay public.
export async function PublicEventsShell({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user === null) {
    return <>{children}</>;
  }

  const { data: member } = await supabase
    .from("members")
    .select("first_name, last_name, status, profile_photo_url, pledge_class")
    .eq("id", user.id)
    .single();

  const isAdmin = member?.status === "admin";

  let photoUrl: string | null = null;
  if (member?.profile_photo_url) {
    const { data: signed } = await supabase.storage
      .from("profile-photos")
      .createSignedUrl(member.profile_photo_url, 3600);
    photoUrl = signed?.signedUrl ?? null;
  }

  const { count: eventsBadgeCount } = await supabase
    .from("events")
    .select("id", { count: "exact", head: true })
    .eq("status", "published")
    .eq("registration_open", true)
    .gte("event_date", new Date().toISOString());

  return (
    <div className="min-h-screen bg-sn-black-secondary md:grid md:grid-cols-[auto_1fr]">
      <AppRail
        firstName={member?.first_name ?? null}
        lastName={member?.last_name ?? null}
        pledgeClass={member?.pledge_class ?? null}
        isAdmin={isAdmin}
        photoUrl={photoUrl}
        eventsBadgeCount={eventsBadgeCount ?? 0}
      />
      <div className="flex flex-col min-h-screen">
        <MobileHeader
          firstName={member?.first_name ?? null}
          lastName={member?.last_name ?? null}
          isAdmin={isAdmin}
          photoUrl={photoUrl}
        />
        <div className="flex-1 pb-24 md:pb-0">{children}</div>
      </div>
      <TabBar />
    </div>
  );
}
