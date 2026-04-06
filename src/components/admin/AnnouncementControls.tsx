"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toggleAnnouncement, deleteAnnouncement } from "@/lib/admin/announcement-actions";

interface Props {
  announcementId: string;
  isActive: boolean;
}

export function AnnouncementControls({ announcementId, isActive }: Props) {
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState<string | null>(null);

  async function handleToggle() {
    setLoading(true);
    setError(null);
    const result = await toggleAnnouncement(announcementId, !isActive);
    setLoading(false);
    if ("error" in result) setError(result.error);
  }

  async function handleDelete() {
    setLoading(true);
    setError(null);
    const result = await deleteAnnouncement(announcementId);
    if ("error" in result) {
      setError(result.error);
      setLoading(false);
      setConfirming(false);
    }
    // On success revalidatePath re-renders the page.
  }

  if (error !== null) {
    return <span className="text-red-400 text-xs">{error}</span>;
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={() => void handleToggle()}
        disabled={loading}
        className="h-6 px-2 text-xs bg-transparent border-white/20 text-white/50 hover:text-white hover:bg-white/10"
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
            className="text-white/40 hover:text-white text-xs transition-colors"
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
          className="h-6 px-2 text-xs bg-transparent border-white/20 text-white/50 hover:text-white hover:bg-white/10"
        >
          Delete
        </Button>
      )}
    </div>
  );
}
