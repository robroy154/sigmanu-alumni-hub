import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ChangeEmailForm } from "@/components/settings/ChangeEmailForm";
import { ChangePasswordForm } from "@/components/settings/ChangePasswordForm";

export const metadata: Metadata = { title: "Account Settings" };

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user === null) redirect("/login");

  // OAuth-only users have no password — only show email change for them.
  const hasPassword =
    user.app_metadata?.provider === "email" ||
    (user.identities ?? []).some((i) => i.provider === "email");

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-white text-xl font-semibold">Account Settings</h1>
        <Link
          href="/profile"
          className="text-white/50 hover:text-white text-sm transition-colors"
        >
          ← Back to profile
        </Link>
      </div>

      {/* Change email */}
      <div className="bg-sn-black rounded-xl border border-sn-gold/20 p-6 space-y-4">
        <div>
          <p className="text-white/70 text-xs font-semibold uppercase tracking-wider">
            Change Email
          </p>
          <p className="text-white/40 text-xs mt-1">
            A confirmation link will be sent to your new address.
          </p>
        </div>
        <ChangeEmailForm />
      </div>

      {/* Change password — only for email/password accounts */}
      {hasPassword && (
        <div className="bg-sn-black rounded-xl border border-sn-gold/20 p-6 space-y-4">
          <p className="text-white/70 text-xs font-semibold uppercase tracking-wider">
            Change Password
          </p>
          <ChangePasswordForm />
        </div>
      )}
    </div>
  );
}
