"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  createEvent,
  updateEvent,
  checkSlugAvailable,
  saveEventFields,
  type EventFormInput,
} from "@/lib/admin/event-actions";
import { Button } from "@/components/ui/button";
import { RichTextEditor } from "@/components/ui/RichTextEditor";
import { EventBannerUpload } from "@/components/admin/EventBannerUpload";
import { EventFieldsBuilder, type EventFieldDraft } from "@/components/admin/EventFieldsBuilder";
import { titleToSlug } from "@/lib/events/slug";
import { Edit2, Check, X } from "lucide-react";
import type { EventRow, EventFieldRow } from "@/types/database";

interface Props {
  event?:                  EventRow;
  initialFields?:          EventFieldRow[];
  responseCountByFieldId?: Record<string, number>;
}

function toDatetimeLocal(isoString: string): string {
  const d   = new Date(isoString);
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `T${pad(d.getHours())}:${pad(d.getMinutes())}`
  );
}

function fieldRowsToDrafts(rows: EventFieldRow[]): EventFieldDraft[] {
  return rows.map((r) => ({
    id:            r.id,
    field_label:   r.field_label,
    field_type:    r.field_type as EventFieldDraft["field_type"],
    field_options: (r.field_options as { options: string[] } | null) ?? null,
    required:      r.required,
    display_order: r.display_order,
  }));
}

export function EventForm({ event, initialFields = [], responseCountByFieldId = {} }: Props) {
  const router  = useRouter();
  const isEdit  = event !== undefined;

  // ── Basic Info ──────────────────────────────────────────────────────────────
  const [title, setTitle]                 = useState(event?.title ?? "");
  const [slug, setSlug]                   = useState(event?.slug ?? "");
  const [slugEditing, setSlugEditing]     = useState(false);
  const [slugValid, setSlugValid]         = useState<boolean | null>(null);
  const [slugChecking, setSlugChecking]   = useState(false);
  const [eventType, setEventType]         = useState<"internal" | "external">(
    (event?.event_type as "internal" | "external") ?? "external"
  );
  const [status, setStatus]               = useState<"draft" | "published" | "archived">(
    (event?.status as "draft" | "published" | "archived") ?? "draft"
  );
  const [registrationOpen, setRegistrationOpen] = useState(event?.registration_open ?? true);

  // ── Details ─────────────────────────────────────────────────────────────────
  const [eventDate, setEventDate]         = useState(
    event !== undefined ? toDatetimeLocal(event.event_date) : ""
  );
  const [location, setLocation]           = useState(event?.location ?? "");
  const [description, setDescription]     = useState(event?.rich_description ?? event?.description ?? "");
  const [bannerUrl, setBannerUrl]         = useState(event?.banner_image_url ?? "");

  // ── Pricing & Capacity ──────────────────────────────────────────────────────
  const [price, setPrice]                 = useState(String(event?.ticket_price ?? "0"));
  const [earlyBirdEnabled, setEarlyBirdEnabled] = useState(
    event?.early_bird_price !== null && event?.early_bird_price !== undefined
  );
  const [earlyBirdPrice, setEarlyBirdPrice]     = useState(
    event?.early_bird_price !== null && event?.early_bird_price !== undefined
      ? String(event.early_bird_price)
      : ""
  );
  const [earlyBirdEndsAt, setEarlyBirdEndsAt]   = useState(
    event?.early_bird_ends_at !== null && event?.early_bird_ends_at !== undefined
      ? toDatetimeLocal(event.early_bird_ends_at)
      : ""
  );
  const [capacityMode, setCapacityMode]   = useState<"unlimited" | "capped" | "waitlist">(
    (event?.capacity_mode as "unlimited" | "capped" | "waitlist") ?? "unlimited"
  );
  const [capacity, setCapacity]           = useState(
    event?.capacity !== null && event?.capacity !== undefined ? String(event.capacity) : ""
  );
  const [closesAt, setClosesAt]           = useState(
    event?.registration_closes_at !== null && event?.registration_closes_at !== undefined
      ? toDatetimeLocal(event.registration_closes_at)
      : ""
  );

  // ── Custom Fields ───────────────────────────────────────────────────────────
  const [fields, setFields]               = useState<EventFieldDraft[]>(
    fieldRowsToDrafts(initialFields)
  );

  // ── Form state ──────────────────────────────────────────────────────────────
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState<string | null>(null);

  // ── Slug auto-generation from title ─────────────────────────────────────────
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (slugEditing) return; // don't override manual edits
    if (debounceRef.current !== null) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (title.trim() !== "") {
        const auto = titleToSlug(title);
        setSlug(auto);
        void validateSlug(auto);
      }
    }, 300);
    return () => {
      if (debounceRef.current !== null) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, slugEditing]);

  async function validateSlug(value: string) {
    if (value === "") { setSlugValid(null); return; }
    const slugPattern = /^[a-z0-9-]+$/;
    if (!slugPattern.test(value)) { setSlugValid(false); return; }
    setSlugChecking(true);
    const available = await checkSlugAvailable(value, isEdit ? event?.id : undefined);
    setSlugChecking(false);
    setSlugValid(available);
  }

  // ── Submit ──────────────────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const data: EventFormInput = {
      title,
      slug,
      description:            undefined,
      rich_description:       description !== "" ? description : undefined,
      event_date:             new Date(eventDate).toISOString(),
      location:               location !== "" ? location : undefined,
      ticket_price:           parseFloat(price) || 0,
      early_bird_price:       earlyBirdEnabled && earlyBirdPrice !== ""
                                ? (parseFloat(earlyBirdPrice) || 0) : "",
      early_bird_ends_at:     earlyBirdEnabled && earlyBirdEndsAt !== ""
                                ? new Date(earlyBirdEndsAt).toISOString() : undefined,
      registration_closes_at: closesAt !== ""
                                ? new Date(closesAt).toISOString() : undefined,
      capacity_mode:          capacityMode,
      capacity:               capacityMode !== "unlimited" && capacity !== ""
                                ? Number(capacity) : "",
      status,
      registration_open:      registrationOpen,
      event_type:             eventType,
      banner_image_url:       bannerUrl !== "" ? bannerUrl : undefined,
    };

    const result = isEdit
      ? await updateEvent(event.id, data)
      : await createEvent(data);

    if ("error" in result) {
      setError(result.error);
      setLoading(false);
      return;
    }

    const eventId = "id" in result ? (result as { id: string }).id : event?.id ?? "";

    // Save custom fields
    if (fields.length > 0 || initialFields.length > 0) {
      const fieldsResult = await saveEventFields(eventId, fields);
      if ("error" in fieldsResult) {
        setError(fieldsResult.error);
        setLoading(false);
        return;
      }
    }

    router.push("/admin/events");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-2xl">

      {/* ── Basic Info ─────────────────────────────────────────────────────── */}
      <section className="space-y-5">
        <h3 className="text-sn-gold text-xs font-semibold uppercase tracking-widest">
          Basic Info
        </h3>

        <Field label="Title" required>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className={inputCls}
            placeholder="e.g. 30th Anniversary Reunion"
          />
        </Field>

        {/* Slug */}
        <Field label="Slug (URL)">
          <div className="flex items-center gap-2">
            <div className="flex-1 flex items-center gap-2 rounded-lg bg-sn-gray-dark border border-white/10 px-3 py-2 text-sm">
              <span className="text-white/30 text-xs whitespace-nowrap">csusigmanu.com/events/</span>
              {slugEditing ? (
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => {
                    const v = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "");
                    setSlug(v);
                    void validateSlug(v);
                  }}
                  className="flex-1 bg-transparent text-white text-sm focus:outline-none"
                  autoFocus
                />
              ) : (
                <span className="text-white flex-1">{slug !== "" ? slug : "—"}</span>
              )}
              {slugChecking && <span className="text-white/30 text-xs">checking…</span>}
              {!slugChecking && slugValid === true  && <Check size={12} className="text-green-400 shrink-0" />}
              {!slugChecking && slugValid === false && <X    size={12} className="text-red-400  shrink-0" />}
            </div>
            <button
              type="button"
              onClick={() => setSlugEditing(!slugEditing)}
              className="p-2 text-white/40 hover:text-sn-gold transition-colors"
              title={slugEditing ? "Lock slug" : "Edit slug"}
            >
              <Edit2 size={14} />
            </button>
          </div>
          {!slugChecking && slugValid === false && (
            <p className="text-red-400 text-xs mt-1">
              This slug is already taken or contains invalid characters.
            </p>
          )}
        </Field>

        {/* Event type */}
        <Field label="Visibility">
          <div className="flex rounded-lg overflow-hidden border border-white/10 w-fit">
            {(["external", "internal"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setEventType(t)}
                className={`px-4 py-2 text-sm transition-colors ${
                  eventType === t
                    ? "bg-sn-gold text-sn-black font-semibold"
                    : "bg-sn-gray-dark text-white/60 hover:text-white"
                }`}
              >
                {t === "external" ? "Public (Landing Page)" : "Internal (Members Only)"}
              </button>
            ))}
          </div>
        </Field>

        {/* Status */}
        <Field label="Status" required>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as "draft" | "published" | "archived")}
            className={inputCls}
          >
            <option value="draft">Draft — not visible to public</option>
            <option value="published">Published — open for registration</option>
            <option value="archived">Archived — hidden, history preserved</option>
          </select>
        </Field>

        {/* Registration open */}
        <label className="flex items-center gap-3 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={registrationOpen}
            onChange={(e) => setRegistrationOpen(e.target.checked)}
            className="w-4 h-4 rounded border border-white/20 bg-sn-gray-dark accent-sn-gold"
          />
          <span className="text-white/70 text-sm">Registration open</span>
        </label>
      </section>

      <div className="border-t border-white/5" />

      {/* ── Details ────────────────────────────────────────────────────────── */}
      <section className="space-y-5">
        <h3 className="text-sn-gold text-xs font-semibold uppercase tracking-widest">
          Details
        </h3>

        <Field label="Date &amp; Time" required>
          <input
            type="datetime-local"
            value={eventDate}
            onChange={(e) => setEventDate(e.target.value)}
            required
            className={inputCls}
          />
        </Field>

        <Field label="Location">
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className={inputCls}
            placeholder="e.g. Columbus Trade Center"
          />
        </Field>

        <Field label="Description">
          <RichTextEditor
            value={description}
            onChange={setDescription}
            placeholder="Event description, schedule, what to bring…"
          />
        </Field>

        <Field label="Banner Image">
          <EventBannerUpload
            eventId={isEdit ? event?.id ?? null : null}
            currentUrl={bannerUrl !== "" ? bannerUrl : null}
            onUpload={(url) => setBannerUrl(url)}
          />
        </Field>
      </section>

      <div className="border-t border-white/5" />

      {/* ── Pricing & Capacity ─────────────────────────────────────────────── */}
      <section className="space-y-5">
        <h3 className="text-sn-gold text-xs font-semibold uppercase tracking-widest">
          Pricing &amp; Capacity
        </h3>

        <Field label="Ticket Price ($)" required>
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            min="0"
            step="0.01"
            required
            className={inputCls}
          />
        </Field>

        {/* Early bird */}
        <div className="space-y-3">
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={earlyBirdEnabled}
              onChange={(e) => setEarlyBirdEnabled(e.target.checked)}
              className="w-4 h-4 rounded border border-white/20 bg-sn-gray-dark accent-sn-gold"
            />
            <span className="text-white/70 text-sm">Enable early bird pricing</span>
          </label>

          {earlyBirdEnabled && (
            <div className="grid grid-cols-2 gap-4 pl-7">
              <Field label="Early bird price ($)">
                <input
                  type="number"
                  value={earlyBirdPrice}
                  onChange={(e) => setEarlyBirdPrice(e.target.value)}
                  min="0"
                  step="0.01"
                  className={inputCls}
                  placeholder="0.00"
                />
              </Field>
              <Field label="Early bird ends">
                <input
                  type="datetime-local"
                  value={earlyBirdEndsAt}
                  onChange={(e) => setEarlyBirdEndsAt(e.target.value)}
                  className={inputCls}
                />
              </Field>
            </div>
          )}
        </div>

        {/* Capacity mode */}
        <Field label="Capacity Mode">
          <div className="space-y-2">
            {(
              [
                ["unlimited",  "Unlimited — no cap"],
                ["capped",     "Capped — close when full"],
                ["waitlist",   "Capped with Waitlist — offer waitlist when full"],
              ] as [string, string][]
            ).map(([val, label]) => (
              <label key={val} className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="radio"
                  name="capacity_mode"
                  value={val}
                  checked={capacityMode === val}
                  onChange={() => setCapacityMode(val as "unlimited" | "capped" | "waitlist")}
                  className="accent-sn-gold"
                />
                <span className="text-white/70 text-sm">{label}</span>
              </label>
            ))}
          </div>
        </Field>

        {capacityMode !== "unlimited" && (
          <Field label="Capacity">
            <input
              type="number"
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              min="1"
              step="1"
              className={inputCls}
              placeholder="e.g. 200"
            />
          </Field>
        )}

        {/* Registration deadline */}
        <Field label="Registration deadline (optional)">
          <input
            type="datetime-local"
            value={closesAt}
            onChange={(e) => setClosesAt(e.target.value)}
            className={inputCls}
          />
        </Field>
      </section>

      <div className="border-t border-white/5" />

      {/* ── Custom Fields ──────────────────────────────────────────────────── */}
      <section className="space-y-4">
        <div>
          <h3 className="text-sn-gold text-xs font-semibold uppercase tracking-widest">
            Custom Fields
          </h3>
          <p className="text-white/40 text-xs mt-1">
            Collect additional information from registrants.
          </p>
        </div>

        <EventFieldsBuilder
          fields={fields}
          onChange={setFields}
          responseCountByFieldId={responseCountByFieldId}
        />
      </section>

      {error !== null && (
        <p className="text-red-400 text-sm">{error}</p>
      )}

      <div className="flex gap-3 pt-2">
        <Button
          type="submit"
          disabled={loading}
          className="bg-sn-gold text-sn-black hover:bg-sn-gold-light font-semibold"
        >
          {loading ? "Saving…" : isEdit ? "Save Changes" : "Create Event"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.push("/admin/events")}
          className="text-white/60 hover:text-white"
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const inputCls =
  "w-full rounded-lg bg-sn-gray-dark border border-white/10 text-white text-sm px-3 py-2 focus:outline-none focus:border-sn-gold/50 placeholder:text-white/30";

function Field({
  label,
  required,
  children,
}: {
  label:     string;
  required?: boolean;
  children:  React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-white/70 text-xs font-semibold uppercase tracking-wider">
        {label}
        {required === true && <span className="text-sn-gold ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}
