"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { duplicateEvent } from "@/lib/admin/event-actions";
import { toastSuccess, toastError } from "@/lib/toast";
import { Copy } from "lucide-react";

export function DuplicateEventButton({ eventId }: { eventId: string }) {
  const [loading, setLoading] = useState(false);

  async function handleDuplicate() {
    setLoading(true);
    const result = await duplicateEvent(eventId);
    setLoading(false);
    if ("error" in result) {
      toastError(result.error);
    } else {
      toastSuccess("Event duplicated as a draft.");
    }
  }

  return (
    <Button
      type="button"
      size="sm"
      variant="ghost"
      onClick={() => void handleDuplicate()}
      disabled={loading}
      className="h-7 px-2 text-xs text-white/40 hover:text-white"
      title="Duplicate event"
    >
      <Copy className="w-3.5 h-3.5" />
    </Button>
  );
}
