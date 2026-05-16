"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { changeEmail } from "@/lib/auth/settings-actions";
import { toastSuccess, toastError } from "@/lib/toast";

export function ChangeEmailForm() {
  const [newEmail,         setNewEmail]         = useState("");
  const [currentPassword, setCurrentPassword]   = useState("");
  const [loading,          setLoading]          = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const result = await changeEmail(newEmail, currentPassword);
    setLoading(false);
    if ("error" in result) {
      toastError(result.error);
    } else {
      toastSuccess("Confirmation email sent. Check your new inbox to complete the change.");
      setNewEmail("");
      setCurrentPassword("");
    }
  }

  const inputClass =
    "bg-white/10 border-white/20 text-white placeholder:text-white/30 focus-visible:border-sn-gold";

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="new_email" className="text-white/80 text-sm">New email address</Label>
        <Input
          id="new_email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
          required
          className={inputClass}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="current_password_email" className="text-white/80 text-sm">Current password</Label>
        <Input
          id="current_password_email"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          required
          className={inputClass}
        />
      </div>
      <Button
        type="submit"
        disabled={loading}
        className="bg-sn-gold text-sn-black hover:bg-sn-gold-light font-semibold"
      >
        {loading ? "Sending…" : "Update Email"}
      </Button>
    </form>
  );
}
