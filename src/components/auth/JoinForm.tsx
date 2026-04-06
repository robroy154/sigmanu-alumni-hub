"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { PLEDGE_CLASSES } from "@/lib/utils/pledge-classes";
import { AddressAutocomplete } from "@/components/profile/AddressAutocomplete";
import { completeReferral } from "@/lib/referrals/actions";
import { toastError } from "@/lib/toast";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

const JoinSchema = z
  .object({
    first_name:     z.string().min(1, "First name is required"),
    last_name:      z.string().min(1, "Last name is required"),
    password:       z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
    pledge_class:   z.string().optional(),
    phone:          z.string().optional(),
    street_address: z.string().optional(),
    city:           z.string().optional(),
    state:          z.string().optional(),
    zip:            z.string().optional(),
    country:        z.string().optional(),
    birthday:       z.string().optional(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type JoinInput = z.infer<typeof JoinSchema>;

interface JoinFormProps {
  firstName: string;
  lastName:  string;
  email:     string;
  token:     string;
}

export function JoinForm({ firstName, lastName, email, token }: JoinFormProps) {
  const router = useRouter();
  const [resetLoading, setResetLoading] = useState(false);
  const [showResetPrompt, setShowResetPrompt] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<JoinInput>({
    resolver: zodResolver(JoinSchema),
    defaultValues: { first_name: firstName, last_name: lastName },
  });

  async function onSubmit(data: JoinInput) {
    const supabase = createClient();

    const { data: signUpData, error } = await supabase.auth.signUp({
      email,
      password: data.password,
      options: {
        data: { first_name: data.first_name, last_name: data.last_name },
      },
    });

    if (error !== null) {
      const isDuplicate =
        error.message.toLowerCase().includes("already registered") ||
        error.message.toLowerCase().includes("already exists") ||
        ("code" in error && (error as { code?: string }).code === "user_already_exists");

      if (isDuplicate) {
        setShowResetPrompt(true);
        return;
      }
      toastError(error.message);
      return;
    }

    if (signUpData.user !== null) {
      // Complete the referral: set referred_by, mark token used, send emails.
      const result = await completeReferral(token, {
        pledge_class:   data.pledge_class,
        phone:          data.phone,
        street_address: data.street_address,
        city:           data.city,
        state:          data.state,
        zip:            data.zip,
        country:        data.country,
        birthday:       data.birthday,
      });
      if ("error" in result) {
        // Non-blocking: user is signed up — just show a warning and continue.
        console.warn("[JoinForm] completeReferral:", result.error);
      }
    }

    router.push("/pending-approval");
  }

  async function sendResetLink() {
    setResetLoading(true);
    const supabase = createClient();
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${APP_URL}/auth/reset-password`,
    });
    setResetLoading(false);
    setResetSent(true);
  }

  // ── Duplicate email state ──────────────────────────────────────────────────
  if (showResetPrompt) {
    if (resetSent) {
      return (
        <div className="space-y-4 text-center py-2">
          <div className="text-green-400 text-3xl">✓</div>
          <p className="text-white text-sm leading-relaxed">
            A reset link has been sent to{" "}
            <span className="text-sn-gold">{email}</span>. Check your inbox.
          </p>
          <Link href="/login" className="inline-block text-sn-gold hover:text-sn-gold-light text-sm underline">
            Back to sign in
          </Link>
        </div>
      );
    }
    return (
      <div className="space-y-4">
        <div className="rounded-lg bg-amber-400/10 border border-amber-400/20 px-4 py-3 space-y-1">
          <p className="text-amber-300 text-sm font-medium">Email already in use</p>
          <p className="text-white/60 text-sm">
            An account with <span className="text-white">{email}</span> already exists.
            Want us to send a password reset link?
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <Button
            type="button"
            onClick={() => void sendResetLink()}
            disabled={resetLoading}
            className="w-full bg-sn-gold text-sn-black hover:bg-sn-gold-light font-semibold"
          >
            {resetLoading ? "Sending…" : "Send reset link"}
          </Button>
          <Link
            href="/login"
            className="inline-flex h-9 w-full items-center justify-center rounded-lg border border-white/20 text-sm text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            Back to login
          </Link>
        </div>
      </div>
    );
  }

  // ── Main form ──────────────────────────────────────────────────────────────
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>

      {/* Name */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="first_name" className="text-white/80 text-sm">First name</Label>
          <Input id="first_name" type="text" autoComplete="given-name"
            className="bg-white/10 border-white/20 text-white placeholder:text-white/30 focus-visible:border-sn-gold"
            {...register("first_name")} aria-invalid={errors.first_name !== undefined} />
          {errors.first_name !== undefined && (
            <p className="text-red-400 text-xs">{errors.first_name.message}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="last_name" className="text-white/80 text-sm">Last name</Label>
          <Input id="last_name" type="text" autoComplete="family-name"
            className="bg-white/10 border-white/20 text-white placeholder:text-white/30 focus-visible:border-sn-gold"
            {...register("last_name")} aria-invalid={errors.last_name !== undefined} />
          {errors.last_name !== undefined && (
            <p className="text-red-400 text-xs">{errors.last_name.message}</p>
          )}
        </div>
      </div>

      {/* Email — read-only, set by referral */}
      <div className="space-y-1.5">
        <Label htmlFor="email" className="text-white/80 text-sm">Email address</Label>
        <Input
          id="email"
          type="email"
          value={email}
          readOnly
          className="bg-white/5 border-white/10 text-white/50 cursor-not-allowed focus-visible:border-white/10"
        />
        <p className="text-white/40 text-xs">
          Email was set by the person who invited you and cannot be changed.
        </p>
      </div>

      {/* Pledge class + Phone */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="pledge_class" className="text-white/80 text-sm">
            Pledge class <span className="text-white/40 font-normal">(optional)</span>
          </Label>
          <select id="pledge_class"
            className="h-8 w-full rounded-lg border border-white/20 bg-white/10 px-2.5 py-1 text-sm text-white focus:outline-none focus:border-sn-gold"
            {...register("pledge_class")}>
            <option value="" className="bg-sn-black">Select class</option>
            {PLEDGE_CLASSES.map((pc) => (
              <option key={pc} value={pc} className="bg-sn-black">{pc}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="phone" className="text-white/80 text-sm">
            Phone <span className="text-white/40 font-normal">(optional)</span>
          </Label>
          <Input id="phone" type="tel" autoComplete="tel" placeholder="(555) 000-0000"
            className="bg-white/10 border-white/20 text-white placeholder:text-white/30 focus-visible:border-sn-gold"
            {...register("phone")} />
        </div>
      </div>

      {/* Birthday */}
      <div className="space-y-1.5">
        <Label htmlFor="birthday" className="text-white/80 text-sm">
          Birthday <span className="text-white/40 font-normal">(optional)</span>
        </Label>
        <Input id="birthday" type="date"
          className="bg-white/10 border-white/20 text-white focus-visible:border-sn-gold scheme-dark"
          {...register("birthday")} />
      </div>

      {/* Address */}
      <div className="space-y-3">
        <p className="text-white/70 text-xs font-semibold uppercase tracking-wider">
          Address <span className="text-white/40 font-normal normal-case">(optional)</span>
        </p>
        <div className="space-y-1.5">
          <Label htmlFor="street_address" className="text-white/80 text-sm">Street address</Label>
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
                  setValue("city",    parts.city);
                  setValue("state",   parts.state);
                  setValue("zip",     parts.zip);
                  setValue("country", parts.country);
                }}
                className="h-9 w-full rounded-lg border border-white/20 bg-white/10 px-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-sn-gold transition-colors"
                placeholder="123 Main St"
              />
            )}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="city" className="text-white/80 text-sm">City</Label>
            <Input id="city" type="text" autoComplete="address-level2" placeholder="Columbus"
              className="bg-white/10 border-white/20 text-white placeholder:text-white/30 focus-visible:border-sn-gold"
              {...register("city")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="state" className="text-white/80 text-sm">State</Label>
            <Input id="state" type="text" autoComplete="address-level1" placeholder="GA" maxLength={2}
              className="bg-white/10 border-white/20 text-white placeholder:text-white/30 focus-visible:border-sn-gold"
              {...register("state")} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="zip" className="text-white/80 text-sm">ZIP code</Label>
            <Input id="zip" type="text" autoComplete="postal-code" placeholder="31901"
              className="bg-white/10 border-white/20 text-white placeholder:text-white/30 focus-visible:border-sn-gold"
              {...register("zip")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="country" className="text-white/80 text-sm">Country</Label>
            <Input id="country" type="text" autoComplete="country-name" placeholder="USA"
              className="bg-white/10 border-white/20 text-white placeholder:text-white/30 focus-visible:border-sn-gold"
              {...register("country")} />
          </div>
        </div>
      </div>

      {/* Password */}
      <div className="space-y-1.5">
        <Label htmlFor="password" className="text-white/80 text-sm">Password</Label>
        <Input id="password" type="password" autoComplete="new-password" placeholder="Min. 8 characters"
          className="bg-white/10 border-white/20 text-white placeholder:text-white/30 focus-visible:border-sn-gold"
          {...register("password")} aria-invalid={errors.password !== undefined} />
        {errors.password !== undefined && (
          <p className="text-red-400 text-xs">{errors.password.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="confirmPassword" className="text-white/80 text-sm">Confirm password</Label>
        <Input id="confirmPassword" type="password" autoComplete="new-password" placeholder="••••••••"
          className="bg-white/10 border-white/20 text-white placeholder:text-white/30 focus-visible:border-sn-gold"
          {...register("confirmPassword")} aria-invalid={errors.confirmPassword !== undefined} />
        {errors.confirmPassword !== undefined && (
          <p className="text-red-400 text-xs">{errors.confirmPassword.message}</p>
        )}
      </div>

      <Button
        type="submit"
        className="w-full bg-sn-gold text-sn-black hover:bg-sn-gold-light font-semibold"
        disabled={isSubmitting}
      >
        {isSubmitting ? "Creating account…" : "Create account"}
      </Button>

      <p className="text-center text-white/50 text-sm">
        Already have an account?{" "}
        <Link href="/login" className="text-sn-gold hover:text-sn-gold-light underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
