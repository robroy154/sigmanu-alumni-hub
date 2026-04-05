"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { setPinNumber } from "@/lib/profile/actions";
import { SetPinSchema, type SetPinInput } from "@/lib/profile/schemas";

export function SetPinForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<SetPinInput>({
    resolver: zodResolver(SetPinSchema),
  });

  async function onSubmit(data: SetPinInput) {
    setServerError(null);
    const result = await setPinNumber(data);

    if ("error" in result) {
      setServerError(result.error);
      return;
    }

    setConfirmed(true);
    router.refresh();
  }

  if (confirmed) {
    return (
      <p className="text-green-400 text-sm bg-green-400/10 border border-green-400/20 rounded-md px-3 py-2">
        Pin number <strong>{getValues("pin_number")}</strong> has been set. It
        cannot be changed without contacting an admin.
      </p>
    );
  }

  return (
    <div className="rounded-lg border border-sn-gold/20 bg-white/5 p-4 space-y-3">
      <div className="space-y-1">
        <p className="text-white text-sm font-medium">Set your pin number</p>
        <p className="text-white/50 text-xs leading-relaxed">
          This is your permanent fraternity identifier. Choose carefully — it
          cannot be changed without contacting an admin.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3" noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="pin_number" className="text-white/80 text-sm">
            Pin number
          </Label>
          <Input
            id="pin_number"
            type="text"
            placeholder="e.g. 1042"
            className="bg-white/10 border-white/20 text-white placeholder:text-white/30 focus-visible:border-sn-gold"
            {...register("pin_number")}
            aria-invalid={errors.pin_number !== undefined}
          />
          {errors.pin_number !== undefined && (
            <p className="text-red-400 text-xs">{errors.pin_number.message}</p>
          )}
        </div>

        {serverError !== null && (
          <p className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-md px-3 py-2">
            {serverError}
          </p>
        )}

        <Button
          type="submit"
          size="sm"
          className="bg-sn-gold text-sn-navy hover:bg-sn-gold-light font-semibold"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Setting…" : "Set pin number"}
        </Button>
      </form>
    </div>
  );
}
