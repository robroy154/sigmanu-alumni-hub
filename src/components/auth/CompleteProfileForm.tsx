"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { completeProfile } from "@/lib/auth/actions";
import { CompleteProfileSchema, type CompleteProfileInput } from "@/lib/auth/schemas";
import { PLEDGE_CLASSES } from "@/lib/utils/pledge-classes";

export function CompleteProfileForm() {
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CompleteProfileInput>({
    resolver: zodResolver(CompleteProfileSchema),
  });

  async function onSubmit(data: CompleteProfileInput) {
    setServerError(null);
    const result = await completeProfile(data);
    if (result !== undefined && "error" in result) {
      setServerError(result.error);
    }
    // On success, completeProfile redirects — no further handling needed
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="first_name" className="text-white/80 text-sm">
            First name
          </Label>
          <Input
            id="first_name"
            type="text"
            autoComplete="given-name"
            placeholder="John"
            className="bg-white/10 border-white/20 text-white placeholder:text-white/30 focus-visible:border-sn-gold"
            {...register("first_name")}
            aria-invalid={errors.first_name !== undefined}
          />
          {errors.first_name !== undefined && (
            <p className="text-red-400 text-xs">{errors.first_name.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="last_name" className="text-white/80 text-sm">
            Last name
          </Label>
          <Input
            id="last_name"
            type="text"
            autoComplete="family-name"
            placeholder="Smith"
            className="bg-white/10 border-white/20 text-white placeholder:text-white/30 focus-visible:border-sn-gold"
            {...register("last_name")}
            aria-invalid={errors.last_name !== undefined}
          />
          {errors.last_name !== undefined && (
            <p className="text-red-400 text-xs">{errors.last_name.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="pledge_class" className="text-white/80 text-sm">
          Pledge class{" "}
          <span className="text-white/40 font-normal">(optional)</span>
        </Label>
        <select
          id="pledge_class"
          className="h-8 w-full rounded-lg border border-white/20 bg-white/10 px-2.5 py-1 text-sm text-white focus:outline-none focus:border-sn-gold"
          {...register("pledge_class")}
        >
          <option value="" className="bg-sn-black">
            Select your pledge class
          </option>
          {PLEDGE_CLASSES.map((pc) => (
            <option key={pc} value={pc} className="bg-sn-black">
              {pc}
            </option>
          ))}
        </select>
      </div>

      {serverError !== null && (
        <p className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-md px-3 py-2">
          {serverError}
        </p>
      )}

      <Button
        type="submit"
        className="w-full bg-sn-gold text-sn-black hover:bg-sn-gold-light font-semibold"
        disabled={isSubmitting}
      >
        {isSubmitting ? "Saving…" : "Save and continue"}
      </Button>
    </form>
  );
}
