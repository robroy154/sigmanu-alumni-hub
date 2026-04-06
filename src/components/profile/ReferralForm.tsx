"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ReferralRow {
  id:         string;
  first_name: string;
  last_name:  string;
  email:      string;
  status:     "pending" | "completed" | "expired";
  created_at: string;
}

interface ReferralFormProps {
  initialReferrals: ReferralRow[];
}

export function ReferralForm({ initialReferrals }: ReferralFormProps) {
  const [referrals, setReferrals] = useState<ReferralRow[]>(initialReferrals);
  const [firstName, setFirstName] = useState("");
  const [lastName,  setLastName]  = useState("");
  const [email,     setEmail]     = useState("");
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState<string | null>(null);
  const [success,   setSuccess]   = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (firstName.trim() === "" || lastName.trim() === "" || email.trim() === "") {
      setError("All fields are required.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/referrals", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ first_name: firstName.trim(), last_name: lastName.trim(), email: email.trim() }),
      });

      const json = await res.json() as { success?: boolean; firstName?: string; lastName?: string; error?: string };

      if (!res.ok || json.error !== undefined) {
        setError(json.error ?? "Something went wrong. Please try again.");
        setLoading(false);
        return;
      }

      setSuccess(`Invite sent to ${json.firstName ?? firstName} ${json.lastName ?? lastName}!`);
      setFirstName("");
      setLastName("");
      setEmail("");

      // Optimistically prepend to list with a placeholder id and pending status.
      const optimistic: ReferralRow = {
        id:         crypto.randomUUID(),
        first_name: json.firstName ?? firstName,
        last_name:  json.lastName  ?? lastName,
        email:      email.trim(),
        status:     "pending",
        created_at: new Date().toISOString(),
      };
      setReferrals((prev) => [optimistic, ...prev].slice(0, 10));
    } catch {
      setError("Network error. Please try again.");
    }

    setLoading(false);
  }

  const inputClass = "bg-white/10 border-white/20 text-white placeholder:text-white/30 focus-visible:border-sn-gold h-9";
  const labelClass = "text-white/80 text-sm";

  return (
    <div className="space-y-6">
      {/* Invite form */}
      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-3" noValidate>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="invite_first" className={labelClass}>First name</Label>
            <Input
              id="invite_first"
              type="text"
              placeholder="John"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className={inputClass}
              disabled={loading}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="invite_last" className={labelClass}>Last name</Label>
            <Input
              id="invite_last"
              type="text"
              placeholder="Smith"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className={inputClass}
              disabled={loading}
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="invite_email" className={labelClass}>Email address</Label>
          <Input
            id="invite_email"
            type="email"
            placeholder="brother@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
            disabled={loading}
          />
        </div>

        {error !== null && (
          <p className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-md px-3 py-2">
            {error}
          </p>
        )}
        {success !== null && (
          <p className="text-green-400 text-sm bg-green-400/10 border border-green-400/20 rounded-md px-3 py-2">
            {success}
          </p>
        )}

        <Button
          type="submit"
          disabled={loading}
          className="w-full bg-sn-gold text-sn-black hover:bg-sn-gold-light font-semibold"
        >
          {loading ? "Sending…" : "Send Invite"}
        </Button>
      </form>

      {/* Referrals list */}
      {referrals.length === 0 ? (
        <p className="text-white/40 text-sm text-center py-2">No invites sent yet.</p>
      ) : (
        <div className="space-y-2">
          <p className="text-white/50 text-xs font-semibold uppercase tracking-wider">Sent invites</p>
          <div className="divide-y divide-white/5">
            {referrals.map((r) => (
              <div key={r.id} className="flex items-center justify-between py-2.5 gap-4">
                <div className="min-w-0">
                  <p className="text-white text-sm font-medium leading-tight">
                    {r.first_name} {r.last_name}
                  </p>
                  <p className="text-white/40 text-xs truncate">{r.email}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <StatusBadge status={r.status} />
                  <span className="text-white/30 text-xs">
                    {new Date(r.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day:   "numeric",
                      year:  "numeric",
                    })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: "pending" | "completed" | "expired" }) {
  if (status === "completed") {
    return (
      <span className="inline-flex items-center rounded-full bg-green-400/10 border border-green-400/30 px-2 py-0.5 text-xs text-green-400">
        Joined
      </span>
    );
  }
  if (status === "expired") {
    return (
      <span className="inline-flex items-center rounded-full bg-white/5 border border-white/15 px-2 py-0.5 text-xs text-white/40">
        Expired
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-sn-gold/10 border border-sn-gold/30 px-2 py-0.5 text-xs text-sn-gold">
      Pending
    </span>
  );
}
