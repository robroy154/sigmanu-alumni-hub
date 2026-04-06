"use client";

import { useState } from "react";
import { archiveEvent } from "@/lib/admin/event-actions";
import { toastSuccess, toastError } from "@/lib/toast";
import { Archive } from "lucide-react";

export function ArchiveEventButton({ eventId }: { eventId: string }) {
  const [loading, setLoading] = useState(false);
  const [done, setDone]       = useState(false);

  async function handleArchive() {
    if (!confirm("Archive this event? It will no longer be visible publicly. Registration history is preserved.")) return;
    setLoading(true);
    const result = await archiveEvent(eventId);
    if ("error" in result) {
      toastError(result.error);
      setLoading(false);
    } else {
      toastSuccess("Event archived.");
      setDone(true);
    }
  }

  if (done) {
    return <span className="text-sn-gray-medium text-xs">Archived</span>;
  }

  return (
    <button
      onClick={() => void handleArchive()}
      disabled={loading}
      className="inline-flex h-7 items-center gap-1.5 rounded-sm border border-red-800 px-2 text-xs text-red-400 hover:border-red-600 hover:text-red-300 transition-colors disabled:opacity-50"
    >
      {loading ? "Archiving…" : <><Archive className="w-3.5 h-3.5" />Archive</>}
    </button>
  );
}
