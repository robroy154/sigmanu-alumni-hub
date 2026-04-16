"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { adminUpdateMember, assignBadge, removeBadge } from "@/lib/admin/actions";
import { PLEDGE_CLASSES } from "@/lib/utils/pledge-classes";

interface Badge {
  id: string;
  badge_type: string;
}

interface Member {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  nickname: string | null;
  pledge_class: string | null;
  pin_number: string | null;
  phone: string | null;
  city: string | null;
  state: string | null;
  home_address: string | null;
  linkedin_url: string | null;
  status: "pending" | "member" | "admin" | "stub";
  big_id: string | null;
}

interface AdminMemberEditFormProps {
  member: Member;
  badges: Badge[];
  allMembers: { id: string; first_name: string; last_name: string }[];
  resolvedBigName?: string | null | undefined;
  referrerName?: string | null;
  referrerId?:   string | null;
}

export function AdminMemberEditForm({
  member,
  badges,
  allMembers,
  resolvedBigName,
  referrerName,
  referrerId,
}: AdminMemberEditFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const [form, setForm] = useState({
    first_name:   member.first_name,
    last_name:    member.last_name,
    nickname:     member.nickname ?? "",
    pledge_class: member.pledge_class ?? "",
    pin_number:   member.pin_number ?? "",
    phone:        member.phone ?? "",
    city:         member.city ?? "",
    state:        member.state ?? "",
    home_address: member.home_address ?? "",
    linkedin_url: member.linkedin_url ?? "",
    // Stubs default to "pending" in the form — admin sets final status when editing.
    status:       (member.status === "stub" ? "pending" : member.status) as "pending" | "member" | "admin",
    big_id:       member.big_id ?? "",
  });

  function set(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
    };
  }

  async function handleSave() {
    setSaving(true);
    setSaveError(null);
    setSaved(false);

    const result = await adminUpdateMember(member.id, {
      first_name:   form.first_name,
      last_name:    form.last_name,
      nickname:     form.nickname || null,
      pledge_class: form.pledge_class || null,
      pin_number:   form.pin_number || null,
      phone:        form.phone || null,
      city:         form.city || null,
      state:        form.state || null,
      home_address: form.home_address || null,
      linkedin_url: form.linkedin_url || null,
      status:       form.status,
      big_id:       form.big_id || null,
    });

    if ("error" in result) {
      setSaveError(result.error);
    } else {
      setSaved(true);
      router.refresh();
    }
    setSaving(false);
  }

  // Badge state
  const [badgeList, setBadgeList] = useState<Badge[]>(badges);
  const [newBadge, setNewBadge] = useState("");
  const [badgeError, setBadgeError] = useState<string | null>(null);

  async function handleAssignBadge() {
    setBadgeError(null);
    const result = await assignBadge(member.id, newBadge);
    if ("error" in result) {
      setBadgeError(result.error);
    } else {
      setNewBadge("");
      router.refresh();
    }
  }

  async function handleRemoveBadge(badgeId: string) {
    const result = await removeBadge(badgeId, member.id);
    if ("error" in result) {
      setBadgeError(result.error);
    } else {
      setBadgeList((prev) => prev.filter((b) => b.id !== badgeId));
    }
  }

  const inputClass =
    "bg-white/10 border-white/20 text-white placeholder:text-white/30 focus-visible:border-sn-gold h-9";
  const labelClass = "text-white/70 text-xs uppercase tracking-wide";
  const selectClass =
    "h-9 w-full rounded-lg border border-white/20 bg-white/10 px-3 text-sm text-white focus:outline-none focus:border-sn-gold";

  return (
    <div className="space-y-8">
      {/* Profile fields */}
      <section className="bg-sn-black rounded-xl border border-sn-gold/20 p-6 space-y-5">
        <h2 className="text-white font-semibold">Profile</h2>

        <div className="grid grid-cols-2 gap-4">
          <Field label="First name" labelClass={labelClass}>
            <Input className={inputClass} value={form.first_name} onChange={set("first_name")} />
          </Field>
          <Field label="Last name" labelClass={labelClass}>
            <Input className={inputClass} value={form.last_name} onChange={set("last_name")} />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Nickname" labelClass={labelClass}>
            <Input className={inputClass} placeholder="—" value={form.nickname} onChange={set("nickname")} />
          </Field>
          <Field label="Pin number" labelClass={labelClass}>
            <Input className={inputClass} placeholder="—" value={form.pin_number} onChange={set("pin_number")} />
          </Field>
        </div>

        <Field label="Pledge class" labelClass={labelClass}>
          <select className={selectClass} value={form.pledge_class} onChange={set("pledge_class")}>
            <option value="" className="bg-sn-black">— not set —</option>
            {PLEDGE_CLASSES.map((pc) => (
              <option key={pc} value={pc} className="bg-sn-black">{pc}</option>
            ))}
          </select>
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Phone" labelClass={labelClass}>
            <Input className={inputClass} placeholder="—" value={form.phone} onChange={set("phone")} />
          </Field>
          <Field label="LinkedIn URL" labelClass={labelClass}>
            <Input className={inputClass} placeholder="—" value={form.linkedin_url} onChange={set("linkedin_url")} />
          </Field>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Field label="City" labelClass={labelClass}>
            <Input className={inputClass} placeholder="—" value={form.city} onChange={set("city")} />
          </Field>
          <Field label="State" labelClass={labelClass}>
            <Input className={inputClass} placeholder="—" maxLength={2} value={form.state} onChange={set("state")} />
          </Field>
          <Field label="Home address" labelClass={labelClass}>
            <Input className={inputClass} placeholder="—" value={form.home_address} onChange={set("home_address")} />
          </Field>
        </div>
      </section>

      {/* Account settings */}
      <section className="bg-sn-black rounded-xl border border-sn-gold/20 p-6 space-y-5">
        <h2 className="text-white font-semibold">Account</h2>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Status" labelClass={labelClass}>
            <select className={selectClass} value={form.status} onChange={set("status")}>
              <option value="pending" className="bg-sn-black">Pending</option>
              <option value="member"  className="bg-sn-black">Member</option>
              <option value="admin"   className="bg-sn-black">Admin</option>
            </select>
          </Field>

          <Field label="Big brother" labelClass={labelClass}>
            <select className={selectClass} value={form.big_id} onChange={set("big_id")}>
              <option value="" className="bg-sn-black">— none —</option>
              {allMembers
                .filter((m) => m.id !== member.id)
                .map((m) => (
                  <option key={m.id} value={m.id} className="bg-sn-black">
                    {m.first_name} {m.last_name}
                  </option>
                ))}
            </select>
            {/* Show resolved name when big_id points to a stub not in the dropdown */}
            {form.big_id !== "" &&
              !allMembers.some((m) => m.id === form.big_id) &&
              resolvedBigName !== null &&
              resolvedBigName !== undefined && (
                <p className="text-white/50 text-xs mt-1">
                  Currently linked to:{" "}
                  <span className="text-white/70">{resolvedBigName}</span>
                </p>
            )}
          </Field>
        </div>

        {/* Referred by — read-only, admin-only field */}
        <Field label="Referred by" labelClass={labelClass}>
          {referrerName !== null && referrerName !== undefined && referrerId !== null && referrerId !== undefined ? (
            <Link
              href={`/admin/members/${referrerId}`}
              className="text-sn-gold text-sm hover:text-sn-gold-light underline"
            >
              {referrerName}
            </Link>
          ) : (
            <span className="text-white/40 text-sm">—</span>
          )}
        </Field>
      </section>

      {/* Save */}
      {saveError !== null && (
        <p className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-md px-3 py-2">
          {saveError}
        </p>
      )}
      {saved && (
        <p className="text-green-400 text-sm bg-green-400/10 border border-green-400/20 rounded-md px-3 py-2">
          Saved successfully.
        </p>
      )}
      <Button
        onClick={handleSave}
        disabled={saving}
        className="bg-sn-gold text-sn-black hover:bg-sn-gold-light font-semibold"
      >
        {saving ? "Saving…" : "Save changes"}
      </Button>

      {/* Badges */}
      <section className="bg-sn-black rounded-xl border border-sn-gold/20 p-6 space-y-4">
        <h2 className="text-white font-semibold">Badges</h2>

        {badgeList.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {badgeList.map((b) => (
              <span
                key={b.id}
                className="inline-flex items-center gap-1.5 rounded-full bg-sn-gold/15 border border-sn-gold/30 px-3 py-1 text-xs text-sn-gold"
              >
                {b.badge_type}
                <button
                  type="button"
                  onClick={() => handleRemoveBadge(b.id)}
                  className="text-sn-gold/60 hover:text-red-400 transition-colors"
                  aria-label={`Remove ${b.badge_type}`}
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <Input
            value={newBadge}
            onChange={(e) => setNewBadge(e.target.value)}
            placeholder="e.g. Alumni Chapter Officer"
            className="bg-white/10 border-white/20 text-white placeholder:text-white/30 focus-visible:border-sn-gold h-8"
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAssignBadge(); } }}
          />
          <Button
            type="button"
            size="sm"
            onClick={handleAssignBadge}
            disabled={newBadge.trim() === ""}
            className="bg-sn-gold text-sn-black hover:bg-sn-gold-light font-semibold shrink-0"
          >
            Assign
          </Button>
        </div>
        {badgeError !== null && (
          <p className="text-red-400 text-xs">{badgeError}</p>
        )}
      </section>
    </div>
  );
}

function Field({
  label,
  labelClass,
  children,
}: {
  label: string;
  labelClass: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className={labelClass}>{label}</Label>
      {children}
    </div>
  );
}
