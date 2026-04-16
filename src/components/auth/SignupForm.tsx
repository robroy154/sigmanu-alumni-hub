"use client";

import { useState, useEffect, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import { toastError } from "@/lib/toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { SignupSchema, type SignupInput } from "@/lib/auth/schemas";
import { PLEDGE_CLASSES } from "@/lib/utils/pledge-classes";
import { sendSignupNotifications } from "@/lib/auth/signup-notifications";
import { AddressAutocomplete } from "@/components/profile/AddressAutocomplete";
import { findStubMatches, type StubMatch } from "@/lib/auth/stub-search";
import { StubClaimStep } from "@/components/auth/StubClaimStep";

type DuplicateState =
  | { type: "none" }
  | { type: "prompt"; email: string }
  | { type: "reset_sent"; email: string };

type StubClaimState =
  | { type: "none" }
  | { type: "results"; matches: StubMatch[] };

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export function SignupForm() {
  const router = useRouter();
  const [duplicate, setDuplicate]         = useState<DuplicateState>({ type: "none" });
  const [resetLoading, setResetLoading]   = useState(false);
  const [hasPrefill, setHasPrefill]       = useState(false);
  const [pinEntry, setPinEntry]           = useState("");
  const [stubClaim, setStubClaim]         = useState<StubClaimState>({ type: "none" });

  // Ref to carry the selected stub ID into the signUp call without stale closure issues.
  const selectedStubIdRef = useRef<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<SignupInput>({
    resolver: zodResolver(SignupSchema),
  });

  useEffect(() => {
    const raw = sessionStorage.getItem("guest_prefill");
    if (raw === null) return;
    sessionStorage.removeItem("guest_prefill");
    try {
      const prefill = JSON.parse(raw) as {
        first_name: string;
        last_name:  string;
        email:      string;
        phone?:     string;
      };
      setValue("first_name", prefill.first_name);
      setValue("last_name",  prefill.last_name);
      setValue("email",      prefill.email);
      if (prefill.phone !== undefined && prefill.phone !== "") {
        setValue("phone", prefill.phone);
      }
      setHasPrefill(true);
    } catch {
      // Malformed storage — ignore.
    }
  }, [setValue]);

  // ── Core signup — called after stub check resolves ─────────────────────────
  async function proceedWithSignup(data: SignupInput) {
    const supabase = createClient();

    const { data: signUpData, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          first_name: data.first_name,
          last_name:  data.last_name,
          // stub_id is set when user claimed a stub record
          ...(selectedStubIdRef.current !== null
            ? { stub_id: selectedStubIdRef.current }
            : {}),
        },
      },
    });

    if (error !== null) {
      const isDuplicate =
        error.message.toLowerCase().includes("already registered") ||
        error.message.toLowerCase().includes("already exists") ||
        ("code" in error && (error as { code?: string }).code === "user_already_exists");

      if (isDuplicate) {
        setDuplicate({ type: "prompt", email: data.email });
        return;
      }

      toastError(error.message);
      return;
    }

    // The handle_new_user trigger copies first_name/last_name (and stub fields if claimed).
    // Write remaining optional fields now that we have a session.
    if (signUpData.user !== null) {
      const update: Record<string, string> = {};
      if (data.pledge_class   !== undefined && data.pledge_class   !== "") update.pledge_class   = data.pledge_class;
      if (data.phone          !== undefined && data.phone          !== "") update.phone          = data.phone;
      if (data.street_address !== undefined && data.street_address !== "") update.street_address = data.street_address;
      if (data.city           !== undefined && data.city           !== "") update.city           = data.city;
      if (data.state          !== undefined && data.state          !== "") update.state          = data.state;
      if (data.zip            !== undefined && data.zip            !== "") update.zip            = data.zip;
      if (data.country        !== undefined && data.country        !== "") update.country        = data.country;
      if (data.birthday       !== undefined && data.birthday       !== "") update.birthday       = data.birthday;
      if (Object.keys(update).length > 0) {
        await supabase.from("members").update(update).eq("id", signUpData.user.id);
      }
    }

    void sendSignupNotifications({ to: data.email, firstName: data.first_name, lastName: data.last_name });
    router.push("/pending-approval");
  }

  // ── Primary submit — searches for stubs first ─────────────────────────────
  async function onSubmit(data: SignupInput) {
    // Only search stubs if we haven't already shown results (prevents infinite loop
    // when handleSubmit(onSubmit) is called from the "None of these" button path).
    if (stubClaim.type === "none") {
      const matches = await findStubMatches({
        firstName:   data.first_name,
        lastName:    data.last_name,
        pledgeClass: data.pledge_class !== "" ? data.pledge_class : undefined,
        pinNumber:   pinEntry !== "" ? pinEntry : undefined,
      });

      if (matches.length > 0) {
        setStubClaim({ type: "results", matches });
        return; // Pause — show claim UI
      }
    }

    // No stubs found (or already dismissed) — proceed with normal signup.
    await proceedWithSignup(data);
  }

  async function sendResetLink(email: string) {
    setResetLoading(true);
    const supabase = createClient();
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${APP_URL}/auth/reset-password`,
    });
    setResetLoading(false);
    setDuplicate({ type: "reset_sent", email });
  }

  // ── Duplicate email states ──────────────────────────────────────────────────
  if (duplicate.type === "prompt") {
    return (
      <div className="space-y-4">
        <div className="rounded-lg bg-amber-400/10 border border-amber-400/20 px-4 py-3 space-y-1">
          <p className="text-amber-300 text-sm font-medium">Email already in use</p>
          <p className="text-white/60 text-sm">
            An account with{" "}
            <span className="text-white">{duplicate.email}</span> already
            exists. Want us to send you a password reset link?
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <Button
            type="button"
            onClick={() => void sendResetLink(duplicate.email)}
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

  if (duplicate.type === "reset_sent") {
    return (
      <div className="space-y-4 text-center py-2">
        <div className="text-green-400 text-3xl">✓</div>
        <p className="text-white text-sm leading-relaxed">
          A reset link has been sent to{" "}
          <span className="text-sn-gold">{duplicate.email}</span>. Check your
          inbox (and spam folder).
        </p>
        <Link
          href="/login"
          className="inline-block text-sn-gold hover:text-sn-gold-light text-sm underline"
        >
          Back to sign in
        </Link>
      </div>
    );
  }
  // ───────────────────────────────────────────────────────────────────────────

  // ── Stub claim UI ──────────────────────────────────────────────────────────
  if (stubClaim.type === "results") {
    return (
      <StubClaimStep
        matches={stubClaim.matches}
        onClaim={(stubId) => {
          selectedStubIdRef.current = stubId;
          setStubClaim({ type: "none" });
          void handleSubmit(proceedWithSignup)();
        }}
        onDismiss={() => {
          selectedStubIdRef.current = null;
          setStubClaim({ type: "none" });
          void handleSubmit(proceedWithSignup)();
        }}
        onBack={() => setStubClaim({ type: "none" })}
      />
    );
  }
  // ───────────────────────────────────────────────────────────────────────────

  // eslint-disable-next-line react-hooks/refs
  const submitHandler = handleSubmit(onSubmit);

  return (
    <form onSubmit={submitHandler} className="space-y-4" noValidate>
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
          readOnly={hasPrefill}
          className={`bg-white/10 border-white/20 text-white placeholder:text-white/30 focus-visible:border-sn-gold${hasPrefill ? " cursor-not-allowed opacity-70" : ""}`}
          {...register("email")}
          aria-invalid={errors.email !== undefined}
        />
        {hasPrefill && (
          <p className="text-white/40 text-xs">
            To use a different email address, clear this field.
          </p>
        )}
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

      {/* ── Badge Number (search hint only, not written to DB on fresh signup) ── */}
      <div className="space-y-1.5">
        <Label htmlFor="pin_entry" className="text-white/80 text-sm">
          Badge Number{" "}
          <span className="text-white/40 font-normal">(optional)</span>
        </Label>
        <Input
          id="pin_entry"
          type="text"
          placeholder="e.g. 42"
          value={pinEntry}
          onChange={(e) => setPinEntry(e.target.value)}
          className="bg-white/10 border-white/20 text-white placeholder:text-white/30 focus-visible:border-sn-gold"
        />
        <p className="text-white/40 text-xs">
          If known, helps us find your chapter record.
        </p>
      </div>

      {/* ── Birthday ──────────────────────────────────────────────── */}
      <div className="space-y-1.5">
        <Label htmlFor="birthday" className="text-white/80 text-sm">
          Birthday{" "}
          <span className="text-white/40 font-normal">(optional)</span>
        </Label>
        <Input
          id="birthday"
          type="date"
          className="bg-white/10 border-white/20 text-white focus-visible:border-sn-gold scheme-dark"
          {...register("birthday")}
        />
      </div>

      {/* ── Address ───────────────────────────────────────────────── */}
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
