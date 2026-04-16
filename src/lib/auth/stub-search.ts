"use server";

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
