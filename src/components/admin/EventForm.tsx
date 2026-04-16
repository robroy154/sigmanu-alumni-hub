"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createEvent, updateEvent, type EventFormInput } from "@/lib/admin/event-actions";
import { Button } from "@/components/ui/button";
import type { EventRow } from "@/types/database";

interface Props {
  /** Pass an existing event to put the form in edit mode. Omit for create. */
  event?: EventRow;
}

function toDatetimeLocal(isoString: string): string {
  // Convert ISO string to YYYY-MM-DDTHH:mm for datetime-local input.
  const d = new Date(isoString);
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `T${pad(d.getHours())}:${pad(d.getMinutes())}`
  );
}

export function EventForm({ event }: Props) {
  const router = useRouter();
  const isEdit = event !== undefined;

  const [title, setTitle]             = useState(event?.title ?? "");
  const [description, setDescription] = useState(event?.description ?? "");
  const [eventDate, setEventDate]     = useState(
    event !== undefined ? toDatetimeLocal(event.event_date) : ""
  );
  const [location, setLocation]       = useState(event?.location ?? "");
  const [price, setPrice]             = useState(String(event?.ticket_price ?? "0"));
  const [capacity, setCapacity]       = useState(
    event?.capacity !== null && event?.capacity !== undefined
      ? String(event.capacity)
      : ""
  );
  const [status, setStatus]           = useState<"draft" | "published" | "archived">(
    (event?.status as "draft" | "published" | "archived") ?? "draft"
  );
  const [registrationOpen, setRegistrationOpen] = useState(event?.registration_open ?? true);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const data: EventFormInput = {
      title,
      description:  description || undefined,
      event_date:   new Date(eventDate).toISOString(),
      location:     location || undefined,
      ticket_price: parseFloat(price) || 0,
      capacity:          capacity !== "" ? Number(capacity) : "",
      status,
      registration_open: registrationOpen,
    };

    const result = isEdit
      ? await updateEvent(event.id, data)
      : await createEvent(data);

    if ("error" in result) {
      setError(result.error);
      setLoading(false);
      return;
    }

    router.push("/admin/events");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-xl">
      <Field label="Title" required>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="w-full rounded-lg bg-sn-gray-dark border border-white/10 text-white text-sm px-3 py-2 focus:outline-none focus:border-sn-gold/50 placeholder:text-white/30"
          placeholder="e.g. 30th Anniversary Reunion"
        />
      </Field>

      <Field label="Description">
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full rounded-lg bg-sn-gray-dark border border-white/10 text-white text-sm px-3 py-2 focus:outline-none focus:border-sn-gold/50 placeholder:text-white/30 resize-none"
          placeholder="Optional event description"
        />
      </Field>

      <Field label="Date &amp; Time" required>
        <input
          type="datetime-local"
          value={eventDate}
          onChange={(e) => setEventDate(e.target.value)}
          required
          className="w-full rounded-lg bg-sn-gray-dark border border-white/10 text-white text-sm px-3 py-2 focus:outline-none focus:border-sn-gold/50"
        />
      </Field>

      <Field label="Location">
        <input
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="w-full rounded-lg bg-sn-gray-dark border border-white/10 text-white text-sm px-3 py-2 focus:outline-none focus:border-sn-gold/50 placeholder:text-white/30"
          placeholder="e.g. Columbus Trade Center"
        />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Ticket Price ($)" required>
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            min="0"
            step="0.01"
            required
            className="w-full rounded-lg bg-sn-gray-dark border border-white/10 text-white text-sm px-3 py-2 focus:outline-none focus:border-sn-gold/50"
          />
        </Field>

        <Field label="Capacity (optional)">
          <input
            type="number"
            value={capacity}
            onChange={(e) => setCapacity(e.target.value)}
            min="1"
            step="1"
            className="w-full rounded-lg bg-sn-gray-dark border border-white/10 text-white text-sm px-3 py-2 focus:outline-none focus:border-sn-gold/50 placeholder:text-white/30"
            placeholder="Unlimited"
          />
        </Field>
      </div>

      <Field label="Status" required>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as "draft" | "published" | "archived")}
          className="w-full rounded-lg bg-sn-gray-dark border border-white/10 text-white text-sm px-3 py-2 focus:outline-none focus:border-sn-gold/50"
        >
          <option value="draft">Draft — not visible to public</option>
          <option value="published">Published — open for registration</option>
          <option value="archived">Archived — hidden, history preserved</option>
        </select>
      </Field>

      <label className="flex items-center gap-3 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={registrationOpen}
          onChange={(e) => setRegistrationOpen(e.target.checked)}
          className="w-4 h-4 rounded border border-white/20 bg-sn-gray-dark accent-sn-gold"
        />
        <span className="text-white/70 text-sm">Registration open</span>
      </label>

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

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
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
