import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { AppRail } from "@/components/nav/AppRail";
import { TabBar } from "@/components/nav/TabBar";
import { MobileHeader } from "@/components/nav/MobileHeader";
import { CommandPaletteProvider } from "@/components/nav/CommandPaletteContext";
import { OnboardingModal } from "@/components/onboarding/OnboardingModal";

export default async function MemberLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user === null) redirect("/login");

  const { data: member } = await supabase
    .from("members")
    .select("first_name, last_name, status, profile_photo_url, onboarding_dismissed, pledge_class, big_id, pin_number")
    .eq("id", user.id)
    .single();

  const isAdmin = member?.status === "admin";

  let navPhotoUrl: string | null = null;
  if (member?.profile_photo_url) {
    const { data: signed } = await supabase.storage
      .from("profile-photos")
      .createSignedUrl(member.profile_photo_url, 3600);
    navPhotoUrl = signed?.signedUrl ?? null;
  }

  const { count: eventsBadgeCount } = await supabase
    .from("events")
    .select("id", { count: "exact", head: true })
    .eq("status", "published")
    .eq("registration_open", true)
    .gte("event_date", new Date().toISOString());

  const year = new Date().getFullYear();

  return (
    <CommandPaletteProvider>
    <div className="min-h-screen bg-sn-black-secondary md:grid md:grid-cols-[auto_1fr]">
      <AppRail
        firstName={member?.first_name ?? null}
        lastName={member?.last_name ?? null}
        pledgeClass={member?.pledge_class ?? null}
        isAdmin={isAdmin}
        photoUrl={navPhotoUrl}
        eventsBadgeCount={eventsBadgeCount ?? 0}
      />
      <div className="flex flex-col min-h-screen">
        <MobileHeader
          firstName={member?.first_name ?? null}
          lastName={member?.last_name ?? null}
          isAdmin={isAdmin}
          photoUrl={navPhotoUrl}
        />
        {member?.onboarding_dismissed === false && (
          <OnboardingModal
            profilePhotoUrl={member.profile_photo_url ?? null}
            pledgeClass={member.pledge_class ?? null}
            bigId={member.big_id ?? null}
            pinNumber={member.pin_number ?? null}
          />
        )}
        <main className="flex-1 max-w-6xl mx-auto w-full px-6 pt-8 pb-24 md:pb-8">
          {children}
        </main>
        <footer className="mt-auto border-t border-white/5 py-5 px-6 text-center">
          <p className="text-sn-gray-medium text-xs">
            © {year} Sigma Nu Fraternity, Mu Xi Chapter · Columbus State University
          </p>
          <div className="flex items-center justify-center gap-4 mt-1.5 text-xs text-sn-gray-medium/60">
            <Link href="/privacy" className="hover:text-sn-gray-medium transition-colors">Privacy Policy</Link>
            <span>·</span>
            <Link href="/terms" className="hover:text-sn-gray-medium transition-colors">Terms of Service</Link>
            <span>·</span>
            <a href="mailto:info@csusigmanu.com" className="hover:text-sn-gray-medium transition-colors">info@csusigmanu.com</a>
          </div>
        </footer>
      </div>
      <TabBar />
    </div>
    </CommandPaletteProvider>
  );
}
