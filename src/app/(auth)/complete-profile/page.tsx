import { redirect } from "next/navigation";
import type { Metadata } from "next";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { CompleteProfileForm } from "@/components/auth/CompleteProfileForm";

export const metadata: Metadata = { title: "Complete Your Profile" };

export default async function CompleteProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user === null) {
    redirect("/login");
  }

  // If first_name is already set, no need to be here
  const { data: member } = await supabase
    .from("members")
    .select("first_name")
    .eq("id", user.id)
    .single();

  if (member?.first_name !== "" && member?.first_name !== null) {
    redirect("/pending-approval");
  }

  return (
    <Card className="w-full max-w-md bg-white/5 border-sn-gold/20">
      <CardHeader>
        <CardTitle className="text-white text-2xl">
          Complete your profile
        </CardTitle>
        <CardDescription className="text-white/60">
          Tell us your name so we can connect you with the chapter.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <CompleteProfileForm />
      </CardContent>
    </Card>
  );
}
