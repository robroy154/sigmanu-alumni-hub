"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateProfile } from "@/lib/profile/actions";
import { ProfileUpdateSchema, type ProfileUpdateInput } from "@/lib/profile/schemas";
import { PLEDGE_CLASSES } from "@/lib/utils/pledge-classes";
import { AddressAutocomplete } from "@/components/profile/AddressAutocomplete";

interface ProfileEditFormProps {
  defaultValues: ProfileUpdateInput;
}

export function ProfileEditForm({ defaultValues }: ProfileEditFormProps) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [saved, setSaved]             = useState(false);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ProfileUpdateInput>({
    resolver: zodResolver(ProfileUpdateSchema),
    defaultValues,
  });

  async function onSubmit(data: ProfileUpdateInput) {
    setServerError(null);
    setSaved(false);
    const result = await updateProfile(data);
    if ("error" in result) {
      setServerError(result.error);
      return;
    }
    setSaved(true);
    router.refresh();
  }

  const fieldClass =
    "h-9 w-full rounded-lg border border-white/20 bg-white/10 px-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-sn-gold transition-colors";
  const labelClass = "text-white/80 text-sm";
  const optLabel   = <span className="text-white/40 font-normal">(optional)</span>;

  const showAddress  = watch("show_address")  ?? defaultValues.show_address  ?? true;
  const showBirthday = watch("show_birthday") ?? defaultValues.show_birthday ?? true;
  const showPhone    = watch("show_phone")    ?? defaultValues.show_phone    ?? true;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>

      {/* ── Name ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="first_name" className={labelClass}>First name</Label>
          <Input id="first_name" type="text" autoComplete="given-name"
            className="bg-white/10 border-white/20 text-white placeholder:text-white/30 focus-visible:border-sn-gold"
            {...register("first_name")} aria-invalid={errors.first_name !== undefined} />
          {errors.first_name !== undefined && (
            <p className="text-red-400 text-xs mt-0.5">{errors.first_name.message}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="last_name" className={labelClass}>Last name</Label>
          <Input id="last_name" type="text" autoComplete="family-name"
            className="bg-white/10 border-white/20 text-white placeholder:text-white/30 focus-visible:border-sn-gold"
            {...register("last_name")} aria-invalid={errors.last_name !== undefined} />
          {errors.last_name !== undefined && (
            <p className="text-red-400 text-xs mt-0.5">{errors.last_name.message}</p>
          )}
        </div>
      </div>

      {/* ── Nickname ─────────────────────────────────────────────── */}
      <div className="space-y-1.5">
        <Label htmlFor="nickname" className={labelClass}>Fraternity nickname {optLabel}</Label>
        <Input id="nickname" type="text" placeholder="e.g. Spike"
          className="bg-white/10 border-white/20 text-white placeholder:text-white/30 focus-visible:border-sn-gold"
          {...register("nickname")} />
      </div>

      {/* ── Pledge class ─────────────────────────────────────────── */}
      <div className="space-y-1.5">
        <Label htmlFor="pledge_class" className={labelClass}>Pledge class {optLabel}</Label>
        <select id="pledge_class" className={fieldClass} {...register("pledge_class")}>
          <option value="" className="bg-sn-black">Select your pledge class</option>
          {PLEDGE_CLASSES.map((pc) => (
            <option key={pc} value={pc} className="bg-sn-black">{pc}</option>
          ))}
        </select>
      </div>

      {/* ── Phone ────────────────────────────────────────────────── */}
      <div className="space-y-1.5">
        <Label htmlFor="phone" className={labelClass}>Phone {optLabel}</Label>
        <Input id="phone" type="tel" autoComplete="tel" placeholder="(555) 000-0000"
          className="bg-white/10 border-white/20 text-white placeholder:text-white/30 focus-visible:border-sn-gold"
          {...register("phone")} />
      </div>

      {/* ── Birthday ─────────────────────────────────────────────── */}
      <div className="space-y-1.5">
        <Label htmlFor="birthday" className={labelClass}>Birthday {optLabel}</Label>
        <Input id="birthday" type="date"
          className="bg-white/10 border-white/20 text-white focus-visible:border-sn-gold scheme-dark"
          {...register("birthday")} />
      </div>

      {/* ── Address ──────────────────────────────────────────────── */}
      <div className="space-y-3">
        <p className="text-white/70 text-xs font-semibold uppercase tracking-wider">Address {optLabel}</p>

        {/* Street address with Google Places autocomplete */}
        <div className="space-y-1.5">
          <Label htmlFor="street_address" className={labelClass}>Street address</Label>
          <Controller
            name="street_address"
            control={control}
            render={({ field }) => (
              <AddressAutocomplete
                id="street_address"
                value={field.value ?? ""}
                onChange={field.onChange}
                onPlaceSelect={(parts) => {
                  field.onChange(parts.street);
                  setValue("city",    parts.city,    { shouldDirty: true });
                  setValue("state",   parts.state,   { shouldDirty: true });
                  setValue("zip",     parts.zip,     { shouldDirty: true });
                  setValue("country", parts.country, { shouldDirty: true });
                }}
                className={fieldClass}
                placeholder="123 Main St"
              />
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="city" className={labelClass}>City</Label>
            <Input id="city" type="text" autoComplete="address-level2" placeholder="Columbus"
              className="bg-white/10 border-white/20 text-white placeholder:text-white/30 focus-visible:border-sn-gold"
              {...register("city")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="state" className={labelClass}>State</Label>
            <Input id="state" type="text" autoComplete="address-level1" placeholder="GA" maxLength={2}
              className="bg-white/10 border-white/20 text-white placeholder:text-white/30 focus-visible:border-sn-gold"
              {...register("state")} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="zip" className={labelClass}>ZIP code</Label>
            <Input id="zip" type="text" autoComplete="postal-code" placeholder="31901"
              className="bg-white/10 border-white/20 text-white placeholder:text-white/30 focus-visible:border-sn-gold"
              {...register("zip")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="country" className={labelClass}>Country</Label>
            <Input id="country" type="text" autoComplete="country-name" placeholder="USA"
              className="bg-white/10 border-white/20 text-white placeholder:text-white/30 focus-visible:border-sn-gold"
              {...register("country")} />
          </div>
        </div>
      </div>

      {/* ── LinkedIn ─────────────────────────────────────────────── */}
      <div className="space-y-1.5">
        <Label htmlFor="linkedin_url" className={labelClass}>LinkedIn URL {optLabel}</Label>
        <Input id="linkedin_url" type="url" autoComplete="url"
          placeholder="https://www.linkedin.com/in/your-name"
          className="bg-white/10 border-white/20 text-white placeholder:text-white/30 focus-visible:border-sn-gold"
          {...register("linkedin_url")} aria-invalid={errors.linkedin_url !== undefined} />
        {errors.linkedin_url !== undefined && (
          <p className="text-red-400 text-xs mt-0.5">{errors.linkedin_url.message}</p>
        )}
      </div>

      {/* ── Privacy toggles ──────────────────────────────────────── */}
      <div className="space-y-3 pt-1">
        <p className="text-white/70 text-xs font-semibold uppercase tracking-wider">
          Privacy — visible to other members
        </p>
        <p className="text-white/40 text-xs">
          Admins always see your full profile regardless of these settings.
        </p>

        <PrivacyToggle
          id="show_phone"
          label="Show my phone number to other members"
          checked={showPhone}
          onChange={(v) => setValue("show_phone", v, { shouldDirty: true })}
        />
        <PrivacyToggle
          id="show_address"
          label="Show my address to other members"
          checked={showAddress}
          onChange={(v) => setValue("show_address", v, { shouldDirty: true })}
        />
        <PrivacyToggle
          id="show_birthday"
          label="Show my birthday to other members"
          checked={showBirthday}
          onChange={(v) => setValue("show_birthday", v, { shouldDirty: true })}
        />
      </div>

      {serverError !== null && (
        <p className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-md px-3 py-2">
          {serverError}
        </p>
      )}
      {saved && (
        <p className="text-green-400 text-sm bg-green-400/10 border border-green-400/20 rounded-md px-3 py-2">
          Profile saved.
        </p>
      )}

      <Button
        type="submit"
        className="w-full bg-sn-gold text-sn-black hover:bg-sn-gold-light font-semibold"
        disabled={isSubmitting || !isDirty}
      >
        {isSubmitting ? "Saving…" : "Save changes"}
      </Button>
    </form>
  );
}

function PrivacyToggle({
  id,
  label,
  checked,
  onChange,
}: {
  id:       string;
  label:    string;
  checked:  boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label htmlFor={id} className="flex items-center gap-3 cursor-pointer group">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-4 h-4 rounded border border-white/30 bg-white/10 accent-sn-gold cursor-pointer"
      />
      <span className="text-white/70 text-sm group-hover:text-white transition-colors">
        {label}
      </span>
    </label>
  );
}
