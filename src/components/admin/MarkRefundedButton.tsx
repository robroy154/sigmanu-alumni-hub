"use client";

import { useState } from "react";
import { markRegistrationRefunded } from "@/lib/admin/actions";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";

const DEFAULT_TRIGGER_CLASSNAME =
  "h-7 px-3 rounded-sm border border-white/20 text-white/60 hover:text-white text-xs transition-colors";

interface Props {
  registrationId: string;
  /** Overrides the trigger's className — defaults to the bordered button used on the detail page. */
  triggerClassName?: string;
}

export function MarkRefundedButton({ registrationId, triggerClassName }: Props) {
  const [phase, setPhase] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  async function handleConfirm() {
    setOpen(false);
    setPhase("loading");
    const result = await markRegistrationRefunded(registrationId);
    if ("error" in result) {
      setErrorMsg(result.error);
      setPhase("error");
    } else {
      setPhase("done");
    }
  }

  if (phase === "done") {
    return <p className="text-sn-gray-medium text-sm">Marked as refunded.</p>;
  }

  if (phase === "error") {
    return (
      <div className="flex items-center gap-3">
        <p className="text-red-400 text-sm">{errorMsg}</p>
        <button
          type="button"
          onClick={() => setPhase("idle")}
          className="text-white/40 hover:text-white text-xs transition-colors"
        >
          Dismiss
        </button>
      </div>
    );
  }

  if (phase === "loading") {
    return <p className="text-sn-gray-medium text-sm">Saving…</p>;
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger className={triggerClassName ?? DEFAULT_TRIGGER_CLASSNAME}>
        Process Refund
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Process Refund?</AlertDialogTitle>
          <AlertDialogDescription>
            Process a refund for this registration? This will immediately issue
            a refund via Stripe and cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={() => void handleConfirm()}>
            Process Refund
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
