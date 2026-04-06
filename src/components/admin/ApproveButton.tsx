"use client";

import { useState } from "react";
import { approveMember } from "@/lib/admin/actions";

export function ApproveButton({ memberId }: { memberId: string }) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleApprove() {
    setLoading(true);
    setError(null);
    const result = await approveMember(memberId);
    if ("error" in result) {
      setError(result.error);
      setLoading(false);
    } else {
      setDone(true);
    }
  }

  if (done) {
    return <span className="text-green-400 text-xs">Approved ✓</span>;
  }

  return (
    <div className="flex flex-col items-end gap-0.5">
      <button
        onClick={handleApprove}
        disabled={loading}
        className="inline-flex h-7 items-center rounded-lg bg-sn-gold px-3 text-xs font-semibold text-sn-black hover:bg-sn-gold-light transition-colors disabled:opacity-50"
      >
        {loading ? "Approving…" : "Approve"}
      </button>
      {error !== null && (
        <span className="text-red-400 text-xs">{error}</span>
      )}
    </div>
  );
}
