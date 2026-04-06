import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/lib/auth/actions";
import { House, Users, GitFork, Calendar, User, ShieldCheck } from "lucide-react";

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
    .select("status")
    .eq("id", user.id)
    .single();

  const isAdmin = member?.status === "admin";

  return (
    <div className="min-h-screen bg-sn-black-secondary flex flex-col">
      <header className="bg-sn-black border-b border-sn-gold/20 px-6 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          {/* Brand */}
          <Link href="/home" className="flex items-center gap-2.5 shrink-0">
            <div className="w-7 h-7 rounded-full bg-sn-gold flex items-center justify-center text-sn-black font-bold text-xs select-none">
              ΣΝ
            </div>
            <span className="text-sn-gold font-semibold text-sm hidden sm:block">
              Sigma Nu · Mu Xi
            </span>
          </Link>

          {/* Nav */}
          <nav className="flex items-center gap-1">
            <NavLink href="/home"><House className="w-3.5 h-3.5" />Home</NavLink>
            <NavLink href="/directory"><Users className="w-3.5 h-3.5" />Directory</NavLink>
            <NavLink href="/family-tree"><GitFork className="w-3.5 h-3.5" />Family Tree</NavLink>
            <NavLink href="/my-events"><Calendar className="w-3.5 h-3.5" />My Events</NavLink>
            <NavLink href="/profile"><User className="w-3.5 h-3.5" />My Profile</NavLink>
            {isAdmin && <NavLink href="/admin"><ShieldCheck className="w-3.5 h-3.5" />Admin</NavLink>}
          </nav>

          {/* Sign out */}
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

      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-8">
        {children}
      </main>
    </div>
  );
}

function NavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex flex-row items-center gap-1.5 text-white/70 hover:text-white text-sm px-3 py-1.5 rounded-md hover:bg-white/10 transition-colors"
    >
      {children}
    </Link>
  );
}
