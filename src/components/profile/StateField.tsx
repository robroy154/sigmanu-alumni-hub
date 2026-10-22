"use client";

import type { UseFormRegisterReturn } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { US_STATE_OPTIONS, isUSCountry } from "@/lib/profile/normalize";

interface StateFieldProps {
  /** register("state") from the parent form. */
  registration: UseFormRegisterReturn;
  /** Current state value (watch("state")); used to keep an unrecognized saved value selectable. */
  value: string | null | undefined;
  /** Current country value (watch("country")); US or blank shows the dropdown. */
  country: string | null | undefined;
  /** Matches the parent form's input styling. */
  className?: string | undefined;
}

const SELECT_CLASS =
  "h-8 w-full rounded-lg border border-white/20 bg-white/10 px-2.5 py-1 text-sm text-white focus:outline-none focus:border-sn-gold";

/**
 * US addresses get a state dropdown (two-letter codes, so bad values can't be typed);
 * anything else gets a free-text region field. The address autocomplete sets
 * state to Google's short code, which matches these option values.
 */
export function StateField({ registration, value, country, className }: StateFieldProps) {
  if (!isUSCountry(country)) {
    return (
      <Input
        id="state"
        type="text"
        autoComplete="address-level1"
        placeholder="State / region"
        maxLength={30}
        className={className}
        {...registration}
      />
    );
  }

  // A saved value outside the list (legacy data) stays as an option. Without it the
  // browser would show the first option and the next save would silently blank it.
  const current = (value ?? "").trim();
  const isUnknown = current !== "" && !US_STATE_OPTIONS.some((o) => o.code === current);

  return (
    <select id="state" autoComplete="address-level1" className={SELECT_CLASS} {...registration}>
      <option value="" className="bg-sn-black">
        Select state
      </option>
      {isUnknown && (
        <option value={current} className="bg-sn-black">
          {current}
        </option>
      )}
      {US_STATE_OPTIONS.map((o) => (
        <option key={o.code} value={o.code} className="bg-sn-black">
          {o.name}
        </option>
      ))}
    </select>
  );
}
