"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { PLEDGE_CLASSES } from "@/lib/utils/pledge-classes";

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

// ── Approve a pending member ───────────────────────────────────────────────────
export async function approveMember(
  memberId: string
): Promise<{ error: string } | { success: true }> {
  const guard = await requireAdmin();
  if ("error" in guard) return guard;

  const admin = createAdminClient();
  const { error } = await admin
    .from("members")
    .update({ status: "member" })
    .eq("id", memberId)
    .eq("status", "pending"); // Safety: only upgrade pending rows

  if (error !== null) return { error: "Failed to approve member." };

  revalidatePath("/admin/members");
  revalidatePath("/admin");
  return { success: true };
}

// ── Update member profile (admin can edit any field) ──────────────────────────
export async function adminUpdateMember(
  memberId: string,
  data: {
    first_name?: string;
    last_name?: string;
    nickname?: string | null;
    pledge_class?: string | null;
    phone?: string | null;
    city?: string | null;
    state?: string | null;
    home_address?: string | null;
    linkedin_url?: string | null;
    pin_number?: string | null;
    status?: string;
    big_id?: string | null;
  }
): Promise<{ error: string } | { success: true }> {
  const guard = await requireAdmin();
  if ("error" in guard) return guard;

  // Validate pledge_class if provided
  if (
    data.pledge_class !== undefined &&
    data.pledge_class !== null &&
    data.pledge_class !== "" &&
    !PLEDGE_CLASSES.includes(data.pledge_class)
  ) {
    return { error: "Invalid pledge class." };
  }

  // Validate status if provided
  if (
    data.status !== undefined &&
    !["pending", "member", "admin"].includes(data.status)
  ) {
    return { error: "Invalid status." };
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("members")
    .update(data)
    .eq("id", memberId);

  if (error !== null) {
    if (error.code === "23505") return { error: "That pin number is already in use." };
    return { error: "Failed to update member." };
  }

  revalidatePath("/admin/members");
  revalidatePath(`/admin/members/${memberId}`);
  revalidatePath("/admin");
  return { success: true };
}

// ── Assign a badge ─────────────────────────────────────────────────────────────
export async function assignBadge(
  memberId: string,
  badgeType: string
): Promise<{ error: string } | { success: true }> {
  const guard = await requireAdmin();
  if ("error" in guard) return guard;

  if (badgeType.trim() === "") return { error: "Badge type cannot be empty." };

  const admin = createAdminClient();
  const { error } = await admin.from("badges").insert({
    member_id:   memberId,
    badge_type:  badgeType.trim(),
    assigned_by: guard.id,
  });

  if (error !== null) return { error: "Failed to assign badge." };

  revalidatePath(`/admin/members/${memberId}`);
  return { success: true };
}

// ── Remove a badge ─────────────────────────────────────────────────────────────
export async function removeBadge(
  badgeId: string,
  memberId: string
): Promise<{ error: string } | { success: true }> {
  const guard = await requireAdmin();
  if ("error" in guard) return guard;

  const admin = createAdminClient();
  const { error } = await admin
    .from("badges")
    .delete()
    .eq("id", badgeId);

  if (error !== null) return { error: "Failed to remove badge." };

  revalidatePath(`/admin/members/${memberId}`);
  return { success: true };
}
