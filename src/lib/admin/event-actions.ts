"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { EventStatus, CapacityMode, EventType } from "@/types/database";
import type { EventFieldDraft } from "@/components/admin/EventFieldsBuilder";

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
  title:                  z.string().min(1, "Title is required"),
  slug:                   z.string().min(1, "Slug is required")
                           .regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, and hyphens only"),
  description:            z.string().optional(),
  rich_description:       z.string().optional(),
  event_date:             z.string().min(1, "Date is required"),
  location:               z.string().optional(),
  ticket_price:           z.coerce.number().min(0, "Price cannot be negative"),
  early_bird_price:       z.coerce.number().min(0).optional().or(z.literal("")),
  early_bird_ends_at:     z.string().optional(),
  registration_closes_at: z.string().optional(),
  capacity_mode:          z.enum(["unlimited", "capped", "waitlist"]),
  capacity:               z.coerce.number().int().positive().optional().or(z.literal("")),
  status:                 z.enum(["draft", "published", "archived"]),
  registration_open:      z.boolean(),
  event_type:             z.enum(["internal", "external"]),
  banner_image_url:       z.string().optional(),
});

export type EventFormInput = z.infer<typeof eventSchema>;

// ── Slug availability check ───────────────────────────────────────────────────
export async function checkSlugAvailable(
  slug: string,
  excludeId?: string
): Promise<boolean> {
  const admin = createAdminClient();
  let query = admin.from("events").select("id").eq("slug", slug);
  if (excludeId !== undefined && excludeId !== "") {
    query = query.neq("id", excludeId);
  }
  const { data } = await query;
  return (data ?? []).length === 0;
}

// ── Create event ──────────────────────────────────────────────────────────────
export async function createEvent(
  data: EventFormInput
): Promise<{ error: string } | { success: true; id: string }> {
  const guard = await requireAdmin();
  if ("error" in guard) return guard;

  const parsed = eventSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };

  const d = parsed.data;
  const admin = createAdminClient();
  const { data: event, error } = await admin
    .from("events")
    .insert({
      title:                  d.title,
      slug:                   d.slug,
      description:            d.description ?? null,
      rich_description:       d.rich_description ?? null,
      event_date:             d.event_date,
      location:               d.location ?? null,
      ticket_price:           d.ticket_price,
      early_bird_price:       d.early_bird_price !== "" && d.early_bird_price !== undefined
                                ? Number(d.early_bird_price) : null,
      early_bird_ends_at:     d.early_bird_ends_at ?? null,
      registration_closes_at: d.registration_closes_at ?? null,
      capacity_mode:          d.capacity_mode as CapacityMode,
      capacity:               d.capacity !== "" && d.capacity !== undefined
                                ? Number(d.capacity) : null,
      status:                 d.status as EventStatus,
      registration_open:      d.registration_open,
      event_type:             d.event_type as EventType,
      banner_image_url:       d.banner_image_url ?? null,
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

  const d = parsed.data;
  const admin = createAdminClient();
  const { error } = await admin
    .from("events")
    .update({
      title:                  d.title,
      slug:                   d.slug,
      description:            d.description ?? null,
      rich_description:       d.rich_description ?? null,
      event_date:             d.event_date,
      location:               d.location ?? null,
      ticket_price:           d.ticket_price,
      early_bird_price:       d.early_bird_price !== "" && d.early_bird_price !== undefined
                                ? Number(d.early_bird_price) : null,
      early_bird_ends_at:     d.early_bird_ends_at ?? null,
      registration_closes_at: d.registration_closes_at ?? null,
      capacity_mode:          d.capacity_mode as CapacityMode,
      capacity:               d.capacity !== "" && d.capacity !== undefined
                                ? Number(d.capacity) : null,
      status:                 d.status as EventStatus,
      registration_open:      d.registration_open,
      event_type:             d.event_type as EventType,
      banner_image_url:       d.banner_image_url ?? null,
      updated_at:             new Date().toISOString(),
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

// ── Save event fields (replace-all strategy) ──────────────────────────────────
export async function saveEventFields(
  eventId: string,
  fields: EventFieldDraft[]
): Promise<{ error: string } | { success: true }> {
  const guard = await requireAdmin();
  if ("error" in guard) return guard;

  const admin = createAdminClient();

  // Delete all existing fields for this event
  const { error: deleteError } = await admin
    .from("event_fields")
    .delete()
    .eq("event_id", eventId);

  if (deleteError !== null) {
    return { error: "Failed to update custom fields." };
  }

  // Insert new fields (skip if empty)
  if (fields.length > 0) {
    const rows = fields.map((f, i) => ({
      event_id:      eventId,
      field_label:   f.field_label,
      field_type:    f.field_type,
      field_options: f.field_options ?? null,
      required:      f.required,
      display_order: i,
    }));

    const { error: insertError } = await admin
      .from("event_fields")
      .insert(rows);

    if (insertError !== null) {
      return { error: "Failed to save custom fields." };
    }
  }

  revalidatePath(`/admin/events/${eventId}/edit`);
  return { success: true };
}
