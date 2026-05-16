"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { deleteRegistration } from "@/lib/admin/actions";
import { toastError } from "@/lib/toast";

interface DeleteRegistrationButtonProps {
  registrationId: string;
  registrantName: string;
  eventTitle:     string;
  /** If provided, router.push(redirectAfter) after successful delete. Otherwise router.refresh(). */
  redirectAfter?: string;
}

export function DeleteRegistrationButton({
  registrationId,
  registrantName,
  eventTitle,
  redirectAfter,
}: DeleteRegistrationButtonProps) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [loading,    setLoading]    = useState(false);

  async function handleDelete() {
    setLoading(true);
    const result = await deleteRegistration(registrationId);
    if ("error" in result) {
      toastError(result.error);
      setLoading(false);
      setConfirming(false);
    } else if (redirectAfter !== undefined) {
      router.push(redirectAfter);
    } else {
      router.refresh();
    }
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-2 flex-wrap">
        <p className="text-white/70 text-xs">
          Delete <span className="text-white font-medium">{registrantName}</span>&apos;s registration for{" "}
          <span className="text-white font-medium">{eventTitle}</span>? This cannot be undone.
        </p>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            type="button"
            size="sm"
            onClick={() => void handleDelete()}
            disabled={loading}
            className="h-6 px-2 text-xs bg-red-600/80 hover:bg-red-600 text-white border-0"
          >
            {loading ? "Deleting…" : "Delete"}
          </Button>
          <button
            type="button"
            onClick={() => setConfirming(false)}
            className="text-sn-gray-medium hover:text-sn-off-white text-xs transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setConfirming(true)}
      className="text-red-400/70 hover:text-red-400 text-xs transition-colors"
    >
      Delete
    </button>
  );
}
