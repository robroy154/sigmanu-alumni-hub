"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { deleteReferral } from "@/lib/admin/actions";
import { toastSuccess, toastError } from "@/lib/toast";
import { Trash2 } from "lucide-react";

export function DeleteReferralButton({ referralId }: { referralId: string }) {
  const [confirming, setConfirming] = useState(false);
  const [loading,    setLoading]    = useState(false);

  async function handleDelete() {
    setLoading(true);
    const result = await deleteReferral(referralId);
    if ("error" in result) {
      toastError(result.error);
      setLoading(false);
      setConfirming(false);
    } else {
      toastSuccess("Referral deleted.");
    }
    // On success, revalidatePath in the action re-renders the page.
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-1.5">
        <Button
          type="button"
          size="sm"
          onClick={() => void handleDelete()}
          disabled={loading}
          className="h-6 px-2 text-xs bg-red-500/80 hover:bg-red-500 text-white border-0"
        >
          {loading ? "Deleting…" : "Confirm"}
        </Button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="text-sn-gray-medium hover:text-sn-off-white text-xs transition-colors"
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
      className="h-6 px-2 text-xs bg-transparent border-white/20 text-sn-gray-text hover:text-sn-off-white hover:bg-white/10"
    >
      <Trash2 className="w-3.5 h-3.5" />Delete
    </Button>
  );
}
