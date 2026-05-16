"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { updateEventStatus } from "@/lib/admin/event-actions";
import { toastSuccess, toastError } from "@/lib/toast";

interface Props {
  eventId: string;
  currentStatus: "draft" | "published";
}

export function ToggleEventStatusButton({ eventId, currentStatus }: Props) {
  const [loading, setLoading] = useState(false);

  const nextStatus = currentStatus === "draft" ? "published" : "draft";
  const label      = currentStatus === "draft" ? "Publish" : "Unpublish";

  async function handleToggle() {
    setLoading(true);
    const result = await updateEventStatus(eventId, nextStatus);
    setLoading(false);
    if ("error" in result) {
      toastError(result.error);
    } else {
      toastSuccess(nextStatus === "published" ? "Event published." : "Event moved to draft.");
    }
  }

  return (
    <Button
      type="button"
      size="sm"
      variant="ghost"
      onClick={() => void handleToggle()}
      disabled={loading}
      className="h-7 px-2 text-xs text-white/60 hover:text-white"
    >
      {loading ? "…" : label}
    </Button>
  );
}
