"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle, Circle, X } from "lucide-react";
import { dismissOnboarding } from "@/lib/auth/actions";

interface Props {
  profilePhotoUrl: string | null;
  pledgeClass:     string | null;
  bigId:           string | null;
  pinNumber:       string | null;
}

interface ChecklistItem {
  label:   string;
  done:    boolean;
  href:    string;
  external?: false;
}

export function OnboardingModal({ profilePhotoUrl, pledgeClass, bigId, pinNumber }: Props) {
  const router = useRouter();
  const [visible, setVisible]   = useState(true);
  const [loading, setLoading]   = useState(false);

  if (!visible) return null;

  const items: ChecklistItem[] = [
    {
      label: "Add a profile photo",
      done:  profilePhotoUrl !== null && profilePhotoUrl !== "",
      href:  "/profile/edit",
    },
    {
      label: "Set your pledge class",
      done:  pledgeClass !== null,
      href:  "/profile/edit",
    },
    {
      label: "Link your Big Brother",
      done:  bigId !== null,
      href:  "/profile/edit",
    },
    {
      label: "Add your badge number",
      done:  pinNumber !== null && pinNumber !== "",
      href:  "/profile/edit",
    },
    {
      label: "Explore the family tree",
      done:  false,
      href:  "/family-tree",
    },
    {
      label: "Browse the directory",
      done:  false,
      href:  "/directory",
    },
  ];

  const doneCount = items.filter((i) => i.done).length;
  const allDone   = doneCount === items.length;

  async function handleDismiss() {
    setLoading(true);
    await dismissOnboarding();
    setVisible(false);
    router.refresh();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
      <div className="bg-sn-black border border-sn-gold/30 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-white/10">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-sn-off-white text-lg font-bold">Welcome to the Alumni Hub!</h2>
              <p className="text-sn-gray-medium text-sm mt-1">
                Complete your profile to get the most out of the platform.
              </p>
            </div>
            <button
              type="button"
              onClick={() => void handleDismiss()}
              aria-label="Dismiss"
              className="text-white/30 hover:text-white transition-colors shrink-0 mt-0.5"
            >
              <X size={18} />
            </button>
          </div>

          {/* Progress bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-sn-gray-medium mb-1.5">
              <span>{doneCount} of {items.length} complete</span>
              {allDone && <span className="text-sn-gold font-semibold">All done!</span>}
            </div>
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-sn-gold rounded-full transition-all duration-500"
                style={{ width: `${(doneCount / items.length) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Checklist */}
        <ul className="px-6 py-4 space-y-3">
          {items.map((item) => (
            <li key={item.label}>
              <Link
                href={item.href}
                className="flex items-center gap-3 group"
              >
                {item.done ? (
                  <CheckCircle className="w-4 h-4 text-green-400 shrink-0" />
                ) : (
                  <Circle className="w-4 h-4 text-white/25 shrink-0 group-hover:text-sn-gold/60 transition-colors" />
                )}
                <span
                  className={[
                    "text-sm transition-colors",
                    item.done
                      ? "text-white/40 line-through"
                      : "text-sn-gray-text group-hover:text-sn-off-white",
                  ].join(" ")}
                >
                  {item.label}
                </span>
              </Link>
            </li>
          ))}
        </ul>

        {/* Footer */}
        <div className="px-6 pb-6 pt-2 flex items-center justify-end">
          <button
            type="button"
            onClick={() => void handleDismiss()}
            disabled={loading}
            className="text-white/40 hover:text-white text-sm transition-colors disabled:opacity-50"
          >
            {loading ? "Saving…" : "Don't show again"}
          </button>
        </div>
      </div>
    </div>
  );
}
