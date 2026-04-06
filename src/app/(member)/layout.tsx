import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/layout/Navbar";

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
    .select("first_name, last_name, status")
    .eq("id", user.id)
    .single();

  const isAdmin = member?.status === "admin";

  return (
    <div className="min-h-screen bg-sn-black-secondary flex flex-col">
      <Navbar
        firstName={member?.first_name ?? null}
        lastName={member?.last_name ?? null}
        isAdmin={isAdmin}
      />
      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-8">
        {children}
      </main>
    </div>
  );
}
