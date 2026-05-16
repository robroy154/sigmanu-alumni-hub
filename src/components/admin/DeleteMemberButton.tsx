"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { deleteMember } from "@/lib/admin/actions";
import { toastError } from "@/lib/toast";

interface DeleteMemberButtonProps {
  memberId:   string;
  memberName: string;
}

export function DeleteMemberButton({ memberId, memberName }: DeleteMemberButtonProps) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [loading,    setLoading]    = useState(false);

  async function handleDelete() {
    setLoading(true);
    const result = await deleteMember(memberId);
    if ("error" in result) {
      toastError(result.error);
      setLoading(false);
      setConfirming(false);
    } else {
      router.push("/admin/members");
    }
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-3">
        <p className="text-white/70 text-sm">
          Permanently delete <span className="text-white font-medium">{memberName}</span>? This cannot be undone.
        </p>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            onClick={() => void handleDelete()}
            disabled={loading}
            className="h-7 px-3 text-xs bg-red-600/80 hover:bg-red-600 text-white border-0"
          >
            {loading ? "Deleting…" : "Delete permanently"}
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
      onClick={() => setConfirming(true)}
      className="border-red-500/40 text-red-400 hover:bg-red-500/10 hover:text-red-300 hover:border-red-500/60"
    >
      Delete Member
    </Button>
  );
}
