"use client";

import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRef } from "react";
import { createGuestRegistration } from "@/lib/registration/guestActions";
import { uploadRegistrationFile } from "@/lib/registration/upload-registration-file";
import {
  GuestRegistrationSchema,
  TSHIRT_SIZES,
  type GuestRegistrationInput,
} from "@/lib/registration/schemas";
import type { EventFieldRow } from "@/types/database";

interface GuestRegistrationFormProps {
  eventId:      string;
  ticketPrice:  number;
  eventFields?: EventFieldRow[];
}

export function GuestRegistrationForm({ eventId, ticketPrice, eventFields = [] }: GuestRegistrationFormProps) {
  const [serverError, setServerError]       = useState<string | null>(null);
  const [isAlumnus, setIsAlumnus]           = useState(false);
  const [fieldResponses, setFieldResponses] = useState<Record<string, string>>({});
  const [fieldErrors, setFieldErrors]       = useState<Record<string, string>>({});
  const tempId                              = useRef(crypto.randomUUID());

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<GuestRegistrationInput>({
    resolver: zodResolver(GuestRegistrationSchema),
    defaultValues: { guest_names: [] },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "guest_names" as never,
  });

  const guestNames    = watch("guest_names");
  const guestCount    = guestNames?.length ?? 0;
  const totalAttendees = 1 + guestCount;
  const totalPrice    = totalAttendees * ticketPrice;

  async function validateCustomFields(): Promise<boolean> {
    const errs: Record<string, string> = {};
    for (const field of eventFields) {
      if (field.required && (fieldResponses[field.id] ?? "") === "") {
        errs[field.id] = `${field.field_label} is required.`;
      }
    }
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleFileUpload(fieldId: string, file: File): Promise<void> {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target?.result as string;
      const result = await uploadRegistrationFile(
        base64, file.type, tempId.current, fieldId, file.name
      );
      if ("path" in result) {
        setFieldResponses((prev) => ({ ...prev, [fieldId]: result.path }));
      }
    };
    reader.readAsDataURL(file);
  }

  async function onSubmit(data: GuestRegistrationInput) {
    setServerError(null);
    const customValid = await validateCustomFields();
    if (!customValid) return;
    const result = await createGuestRegistration(eventId, data, fieldResponses);

    if ("error" in result) {
      setServerError(result.error);
      return;
    }

    if ("confirmationUrl" in result) {
      window.location.href = result.confirmationUrl;
      return;
    }

    window.location.href = result.checkoutUrl;
  }

  const inputClass  = "bg-white/10 border-white/20 text-white placeholder:text-white/30 focus-visible:border-sn-gold";
  const labelClass  = "text-white/80 text-sm";
  const errorClass  = "text-red-400 text-xs mt-0.5";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      {/* Name — two columns */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="first_name" className={labelClass}>
            First name
          </Label>
          <Input
            id="first_name"
            type="text"
            autoComplete="given-name"
            placeholder="John"
            className={inputClass}
            {...register("first_name")}
            aria-invalid={errors.first_name !== undefined}
          />
          {errors.first_name !== undefined && (
            <p className={errorClass}>{errors.first_name.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="last_name" className={labelClass}>
            Last name
          </Label>
          <Input
            id="last_name"
            type="text"
            autoComplete="family-name"
            placeholder="Smith"
            className={inputClass}
            {...register("last_name")}
            aria-invalid={errors.last_name !== undefined}
          />
          {errors.last_name !== undefined && (
            <p className={errorClass}>{errors.last_name.message}</p>
          )}
        </div>
      </div>

      {/* Email */}
      <div className="space-y-1.5">
        <Label htmlFor="email" className={labelClass}>
          Email address
        </Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          className={inputClass}
          {...register("email")}
          aria-invalid={errors.email !== undefined}
        />
        {errors.email !== undefined && (
          <p className={errorClass}>{errors.email.message}</p>
        )}
      </div>

      {/* Phone + T-shirt */}
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
            <option value="" className="bg-sn-black">
              Select size
            </option>
            {TSHIRT_SIZES.map((s) => (
              <option key={s} value={s} className="bg-sn-black">
                {s}
              </option>
            ))}
          </select>
          {errors.tshirt_size !== undefined && (
            <p className={errorClass}>{errors.tshirt_size.message}</p>
          )}
        </div>
      </div>

      {/* Dietary restrictions */}
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

      {/* Custom event fields */}
      {eventFields.length > 0 && eventFields.map((field) => {
        const options: string[] =
          (field.field_options as { options?: string[] } | null)?.options ?? [];
        const val = fieldResponses[field.id] ?? "";
        const err = fieldErrors[field.id];

        if (field.field_type === "short_text") {
          return (
            <div key={field.id} className="space-y-1.5">
              <Label className={labelClass}>
                {field.field_label}
                {field.required && <span className="text-red-400 ml-0.5">*</span>}
              </Label>
              <Input
                type="text"
                className={inputClass}
                value={val}
                onChange={(e) =>
                  setFieldResponses((p) => ({ ...p, [field.id]: e.target.value }))
                }
              />
              {err !== undefined && <p className={errorClass}>{err}</p>}
            </div>
          );
        }

        if (field.field_type === "long_text") {
          return (
            <div key={field.id} className="space-y-1.5">
              <Label className={labelClass}>
                {field.field_label}
                {field.required && <span className="text-red-400 ml-0.5">*</span>}
              </Label>
              <textarea
                rows={4}
                className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-sn-gold transition-colors resize-none"
                value={val}
                onChange={(e) =>
                  setFieldResponses((p) => ({ ...p, [field.id]: e.target.value }))
                }
              />
              {err !== undefined && <p className={errorClass}>{err}</p>}
            </div>
          );
        }

        if (field.field_type === "dropdown") {
          return (
            <div key={field.id} className="space-y-1.5">
              <Label className={labelClass}>
                {field.field_label}
                {field.required && <span className="text-red-400 ml-0.5">*</span>}
              </Label>
              <select
                className="h-9 w-full rounded-lg border border-white/20 bg-white/10 px-3 text-sm text-white focus:outline-none focus:border-sn-gold transition-colors"
                value={val}
                onChange={(e) =>
                  setFieldResponses((p) => ({ ...p, [field.id]: e.target.value }))
                }
              >
                <option value="" className="bg-sn-black">Select…</option>
                {options.map((opt) => (
                  <option key={opt} value={opt} className="bg-sn-black">{opt}</option>
                ))}
              </select>
              {err !== undefined && <p className={errorClass}>{err}</p>}
            </div>
          );
        }

        if (field.field_type === "checkbox") {
          return (
            <div key={field.id} className="flex items-center gap-2">
              <input
                type="checkbox"
                id={`field-${field.id}`}
                className="h-4 w-4 rounded border-white/20 bg-white/10 accent-sn-gold"
                checked={val === "true"}
                onChange={(e) =>
                  setFieldResponses((p) => ({
                    ...p,
                    [field.id]: e.target.checked ? "true" : "false",
                  }))
                }
              />
              <Label htmlFor={`field-${field.id}`} className={labelClass}>
                {field.field_label}
                {field.required && <span className="text-red-400 ml-0.5">*</span>}
              </Label>
              {err !== undefined && <p className={errorClass}>{err}</p>}
            </div>
          );
        }

        if (field.field_type === "multi_select") {
          const selected = val !== "" ? val.split(",") : [];
          return (
            <div key={field.id} className="space-y-1.5">
              <Label className={labelClass}>
                {field.field_label}
                {field.required && <span className="text-red-400 ml-0.5">*</span>}
              </Label>
              <div className="space-y-1.5">
                {options.map((opt) => (
                  <label key={opt} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-white/20 bg-white/10 accent-sn-gold"
                      checked={selected.includes(opt)}
                      onChange={(e) => {
                        const next = e.target.checked
                          ? [...selected, opt]
                          : selected.filter((s) => s !== opt);
                        setFieldResponses((p) => ({
                          ...p,
                          [field.id]: next.join(","),
                        }));
                      }}
                    />
                    <span className="text-white/80 text-sm">{opt}</span>
                  </label>
                ))}
              </div>
              {err !== undefined && <p className={errorClass}>{err}</p>}
            </div>
          );
        }

        if (field.field_type === "file_upload") {
          return (
            <div key={field.id} className="space-y-1.5">
              <Label className={labelClass}>
                {field.field_label}
                {field.required && <span className="text-red-400 ml-0.5">*</span>}
              </Label>
              <input
                type="file"
                className="w-full text-sm text-white/70 file:mr-3 file:rounded file:border-0 file:bg-white/10 file:px-3 file:py-1 file:text-sm file:text-white hover:file:bg-white/20 transition-colors"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file !== undefined) {
                    void handleFileUpload(field.id, file);
                  }
                }}
              />
              {val !== "" && (
                <p className="text-white/40 text-xs">File uploaded.</p>
              )}
              {err !== undefined && <p className={errorClass}>{err}</p>}
            </div>
          );
        }

        return null;
      })}

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

      {/* Alumni checkbox */}
      <div className="space-y-2">
        <label className="flex items-center gap-3 cursor-pointer group">
          <input
            type="checkbox"
            checked={isAlumnus}
            onChange={(e) => setIsAlumnus(e.target.checked)}
            className="w-4 h-4 rounded border-white/30 bg-white/10 accent-sn-gold cursor-pointer"
          />
          <span className="text-white/70 text-sm group-hover:text-white/90 transition-colors">
            I am a Mu Xi alumnus
          </span>
        </label>
        {isAlumnus && (
          <p className="text-amber-300 text-xs bg-amber-400/10 border border-amber-400/20 rounded-md px-3 py-2 ml-7">
            Create your account after registering to access the alumni hub.
          </p>
        )}
      </div>

      {serverError !== null && (
        <p className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-md px-3 py-2">
          {serverError}
        </p>
      )}

      <Button
        type="submit"
        className="w-full bg-sn-gold text-sn-black hover:bg-sn-gold-light font-semibold h-10"
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
