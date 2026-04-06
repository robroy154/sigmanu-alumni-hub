"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface ConfirmationStatusProps {
  registrationId: string;
  initialIsPaid:  boolean;
}

export function ConfirmationStatus({
  registrationId,
  initialIsPaid,
}: ConfirmationStatusProps) {
  const [isPaid, setIsPaid] = useState(initialIsPaid);

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`confirmation-${registrationId}`)
      .on(
        "postgres_changes",
        {
          event:  "UPDATE",
          schema: "public",
          table:  "registrations",
          filter: `id=eq.${registrationId}`,
        },
        (payload) => {
          const newStatus = (payload.new as { payment_status: string }).payment_status;
          setIsPaid(newStatus === "paid");
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [registrationId]);

  if (isPaid) {
    return (
      <div className="rounded-sm bg-green-500/10 border border-green-500/30 p-6 text-center space-y-2">
        <div className="text-green-400 text-3xl">✓</div>
        <h1 className="text-sn-off-white text-xl font-bold">You&apos;re registered!</h1>
        <p className="text-sn-gray-text text-sm">
          Payment confirmed. We&apos;ll see you there, brother.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-sm bg-amber-500/10 border border-amber-500/30 p-6 text-center space-y-2">
      <div className="text-amber-400 text-3xl">⏳</div>
      <h1 className="text-sn-off-white text-xl font-bold">Payment Processing</h1>
      <p className="text-sn-gray-text text-sm">
        Your registration is saved. Payment confirmation may take a moment
        to arrive — this page will update automatically.
      </p>
    </div>
  );
}
