"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { adminMergeStub } from "@/lib/admin/actions";
import { toastSuccess, toastError } from "@/lib/toast";

interface MatchingStub {
  id:           string;
  first_name:   string;
  last_name:    string;
  pledge_class: string | null;
  pin_number:   string | null;
}

interface MergeStubSectionProps {
  realMemberId:   string;
  realMemberName: string;
  matchingStubs:  MatchingStub[];
}

function stubLabel(stub: MatchingStub): string {
  const parts: string[] = [];
  if (stub.pledge_class !== null && stub.pledge_class !== "") parts.push(stub.pledge_class);
  if (stub.pin_number   !== null && stub.pin_number   !== "") parts.push(`Badge #${stub.pin_number}`);
  const detail = parts.length > 0 ? ` (${parts.join(" · ")})` : "";
  return `${stub.first_name} ${stub.last_name}${detail}`;
}

export function MergeStubSection({
  realMemberId,
  realMemberName,
  matchingStubs,
}: MergeStubSectionProps) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState(matchingStubs[0]?.id ?? "");
  const [isPending, setIsPending]   = useState(false);

  async function handleMerge() {
    const stub = matchingStubs.find((s) => s.id === selectedId);
    if (stub === undefined) return;

    const confirmed = window.confirm(
      `Merge "${stub.first_name} ${stub.last_name}" into "${realMemberName}"? The stub record will be deleted.`
    );
    if (!confirmed) return;

    setIsPending(true);
    const result = await adminMergeStub(realMemberId, selectedId);
    setIsPending(false);

    if ("error" in result) {
      toastError(result.error);
      return;
    }

    toastSuccess("Stub merged successfully.");
    router.refresh();
  }

  return (
    <div className="rounded-xl border border-white/10 bg-sn-surface p-5 space-y-3">
      <p className="text-white/80 text-sm font-semibold">Merge stub record</p>
      <p className="text-white/50 text-sm">
        If this member has an unclaimed stub record from the alumni import, merge it here
        to copy their pledge class, badge number, and big brother.
      </p>

      <div className="flex gap-3 items-center">
        <select
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
          className="flex-1 h-9 rounded-lg border border-white/20 bg-white/10 px-3 text-sm text-white focus:outline-none focus:border-sn-gold transition-colors"
        >
          {matchingStubs.map((stub) => (
            <option key={stub.id} value={stub.id} className="bg-sn-black">
              {stubLabel(stub)}
            </option>
          ))}
        </select>

        <Button
          type="button"
          onClick={() => void handleMerge()}
          disabled={isPending || selectedId === ""}
          className="shrink-0 bg-sn-gold text-sn-black hover:bg-sn-gold-light font-semibold"
        >
          {isPending ? "Merging…" : "Merge"}
        </Button>
      </div>
    </div>
  );
}
