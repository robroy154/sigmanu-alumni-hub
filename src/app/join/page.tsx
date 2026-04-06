import Link from "next/link";
import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { JoinForm } from "@/components/auth/JoinForm";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = { title: "Join — Sigma Nu Mu Xi Alumni Hub" };

interface Props {
  searchParams: Promise<{ token?: string }>;
}

export default async function JoinPage({ searchParams }: Props) {
  const { token } = await searchParams;
  const contactEmail = process.env.CHAPTER_CONTACT_EMAIL ?? "";

  // ── No token provided ──────────────────────────────────────────────────────
  if (token === undefined || token === "") {
    return <InviteError heading="Invalid invite link" contactEmail={contactEmail}>
      This invite link is invalid. Please contact a chapter member to request a new invitation.
    </InviteError>;
  }

  // ── Look up token via admin client (route is unauthenticated) ─────────────
  const admin = createAdminClient();
  const { data: referral } = await admin
    .from("referrals")
    .select("first_name, last_name, email, status, expires_at")
    .eq("token", token)
    .maybeSingle();

  // ── Not found ──────────────────────────────────────────────────────────────
  if (referral === null) {
    return <InviteError heading="Invalid invite link" contactEmail={contactEmail}>
      This invite link is invalid. Please contact a chapter member to request a new invitation.
    </InviteError>;
  }

  // ── Already used ───────────────────────────────────────────────────────────
  if (referral.status === "completed") {
    return <InviteError heading="Invite already used" contactEmail={null}>
      <span>
        This invite link has already been used.{" "}
        <Link href="/login" className="text-sn-gold hover:text-sn-gold-light underline">
          Sign in here
        </Link>{" "}
        if that was you.
      </span>
    </InviteError>;
  }

  // ── Expired ────────────────────────────────────────────────────────────────
  if (referral.status === "expired" || new Date(referral.expires_at) < new Date()) {
    return <InviteError heading="Invite link expired" contactEmail={contactEmail}>
      This invite link has expired. Invite links are valid for 7 days. Contact a chapter member to request a new one.
    </InviteError>;
  }

  // ── Valid — render pre-filled signup form ──────────────────────────────────
  return (
    <Card className="w-full max-w-lg bg-white/5 border-sn-gold/20">
      <CardHeader>
        <CardTitle className="text-white text-2xl">Join the Alumni Hub</CardTitle>
        <CardDescription className="text-white/60">
          You&apos;ve been invited to join the Sigma Nu Mu Xi Chapter alumni platform.
          Complete your account below.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <JoinForm
          firstName={referral.first_name}
          lastName={referral.last_name}
          email={referral.email}
          token={token}
        />
      </CardContent>
    </Card>
  );
}

// ── Error page component ────────────────────────────────────────────────────
function InviteError({
  heading,
  contactEmail,
  children,
}: {
  heading:      string;
  contactEmail: string | null;
  children:     React.ReactNode;
}) {
  return (
    <div className="w-full max-w-md space-y-4 text-center">
      <div className="w-12 h-12 rounded-full bg-sn-gold/10 border border-sn-gold/30 flex items-center justify-center mx-auto">
        <span className="text-sn-gold text-xl font-bold">ΣΝ</span>
      </div>
      <h1 className="text-white text-2xl font-semibold">{heading}</h1>
      <p className="text-white/60 text-sm leading-relaxed">{children}</p>
      {contactEmail !== null && contactEmail !== "" && (
        <a
          href={`mailto:${contactEmail}`}
          className="inline-block text-sn-gold hover:text-sn-gold-light text-sm underline"
        >
          {contactEmail}
        </a>
      )}
    </div>
  );
}
