"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

type FormState = "loading" | "ready" | "submitting" | "success" | "invalid_token";

export function ResetPasswordForm() {
  const router  = useRouter();
  const [state, setState]               = useState<FormState>("loading");
  const [password, setPassword]         = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError]               = useState<string | null>(null);

  // Supabase embeds the recovery token in the URL hash.
  // onAuthStateChange fires with event="PASSWORD_RECOVERY" once the client
  // picks up the hash and exchanges it for a session.
  useEffect(() => {
    const supabase = createClient();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setState("ready");
      }
    });

    // If the hash is missing or already expired Supabase won't fire the event.
    // Give it 3 seconds then assume the token is invalid.
    const timeout = setTimeout(() => {
      setState((current) => current === "loading" ? "invalid_token" : current);
    }, 3000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

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

  if (state === "loading") {
    return (
      <p className="text-white/50 text-sm text-center py-6 animate-pulse">
        Verifying reset link…
      </p>
    );
  }

  if (state === "invalid_token") {
    return (
      <div className="space-y-4 text-center py-2">
        <div className="text-red-400 text-3xl">✕</div>
        <p className="text-white/70 text-sm leading-relaxed">
          This reset link is invalid or has expired. Reset links are valid for
          one hour.
        </p>
        <Link
          href="/auth/forgot-password"
          className="inline-block text-sn-gold hover:text-sn-gold-light text-sm underline"
        >
          Request a new reset link
        </Link>
      </div>
    );
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
