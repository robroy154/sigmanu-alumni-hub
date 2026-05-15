"use client";

import { useState } from "react";
import { markRegistrationRefunded } from "@/lib/admin/actions";

interface Props {
  registrationId: string;
}

export function MarkRefundedButton({ registrationId }: Props) {
  const [phase, setPhase] = useState<"idle" | "confirming" | "loading" | "done" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleConfirm() {
    setPhase("loading");
    const result = await markRegistrationRefunded(registrationId);
    if ("error" in result) {
      setErrorMsg(result.error);
      setPhase("error");
    } else {
      setPhase("done");
    }
  }

  if (phase === "done") {
    return <p className="text-sn-gray-medium text-sm">Marked as refunded.</p>;
  }

  if (phase === "error") {
    return (
      <div className="flex items-center gap-3">
        <p className="text-red-400 text-sm">{errorMsg}</p>
        <button
          type="button"
          onClick={() => setPhase("idle")}
          className="text-white/40 hover:text-white text-xs transition-colors"
        >
          Dismiss
        </button>
      </div>
    );
  }

  if (phase === "loading") {
    return <p className="text-sn-gray-medium text-sm">Saving…</p>;
  }

  if (phase === "confirming") {
    return (
      <div className="flex items-center gap-3 flex-wrap">
        <p className="text-sn-gray-text text-sm">Mark this registration as refunded?</p>
        <button
          type="button"
          onClick={() => void handleConfirm()}
          className="h-7 px-3 rounded-sm bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-semibold hover:bg-amber-500/30 transition-colors"
        >
          Yes, mark refunded
        </button>
        <button
          type="button"
          onClick={() => setPhase("idle")}
          className="text-white/40 hover:text-white text-xs transition-colors"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setPhase("confirming")}
      className="h-7 px-3 rounded-sm border border-white/20 text-white/60 hover:text-white text-xs transition-colors"
    >
      Mark as refunded
    </button>
  );
}
