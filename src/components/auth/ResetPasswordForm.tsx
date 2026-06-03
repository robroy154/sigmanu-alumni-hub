"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

type FormState = "ready" | "submitting" | "success";

export function ResetPasswordForm() {
  const router  = useRouter();
  const [state, setState]               = useState<FormState>("ready");
  const [password, setPassword]         = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError]               = useState<string | null>(null);

  // By the time the user lands here via /auth/callback?next=/auth/reset-password,
  // exchangeCodeForSession has already run and their session is established.
  // No token polling needed — just update the password directly.
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setState("submitting");
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError !== null) {
      setError(updateError.message);
      setState("ready");
      return;
    }

    setState("success");
    setTimeout(() => router.push("/login?reset=1"), 1500);
  }

  if (state === "success") {
    return (
      <div className="space-y-2 text-center py-2">
        <div className="text-green-400 text-3xl">✓</div>
        <p className="text-white text-sm">Password updated. Redirecting…</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div className="space-y-1.5">
        <Label htmlFor="password" className="text-white/80 text-sm">
          New password
        </Label>
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          placeholder="Min. 8 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="bg-white/10 border-white/20 text-white placeholder:text-white/30 focus-visible:border-sn-gold"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="confirmPassword" className="text-white/80 text-sm">
          Confirm new password
        </Label>
        <Input
          id="confirmPassword"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          className="bg-white/10 border-white/20 text-white placeholder:text-white/30 focus-visible:border-sn-gold"
        />
      </div>

      {error !== null && (
        <p className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-md px-3 py-2">
          {error}
        </p>
      )}

      <Button
        type="submit"
        disabled={state === "submitting"}
        className="w-full bg-sn-gold text-sn-black hover:bg-sn-gold-light font-semibold"
      >
        {state === "submitting" ? "Saving…" : "Set new password"}
      </Button>
    </form>
  );
}
