"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { claimStubForExistingUser } from "@/lib/auth/stub-search";
import { toastError } from "@/lib/toast";

interface ClaimStubButtonProps {
  stubId: string;
  next:   string;
}

export function ClaimStubButton({ stubId, next }: ClaimStubButtonProps) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  async function handleClaim() {
    setIsPending(true);
    const result = await claimStubForExistingUser(stubId);
    if ("error" in result) {
      toastError(result.error);
      setIsPending(false);
      return;
    }
    router.push(next);
  }

  return (
    <Button
      onClick={() => void handleClaim()}
      disabled={isPending}
      className="w-full bg-sn-gold text-sn-black hover:bg-sn-gold-light font-semibold h-10"
    >
      {isPending ? "Claiming…" : "Yes, this is me"}
    </Button>
  );
}
