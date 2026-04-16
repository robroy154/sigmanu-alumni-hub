import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/lib/auth/actions";

export default async function AdminLayout({
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
    .select("status")
    .eq("id", user.id)
    .single();

  if (member?.status !== "admin") redirect("/");

  return (
    <div className="min-h-screen bg-sn-black-secondary flex flex-col">
      <header className="bg-black/40 border-b border-sn-gold/30 px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-7 h-7 rounded-full bg-sn-gold flex items-center justify-center text-sn-black font-bold text-xs select-none">
              ΣΝ
            </div>
            <span className="text-sn-gold font-semibold text-sm">
              Admin Panel
            </span>
          </div>

          <nav className="flex items-center gap-1">
            <AdminNavLink href="/admin">Dashboard</AdminNavLink>
            <AdminNavLink href="/admin/members">Members</AdminNavLink>
            <AdminNavLink href="/admin/registrations">Registrations</AdminNavLink>
            <AdminNavLink href="/admin/events">Events</AdminNavLink>
            <AdminNavLink href="/admin/referrals">Referrals</AdminNavLink>
            <AdminNavLink href="/admin/announcements">Announcements</AdminNavLink>
            <AdminNavLink href="/admin/import">Import</AdminNavLink>
            <AdminNavLink href="/directory">← Site</AdminNavLink>
          </nav>

          <form action={signOut}>
            <button
              type="submit"
              className="text-white/50 hover:text-white text-sm transition-colors"
            >
              Sign out
            </button>
          </form>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-8">
        {children}
      </main>
    </div>
  );
}

function AdminNavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="text-white/70 hover:text-white text-sm px-3 py-1.5 rounded-md hover:bg-white/10 transition-colors"
    >
      {children}
    </Link>
  );
}
