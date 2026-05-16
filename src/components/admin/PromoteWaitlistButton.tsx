"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { promoteFromWaitlist } from "@/lib/admin/actions";
import { toastSuccess, toastError } from "@/lib/toast";

interface Props {
  waitlistId: string;
}

export function PromoteWaitlistButton({ waitlistId }: Props) {
  const router = useRouter();
  const [phase, setPhase] = useState<"idle" | "confirm" | "loading">("idle");

  async function handleConfirm() {
    setPhase("loading");
    const result = await promoteFromWaitlist(waitlistId);
    if ("error" in result) {
      toastError(result.error);
      setPhase("idle");
    } else {
      toastSuccess("Promoted to registration and notified member.");
      router.refresh();
    }
  }

  if (phase === "confirm") {
    return (
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => void handleConfirm()}
          className="h-7 px-3 rounded-sm bg-sn-gold text-sn-black text-xs font-semibold hover:bg-sn-gold-light transition-colors"
        >
          Confirm
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

  if (phase === "loading") {
    return (
      <span className="text-white/40 text-xs">Promoting…</span>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setPhase("confirm")}
      className="h-7 px-3 rounded-sm border border-sn-gold/40 text-sn-gold text-xs hover:bg-sn-gold/10 transition-colors"
    >
      Promote
    </button>
  );
}
