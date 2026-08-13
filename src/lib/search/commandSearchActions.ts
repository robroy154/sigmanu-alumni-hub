"use server";

import { createClient } from "@/lib/supabase/server";

export interface MemberSearchResult {
  id: string;
  name: string;
  meta: string | null;
}

export interface EventSearchResult {
  id: string;
  slug: string | null;
  title: string;
  dateLabel: string;
}

export interface CommandSearchResults {
  members: MemberSearchResult[];
  events: EventSearchResult[];
}

const EMPTY: CommandSearchResults = { members: [], events: [] };

// Two parallel .ilike() queries per field instead of .or() with string
// interpolation, matching the existing safety convention in
// src/lib/auth/big-brother-search.ts. Results merged and deduped by id.
export async function searchCommandPalette(rawQuery: string): Promise<CommandSearchResults> {
  const query = rawQuery.trim();
  if (query.length < 2) return EMPTY;

  const supabase = await createClient();
  const escaped = query.replace(/[\\%_]/g, (c) => `\\${c}`);
  const like = `%${escaped}%`;

  const [firstNameRes, lastNameRes, pledgeRes, cityRes, eventsRes] = await Promise.all([
    supabase.from("members")
      .select("id, first_name, last_name, pledge_class")
      .in("status", ["member", "admin"])
      .ilike("first_name", like)
      .limit(8),
    supabase.from("members")
      .select("id, first_name, last_name, pledge_class")
      .in("status", ["member", "admin"])
      .ilike("last_name", like)
      .limit(8),
    supabase.from("members")
      .select("id, first_name, last_name, pledge_class")
      .in("status", ["member", "admin"])
      .ilike("pledge_class", like)
      .limit(8),
    supabase.from("members")
      .select("id, first_name, last_name, pledge_class, city")
      .in("status", ["member", "admin"])
      .eq("show_address", true)
      .ilike("city", like)
      .limit(8),
    supabase.from("events")
      .select("id, slug, title, event_date")
      .eq("status", "published")
      .ilike("title", like)
      .order("event_date", { ascending: true })
      .limit(6),
  ]);

  const memberRows = [
    ...(firstNameRes.data ?? []),
    ...(lastNameRes.data ?? []),
    ...(pledgeRes.data ?? []),
    ...(cityRes.data ?? []),
  ];
  const seen = new Set<string>();
  const members: MemberSearchResult[] = [];
  for (const m of memberRows) {
    if (seen.has(m.id)) continue;
    seen.add(m.id);
    members.push({
      id: m.id,
      name: `${m.first_name} ${m.last_name}`,
      meta: m.pledge_class,
    });
    if (members.length >= 8) break;
  }

  const events: EventSearchResult[] = (eventsRes.data ?? []).map((e) => ({
    id: e.id,
    slug: e.slug,
    title: e.title,
    dateLabel: new Date(e.event_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
  }));

  return { members, events };
}
