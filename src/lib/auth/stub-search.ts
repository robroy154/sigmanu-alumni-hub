"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export interface StubMatch {
  id:          string;
  firstName:   string;
  lastName:    string;
  nickname:    string | null;
  pledgeClass: string | null;
  pinNumber:   string | null; // full value, never masked
  similarity:  number;
}

export async function findStubMatches(input: {
  firstName:    string;
  lastName:     string;
  pledgeClass?: string | undefined;
  pinNumber?:   string | undefined;
}): Promise<StubMatch[]> {
  const admin = createAdminClient();

  // Pass null (not undefined) — Supabase rpc serializes undefined as absent which
  // may cause the default DEFAULT NULL to not trigger correctly in some versions.
  const { data, error } = await admin.rpc("search_stubs", {
    search_name:         `${input.firstName} ${input.lastName}`,
    search_pledge_class: input.pledgeClass ?? null,
    search_pin:          input.pinNumber ?? null,
  });

  if (error !== null || data === null) {
    // Non-fatal: if the search fails, fall back to no matches so signup proceeds normally.
    console.error("[findStubMatches] RPC error:", error);
    return [];
  }

  return (data as Array<{
    id:           string;
    first_name:   string;
    last_name:    string;
    nickname:     string | null;
    pledge_class: string | null;
    pin_number:   string | null;
    similarity:   number;
  }>).map((row) => ({
    id:          row.id,
    firstName:   row.first_name,
    lastName:    row.last_name,
    nickname:    row.nickname,
    pledgeClass: row.pledge_class,
    pinNumber:   row.pin_number,
    similarity:  row.similarity,
  }));
}

// ── Claim a stub for an already-authenticated user (OAuth post-signup path) ──
// Gets the caller's identity from the session — never accepts userId as a param.
export async function claimStubForExistingUser(
  stubId: string
): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user === null) return { error: "Not authenticated." };

  const admin = createAdminClient();

  // Fetch stub — confirm it's still unclaimed
  const { data: stub } = await admin
    .from("members")
    .select("id, pledge_class, pin_number, big_id, nickname, status")
    .eq("id", stubId)
    .single();

  if (stub === null || stub.status !== "stub") {
    return { error: "Stub record not found or already claimed." };
  }

  // Fetch the real member row to know which fields are already set
  const { data: realMember } = await admin
    .from("members")
    .select("id, pledge_class, pin_number, big_id, nickname")
    .eq("id", user.id)
    .single();

  if (realMember === null) return { error: "Member record not found." };

  // Only overwrite fields that are currently null on the real row
  const updates: Record<string, string | null> = {};
  if (realMember.pledge_class === null && stub.pledge_class !== null)
    updates.pledge_class = stub.pledge_class;
  if (realMember.pin_number === null && stub.pin_number !== null)
    updates.pin_number = stub.pin_number;
  if (realMember.big_id === null && stub.big_id !== null)
    updates.big_id = stub.big_id;
  if (realMember.nickname === null && stub.nickname !== null)
    updates.nickname = stub.nickname;

  if (Object.keys(updates).length > 0) {
    const { error: updateError } = await admin
      .from("members")
      .update(updates)
      .eq("id", user.id);
    if (updateError !== null) return { error: "Failed to update member record." };
  }

  // Re-point any little brothers that referenced the stub
  await admin.from("members").update({ big_id: user.id }).eq("big_id", stubId);

  // Delete stub only if no registrations reference it
  const { count } = await admin
    .from("registrations")
    .select("id", { count: "exact", head: true })
    .eq("member_id", stubId);

  if ((count ?? 0) === 0) {
    await admin.from("members").delete().eq("id", stubId);
  }

  revalidatePath("/family-tree");
  return { success: true };
}
