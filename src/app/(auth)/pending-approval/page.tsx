import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/lib/auth/actions";

export const metadata: Metadata = { title: "Pending Approval" };

export default async function PendingApprovalPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user === null) {
    redirect("/login");
  }

  // If the admin approved this user since they last loaded the page,
  // bounce them through to the member area automatically.
  const { data: member } = await supabase
    .from("members")
    .select("status, first_name")
    .eq("id", user.id)
    .single();

  if (member?.status === "member" || member?.status === "admin") {
    redirect("/directory");
  }

  const firstName = member?.first_name ?? "";

  return (
    <Card className="w-full max-w-md bg-white/5 border-sn-gold/20 text-center">
      <CardHeader>
        <CardTitle className="text-white text-2xl">
          {firstName !== "" ? `Thanks, ${firstName}!` : "Account Pending"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <p className="text-white/70 text-sm leading-relaxed">
            Your account is awaiting approval from a chapter admin. You&apos;ll
            get access to the full hub once they confirm your membership.
          </p>
          <p className="text-white/50 text-sm">
            In the meantime, you can still{" "}
            <span className="text-sn-gold">register for an event</span>{" "}
            using the button below.
          </p>
        </div>

        <div className="space-y-2">
          <a
            href="/register"
            className="inline-flex h-9 w-full items-center justify-center rounded-lg bg-sn-gold px-4 text-sm font-semibold text-sn-black hover:bg-sn-gold-light transition-colors"
          >
            Register for an Event
          </a>

          <form action={signOut}>
            <Button
              type="submit"
              variant="ghost"
              className="w-full text-white/50 hover:text-white hover:bg-white/10"
            >
              Sign out
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}
