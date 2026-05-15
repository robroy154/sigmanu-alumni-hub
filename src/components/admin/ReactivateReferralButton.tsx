"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { reactivateReferral } from "@/lib/referrals/actions";
import { toastSuccess, toastError } from "@/lib/toast";
import { RefreshCw } from "lucide-react";

export function ReactivateReferralButton({ referralId }: { referralId: string }) {
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading]       = useState(false);

  async function handleReactivate() {
    setLoading(true);
    const result = await reactivateReferral(referralId);
    if ("error" in result) {
      toastError(result.error);
      setLoading(false);
      setConfirming(false);
    } else {
      toastSuccess("Referral reactivated and invite re-sent.");
    }
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-1.5">
        <Button
          type="button"
          size="sm"
          onClick={() => void handleReactivate()}
          disabled={loading}
          className="h-6 px-2 text-xs bg-sn-gold/80 hover:bg-sn-gold text-sn-black border-0 font-semibold"
        >
          {loading ? "Sending…" : "Confirm"}
        </Button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="text-sn-gray-medium hover:text-sn-off-white text-xs transition-colors"
        >
          Cancel
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
      className="h-6 px-2 text-xs bg-transparent border-white/20 text-sn-gray-text hover:text-sn-off-white hover:bg-white/10"
    >
      <RefreshCw className="w-3 h-3" />Reactivate
    </Button>
  );
}
