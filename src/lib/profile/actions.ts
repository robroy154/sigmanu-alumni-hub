"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ProfileUpdateInput, SetPinInput } from "@/lib/profile/schemas";

// ── Update editable profile fields ────────────────────────────────────────────
// Members can update all fields here at any time.
// pin_number is intentionally excluded — use setPinNumber below.
export async function updateProfile(
  data: ProfileUpdateInput
): Promise<{ error: string } | { success: true }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user === null) {
    return { error: "Not authenticated." };
  }

  const { error } = await supabase
    .from("members")
    .update({
      first_name:   data.first_name,
      last_name:    data.last_name,
      nickname:     data.nickname ?? null,
      pledge_class: data.pledge_class ?? null,
      phone:        data.phone ?? null,
      city:         data.city ?? null,
      state:        data.state ?? null,
      linkedin_url: data.linkedin_url ?? null,
    })
    .eq("id", user.id);

  if (error !== null) {
    return { error: "Failed to save profile. Please try again." };
  }

  revalidatePath("/profile");
  revalidatePath("/profile/edit");
  return { success: true };
}

// ── Set pin number (one-time, member-initiated) ────────────────────────────────
// Uses the admin client so the authenticated column grant restriction on
// pin_number does not block the write. Verifies the member's current pin is
// NULL before allowing the write — this enforces the "set once" rule at the
// application layer (the DB unique constraint handles duplicates).
export async function setPinNumber(
  data: SetPinInput
): Promise<{ error: string } | { success: true }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user === null) {
    return { error: "Not authenticated." };
  }

  // Verify the current pin is still NULL before writing.
  const { data: member } = await supabase
    .from("members")
    .select("pin_number")
    .eq("id", user.id)
    .single();

  if (member?.pin_number !== null && member?.pin_number !== undefined) {
    return { error: "Pin number has already been set and cannot be changed." };
  }

  // Write via admin client — bypasses column-level grant restriction.
  const admin = createAdminClient();
  const { error } = await admin
    .from("members")
    .update({ pin_number: data.pin_number })
    .eq("id", user.id);

  if (error !== null) {
    // Unique constraint violation
    if (error.code === "23505") {
      return { error: "That pin number is already in use. Please choose another." };
    }
    return { error: "Failed to set pin number. Please try again." };
  }

  revalidatePath("/profile");
  revalidatePath("/profile/edit");
  return { success: true };
}

// ── Update big brother ────────────────────────────────────────────────────────
// Members can freely change their own big_id (no lock, just confirmation in UI).
// Passing null clears the relationship.
export async function updateBigBrother(
  bigId: string | null
): Promise<{ error: string } | { success: true }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user === null) {
    return { error: "Not authenticated." };
  }

  // Prevent self-reference.
  if (bigId === user.id) {
    return { error: "You cannot set yourself as your own Big." };
  }

  // Prevent simple circular reference: check that the chosen big doesn't
  // already have the current user as their big.
  if (bigId !== null) {
    const { data: proposed } = await supabase
      .from("members")
      .select("big_id")
      .eq("id", bigId)
      .single();

    if (proposed?.big_id === user.id) {
      return { error: "That member already has you as their Big — circular lineage not allowed." };
    }
  }

  const { error } = await supabase
    .from("members")
    .update({ big_id: bigId })
    .eq("id", user.id);

  if (error !== null) {
    return { error: "Failed to update Big Brother. Please try again." };
  }

  revalidatePath("/profile");
  revalidatePath("/profile/edit");
  return { success: true };
}

// ── Update profile photo path ──────────────────────────────────────────────────
// Called after client-side upload to Supabase Storage succeeds.
// Receives the storage object path (not a full URL).
export async function updateProfilePhoto(
  storagePath: string
): Promise<{ error: string } | { success: true }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user === null) {
    return { error: "Not authenticated." };
  }

  const { error } = await supabase
    .from("members")
    .update({ profile_photo_url: storagePath })
    .eq("id", user.id);

  if (error !== null) {
    return { error: "Failed to save photo. Please try again." };
  }

  revalidatePath("/profile");
  revalidatePath("/profile/edit");
  return { success: true };
}
