"use client";

import { Button } from "@/components/ui/button";
import type { StubMatch } from "@/lib/auth/stub-search";

interface StubClaimStepProps {
  matches:   StubMatch[];
  onClaim:   (stubId: string) => void;
  onDismiss: () => void;
  onBack:    () => void;
}

/**
 * Shared stub claim UI used by both SignupForm and JoinForm.
 * Shows up to 3 match cards. "This is me" calls onClaim; "None of these are me"
 * calls onDismiss (proceeds without stub); "Back" calls onBack (returns to form).
 * pin_number is always shown in full — never masked.
 */
export function StubClaimStep({ matches, onClaim, onDismiss, onBack }: StubClaimStepProps) {
  const visibleMatches = matches.slice(0, 3);
  const highConf = visibleMatches.length === 1 && (visibleMatches[0]?.similarity ?? 0) > 0.7;
  const heading  = highConf
    ? "We found a record that might be yours"
    : "We found some records that might be yours";

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sn-off-white font-semibold">{heading}</p>
        <p className="text-white/50 text-sm mt-0.5">
          Select your record to carry over your chapter information.
        </p>
      </div>

      <div className="space-y-3">
        {visibleMatches.map((match) => (
          <div
            key={match.id}
            className="bg-sn-surface rounded-sm border border-white/10 px-4 py-3 flex items-center justify-between gap-4"
          >
            <div className="min-w-0 space-y-0.5">
              <p className="text-sn-off-white font-semibold text-sm">
                {match.firstName} {match.lastName}
              </p>
              {match.nickname !== null && match.nickname !== "" && (
                <p className="text-sn-gray-text text-xs">&ldquo;{match.nickname}&rdquo;</p>
              )}
              <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
                {match.pledgeClass !== null && match.pledgeClass !== "" && (
                  <p className="text-sn-gray-text text-xs uppercase tracking-wide">
                    {match.pledgeClass}
                  </p>
                )}
                {match.pinNumber !== null && match.pinNumber !== "" && (
                  <p className="text-sn-gold text-xs">Badge #{match.pinNumber}</p>
                )}
              </div>
            </div>
            <Button
              type="button"
              size="sm"
              onClick={() => onClaim(match.id)}
              className="shrink-0 bg-sn-gold text-sn-black hover:bg-sn-gold-light font-semibold"
            >
              This is me
            </Button>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between pt-1">
        <button
          type="button"
          onClick={onBack}
          className="text-white/50 hover:text-white text-sm transition-colors"
        >
          ← Back
        </button>
        <button
          type="button"
          onClick={onDismiss}
          className="text-white/60 hover:text-white text-sm transition-colors"
        >
          None of these are me →
        </button>
      </div>
    </div>
  );
}
