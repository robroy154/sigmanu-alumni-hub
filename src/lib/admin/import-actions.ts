"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// ── Guard ─────────────────────────────────────────────────────────────────────
async function requireAdmin(): Promise<{ id: string } | { error: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user === null) return { error: "Not authenticated." };

  const { data: member } = await supabase
    .from("members")
    .select("status")
    .eq("id", user.id)
    .single();

  if (member?.status !== "admin") return { error: "Not authorized." };
  return { id: user.id };
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ImportRow {
  first_name:        string;
  last_name:         string;
  nickname?:         string | undefined;
  pledge_class?:     string | undefined;
  pin_number?:       string | undefined;
  big_brother_name?: string | undefined;
}

export interface ImportResult {
  inserted: number;
  skipped:  number;
  errors:   string[];
}

// ── importStubs ───────────────────────────────────────────────────────────────
// Two-pass import:
//   Pass 1 — Insert stub rows, skipping duplicates (same first+last+pledge_class).
//   Pass 2 — Resolve big_brother_name to big_id via fuzzy name search.
export async function importStubs(rows: ImportRow[]): Promise<ImportResult> {
  const guard = await requireAdmin();
  if ("error" in guard) return { inserted: 0, skipped: 0, errors: [guard.error] };

  const admin = createAdminClient();
  let inserted = 0;
  let skipped  = 0;
  const errors: string[] = [];

  // Track newly inserted stubs with their big_brother_name for pass 2.
  const pendingBigResolution: Array<{ insertedId: string; bigBrotherName: string; firstName: string; lastName: string }> = [];

  // ── Pass 1: Insert stubs ────────────────────────────────────────────────────
  for (const row of rows) {
    const firstName = row.first_name.trim();
    const lastName  = row.last_name.trim();
    if (firstName === "" || lastName === "") {
      errors.push(`Skipped row with missing first or last name.`);
      continue;
    }

    // Duplicate check: same first_name + last_name + pledge_class (any status)
    const pledgeClass = (row.pledge_class ?? "").trim() || null;
    const dupBase = admin
      .from("members")
      .select("id")
      .ilike("first_name", firstName)
      .ilike("last_name",  lastName);
    const { data: existing } = await (
      pledgeClass !== null
        ? dupBase.eq("pledge_class", pledgeClass)
        : dupBase.is("pledge_class", null)
    ).limit(1);
    if (existing !== null && existing.length > 0) {
      skipped++;
      continue;
    }

    // Insert stub row.
    // members.id FK to auth.users was dropped in the Phase 22 migration, so stubs
    // can have arbitrary UUIDs. Email must be unique (DB constraint), so we use a
    // per-stub placeholder that will never appear as a real address.
    const newId = crypto.randomUUID();
    const { data: newRow, error: insertError } = await admin
      .from("members")
      .insert({
        id:           newId,
        email:        `stub-${newId}@placeholder.internal`,
        first_name:   firstName,
        last_name:    lastName,
        nickname:     (row.nickname ?? "").trim() || null,
        pledge_class: pledgeClass,
        pin_number:   (row.pin_number ?? "").trim() || null,
        status:       "stub" as string,
      })
      .select("id")
      .single();

    if (insertError !== null || newRow === null) {
      errors.push(`Failed to insert ${firstName} ${lastName}: ${insertError?.message ?? "unknown error"}`);
      continue;
    }

    inserted++;

    const bigName = (row.big_brother_name ?? "").trim();
    if (bigName !== "") {
      pendingBigResolution.push({
        insertedId:    (newRow as { id: string }).id,
        bigBrotherName: bigName,
        firstName,
        lastName,
      });
    }
  }

  // ── Pass 2: Resolve big brothers ───────────────────────────────────────────
  for (const pending of pendingBigResolution) {
    // Try exact case-insensitive match first (full name ilike)
    const { data: exactMatches } = await admin
      .from("members")
      .select("id, first_name, last_name")
      .neq("status", "stub")
      .ilike("first_name", pending.bigBrotherName.split(" ")[0] ?? "")
      .ilike("last_name",  pending.bigBrotherName.split(" ").slice(1).join(" ") || "%")
      .limit(1);

    let resolvedId: string | null = null;

    if (exactMatches !== null && exactMatches.length > 0) {
      resolvedId = (exactMatches[0] as { id: string }).id;
    } else {
      // Fall back to trigram similarity via the find_member_by_name function
      const { data: fuzzyMatches } = await admin.rpc("find_member_by_name", {
        search_name: pending.bigBrotherName,
      });

      if (fuzzyMatches !== null && Array.isArray(fuzzyMatches) && fuzzyMatches.length > 0) {
        resolvedId = (fuzzyMatches[0] as { id: string }).id;
      }
    }

    if (resolvedId !== null) {
      await admin
        .from("members")
        .update({ big_id: resolvedId })
        .eq("id", pending.insertedId);
    } else {
      errors.push(
        `Could not resolve big brother "${pending.bigBrotherName}" for ${pending.firstName} ${pending.lastName}`
      );
    }
  }

  return { inserted, skipped, errors };
}
