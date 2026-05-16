"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { changePassword } from "@/lib/auth/settings-actions";
import { toastSuccess, toastError } from "@/lib/toast";

export function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword,     setNewPassword]     = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading,         setLoading]         = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toastError("New passwords do not match.");
      return;
    }
    if (newPassword.length < 8) {
      toastError("Password must be at least 8 characters.");
      return;
    }
    setLoading(true);
    const result = await changePassword(currentPassword, newPassword);
    setLoading(false);
    if ("error" in result) {
      toastError(result.error);
    } else {
      toastSuccess("Password updated successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }
  }

  const inputClass =
    "bg-white/10 border-white/20 text-white placeholder:text-white/30 focus-visible:border-sn-gold";

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="current_password" className="text-white/80 text-sm">Current password</Label>
        <Input
          id="current_password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          required
          className={inputClass}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="new_password" className="text-white/80 text-sm">New password</Label>
        <Input
          id="new_password"
          type="password"
          autoComplete="new-password"
          placeholder="At least 8 characters"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
          className={inputClass}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="confirm_password" className="text-white/80 text-sm">Confirm new password</Label>
        <Input
          id="confirm_password"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          className={inputClass}
        />
      </div>
      <Button
        type="submit"
        disabled={loading}
        className="bg-sn-gold text-sn-black hover:bg-sn-gold-light font-semibold"
      >
        {loading ? "Saving…" : "Update Password"}
      </Button>
    </form>
  );
}
