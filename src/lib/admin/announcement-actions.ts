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
  body: string,
  notifyMembers: boolean,
): Promise<{ error: string } | { success: true }> {
  const guard = await requireAdmin();
  if ("error" in guard) return guard;

  if (title.trim() === "") return { error: "Title is required." };
  if (body.trim() === "") return { error: "Body is required." };

  const admin = createAdminClient();
  const { error } = await admin.from("announcements").insert({
    title:          title.trim(),
    body:           body.trim(),
    created_by:     guard.id,
    notify_members: notifyMembers,
  });

  if (error !== null) return { error: "Failed to create announcement." };

  // Send notification emails if requested — fire-and-forget.
  if (notifyMembers) {
    void (async () => {
      const { data: members } = await admin
        .from("members")
        .select("email")
        .in("status", ["member", "admin"])
        .not("email", "is", null);

      const emails = (members ?? []).map((m) => m.email);
      if (emails.length > 0) {
        const { sendAnnouncementNotification } = await import("@/lib/email");
        await sendAnnouncementNotification({
          title: title.trim(),
          body:  body.trim(),
          memberEmails: emails,
        });
      }
    })();
  }

  revalidatePath("/admin/announcements");
  revalidatePath("/home");
  return { success: true };
}

// ── Update announcement title and body ────────────────────────────────────────
export async function updateAnnouncement(
  announcementId: string,
  title: string,
  body: string,
): Promise<{ error: string } | { success: true }> {
  const guard = await requireAdmin();
  if ("error" in guard) return guard;

  if (title.trim() === "") return { error: "Title is required." };
  if (body.trim() === "") return { error: "Body is required." };

  const admin = createAdminClient();
  const { error } = await admin
    .from("announcements")
    .update({ title: title.trim(), body: body.trim(), updated_at: new Date().toISOString() })
    .eq("id", announcementId);

  if (error !== null) return { error: "Failed to update announcement." };

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

// ── Pin / unpin announcement ──────────────────────────────────────────────────
export async function pinAnnouncement(
  announcementId: string,
  pinned: boolean,
): Promise<{ error: string } | { success: true }> {
  const guard = await requireAdmin();
  if ("error" in guard) return guard;

  const admin = createAdminClient();
  const { error } = await admin
    .from("announcements")
    .update({ is_pinned: pinned, updated_at: new Date().toISOString() })
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

// ── Toggle show_on_login ──────────────────────────────────────────────────────
export async function setAnnouncementLoginSplash(
  announcementId: string,
  show: boolean
): Promise<{ error: string } | { success: true }> {
  const guard = await requireAdmin();
  if ("error" in guard) return guard;

  const admin = createAdminClient();
  const { error } = await admin
    .from("announcements")
    .update({ show_on_login: show })
    .eq("id", announcementId);

  if (error !== null) return { error: "Failed to update announcement." };

  revalidatePath("/admin/announcements");
  revalidatePath("/home");
  return { success: true };
}
