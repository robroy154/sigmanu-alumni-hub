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
import { LoginSchema, type LoginInput } from "@/lib/auth/schemas";

interface LoginFormProps {
  redirectTo: string | undefined;
}

export function LoginForm({ redirectTo }: LoginFormProps) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(LoginSchema),
  });

  async function onSubmit(data: LoginInput) {
    setServerError(null);
    const supabase = createClient();

    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (error !== null) {
      setServerError(
        error.message === "Invalid login credentials"
          ? "Incorrect email or password."
          : error.message
      );
      return;
    }

    // Fetch member status to determine redirect destination
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user === null) {
      setServerError("Sign in failed. Please try again.");
      return;
    }

    const { data: member } = await supabase
      .from("members")
      .select("status")
      .eq("id", user.id)
      .single();

    if (member?.status === "pending") {
      router.push("/pending-approval");
    } else {
      router.push(redirectTo ?? "/directory");
    }

    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
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

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="password" className="text-white/80 text-sm">
            Password
          </Label>
        </div>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          className="bg-white/10 border-white/20 text-white placeholder:text-white/30 focus-visible:border-sn-gold"
          {...register("password")}
          aria-invalid={errors.password !== undefined}
        />
        {errors.password !== undefined && (
          <p className="text-red-400 text-xs">{errors.password.message}</p>
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
        {isSubmitting ? "Signing in…" : "Sign in"}
      </Button>

      <p className="text-center text-white/50 text-sm">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="text-sn-gold hover:text-sn-gold-light underline">
          Create one
        </Link>
      </p>
    </form>
  );
}
