"use client";

import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createRegistration } from "@/lib/registration/actions";
import {
  RegistrationSchema,
  TSHIRT_SIZES,
  type RegistrationInput,
} from "@/lib/registration/schemas";

interface RegistrationFormProps {
  eventId:   string;
  ticketPrice: number;
  defaultName:  string;
  defaultEmail: string;
}

export function RegistrationForm({
  eventId,
  ticketPrice,
  defaultName,
  defaultEmail,
}: RegistrationFormProps) {
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegistrationInput>({
    resolver: zodResolver(RegistrationSchema),
    defaultValues: {
      registrant_name: defaultName,
      email:           defaultEmail,
      guest_names:     [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "guest_names" as never, // useFieldArray expects object arrays; we cast below
  });

  const guestNames = watch("guest_names");
  const guestCount = guestNames?.length ?? 0;
  const totalAttendees = 1 + guestCount;
  const totalPrice = totalAttendees * ticketPrice;

  async function onSubmit(data: RegistrationInput) {
    setServerError(null);
    const result = await createRegistration(eventId, data);

    if ("error" in result) {
      setServerError(result.error);
      return;
    }

    // Free event: redirect to confirmation directly.
    if ("confirmationUrl" in result) {
      window.location.href = result.confirmationUrl;
      return;
    }

    // Paid event: redirect to Stripe Checkout.
    window.location.href = result.checkoutUrl;
  }

  const inputClass =
    "bg-white/10 border-white/20 text-white placeholder:text-white/30 focus-visible:border-sn-gold";
  const labelClass = "text-white/80 text-sm";
  const errorClass = "text-red-400 text-xs mt-0.5";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      {/* Registrant info */}
      <div className="space-y-1.5">
        <Label htmlFor="registrant_name" className={labelClass}>
          Your name
        </Label>
        <Input
          id="registrant_name"
          type="text"
          className={inputClass}
          {...register("registrant_name")}
          aria-invalid={errors.registrant_name !== undefined}
        />
        {errors.registrant_name !== undefined && (
          <p className={errorClass}>{errors.registrant_name.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="email" className={labelClass}>
          Email address
        </Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          className={inputClass}
          {...register("email")}
          aria-invalid={errors.email !== undefined}
        />
        {errors.email !== undefined && (
          <p className={errorClass}>{errors.email.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="phone" className={labelClass}>
            Phone{" "}
            <span className="text-white/40 font-normal">(optional)</span>
          </Label>
          <Input
            id="phone"
            type="tel"
            autoComplete="tel"
            placeholder="(555) 000-0000"
            className={inputClass}
            {...register("phone")}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="tshirt_size" className={labelClass}>
            T-shirt size
          </Label>
          <select
            id="tshirt_size"
            className="h-9 w-full rounded-lg border border-white/20 bg-white/10 px-3 text-sm text-white focus:outline-none focus:border-sn-gold transition-colors"
            {...register("tshirt_size")}
            aria-invalid={errors.tshirt_size !== undefined}
          >
            <option value="" className="bg-sn-navy">
              Select size
            </option>
            {TSHIRT_SIZES.map((s) => (
              <option key={s} value={s} className="bg-sn-navy">
                {s}
              </option>
            ))}
          </select>
          {errors.tshirt_size !== undefined && (
            <p className={errorClass}>{errors.tshirt_size.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="dietary_restrictions" className={labelClass}>
          Dietary restrictions{" "}
          <span className="text-white/40 font-normal">(optional)</span>
        </Label>
        <Input
          id="dietary_restrictions"
          type="text"
          placeholder="e.g. vegetarian, gluten-free"
          className={inputClass}
          {...register("dietary_restrictions")}
        />
      </div>

      {/* Additional guests */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-white/80 text-sm font-medium">
            Additional guests
          </p>
          {ticketPrice > 0 && (
            <span className="text-white/40 text-xs">
              ${ticketPrice.toFixed(2)} per person
            </span>
          )}
        </div>

        {fields.map((field, index) => (
          <div key={field.id} className="flex gap-2 items-start">
            <div className="flex-1 space-y-1">
              <Input
                type="text"
                placeholder={`Guest ${index + 1} full name`}
                className={inputClass}
                {...register(`guest_names.${index}`)}
                aria-invalid={errors.guest_names?.[index] !== undefined}
              />
              {errors.guest_names?.[index] !== undefined && (
                <p className={errorClass}>
                  {errors.guest_names[index]?.message}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => remove(index)}
              className="h-9 px-2 text-white/40 hover:text-red-400 transition-colors text-sm"
              aria-label={`Remove guest ${index + 1}`}
            >
              ✕
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={() => append("" as never)}
          className="text-sn-gold hover:text-sn-gold-light text-sm transition-colors"
        >
          + Add a guest
        </button>
      </div>

      {/* Order summary */}
      {ticketPrice > 0 && (
        <div className="rounded-lg border border-sn-gold/20 bg-sn-gold/5 p-4 space-y-2">
          <p className="text-white/70 text-xs font-semibold uppercase tracking-wider">
            Order Summary
          </p>
          <div className="flex justify-between text-sm">
            <span className="text-white/70">
              {totalAttendees} attendee{totalAttendees !== 1 ? "s" : ""} × $
              {ticketPrice.toFixed(2)}
            </span>
            <span className="text-white font-semibold">
              ${totalPrice.toFixed(2)}
            </span>
          </div>
          <p className="text-white/40 text-xs">
            You&apos;ll be redirected to Stripe to complete payment.
          </p>
        </div>
      )}

      {serverError !== null && (
        <p className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-md px-3 py-2">
          {serverError}
        </p>
      )}

      <Button
        type="submit"
        className="w-full bg-sn-gold text-sn-navy hover:bg-sn-gold-light font-semibold h-10"
        disabled={isSubmitting}
      >
        {isSubmitting
          ? "Processing…"
          : ticketPrice > 0
          ? `Continue to Payment — $${totalPrice.toFixed(2)}`
          : "Complete Registration"}
      </Button>
    </form>
  );
}
