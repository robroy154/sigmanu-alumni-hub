"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { updateBigBrother } from "@/lib/profile/actions";

interface Member {
  id: string;
  first_name: string;
  last_name: string;
  pledge_class: string | null;
}

interface BigBrotherSelectorProps {
  currentBigId:   string | null;
  currentBigName: string | null;
  allMembers:     Member[];
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
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const selectedMember = allMembers.find((m) => m.id === selectedId) ?? null;

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setSelectedId(e.target.value);
    setConfirming(false);
    setError(null);
    setSaved(false);
  }

  function handleRequestConfirm() {
    // No change — nothing to confirm.
    if (selectedId === (currentBigId ?? "")) return;
    setConfirming(true);
  }

  async function handleConfirm() {
    setSaving(true);
    setError(null);
    const result = await updateBigBrother(selectedId === "" ? null : selectedId);
    if ("error" in result) {
      setError(result.error);
      setSaving(false);
      setConfirming(false);
      return;
    }
    setSaved(true);
    setConfirming(false);
    setSaving(false);
    router.refresh();
  }

  function handleCancel() {
    setSelectedId(currentBigId ?? "");
    setConfirming(false);
    setError(null);
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
        <option value="" className="bg-sn-navy">
          — No Big Brother —
        </option>
        {allMembers.map((m) => (
          <option key={m.id} value={m.id} className="bg-sn-navy">
            {m.first_name} {m.last_name}
            {m.pledge_class !== null ? ` (${m.pledge_class})` : ""}
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
              className="bg-sn-gold text-sn-navy hover:bg-sn-gold-light font-semibold"
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
              className="bg-sn-gold text-sn-navy hover:bg-sn-gold-light font-semibold"
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
      {hasChange && !confirming && !saved && (
        <Button
          size="sm"
          onClick={handleRequestConfirm}
          className="bg-sn-gold text-sn-navy hover:bg-sn-gold-light font-semibold"
        >
          Save change
        </Button>
      )}

      {error !== null && (
        <p className="text-red-400 text-xs">{error}</p>
      )}

      {saved && (
        <p className="text-green-400 text-xs">Big Brother updated.</p>
      )}
    </div>
  );
}
