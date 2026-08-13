"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { toastSuccess, toastError } from "@/lib/toast";
import type { FamilyTreeMember } from "./types";

interface NodePanelProps {
  member: FamilyTreeMember | null;
  big: FamilyTreeMember | null;
  littleCount: number;
  canInvite: boolean;
  onClose: () => void;
  onFlyToBig: () => void;
  onFlyToLittles: () => void;
}

export function NodePanel({ member, big, littleCount, canInvite, onClose, onFlyToBig, onFlyToLittles }: NodePanelProps) {
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteEmail, setInviteEmail]       = useState("");
  const [inviteLoading, setInviteLoading]   = useState(false);

  useEffect(() => {
    setShowInviteForm(false);
    setInviteEmail("");
    setInviteLoading(false);
  }, [member?.id]);

  if (member === null) return null;

  const initials = [member.first_name[0], member.last_name[0]].filter(Boolean).join("").toUpperCase();
  const pinDisplay = member.pin_number !== null ? `ΜΞ ${String(member.pin_number).padStart(3, "0")}` : null;

  async function handleInvite() {
    if (member === null || inviteEmail.trim() === "") return;
    setInviteLoading(true);
    try {
      const res = await fetch("/api/referrals", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          first_name: member.first_name,
          last_name:  member.last_name,
          email:      inviteEmail.trim(),
        }),
      });
      const json = await res.json() as { error?: string };
      if (!res.ok) {
        toastError(json.error ?? "Failed to send invite.");
      } else {
        setShowInviteForm(false);
        setInviteEmail("");
        toastSuccess(`Invite sent to ${inviteEmail.trim()}.`);
      }
    } catch {
      toastError("Failed to send invite. Please try again.");
    } finally {
      setInviteLoading(false);
    }
  }

  return (
    <div className="absolute top-0 right-0 bottom-0 w-70 bg-sn-surface border-l border-white/8 p-4.5 flex flex-col gap-4 overflow-y-auto md:static md:h-full">
      <button type="button" onClick={onClose} aria-label="Close panel" className="self-end text-sn-gray-medium hover:text-sn-off-white transition-colors">
        <X size={16} />
      </button>

      <div className="flex flex-col items-center gap-2.5 text-center">
        <div className="w-16 h-16 rounded-full overflow-hidden bg-sn-gray-dark text-sn-gold font-semibold text-lg flex items-center justify-center">
          {member.photo_url !== null
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={member.photo_url} alt={initials} className="w-full h-full object-cover" />
            : initials}
        </div>
        <div>
          <p className="text-sn-off-white font-semibold text-sm">{member.first_name} {member.last_name}</p>
          {member.is_stub ? (
            <span className="inline-block mt-1 text-[10px] font-semibold uppercase tracking-wide text-sn-gray-medium bg-white/5 rounded-full px-2 py-0.5">
              Unclaimed
            </span>
          ) : (
            <p className="text-sn-gray-medium text-xs mt-0.5">
              {member.pledge_class ?? "—"}{pinDisplay !== null ? ` · ${pinDisplay}` : ""}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-2 text-sm">
        <button
          type="button"
          onClick={onFlyToBig}
          disabled={big === null}
          className="w-full flex justify-between items-center bg-sn-surface-2 rounded-lg px-3 py-2 text-left disabled:opacity-40 hover:bg-white/5 transition-colors"
        >
          <span className="text-sn-gray-medium text-xs uppercase tracking-wide">Big</span>
          <span className="text-sn-text truncate ml-2">{big !== null ? `${big.first_name} ${big.last_name}` : "None"}</span>
        </button>
        <button
          type="button"
          onClick={onFlyToLittles}
          disabled={littleCount === 0}
          className="w-full flex justify-between items-center bg-sn-surface-2 rounded-lg px-3 py-2 text-left disabled:opacity-40 hover:bg-white/5 transition-colors"
        >
          <span className="text-sn-gray-medium text-xs uppercase tracking-wide">Littles</span>
          <span className="text-sn-text">{littleCount}</span>
        </button>
      </div>

      {member.is_stub ? (
        canInvite && (
          <div className="mt-auto space-y-2">
            {!showInviteForm ? (
              <button
                type="button"
                onClick={() => setShowInviteForm(true)}
                className="w-full bg-sn-gold text-sn-black-secondary font-semibold text-sm rounded-lg py-2 hover:bg-sn-gold-light transition-colors"
              >
                Invite to claim
              </button>
            ) : (
              <div className="space-y-2">
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder={`${member.first_name}'s email`}
                  className="w-full h-9 rounded-lg border border-white/20 bg-white/10 px-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-sn-gold"
                />
                <button
                  type="button"
                  onClick={handleInvite}
                  disabled={inviteLoading || inviteEmail.trim() === ""}
                  className="w-full bg-sn-gold text-sn-black-secondary font-semibold text-sm rounded-lg py-2 hover:bg-sn-gold-light transition-colors disabled:opacity-50"
                >
                  {inviteLoading ? "Sending…" : "Send invite"}
                </button>
              </div>
            )}
          </div>
        )
      ) : (
        <Link
          href={`/profile/${member.id}`}
          className="mt-auto block w-full text-center bg-sn-gold text-sn-black-secondary font-semibold text-sm rounded-lg py-2 hover:bg-sn-gold-light transition-colors"
        >
          View full profile →
        </Link>
      )}
    </div>
  );
}
