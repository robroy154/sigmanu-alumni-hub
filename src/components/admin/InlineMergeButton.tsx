"use client";

import { useState } from "react";
import { adminMergeStub } from "@/lib/admin/actions";
import { toastSuccess, toastError } from "@/lib/toast";

interface Props {
  realMemberId: string;
  stubId: string;
  stubName: string;
  memberName: string;
}

export function InlineMergeButton({ realMemberId, stubId, stubName, memberName }: Props) {
  const [phase, setPhase] = useState<"idle" | "confirming" | "loading">("idle");

  async function handleMerge() {
    setPhase("loading");
    const result = await adminMergeStub(realMemberId, stubId);
    if ("error" in result) {
      toastError(result.error);
      setPhase("idle");
    } else {
      toastSuccess(`Merged ${stubName} into ${memberName}.`);
    }
  }

  if (phase === "confirming") {
    return (
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => void handleMerge()}
          className="h-6 px-2.5 rounded-sm bg-sn-gold/80 hover:bg-sn-gold text-sn-black text-xs font-semibold transition-colors"
        >
          Confirm merge
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
    return <span className="text-sn-gray-medium text-xs">Merging…</span>;
  }

  return (
    <button
      type="button"
      onClick={() => setPhase("confirming")}
      className="h-6 px-2.5 rounded-sm border border-sn-gold/30 text-sn-gold hover:bg-sn-gold/10 text-xs transition-colors"
    >
      Merge →
    </button>
  );
}
