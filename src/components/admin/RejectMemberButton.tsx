"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { rejectMember } from "@/lib/admin/actions";
import { toastError, toastSuccess } from "@/lib/toast";

interface RejectMemberButtonProps {
  memberId:   string;
  memberName: string;
}

export function RejectMemberButton({ memberId, memberName }: RejectMemberButtonProps) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [loading,    setLoading]    = useState(false);

  async function handleReject() {
    setLoading(true);
    const result = await rejectMember(memberId);
    if ("error" in result) {
      toastError(result.error);
      setLoading(false);
      setConfirming(false);
    } else {
      toastSuccess(`${memberName}'s account has been rejected.`);
      router.push("/admin/members");
    }
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-3">
        <p className="text-white/70 text-sm">
          Reject{" "}
          <span className="text-white font-medium">{memberName}</span>&apos;s account?
          This cannot be undone. They will need to sign up again if rejected in error.
        </p>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            onClick={() => void handleReject()}
            disabled={loading}
            className="h-7 px-3 text-xs bg-amber-600/80 hover:bg-amber-600 text-white border-0"
          >
            {loading ? "Rejecting…" : "Reject account"}
          </Button>
          <button
            type="button"
            onClick={() => setConfirming(false)}
            className="text-sn-gray-medium hover:text-sn-off-white text-xs transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={() => setConfirming(true)}
      className="h-7 px-3 text-xs border-amber-500/40 text-amber-400 hover:bg-amber-500/10 hover:text-amber-300 hover:border-amber-500/60"
    >
      Reject
    </Button>
  );
}
