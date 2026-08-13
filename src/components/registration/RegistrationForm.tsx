"use client";

import { useRef, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createRegistration } from "@/lib/registration/actions";
import { uploadRegistrationFile } from "@/lib/registration/upload-registration-file";
import { toastSuccess, toastError } from "@/lib/toast";
import {
  RegistrationSchema,
  type RegistrationInput,
} from "@/lib/registration/schemas";
import type { EventFieldRow } from "@/types/database";

interface RegistrationFormProps {
  eventId:         string;
  ticketPrice:     number;
  defaultName:     string;
  defaultEmail:    string;
  eventFields?:    EventFieldRow[];
  capacity?:       number | null;
  capacityMode?:   string;
  registeredCount?: number;
  shareUrl?:       string;
}

// ── Shared field-input renderer ───────────────────────────────────────────────
// Used for both Section B (order-scoped) and Section C (per-attendee cards).

interface FieldInputProps {
  field:     EventFieldRow;
  value:     string;
  error:     string | undefined;
  tempId:    string;
  onChange:  (fieldId: string, value: string) => void;
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

export function RegistrationForm({
  eventId,
  ticketPrice,
  defaultName,
  defaultEmail,
  eventFields = [],
  capacity = null,
  capacityMode = "unlimited",
  registeredCount = 0,
  shareUrl = "",
}: RegistrationFormProps) {
  const [serverError, setServerError]             = useState<string | null>(null);
  // Responses keyed by fieldId — covers both registration-scoped fields and
  // the primary registrant's attendee-scoped fields (stored in event_field_responses).
  const [fieldResponses, setFieldResponses]       = useState<Record<string, string>>({});
  const [fieldErrors, setFieldErrors]             = useState<Record<string, string>>({});
  // Per-guest attendee-scoped responses: index 0 = first guest, etc.
  const [guestFieldResponses, setGuestFieldResponses] = useState<Array<Record<string, string>>>([]);
  const [guestFieldErrors, setGuestFieldErrors]   = useState<Array<Record<string, string>>>([]);
  const tempId                                    = useRef(crypto.randomUUID());

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
    name: "guest_names" as never,
  });

  const guestNames     = watch("guest_names");
  const guestCount     = guestNames?.length ?? 0;
  const totalAttendees = 1 + guestCount;
  const totalPrice     = totalAttendees * ticketPrice;

  const capacityLimited = (capacityMode === "capped" || capacityMode === "waitlist") && capacity !== null;
  const remainingSpots  = capacityLimited ? Math.max(0, (capacity as number) - registeredCount) : null;
  const atCapacity      = remainingSpots !== null && totalAttendees >= remainingSpots;

  // Derived field sets
  const registrationFields = eventFields.filter((f) => f.field_scope !== "attendee");
  const attendeeFields     = eventFields.filter((f) => f.field_scope === "attendee");

  function handleAddGuest() {
    if (atCapacity) return;
    append("" as never);
    setGuestFieldResponses((prev) => [...prev, {}]);
    setGuestFieldErrors((prev) => [...prev, {}]);
  }

  function handleShare() {
    if (shareUrl === "") return;
    if (typeof navigator.share === "function") {
      navigator.share({ url: shareUrl }).catch(() => {});
      return;
    }
    void navigator.clipboard.writeText(shareUrl).then(() => {
      toastSuccess("Link copied!");
    }).catch(() => {
      toastError("Could not copy link.");
    });
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
    // Validate registration-scoped fields
    for (const field of registrationFields) {
      if (field.required && (fieldResponses[field.id] ?? "") === "") {
        errs[field.id] = `${field.field_label} is required.`;
      }
    }
    // Validate registrant's attendee-scoped fields
    for (const field of attendeeFields) {
      if (field.required && (fieldResponses[field.id] ?? "") === "") {
        errs[`registrant-${field.id}`] = `${field.field_label} is required.`;
      }
    }
    setFieldErrors(errs);

    // Validate guest attendee-scoped fields
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

    const anyFieldError = Object.keys(errs).length > 0;
    const anyGuestError = guestErrsAll.some((g) => Object.keys(g).length > 0);
    return !anyFieldError && !anyGuestError;
  }

  async function onSubmit(data: RegistrationInput) {
    setServerError(null);
    const customValid = await validateCustomFields();
    if (!customValid) return;

    const result = await createRegistration(eventId, data, fieldResponses, guestFieldResponses);

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
  const readOnlyClass = "bg-white/5 border-white/10 text-white/50 cursor-default focus-visible:border-white/10";
  const labelClass  = "text-white/80 text-sm";
  const errorClass  = "text-red-400 text-xs mt-0.5";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="lg:flex lg:gap-6 lg:items-start" noValidate>
    <div className="flex-1 space-y-5 pb-32 lg:pb-0">
      {/* ── Section A: Contact info + guests ─────────────────────────────── */}

      {/* Registrant info — read-only, sourced from member profile */}
      <div className="space-y-1.5">
        <Label htmlFor="registrant_name" className={labelClass}>
          Your name
        </Label>
        <Input
          id="registrant_name"
          type="text"
          readOnly
          className={readOnlyClass}
          {...register("registrant_name")}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="email" className={labelClass}>
          Email address
        </Label>
        <Input
          id="email"
          type="email"
          readOnly
          className={readOnlyClass}
          {...register("email")}
        />
      </div>

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

      {/* Guests card */}
      <div className="bg-sn-surface border border-white/8 rounded-[14px] p-3.5 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-white/80 text-sm font-medium">Guests</p>
          <div className="flex items-center gap-2.75 bg-sn-black-secondary rounded-full px-1.5 py-1">
            <button
              type="button"
              onClick={() => handleRemoveGuest(guestCount - 1)}
              disabled={guestCount === 0}
              aria-label="Remove a guest"
              className="w-7 h-7 rounded-full bg-[#232326] text-white flex items-center justify-center disabled:opacity-30 transition-opacity"
            >
              −
            </button>
            <span className="text-white font-semibold text-sm min-w-3 text-center">{guestCount}</span>
            <button
              type="button"
              onClick={handleAddGuest}
              disabled={atCapacity}
              aria-label="Add a guest"
              className="w-7 h-7 rounded-full bg-sn-gold text-sn-black-secondary flex items-center justify-center disabled:opacity-30 transition-opacity"
            >
              +
            </button>
          </div>
        </div>

        {atCapacity && remainingSpots !== null && (
          <p className="text-amber-400 text-xs">
            Only {Math.max(0, remainingSpots)} spot{remainingSpots === 1 ? "" : "s"} left for this event.
          </p>
        )}

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
              onClick={() => handleRemoveGuest(index)}
              className="h-9 px-2 text-white/40 hover:text-red-400 transition-colors text-sm"
              aria-label={`Remove guest ${index + 1}`}
            >
              ✕
            </button>
          </div>
        ))}

        {ticketPrice > 0 && (
          <div className="flex justify-between text-sm pt-2 border-t border-white/7">
            <span className="text-white/60">
              {totalAttendees} × ${ticketPrice.toFixed(2)}
            </span>
            <span className="text-sn-gold-light font-semibold">${totalPrice.toFixed(2)}</span>
          </div>
        )}
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
            <p className="text-white/80 text-sm font-medium">
              {defaultName || "You"}
            </p>
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

      {ticketPrice > 0 && (
        <p className="text-white/40 text-xs">
          You&apos;ll be redirected to Stripe to complete payment.
        </p>
      )}

      {serverError !== null && (
        <p className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-md px-3 py-2">
          {serverError}
        </p>
      )}
    </div>

    {/* Sticky action bar — fixed to viewport bottom on phone, docked in the
        right column (sticky within the flex row) at lg+ per the design spec. */}
    <div
      className="fixed bottom-0 inset-x-0 z-40 bg-sn-rail border-t border-white/8 px-4 pt-2.75 flex gap-2.25 items-center lg:sticky lg:bg-transparent lg:border-0 lg:p-0 lg:top-24 lg:w-72 lg:flex-col lg:items-stretch lg:gap-3"
      style={{ paddingBottom: "calc(11px + env(safe-area-inset-bottom))" }}
    >
      <Button
        type="submit"
        disabled={isSubmitting || atCapacity}
        className="flex-1 lg:w-full bg-sn-gold text-sn-black hover:bg-sn-gold-light font-semibold h-11 lg:h-10 rounded-[11px] lg:rounded-lg"
      >
        {isSubmitting && (
          <span className="w-3.5 h-3.5 rounded-full border-2 border-sn-black/40 border-t-sn-black animate-spin inline-block mr-2" />
        )}
        {isSubmitting
          ? "Processing…"
          : ticketPrice > 0
          ? `Register · $${totalPrice.toFixed(2)}`
          : "Complete Registration"}
      </Button>
      <button
        type="button"
        onClick={handleShare}
        aria-label="Share this event"
        className="w-11 h-11 lg:w-full lg:h-10 rounded-[11px] lg:rounded-lg border border-white/14 flex items-center justify-center lg:justify-center gap-2 text-white shrink-0 hover:bg-white/5 transition-colors"
      >
        <Share2 size={17} />
        <span className="hidden lg:inline text-sm font-medium">Share</span>
      </button>
    </div>
    </form>
  );
}
