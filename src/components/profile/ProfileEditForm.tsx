"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateProfile } from "@/lib/profile/actions";
import { ProfileUpdateSchema, type ProfileUpdateInput } from "@/lib/profile/schemas";
import { PLEDGE_CLASSES } from "@/lib/utils/pledge-classes";

interface ProfileEditFormProps {
  defaultValues: ProfileUpdateInput;
}

export function ProfileEditForm({ defaultValues }: ProfileEditFormProps) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const {
    register,
    handleSubmit,
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
  const errorClass = "text-red-400 text-xs mt-0.5";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      {/* Name */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="first_name" className={labelClass}>
            First name
          </Label>
          <Input
            id="first_name"
            type="text"
            autoComplete="given-name"
            className="bg-white/10 border-white/20 text-white placeholder:text-white/30 focus-visible:border-sn-gold"
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
            className="bg-white/10 border-white/20 text-white placeholder:text-white/30 focus-visible:border-sn-gold"
            {...register("last_name")}
            aria-invalid={errors.last_name !== undefined}
          />
          {errors.last_name !== undefined && (
            <p className={errorClass}>{errors.last_name.message}</p>
          )}
        </div>
      </div>

      {/* Nickname */}
      <div className="space-y-1.5">
        <Label htmlFor="nickname" className={labelClass}>
          Fraternity nickname{" "}
          <span className="text-white/40 font-normal">(optional)</span>
        </Label>
        <Input
          id="nickname"
          type="text"
          placeholder="e.g. Spike"
          className="bg-white/10 border-white/20 text-white placeholder:text-white/30 focus-visible:border-sn-gold"
          {...register("nickname")}
        />
      </div>

      {/* Pledge class */}
      <div className="space-y-1.5">
        <Label htmlFor="pledge_class" className={labelClass}>
          Pledge class{" "}
          <span className="text-white/40 font-normal">(optional)</span>
        </Label>
        <select
          id="pledge_class"
          className={fieldClass}
          {...register("pledge_class")}
        >
          <option value="" className="bg-sn-navy">
            Select your pledge class
          </option>
          {PLEDGE_CLASSES.map((pc) => (
            <option key={pc} value={pc} className="bg-sn-navy">
              {pc}
            </option>
          ))}
        </select>
      </div>

      {/* Phone */}
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
          className="bg-white/10 border-white/20 text-white placeholder:text-white/30 focus-visible:border-sn-gold"
          {...register("phone")}
        />
      </div>

      {/* City / State */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="city" className={labelClass}>
            City{" "}
            <span className="text-white/40 font-normal">(optional)</span>
          </Label>
          <Input
            id="city"
            type="text"
            autoComplete="address-level2"
            placeholder="Columbus"
            className="bg-white/10 border-white/20 text-white placeholder:text-white/30 focus-visible:border-sn-gold"
            {...register("city")}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="state" className={labelClass}>
            State{" "}
            <span className="text-white/40 font-normal">(optional)</span>
          </Label>
          <Input
            id="state"
            type="text"
            autoComplete="address-level1"
            placeholder="GA"
            maxLength={2}
            className="bg-white/10 border-white/20 text-white placeholder:text-white/30 focus-visible:border-sn-gold"
            {...register("state")}
          />
        </div>
      </div>

      {/* LinkedIn */}
      <div className="space-y-1.5">
        <Label htmlFor="linkedin_url" className={labelClass}>
          LinkedIn URL{" "}
          <span className="text-white/40 font-normal">(optional)</span>
        </Label>
        <Input
          id="linkedin_url"
          type="url"
          autoComplete="url"
          placeholder="https://www.linkedin.com/in/your-name"
          className="bg-white/10 border-white/20 text-white placeholder:text-white/30 focus-visible:border-sn-gold"
          {...register("linkedin_url")}
          aria-invalid={errors.linkedin_url !== undefined}
        />
        {errors.linkedin_url !== undefined && (
          <p className={errorClass}>{errors.linkedin_url.message}</p>
        )}
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
        className="w-full bg-sn-gold text-sn-navy hover:bg-sn-gold-light font-semibold"
        disabled={isSubmitting || !isDirty}
      >
        {isSubmitting ? "Saving…" : "Save changes"}
      </Button>
    </form>
  );
}
