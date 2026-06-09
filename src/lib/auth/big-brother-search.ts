"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export interface BigBrotherCandidate {
  id:          string;
  firstName:   string;
  lastName:    string;
  pinNumber:   string | null;
  pledgeClass: string | null;
  status:      "member" | "admin" | "stub";
}

type MemberRow = {
  id:           string;
  first_name:   string;
  last_name:    string;
  pin_number:   string | null;
  pledge_class: string | null;
  status:       string;
};

function mapRow(row: MemberRow): BigBrotherCandidate {
  return {
    id:          row.id,
    firstName:   row.first_name,
    lastName:    row.last_name,
    pinNumber:   row.pin_number,
    pledgeClass: row.pledge_class,
    status:      row.status as "member" | "admin" | "stub",
  };
}

// Returns candidates for big brother selection.
// Empty query  → top 10 by badge number ascending (browse mode, null-last).
// Numeric query → badge number substring match.
// Text query    → first/last name fragment match (ilike).
// Uses admin client — called during signup before the user has a session.
export async function searchBigBrotherCandidates(
  query: string
): Promise<BigBrotherCandidate[]> {
  const admin = createAdminClient();
  const q = query.trim();

  if (q === "") {
    // Browse mode: members with a badge number, ordered ascending
    const { data } = await admin
      .from("members")
      .select("id, first_name, last_name, pin_number, pledge_class, status")
      .in("status", ["member", "admin", "stub"])
      .not("pin_number", "is", null)
      .order("pin_number", { ascending: true })
      .limit(10);
    return (data ?? []).map(mapRow);
  }

  if (/^\d+$/.test(q)) {
    // Badge number search
    const { data } = await admin
      .from("members")
      .select("id, first_name, last_name, pin_number, pledge_class, status")
      .in("status", ["member", "admin", "stub"])
      .ilike("pin_number", `%${q}%`)
      .order("pin_number", { ascending: true })
      .limit(10);
    return (data ?? []).map(mapRow);
  }

  // Name fragment search — escape LIKE wildcards and backslash, then run two
  // separate typed queries (no .or() string interpolation) and merge by ID.
  const safe    = q.replace(/[\\%_]/g, "\\$&");
  const pattern = `%${safe}%`;

  const [{ data: byFirst }, { data: byLast }] = await Promise.all([
    admin
      .from("members")
      .select("id, first_name, last_name, pin_number, pledge_class, status")
      .in("status", ["member", "admin", "stub"])
      .ilike("first_name", pattern)
      .order("pin_number", { ascending: true })
      .limit(10),
    admin
      .from("members")
      .select("id, first_name, last_name, pin_number, pledge_class, status")
      .in("status", ["member", "admin", "stub"])
      .ilike("last_name", pattern)
      .order("pin_number", { ascending: true })
      .limit(10),
  ]);

  const seen   = new Set<string>();
  const merged: MemberRow[] = [];
  for (const row of [...(byFirst ?? []), ...(byLast ?? [])]) {
    if (!seen.has(row.id)) {
      seen.add(row.id);
      merged.push(row as MemberRow);
    }
  }
  return merged
    .sort((a, b) => (a.pin_number ?? "").localeCompare(b.pin_number ?? ""))
    .slice(0, 10)
    .map(mapRow);
}

// Resolves a single member by ID — used to populate display name for a
// pre-selected big_id (e.g., inherited from a claimed stub record).
export async function getBigBrotherById(
  id: string
): Promise<BigBrotherCandidate | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("members")
    .select("id, first_name, last_name, pin_number, pledge_class, status")
    .eq("id", id)
    .in("status", ["member", "admin", "stub"])
    .maybeSingle();
  if (data === null) return null;
  return mapRow(data as MemberRow);
}

// Sets big_id for a member — verifies session ownership before writing.
// Note: session cookies may not be available immediately after a client-side
// signUp() call. For the signup flow, prefer the client-side update pattern
// in SignupForm.tsx / JoinForm.tsx (same approach used for phone, pledge_class, etc.).
export async function setBigBrother(
  memberId: string,
  bigId: string
): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user === null) return { error: "Not authenticated." };
  if (user.id !== memberId) return { error: "Not authorized." };

  const admin = createAdminClient();
  const { error } = await admin
    .from("members")
    .update({ big_id: bigId })
    .eq("id", memberId);
  if (error !== null) return { error: "Failed to update big brother." };

  revalidatePath("/profile");
  revalidatePath("/family-tree");
  return { success: true };
}
