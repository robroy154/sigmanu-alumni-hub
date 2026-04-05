"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

const CALLBACK_URL =
  (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000") +
  "/auth/callback";

type OAuthProvider = "google" | "facebook" | "apple";

const PROVIDER_LABELS: Record<OAuthProvider, string> = {
  google: "Continue with Google",
  facebook: "Continue with Facebook",
  apple: "Continue with Apple",
};

export function OAuthButtons() {
  const [loading, setLoading] = useState<OAuthProvider | null>(null);
  const supabase = createClient();

  async function handleOAuth(provider: OAuthProvider) {
    setLoading(provider);
    await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: CALLBACK_URL },
    });
    // Page navigates away — no need to reset loading state
  }

  return (
    <div className="space-y-2">
      {(["google", "facebook", "apple"] as OAuthProvider[]).map((provider) => (
        <Button
          key={provider}
          type="button"
          variant="outline"
          className="w-full border-white/20 text-white hover:bg-white/10"
          onClick={() => handleOAuth(provider)}
          disabled={loading !== null}
        >
          {loading === provider ? "Redirecting…" : PROVIDER_LABELS[provider]}
        </Button>
      ))}
    </div>
  );
}
