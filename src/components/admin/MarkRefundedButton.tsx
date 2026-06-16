"use client";

import { useState } from "react";
import { markRegistrationRefunded, getRefundFeeDetails } from "@/lib/admin/actions";
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

interface FeeDetails {
  amountPaid:     number;
  stripeFee:      number | null;
  registrantName: string;
}

interface Props {
  registrationId: string;
  /** Overrides the trigger's className — defaults to the bordered button used on the detail page. */
  triggerClassName?: string;
}

export function MarkRefundedButton({ registrationId, triggerClassName }: Props) {
  const [phase, setPhase] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [feeLoading, setFeeLoading] = useState(false);
  const [feeDetails, setFeeDetails] = useState<FeeDetails | null>(null);

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next) {
      setFeeDetails(null);
      setFeeLoading(true);
      void getRefundFeeDetails(registrationId).then((result) => {
        setFeeDetails("error" in result ? null : result);
        setFeeLoading(false);
      });
    }
  }

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
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogTrigger className={triggerClassName ?? DEFAULT_TRIGGER_CLASSNAME}>
        Process Refund
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Process Refund?</AlertDialogTitle>
          <AlertDialogDescription render={<div className="space-y-2" />}>
            {feeLoading && (
              <div className="flex items-center gap-2 text-sn-gray-text text-sm">
                <span className="w-3.5 h-3.5 rounded-full border-2 border-sn-gold/40 border-t-sn-gold animate-spin inline-block shrink-0" />
                Loading payment details…
              </div>
            )}
            {!feeLoading && feeDetails !== null && (
              <>
                <p>
                  <strong className="text-white">${feeDetails.amountPaid.toFixed(2)}</strong> will
                  be refunded to{" "}
                  <strong className="text-white">{feeDetails.registrantName}</strong>.
                </p>
                {feeDetails.stripeFee !== null ? (
                  <p>
                    The <strong className="text-white">${feeDetails.stripeFee.toFixed(2)}</strong>{" "}
                    transaction fee from the original payment is non-refundable by Stripe and will
                    be deducted from your balance.
                  </p>
                ) : (
                  <p className="text-sn-gray-medium">
                    Fee details are unavailable for this payment.
                  </p>
                )}
                <p className="text-sn-gray-medium">This will issue the refund via Stripe immediately and cannot be undone.</p>
              </>
            )}
            {!feeLoading && feeDetails === null && (
              <p>
                Process a refund for this registration? This will immediately issue a refund via
                Stripe and cannot be undone.
              </p>
            )}
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
