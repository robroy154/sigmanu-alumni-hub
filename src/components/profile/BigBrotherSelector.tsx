"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { updateBigBrother } from "@/lib/profile/actions";
import { toastSuccess, toastError } from "@/lib/toast";

interface Member {
  id: string;
  first_name: string;
  last_name: string;
  pledge_class: string | null;
  pin_number:   string | null;
  status:       string;
}

interface BigBrotherSelectorProps {
  currentBigId:   string | null;
  currentBigName: string | null;
  allMembers:     Member[];
}

function formatBigLabel(m: Member): string {
  const pin = m.pin_number !== null ? ` — ΜΞ ${String(m.pin_number).padStart(3, "0")}` : "";
  const pc  = m.pledge_class !== null ? ` · ${m.pledge_class}` : "";
  const tag = m.status === "stub" ? " (unclaimed)" : "";
  return `${m.first_name} ${m.last_name}${pin}${pc}${tag}`;
}

export function BigBrotherSelector({
  currentBigId,
  currentBigName,
  allMembers,
}: BigBrotherSelectorProps) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState(currentBigId ?? "");
  const [confirming, setConfirming] = useState(false);
  const [saving, setSaving] = useState(false);

  const selectedMember = allMembers.find((m) => m.id === selectedId) ?? null;

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setSelectedId(e.target.value);
    setConfirming(false);
  }

  function handleRequestConfirm() {
    // No change — nothing to confirm.
    if (selectedId === (currentBigId ?? "")) return;
    setConfirming(true);
  }

  async function handleConfirm() {
    setSaving(true);
    const result = await updateBigBrother(selectedId === "" ? null : selectedId);
    if ("error" in result) {
      toastError(result.error);
      setSaving(false);
      setConfirming(false);
      return;
    }
    toastSuccess("Big brother updated.");
    setConfirming(false);
    setSaving(false);
    router.refresh();
  }

  function handleCancel() {
    setSelectedId(currentBigId ?? "");
    setConfirming(false);
  }

  const hasChange = selectedId !== (currentBigId ?? "");

  return (
    <div className="space-y-3">
      {/* Current big */}
      {currentBigName !== null && (
        <p className="text-white/50 text-sm">
          Current Big:{" "}
          <span className="text-white">{currentBigName}</span>
        </p>
      )}

      {/* Selector */}
      <select
        value={selectedId}
        onChange={handleChange}
        className="h-9 w-full rounded-lg border border-white/20 bg-white/10 px-3 text-sm text-white focus:outline-none focus:border-sn-gold transition-colors"
      >
        <option value="" className="bg-sn-black">
          — No Big Brother —
        </option>
        {allMembers.map((m) => (
          <option key={m.id} value={m.id} className="bg-sn-black">
            {formatBigLabel(m)}
          </option>
        ))}
      </select>

      {/* Inline confirmation */}
      {confirming && selectedMember !== null && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 space-y-2">
          <p className="text-amber-300 text-sm">
            Set <strong>{selectedMember.first_name} {selectedMember.last_name}</strong> as your Big Brother?
            {currentBigName !== null && (
              <span className="text-amber-300/70"> This replaces {currentBigName}.</span>
            )}
          </p>
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleConfirm}
              disabled={saving}
              className="bg-sn-gold text-sn-black hover:bg-sn-gold-light font-semibold"
            >
              {saving ? "Saving…" : "Confirm"}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleCancel}
              disabled={saving}
              className="text-white/60 hover:text-white hover:bg-white/10"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Confirmation to clear */}
      {confirming && selectedMember === null && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 space-y-2">
          <p className="text-amber-300 text-sm">
            Remove your Big Brother relationship?
          </p>
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleConfirm}
              disabled={saving}
              className="bg-sn-gold text-sn-black hover:bg-sn-gold-light font-semibold"
            >
              {saving ? "Saving…" : "Confirm"}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleCancel}
              disabled={saving}
              className="text-white/60 hover:text-white hover:bg-white/10"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Save trigger (only shown when a change is pending and not yet confirming) */}
      {hasChange && !confirming && (
        <Button
          size="sm"
          onClick={handleRequestConfirm}
          className="bg-sn-gold text-sn-black hover:bg-sn-gold-light font-semibold"
        >
          Save change
        </Button>
      )}
    </div>
  );
}
