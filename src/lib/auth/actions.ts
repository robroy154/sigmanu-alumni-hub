"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { CompleteProfileInput } from "@/lib/auth/schemas";

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function completeProfile(
  data: CompleteProfileInput
): Promise<{ error: string } | never> {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError !== null || user === null) {
    redirect("/login");
  }

  const updatePayload: { first_name: string; last_name: string; pledge_class?: string } = {
    first_name: data.first_name,
    last_name: data.last_name,
  };

  if (data.pledge_class !== undefined && data.pledge_class !== "") {
    updatePayload.pledge_class = data.pledge_class;
  }

  const { error } = await supabase
    .from("members")
    .update(updatePayload)
    .eq("id", user.id);

  if (error !== null) {
    return { error: "Failed to save profile. Please try again." };
  }

  redirect("/pending-approval");
}
