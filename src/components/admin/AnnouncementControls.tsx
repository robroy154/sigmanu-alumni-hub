"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toggleAnnouncement, deleteAnnouncement, pinAnnouncement } from "@/lib/admin/announcement-actions";
import { toastSuccess, toastError } from "@/lib/toast";
import { Pin, PinOff } from "lucide-react";

interface Props {
  announcementId: string;
  isActive: boolean;
  isPinned: boolean;
}

export function AnnouncementControls({ announcementId, isActive, isPinned }: Props) {
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading]       = useState(false);

  async function handleToggle() {
    setLoading(true);
    const result = await toggleAnnouncement(announcementId, !isActive);
    setLoading(false);
    if ("error" in result) {
      toastError(result.error);
    } else {
      toastSuccess(isActive ? "Announcement deactivated." : "Announcement activated.");
    }
  }

  async function handlePin() {
    setLoading(true);
    const result = await pinAnnouncement(announcementId, !isPinned);
    setLoading(false);
    if ("error" in result) {
      toastError(result.error);
    } else {
      toastSuccess(isPinned ? "Announcement unpinned." : "Announcement pinned.");
    }
  }

  async function handleDelete() {
    setLoading(true);
    const result = await deleteAnnouncement(announcementId);
    if ("error" in result) {
      toastError(result.error);
      setLoading(false);
      setConfirming(false);
    } else {
      toastSuccess("Announcement deleted.");
    }
    // On success revalidatePath re-renders the page.
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => void handlePin()}
        disabled={loading}
        title={isPinned ? "Unpin" : "Pin to top"}
        className={`transition-colors ${
          isPinned ? "text-sn-gold hover:text-sn-gold-light" : "text-white/30 hover:text-white/70"
        }`}
      >
        {isPinned ? <Pin className="w-3.5 h-3.5" /> : <PinOff className="w-3.5 h-3.5" />}
      </button>
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={() => void handleToggle()}
        disabled={loading}
        className="h-6 px-2 text-xs bg-transparent border-white/20 text-sn-gray-text hover:text-sn-off-white hover:bg-white/10"
      >
        {isActive ? "Deactivate" : "Activate"}
      </Button>

      {confirming ? (
        <>
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
        </>
      ) : (
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => setConfirming(true)}
          className="h-6 px-2 text-xs bg-transparent border-white/20 text-sn-gray-text hover:text-sn-off-white hover:bg-white/10"
        >
          Delete
        </Button>
      )}
    </div>
  );
}
