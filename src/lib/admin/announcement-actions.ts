"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// ── Guard: verify caller is admin ─────────────────────────────────────────────
async function requireAdmin(): Promise<{ id: string } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user === null) return { error: "Not authenticated." };

  const { data: member } = await supabase
    .from("members")
    .select("status")
    .eq("id", user.id)
    .single();

  if (member?.status !== "admin") return { error: "Not authorized." };
  return { id: user.id };
}

// ── Create announcement ───────────────────────────────────────────────────────
export async function createAnnouncement(
  title: string,
  body: string
): Promise<{ error: string } | { success: true }> {
  const guard = await requireAdmin();
  if ("error" in guard) return guard;

  if (title.trim() === "") return { error: "Title is required." };
  if (body.trim() === "") return { error: "Body is required." };

  const admin = createAdminClient();
  const { error } = await admin.from("announcements").insert({
    title:      title.trim(),
    body:       body.trim(),
    created_by: guard.id,
  });

  if (error !== null) return { error: "Failed to create announcement." };

  revalidatePath("/admin/announcements");
  revalidatePath("/home");
  return { success: true };
}

// ── Toggle announcement active state ─────────────────────────────────────────
export async function toggleAnnouncement(
  announcementId: string,
  isActive: boolean
): Promise<{ error: string } | { success: true }> {
  const guard = await requireAdmin();
  if ("error" in guard) return guard;

  const admin = createAdminClient();
  const { error } = await admin
    .from("announcements")
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq("id", announcementId);

  if (error !== null) return { error: "Failed to update announcement." };

  revalidatePath("/admin/announcements");
  revalidatePath("/home");
  return { success: true };
}

// ── Delete announcement ───────────────────────────────────────────────────────
export async function deleteAnnouncement(
  announcementId: string
): Promise<{ error: string } | { success: true }> {
  const guard = await requireAdmin();
  if ("error" in guard) return guard;

  const admin = createAdminClient();
  const { error } = await admin
    .from("announcements")
    .delete()
    .eq("id", announcementId);

  if (error !== null) return { error: "Failed to delete announcement." };

  revalidatePath("/admin/announcements");
  revalidatePath("/home");
  return { success: true };
}
