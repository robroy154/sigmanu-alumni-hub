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
  bigId:       string | null; // big_id from the stub row, for pre-populating big brother on signup
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
  const rpcArgs: { search_name: string; search_pledge_class?: string; search_pin?: string } = {
    search_name: `${input.firstName} ${input.lastName}`,
  };
  if (input.pledgeClass !== undefined) rpcArgs.search_pledge_class = input.pledgeClass;
  if (input.pinNumber !== undefined)   rpcArgs.search_pin = input.pinNumber;

  const { data, error } = await admin.rpc("search_stubs", rpcArgs);

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
    big_id:       string | null;
    similarity:   number;
  }>).map((row) => ({
    id:          row.id,
    firstName:   row.first_name,
    lastName:    row.last_name,
    nickname:    row.nickname,
    pledgeClass: row.pledge_class,
    pinNumber:   row.pin_number,
    bigId:       row.big_id,
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
  const updates: { pledge_class?: string | null; pin_number?: string | null; big_id?: string | null; nickname?: string | null } = {};
  if (realMember.pledge_class === null && stub.pledge_class !== null)
    updates.pledge_class = stub.pledge_class;
  if (realMember.pin_number === null && stub.pin_number !== null)
    updates.pin_number = stub.pin_number;
  if (realMember.big_id === null && stub.big_id !== null)
    updates.big_id = stub.big_id;
  if (realMember.nickname === null && stub.nickname !== null)
    updates.nickname = stub.nickname;

  if (Object.keys(updates).length > 0) {
    // If we're copying pin_number, null it on the stub first to avoid the unique
    // constraint being violated while both rows briefly hold the same value.
    if (updates.pin_number !== undefined) {
      await admin.from("members").update({ pin_number: null }).eq("id", stubId);
    }

    const { error: updateError } = await admin
      .from("members")
      .update(updates)
      .eq("id", user.id);
    if (updateError !== null) return { error: "Failed to update member record." };
  }

  // Re-point any little brothers that referenced the stub
  const { error: repointError } = await admin
    .from("members")
    .update({ big_id: user.id })
    .eq("big_id", stubId);
  if (repointError !== null) {
    console.error("[claimStubForExistingUser] big_id re-point failed:", repointError.message);
  }

  // Delete stub only if no registrations reference it
  const { count } = await admin
    .from("registrations")
    .select("id", { count: "exact", head: true })
    .eq("member_id", stubId);

  if ((count ?? 0) === 0) {
    const { error: deleteError } = await admin.from("members").delete().eq("id", stubId);
    if (deleteError !== null) {
      console.error("[claimStubForExistingUser] stub delete failed:", deleteError.message);
    }
  }

  revalidatePath("/family-tree");
  return { success: true };
}
