"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cancelReferral } from "@/lib/admin/actions";

export function CancelReferralButton({ referralId }: { referralId: string }) {
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState<string | null>(null);

  async function handleCancel() {
    setLoading(true);
    setError(null);
    const result = await cancelReferral(referralId);
    if ("error" in result) {
      setError(result.error);
      setLoading(false);
      setConfirming(false);
    }
    // On success, revalidatePath in the action re-renders the page.
  }

  if (error !== null) {
    return <span className="text-red-400 text-xs">{error}</span>;
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-1.5">
        <Button
          type="button"
          size="sm"
          onClick={() => void handleCancel()}
          disabled={loading}
          className="h-6 px-2 text-xs bg-red-500/80 hover:bg-red-500 text-white border-0"
        >
          {loading ? "Cancelling…" : "Confirm"}
        </Button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="text-white/40 hover:text-white text-xs transition-colors"
        >
          Keep
        </button>
      </div>
    );
  }

  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      onClick={() => setConfirming(true)}
      className="h-6 px-2 text-xs bg-transparent border-white/20 text-white/50 hover:text-white hover:bg-white/10"
    >
      Cancel
    </Button>
  );
}
