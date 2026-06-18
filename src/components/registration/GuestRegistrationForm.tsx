"use client";

import { useRef, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createGuestRegistration } from "@/lib/registration/guestActions";
import { uploadRegistrationFile } from "@/lib/registration/upload-registration-file";
import {
  GuestRegistrationSchema,
  type GuestRegistrationInput,
} from "@/lib/registration/schemas";
import type { EventFieldRow } from "@/types/database";

interface GuestRegistrationFormProps {
  eventId:      string;
  ticketPrice:  number;
  eventFields?: EventFieldRow[];
}

// ── Shared field-input renderer ───────────────────────────────────────────────

interface FieldInputProps {
  field:    EventFieldRow;
  value:    string;
  error:    string | undefined;
  tempId:   string;
  onChange: (fieldId: string, value: string) => void;
}

function FieldInput({ field, value, error, tempId, onChange }: FieldInputProps) {
  const inputClass = "bg-white/10 border-white/20 text-white placeholder:text-white/30 focus-visible:border-sn-gold";
  const labelClass = "text-white/80 text-sm";
  const errorClass = "text-red-400 text-xs mt-0.5";

  const options: string[] =
    (field.field_options as { options?: string[] } | null)?.options ?? [];

  if (field.field_type === "short_text") {
    return (
      <div className="space-y-1.5">
        <Label className={labelClass}>
          {field.field_label}
          {field.required && <span className="text-red-400 ml-0.5">*</span>}
        </Label>
        <Input
          type="text"
          className={inputClass}
          value={value}
          onChange={(e) => onChange(field.id, e.target.value)}
        />
        {error !== undefined && <p className={errorClass}>{error}</p>}
      </div>
    );
  }

  if (field.field_type === "long_text") {
    return (
      <div className="space-y-1.5">
        <Label className={labelClass}>
          {field.field_label}
          {field.required && <span className="text-red-400 ml-0.5">*</span>}
        </Label>
        <textarea
          rows={4}
          className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-sn-gold transition-colors resize-none"
          value={value}
          onChange={(e) => onChange(field.id, e.target.value)}
        />
        {error !== undefined && <p className={errorClass}>{error}</p>}
      </div>
    );
  }

  if (field.field_type === "dropdown") {
    return (
      <div className="space-y-1.5">
        <Label className={labelClass}>
          {field.field_label}
          {field.required && <span className="text-red-400 ml-0.5">*</span>}
        </Label>
        <select
          className="h-9 w-full rounded-lg border border-white/20 bg-white/10 px-3 text-sm text-white focus:outline-none focus:border-sn-gold transition-colors"
          value={value}
          onChange={(e) => onChange(field.id, e.target.value)}
        >
          <option value="" className="bg-sn-black">Select…</option>
          {options.map((opt) => (
            <option key={opt} value={opt} className="bg-sn-black">{opt}</option>
          ))}
        </select>
        {error !== undefined && <p className={errorClass}>{error}</p>}
      </div>
    );
  }

  if (field.field_type === "checkbox") {
    return (
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id={`field-${field.id}-${tempId}`}
          className="h-4 w-4 rounded border-white/20 bg-white/10 accent-sn-gold"
          checked={value === "true"}
          onChange={(e) => onChange(field.id, e.target.checked ? "true" : "false")}
        />
        <Label htmlFor={`field-${field.id}-${tempId}`} className={labelClass}>
          {field.field_label}
          {field.required && <span className="text-red-400 ml-0.5">*</span>}
        </Label>
        {error !== undefined && <p className={errorClass}>{error}</p>}
      </div>
    );
  }

  if (field.field_type === "multi_select") {
    const selected = value !== "" ? value.split(",") : [];
    return (
      <div className="space-y-1.5">
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
                  onChange(field.id, next.join(","));
                }}
              />
              <span className="text-white/80 text-sm">{opt}</span>
            </label>
          ))}
        </div>
        {error !== undefined && <p className={errorClass}>{error}</p>}
      </div>
    );
  }

  if (field.field_type === "file_upload") {
    return (
      <div className="space-y-1.5">
        <Label className={labelClass}>
          {field.field_label}
          {field.required && <span className="text-red-400 ml-0.5">*</span>}
        </Label>
        <input
          type="file"
          className="w-full text-sm text-white/70 file:mr-3 file:rounded file:border-0 file:bg-white/10 file:px-3 file:py-1 file:text-sm file:text-white hover:file:bg-white/20 transition-colors"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file === undefined) return;
            const reader = new FileReader();
            reader.onload = async (ev) => {
              const base64 = ev.target?.result as string;
              const result = await uploadRegistrationFile(
                base64, file.type, tempId, field.id, file.name
              );
              if ("path" in result) {
                onChange(field.id, result.path);
              }
            };
            reader.readAsDataURL(file);
          }}
        />
        {value !== "" && <p className="text-white/40 text-xs">File uploaded.</p>}
        {error !== undefined && <p className={errorClass}>{error}</p>}
      </div>
    );
  }

  return null;
}

// ── Main form ─────────────────────────────────────────────────────────────────

export function GuestRegistrationForm({ eventId, ticketPrice, eventFields = [] }: GuestRegistrationFormProps) {
  const [serverError, setServerError]                 = useState<string | null>(null);
  const [isAlumnus, setIsAlumnus]                     = useState(false);
  const [fieldResponses, setFieldResponses]           = useState<Record<string, string>>({});
  const [fieldErrors, setFieldErrors]                 = useState<Record<string, string>>({});
  const [guestFieldResponses, setGuestFieldResponses] = useState<Array<Record<string, string>>>([]);
  const [guestFieldErrors, setGuestFieldErrors]       = useState<Array<Record<string, string>>>([]);
  const tempId                                        = useRef(crypto.randomUUID());

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

  const guestNames     = watch("guest_names");
  const guestCount     = guestNames?.length ?? 0;
  const totalAttendees = 1 + guestCount;
  const totalPrice     = totalAttendees * ticketPrice;

  const registrationFields = eventFields.filter((f) => f.field_scope !== "attendee");
  const attendeeFields     = eventFields.filter((f) => f.field_scope === "attendee");

  const registrantFirstName = watch("first_name");
  const registrantLastName  = watch("last_name");
  const registrantName = [registrantFirstName, registrantLastName].filter(Boolean).join(" ") || "You";

  function handleAddGuest() {
    append("" as never);
    setGuestFieldResponses((prev) => [...prev, {}]);
    setGuestFieldErrors((prev) => [...prev, {}]);
  }

  function handleRemoveGuest(index: number) {
    remove(index);
    setGuestFieldResponses((prev) => prev.filter((_, i) => i !== index));
    setGuestFieldErrors((prev) => prev.filter((_, i) => i !== index));
  }

  function setRegistrantResponse(fieldId: string, value: string) {
    setFieldResponses((p) => ({ ...p, [fieldId]: value }));
  }

  function setGuestResponse(guestIndex: number, fieldId: string, value: string) {
    setGuestFieldResponses((prev) => {
      const next = [...prev];
      next[guestIndex] = { ...(next[guestIndex] ?? {}), [fieldId]: value };
      return next;
    });
  }

  async function validateCustomFields(): Promise<boolean> {
    const errs: Record<string, string> = {};
    for (const field of registrationFields) {
      if (field.required && (fieldResponses[field.id] ?? "") === "") {
        errs[field.id] = `${field.field_label} is required.`;
      }
    }
    for (const field of attendeeFields) {
      if (field.required && (fieldResponses[field.id] ?? "") === "") {
        errs[`registrant-${field.id}`] = `${field.field_label} is required.`;
      }
    }
    setFieldErrors(errs);

    const guestErrsAll: Array<Record<string, string>> = Array.from(
      { length: guestCount },
      (_, gi) => {
        const gErrs: Record<string, string> = {};
        for (const field of attendeeFields) {
          if (field.required && (guestFieldResponses[gi]?.[field.id] ?? "") === "") {
            gErrs[field.id] = `${field.field_label} is required.`;
          }
        }
        return gErrs;
      }
    );
    setGuestFieldErrors(guestErrsAll);

    return (
      Object.keys(errs).length === 0 &&
      guestErrsAll.every((g) => Object.keys(g).length === 0)
    );
  }

  async function onSubmit(data: GuestRegistrationInput) {
    setServerError(null);
    const customValid = await validateCustomFields();
    if (!customValid) return;
    const result = await createGuestRegistration(eventId, data, fieldResponses, guestFieldResponses);

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
      {/* ── Section A: Contact info + guests ─────────────────────────────── */}

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="first_name" className={labelClass}>First name</Label>
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
          <Label htmlFor="last_name" className={labelClass}>Last name</Label>
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

      <div className="space-y-1.5">
        <Label htmlFor="email" className={labelClass}>Email address</Label>
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

      <div className="space-y-1.5">
        <Label htmlFor="phone" className={labelClass}>
          Phone{" "}<span className="text-white/40 font-normal">(optional)</span>
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

      {/* Additional guests */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-white/80 text-sm font-medium">Additional guests</p>
          {ticketPrice > 0 && (
            <span className="text-white/40 text-xs">${ticketPrice.toFixed(2)} per person</span>
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
                <p className={errorClass}>{errors.guest_names[index]?.message}</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => handleRemoveGuest(index)}
              className="h-9 px-2 text-white/40 hover:text-red-400 transition-colors text-sm"
              aria-label={`Remove guest ${index + 1}`}
            >
              ✕
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={handleAddGuest}
          className="text-sn-gold hover:text-sn-gold-light text-sm transition-colors"
        >
          + Add a guest
        </button>
      </div>

      {/* ── Section B: Registration-scoped custom fields ──────────────────── */}
      {registrationFields.length > 0 && (
        <div className="space-y-5">
          {registrationFields.map((field) => (
            <FieldInput
              key={field.id}
              field={field}
              value={fieldResponses[field.id] ?? ""}
              error={fieldErrors[field.id]}
              tempId={tempId.current}
              onChange={setRegistrantResponse}
            />
          ))}
        </div>
      )}

      {/* ── Section C: Per-attendee fields ────────────────────────────────── */}
      {attendeeFields.length > 0 && (
        <div className="space-y-4">
          <p className="text-white/60 text-xs font-semibold uppercase tracking-wider">
            Per-person details
          </p>

          {/* Registrant card */}
          <div className="border-l-2 border-sn-gold bg-sn-black rounded-lg p-4 space-y-4">
            <p className="text-white/80 text-sm font-medium">{registrantName}</p>
            {attendeeFields.map((field) => (
              <FieldInput
                key={field.id}
                field={field}
                value={fieldResponses[field.id] ?? ""}
                error={fieldErrors[`registrant-${field.id}`]}
                tempId={`${tempId.current}-registrant`}
                onChange={setRegistrantResponse}
              />
            ))}
          </div>

          {/* Guest cards */}
          {Array.from({ length: guestCount }, (_, gi) => {
            const guestName = guestNames?.[gi];
            const name = typeof guestName === "string" && guestName !== ""
              ? guestName
              : `Guest ${gi + 1}`;
            return (
              <div key={gi} className="border-l-2 border-sn-gold bg-sn-black rounded-lg p-4 space-y-4">
                <p className="text-white/80 text-sm font-medium">{name}</p>
                {attendeeFields.map((field) => (
                  <FieldInput
                    key={field.id}
                    field={field}
                    value={guestFieldResponses[gi]?.[field.id] ?? ""}
                    error={guestFieldErrors[gi]?.[field.id]}
                    tempId={`${tempId.current}-guest-${gi}`}
                    onChange={(fieldId, value) => setGuestResponse(gi, fieldId, value)}
                  />
                ))}
              </div>
            );
          })}
        </div>
      )}

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
            <span className="text-white font-semibold">${totalPrice.toFixed(2)}</span>
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
