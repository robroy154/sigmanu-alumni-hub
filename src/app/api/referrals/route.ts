import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendReferralInvite, sendReferralSentConfirmation } from "@/lib/email";

const BodySchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name:  z.string().min(1, "Last name is required"),
  email:      z.string().email("Enter a valid email address"),
});

export async function POST(request: NextRequest) {
  // ── Auth ────────────────────────────────────────────────────────────────────
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user === null) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const { data: caller } = await supabase
    .from("members")
    .select("status, first_name, last_name, email")
    .eq("id", user.id)
    .single();

  if (caller === null || !["member", "admin"].includes(caller.status)) {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }

  // ── Validate body ────────────────────────────────────────────────────────────
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 422 },
    );
  }

  const { first_name, last_name, email } = parsed.data;
  const admin = createAdminClient();

  // ── Check email not already a member ────────────────────────────────────────
  const { data: existing } = await admin
    .from("members")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (existing !== null) {
    return NextResponse.json(
      { error: "This email address is already registered as a member." },
      { status: 409 },
    );
  }

  // ── Check no pending referral for this email ──────────────────────────────
  const { data: pendingReferral } = await admin
    .from("referrals")
    .select("id")
    .eq("email", email)
    .eq("status", "pending")
    .maybeSingle();

  if (pendingReferral !== null) {
    return NextResponse.json(
      { error: "An active invitation has already been sent to this email address." },
      { status: 409 },
    );
  }

  // ── Insert referral ──────────────────────────────────────────────────────────
  const { data: referral, error: insertError } = await admin
    .from("referrals")
    .insert({
      referred_by: user.id,
      first_name,
      last_name,
      email,
    })
    .select("token, first_name, last_name")
    .single();

  if (insertError !== null || referral === null) {
    console.error("[api/referrals] insert failed:", insertError);
    return NextResponse.json(
      { error: "Failed to create invitation. Please try again." },
      { status: 500 },
    );
  }

  // ── Send emails ─────────────────────────────────────────────────────────────
  const referrerName = `${caller.first_name} ${caller.last_name}`;

  try {
    await sendReferralInvite({
      to:               email,
      referrerFullName: referrerName,
      inviteeFirstName: first_name,
      token:            referral.token,
    });
    await sendReferralSentConfirmation({
      to:                caller.email,
      referrerFirstName: caller.first_name,
      inviteeFirstName:  first_name,
      inviteeLastName:   last_name,
    });
  } catch (emailError) {
    console.error("[referrals] email send failed:", emailError);
  }

  return NextResponse.json({
    success:   true,
    firstName: referral.first_name,
    lastName:  referral.last_name,
  });
}
