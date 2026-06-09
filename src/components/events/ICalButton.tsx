"use client";

import { CalendarPlus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EventData {
  id:          string;
  title:       string;
  description: string | null;
  event_date:  string;
  location:    string | null;
}

interface Props {
  event: EventData;
}

/** Strips HTML tags to get plain text for the iCal DESCRIPTION field.
 *  Uses the browser DOM parser (textContent) — handles all tag edge cases
 *  and is safe: setting innerHTML on a detached element never executes scripts. */
function stripHtml(html: string): string {
  const tmp = document.createElement("div");
  tmp.innerHTML = html;
  return (tmp.textContent ?? "").replace(/\s+/g, " ").trim();
}

/** Formats a JS Date as iCal DTSTART/DTEND format: YYYYMMDDTHHmmssZ */
function toICalDate(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}` +
    `T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`
  );
}

/** Escapes special characters in iCal text values. */
function escapeIcal(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

export function ICalButton({ event }: Props) {
  function handleDownload() {
    const start   = new Date(event.event_date);
    const end     = new Date(start.getTime() + 3 * 60 * 60 * 1000); // +3 hours
    const now     = new Date();
    const desc    = event.description !== null ? stripHtml(event.description) : "";

    const ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Sigma Nu Mu Xi Alumni Hub//EN",
      "BEGIN:VEVENT",
      `UID:${event.id}@csusigmanu.com`,
      `DTSTAMP:${toICalDate(now)}`,
      `DTSTART:${toICalDate(start)}`,
      `DTEND:${toICalDate(end)}`,
      `SUMMARY:${escapeIcal(event.title)}`,
      desc !== "" ? `DESCRIPTION:${escapeIcal(desc)}` : null,
      event.location !== null ? `LOCATION:${escapeIcal(event.location)}` : null,
      "END:VEVENT",
      "END:VCALENDAR",
    ]
      .filter(Boolean)
      .join("\r\n");

    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `${event.title.toLowerCase().replace(/\s+/g, "-")}.ics`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={handleDownload}
      className="text-white/60 hover:text-white hover:bg-white/10 gap-1.5"
    >
      <CalendarPlus size={14} />
      Add to Calendar
    </Button>
  );
}
