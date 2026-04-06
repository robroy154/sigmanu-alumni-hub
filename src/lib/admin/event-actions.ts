"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { EventStatus } from "@/types/database";

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

// ── Validation schema ─────────────────────────────────────────────────────────
const eventSchema = z.object({
  title:       z.string().min(1, "Title is required"),
  description: z.string().optional(),
  event_date:  z.string().min(1, "Date is required"),
  location:    z.string().optional(),
  ticket_price: z.coerce.number().min(0, "Price cannot be negative"),
  capacity:    z.coerce.number().int().positive().optional().or(z.literal("")),
  status:      z.enum(["draft", "published", "archived"]),
});

export type EventFormInput = z.infer<typeof eventSchema>;

// ── Create event ──────────────────────────────────────────────────────────────
export async function createEvent(
  data: EventFormInput
): Promise<{ error: string } | { success: true; id: string }> {
  const guard = await requireAdmin();
  if ("error" in guard) return guard;

  const parsed = eventSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };

  const admin = createAdminClient();
  const { data: event, error } = await admin
    .from("events")
    .insert({
      title:        parsed.data.title,
      description:  parsed.data.description ?? null,
      event_date:   parsed.data.event_date,
      location:     parsed.data.location ?? null,
      ticket_price: parsed.data.ticket_price,
      capacity:     parsed.data.capacity !== "" && parsed.data.capacity !== undefined
        ? Number(parsed.data.capacity)
        : null,
      status:       parsed.data.status as EventStatus,
    })
    .select("id")
    .single();

  if (error !== null || event === null) {
    return { error: "Failed to create event. Please try again." };
  }

  revalidatePath("/admin/events");
  revalidatePath("/");
  return { success: true, id: event.id };
}

// ── Update event ──────────────────────────────────────────────────────────────
export async function updateEvent(
  id: string,
  data: EventFormInput
): Promise<{ error: string } | { success: true }> {
  const guard = await requireAdmin();
  if ("error" in guard) return guard;

  const parsed = eventSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };

  const admin = createAdminClient();
  const { error } = await admin
    .from("events")
    .update({
      title:        parsed.data.title,
      description:  parsed.data.description ?? null,
      event_date:   parsed.data.event_date,
      location:     parsed.data.location ?? null,
      ticket_price: parsed.data.ticket_price,
      capacity:     parsed.data.capacity !== "" && parsed.data.capacity !== undefined
        ? Number(parsed.data.capacity)
        : null,
      status:       parsed.data.status as EventStatus,
      updated_at:   new Date().toISOString(),
    })
    .eq("id", id);

  if (error !== null) {
    return { error: "Failed to update event. Please try again." };
  }

  revalidatePath("/admin/events");
  revalidatePath(`/admin/events/${id}/edit`);
  revalidatePath(`/events/${id}`);
  revalidatePath("/");
  return { success: true };
}

// ── Archive event (no hard deletes — preserves registration history) ──────────
export async function archiveEvent(
  id: string
): Promise<{ error: string } | { success: true }> {
  const guard = await requireAdmin();
  if ("error" in guard) return guard;

  const admin = createAdminClient();
  const { error } = await admin
    .from("events")
    .update({ status: "archived", updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error !== null) {
    return { error: "Failed to archive event." };
  }

  revalidatePath("/admin/events");
  revalidatePath("/");
  return { success: true };
}
