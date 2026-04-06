"use client";

import { useState } from "react";
import { approveMember } from "@/lib/admin/actions";
import { toastSuccess, toastError } from "@/lib/toast";
import { Check } from "lucide-react";

export function ApproveButton({ memberId }: { memberId: string }) {
  const [loading, setLoading] = useState(false);
  const [done, setDone]       = useState(false);

  async function handleApprove() {
    setLoading(true);
    const result = await approveMember(memberId);
    if ("error" in result) {
      toastError(result.error);
      setLoading(false);
    } else {
      toastSuccess("Member approved.");
      setDone(true);
    }
  }

  if (done) {
    return <span className="text-green-400 text-xs">Approved ✓</span>;
  }

  return (
    <button
      onClick={() => void handleApprove()}
      disabled={loading}
      className="inline-flex h-7 items-center gap-1.5 rounded-sm bg-sn-gold px-3 text-xs font-semibold text-sn-black hover:bg-sn-gold-light transition-colors disabled:opacity-50"
    >
      {loading ? "Approving…" : <><Check className="w-3.5 h-3.5" />Approve</>}
    </button>
  );
}
