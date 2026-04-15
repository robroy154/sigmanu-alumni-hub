"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface GuestSignupCTAProps {
  registrantName: string;
  email:          string;
  phone:          string | undefined;
}

export function GuestSignupCTA({ registrantName, email, phone }: GuestSignupCTAProps) {
  const router = useRouter();

  function handleCreateAccount() {
    // Split registrantName into first/last on the first space.
    const spaceIndex = registrantName.indexOf(" ");
    const firstName  = spaceIndex === -1 ? registrantName : registrantName.slice(0, spaceIndex);
    const lastName   = spaceIndex === -1 ? "" : registrantName.slice(spaceIndex + 1);

    const prefill = {
      first_name: firstName,
      last_name:  lastName,
      email,
      phone,
    };

    sessionStorage.setItem("guest_prefill", JSON.stringify(prefill));
    router.push("/signup");
  }

  return (
    <div className="bg-sn-black rounded-xl border border-sn-gold/20 p-6 space-y-3">
      <h3 className="text-white font-semibold">Are you a Mu Xi alumnus?</h3>
      <p className="text-white/60 text-sm leading-relaxed">
        Join the alumni hub to access the brother directory, family tree, and future events.
      </p>
      <Button
        type="button"
        onClick={handleCreateAccount}
        className="bg-sn-gold text-sn-black hover:bg-sn-gold-light font-semibold"
      >
        Create Your Account
      </Button>
    </div>
  );
}
