"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export function ForgotPasswordForm() {
  const [email, setEmail]       = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading]   = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (email.trim() === "") return;
    setLoading(true);

    const supabase = createClient();
    // Fire and don't surface the result — never reveal whether the email exists.
    await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${APP_URL}/auth/reset-password`,
    });

    setLoading(false);
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="space-y-4 text-center py-2">
        <div className="text-green-400 text-3xl">✓</div>
        <p className="text-white text-sm leading-relaxed">
          If an account exists for{" "}
          <span className="text-sn-gold">{email}</span>, you&apos;ll receive a
          reset link shortly. Check your spam folder if it doesn&apos;t arrive
          within a few minutes.
        </p>
        <Link
          href="/login"
          className="inline-block text-sn-gold hover:text-sn-gold-light text-sm underline"
        >
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div className="space-y-1.5">
        <Label htmlFor="email" className="text-white/80 text-sm">
          Email address
        </Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="bg-white/10 border-white/20 text-white placeholder:text-white/30 focus-visible:border-sn-gold"
        />
      </div>

      <Button
        type="submit"
        disabled={loading || email.trim() === ""}
        className="w-full bg-sn-gold text-sn-black hover:bg-sn-gold-light font-semibold"
      >
        {loading ? "Sending…" : "Send reset link"}
      </Button>

      <p className="text-center text-white/50 text-sm">
        Remember your password?{" "}
        <Link href="/login" className="text-sn-gold hover:text-sn-gold-light underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
