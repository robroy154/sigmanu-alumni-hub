"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteRegistration } from "@/lib/admin/actions";
import { toastError } from "@/lib/toast";
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

interface DeleteRegistrationButtonProps {
  registrationId: string;
  registrantName: string;
  eventTitle:     string;
  /** Deletion is only permitted for unpaid registrations — paid/refunded rows must go through the refund flow instead. */
  paymentStatus:  string;
  /** If provided, router.push(redirectAfter) after successful delete. Otherwise router.refresh(). */
  redirectAfter?: string;
  /** Show an explanatory note instead of rendering nothing when paymentStatus !== "unpaid". */
  showStatusNote?: boolean;
}

export function DeleteRegistrationButton({
  registrationId,
  registrantName,
  eventTitle,
  paymentStatus,
  redirectAfter,
  showStatusNote = false,
}: DeleteRegistrationButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    setOpen(false);
    setLoading(true);
    const result = await deleteRegistration(registrationId);
    if ("error" in result) {
      toastError(result.error);
      setLoading(false);
    } else if (redirectAfter !== undefined) {
      router.push(redirectAfter);
    } else {
      router.refresh();
    }
  }

  if (paymentStatus !== "unpaid") {
    if (!showStatusNote) return null;
    return (
      <p className="text-white/30 text-xs">
        Delete unavailable — registration is {paymentStatus}.
      </p>
    );
  }

  if (loading) {
    return <span className="text-white/40 text-xs">Deleting…</span>;
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger className="text-red-400/70 hover:text-red-400 text-xs transition-colors">
        Delete
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this registration?</AlertDialogTitle>
          <AlertDialogDescription>
            Delete <strong className="text-white">{registrantName}</strong>&apos;s registration
            for <strong className="text-white">{eventTitle}</strong>? This cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={() => void handleDelete()}>Delete</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
