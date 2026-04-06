"use client";

import { useState } from "react";
import { archiveEvent } from "@/lib/admin/event-actions";

export function ArchiveEventButton({ eventId }: { eventId: string }) {
  const [loading, setLoading] = useState(false);
  const [done, setDone]       = useState(false);
  const [error, setError]     = useState<string | null>(null);

  async function handleArchive() {
    if (!confirm("Archive this event? It will no longer be visible publicly. Registration history is preserved.")) return;
    setLoading(true);
    setError(null);
    const result = await archiveEvent(eventId);
    if ("error" in result) {
      setError(result.error);
      setLoading(false);
    } else {
      setDone(true);
    }
  }

  if (done) {
    return <span className="text-white/40 text-xs">Archived</span>;
  }

  return (
    <div className="flex flex-col items-end gap-0.5">
      <button
        onClick={handleArchive}
        disabled={loading}
        className="inline-flex h-7 items-center rounded-lg border border-red-500/30 px-2 text-xs text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
      >
        {loading ? "Archiving…" : "Archive"}
      </button>
      {error !== null && (
        <span className="text-red-400 text-xs">{error}</span>
      )}
    </div>
  );
}
