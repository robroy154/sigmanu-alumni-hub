"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { joinWaitlist } from "@/lib/events/waitlist-actions";

interface Props {
  eventId:       string;
  prefillName?:  string;
  prefillEmail?: string;
}

export function WaitlistForm({ eventId, prefillName = "", prefillEmail = "" }: Props) {
  const [name, setName]       = useState(prefillName);
  const [email, setEmail]     = useState(prefillEmail);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [done, setDone]       = useState(false);

  if (done) {
    return (
      <div className="bg-sn-surface rounded-xl border border-sn-gold/20 p-6 text-center space-y-2">
        <p className="text-sn-gold font-semibold">You&apos;re on the waitlist!</p>
        <p className="text-white/60 text-sm">
          We&apos;ll contact you if a spot opens up.
        </p>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const result = await joinWaitlist(eventId, { name, email });
    setLoading(false);

    if ("error" in result) {
      setError(result.error);
    } else {
      setDone(true);
    }
  }

  return (
    <div className="bg-sn-surface rounded-xl border border-white/10 p-5 space-y-4" id="waitlist">
      <div>
        <h3 className="text-sn-off-white font-semibold">Join the Waitlist</h3>
        <p className="text-white/50 text-sm mt-0.5">
          This event is at capacity. Join the waitlist and we&apos;ll reach out if a spot opens.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          placeholder="Your name"
          className="w-full rounded-lg bg-sn-gray-dark border border-white/10 text-white text-sm px-3 py-2 focus:outline-none focus:border-sn-gold/50 placeholder:text-white/30"
        />
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder="Email address"
          className="w-full rounded-lg bg-sn-gray-dark border border-white/10 text-white text-sm px-3 py-2 focus:outline-none focus:border-sn-gold/50 placeholder:text-white/30"
        />

        {error !== null && (
          <p className="text-red-400 text-sm">{error}</p>
        )}

        <Button
          type="submit"
          disabled={loading}
          className="bg-sn-gold text-sn-black hover:bg-sn-gold-light font-semibold"
        >
          {loading ? "Joining…" : "Join Waitlist"}
        </Button>
      </form>
    </div>
  );
}
