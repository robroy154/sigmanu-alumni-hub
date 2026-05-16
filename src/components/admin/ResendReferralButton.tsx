"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { resendReferralInvite } from "@/lib/referrals/actions";
import { Send } from "lucide-react";

export function ResendReferralButton({ referralId }: { referralId: string }) {
  const [state, setState] = useState<"idle" | "loading" | "sent" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleResend() {
    setState("loading");
    const result = await resendReferralInvite(referralId);
    if ("error" in result) {
      setErrorMsg(result.error);
      setState("error");
      setTimeout(() => setState("idle"), 3000);
    } else {
      setState("sent");
      setTimeout(() => setState("idle"), 3000);
    }
  }

  if (state === "sent") {
    return (
      <span className="text-xs text-green-400 font-medium">Sent</span>
    );
  }

  if (state === "error") {
    return (
      <span className="text-xs text-red-400 font-medium">{errorMsg}</span>
    );
  }

  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      onClick={() => void handleResend()}
      disabled={state === "loading"}
      className="h-6 px-2 text-xs bg-transparent border-white/20 text-sn-gray-text hover:text-sn-off-white hover:bg-white/10"
    >
      <Send className="w-3.5 h-3.5" />
      {state === "loading" ? "Sending…" : "Resend"}
    </Button>
  );
}
