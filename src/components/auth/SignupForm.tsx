"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { SignupSchema, type SignupInput } from "@/lib/auth/schemas";
import { PLEDGE_CLASSES } from "@/lib/utils/pledge-classes";
import { notifyAdminsNewMember } from "@/lib/email";

export function SignupForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupInput>({
    resolver: zodResolver(SignupSchema),
  });

  async function onSubmit(data: SignupInput) {
    setServerError(null);
    const supabase = createClient();

    const { data: signUpData, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          first_name: data.first_name,
          last_name: data.last_name,
        },
      },
    });

    if (error !== null) {
      setServerError(
        error.message.includes("already registered")
          ? "An account with this email already exists. Try signing in."
          : error.message
      );
      return;
    }

    // The handle_new_user trigger only copies first_name and last_name.
    // Write pledge_class and phone directly now that we have a session.
    if (signUpData.user !== null) {
      const update: { pledge_class?: string; phone?: string } = {};
      if (data.pledge_class !== undefined && data.pledge_class !== "") {
        update.pledge_class = data.pledge_class;
      }
      if (data.phone !== undefined && data.phone !== "") {
        update.phone = data.phone;
      }
      if (Object.keys(update).length > 0) {
        await supabase.from("members").update(update).eq("id", signUpData.user.id);
      }
    }

    // Notify admins of the new signup — fire-and-forget, never block redirect.
    void notifyAdminsNewMember();

    router.push("/pending-approval");
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
        <Label htmlFor="email" className="text-white/80 text-sm">
          Email address
        </Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          className="bg-white/10 border-white/20 text-white placeholder:text-white/30 focus-visible:border-sn-gold"
          {...register("email")}
          aria-invalid={errors.email !== undefined}
        />
        {errors.email !== undefined && (
          <p className="text-red-400 text-xs">{errors.email.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
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
              Select class
            </option>
            {PLEDGE_CLASSES.map((pc) => (
              <option key={pc} value={pc} className="bg-sn-black">
                {pc}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="phone" className="text-white/80 text-sm">
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
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="password" className="text-white/80 text-sm">
          Password
        </Label>
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          placeholder="Min. 8 characters"
          className="bg-white/10 border-white/20 text-white placeholder:text-white/30 focus-visible:border-sn-gold"
          {...register("password")}
          aria-invalid={errors.password !== undefined}
        />
        {errors.password !== undefined && (
          <p className="text-red-400 text-xs">{errors.password.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="confirmPassword" className="text-white/80 text-sm">
          Confirm password
        </Label>
        <Input
          id="confirmPassword"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
          className="bg-white/10 border-white/20 text-white placeholder:text-white/30 focus-visible:border-sn-gold"
          {...register("confirmPassword")}
          aria-invalid={errors.confirmPassword !== undefined}
        />
        {errors.confirmPassword !== undefined && (
          <p className="text-red-400 text-xs">
            {errors.confirmPassword.message}
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
        className="w-full bg-sn-gold text-sn-black hover:bg-sn-gold-light font-semibold"
        disabled={isSubmitting}
      >
        {isSubmitting ? "Creating account…" : "Create account"}
      </Button>

      <p className="text-center text-white/50 text-sm">
        Already have an account?{" "}
        <Link
          href="/login"
          className="text-sn-gold hover:text-sn-gold-light underline"
        >
          Sign in
        </Link>
      </p>
    </form>
  );
}
