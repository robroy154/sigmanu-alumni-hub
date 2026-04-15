"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateGuestNames, addGuestsToRegistration } from "@/lib/registration/manageActions";

interface Guest {
  id:         string;
  guest_name: string;
}

interface ManageRegistrationProps {
  registration: {
    id:             string;
    guest_count:    number;
    payment_status: string;
    event_id:       string;
  };
  guests:            Guest[];
  eventTicketPrice:  number;
  registrationOpen:  boolean;
}

export function ManageRegistration({
  registration,
  guests,
  eventTicketPrice,
  registrationOpen,
}: ManageRegistrationProps) {
  // ── Edit existing guests ──────────────────────────────────────────────────
  const [editedGuests, setEditedGuests] = useState<Guest[]>(
    guests.map((g) => ({ ...g }))
  );
  const [isUpdating,    setIsUpdating]    = useState(false);
  const [updateError,   setUpdateError]   = useState<string | null>(null);
  const [updateSuccess, setUpdateSuccess] = useState(false);

  const isDirty = editedGuests.some(
    (g, i) => guests[i] === undefined || g.guest_name !== guests[i]!.guest_name
  );

  async function handleSaveGuests() {
    setIsUpdating(true);
    setUpdateError(null);
    setUpdateSuccess(false);
    const result = await updateGuestNames(registration.id, editedGuests);
    setIsUpdating(false);
    if ("error" in result) {
      setUpdateError(result.error);
    } else {
      setUpdateSuccess(true);
    }
  }

  // ── Add new guests ────────────────────────────────────────────────────────
  const [newGuestFields, setNewGuestFields] = useState<string[]>([]);
  const [isAdding,   setIsAdding]   = useState(false);
  const [addError,   setAddError]   = useState<string | null>(null);

  function addField() {
    setNewGuestFields((prev) => [...prev, ""]);
  }
  function removeField(index: number) {
    setNewGuestFields((prev) => prev.filter((_, i) => i !== index));
  }
  function updateField(index: number, value: string) {
    setNewGuestFields((prev) => prev.map((v, i) => (i === index ? value : v)));
  }

  const newGuestCount = newGuestFields.filter((n) => n.trim() !== "").length;
  const addTotal      = newGuestCount * eventTicketPrice;

  async function handleAddGuests() {
    const validNames = newGuestFields.filter((n) => n.trim() !== "");
    if (validNames.length === 0) return;

    setIsAdding(true);
    setAddError(null);
    const result = await addGuestsToRegistration(registration.id, validNames);
    setIsAdding(false);

    if ("error" in result) {
      setAddError(result.error);
      return;
    }

    if ("checkoutUrl" in result) {
      window.location.href = result.checkoutUrl;
      return;
    }

    window.location.href = result.confirmationUrl;
  }

  // ── Styles ────────────────────────────────────────────────────────────────
  const inputClass =
    "bg-white/10 border-white/20 text-white placeholder:text-white/30 focus-visible:border-sn-gold";
  const labelClass  = "text-white/70 text-xs font-semibold uppercase tracking-wider";
  const errorClass  = "text-red-400 text-xs mt-1";

  // ── Read-only mode ────────────────────────────────────────────────────────
  if (!registrationOpen) {
    return (
      <div className="bg-sn-surface rounded-xl border border-sn-gold/20 p-5 space-y-3">
        <p className={labelClass}>Guests</p>
        {guests.length === 0 ? (
          <p className="text-white/50 text-sm">No additional guests on this registration.</p>
        ) : (
          <ul className="space-y-1">
            {guests.map((g) => (
              <li key={g.id} className="text-white text-sm">{g.guest_name}</li>
            ))}
          </ul>
        )}
        <p className="text-white/40 text-xs">
          Registration is closed.{" "}
          <a
            href="mailto:info@csusigmanu.com"
            className="text-sn-gold hover:text-sn-gold-light underline"
          >
            Email us
          </a>{" "}
          to request changes.
        </p>
      </div>
    );
  }

  // ── Editable mode ─────────────────────────────────────────────────────────
  return (
    <div className="bg-sn-surface rounded-xl border border-sn-gold/20 p-5 space-y-6">
      {/* Section 1: Edit existing guests */}
      <div className="space-y-3">
        <p className={labelClass}>Manage Guests</p>

        {editedGuests.length === 0 ? (
          <p className="text-white/50 text-sm">No additional guests on this registration.</p>
        ) : (
          <div className="space-y-2">
            {editedGuests.map((guest, i) => (
              <Input
                key={guest.id}
                type="text"
                value={guest.guest_name}
                onChange={(e) => {
                  const val = e.target.value;
                  setEditedGuests((prev) =>
                    prev.map((g, idx) => (idx === i ? { ...g, guest_name: val } : g))
                  );
                  setUpdateSuccess(false);
                }}
                className={inputClass}
                aria-label={`Guest ${i + 1} name`}
              />
            ))}
          </div>
        )}

        {editedGuests.length > 0 && (
          <div className="flex items-center gap-3">
            <Button
              type="button"
              onClick={handleSaveGuests}
              disabled={!isDirty || isUpdating}
              className="h-8 px-4 text-xs bg-sn-gold text-sn-black hover:bg-sn-gold-light font-semibold disabled:opacity-40"
            >
              {isUpdating ? "Saving…" : "Save changes"}
            </Button>
            {updateSuccess && (
              <span className="text-green-400 text-xs">✓ Saved</span>
            )}
          </div>
        )}

        {updateError !== null && (
          <p className={errorClass}>{updateError}</p>
        )}
      </div>

      {/* Divider */}
      <div className="border-t border-white/10" />

      {/* Section 2: Add new guests */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className={labelClass}>Add Guests</p>
          {eventTicketPrice > 0 && (
            <span className="text-white/40 text-xs">
              ${eventTicketPrice.toFixed(2)} per person
            </span>
          )}
        </div>

        {newGuestFields.map((value, i) => (
          <div key={i} className="flex gap-2 items-center">
            <Input
              type="text"
              placeholder={`Guest full name`}
              value={value}
              onChange={(e) => updateField(i, e.target.value)}
              className={`flex-1 ${inputClass}`}
            />
            <button
              type="button"
              onClick={() => removeField(i)}
              className="h-9 px-2 text-white/40 hover:text-red-400 transition-colors text-sm"
              aria-label="Remove guest"
            >
              ✕
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={addField}
          className="text-sn-gold hover:text-sn-gold-light text-sm transition-colors"
        >
          + Add a guest
        </button>

        {newGuestCount > 0 && (
          <>
            {eventTicketPrice > 0 && (
              <div className="rounded-lg border border-sn-gold/20 bg-sn-gold/5 px-4 py-3 flex justify-between text-sm">
                <span className="text-white/70">
                  {newGuestCount} guest{newGuestCount !== 1 ? "s" : ""} × ${eventTicketPrice.toFixed(2)}
                </span>
                <span className="text-white font-semibold">${addTotal.toFixed(2)}</span>
              </div>
            )}

            <Button
              type="button"
              onClick={handleAddGuests}
              disabled={isAdding}
              className="w-full h-9 bg-sn-gold text-sn-black hover:bg-sn-gold-light font-semibold text-sm disabled:opacity-40"
            >
              {isAdding
                ? "Processing…"
                : eventTicketPrice > 0
                ? `Add Guest${newGuestCount !== 1 ? "s" : ""} — $${addTotal.toFixed(2)}`
                : `Add Guest${newGuestCount !== 1 ? "s" : ""}`}
            </Button>
          </>
        )}

        {addError !== null && (
          <p className={errorClass}>{addError}</p>
        )}
      </div>
    </div>
  );
}
