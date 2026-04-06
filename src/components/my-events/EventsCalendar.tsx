"use client";

import { useMemo, useState } from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/style.css";

interface Props {
  // ISO date strings — avoids RSC serialisation converting Date objects to strings
  eventDateStrings: string[];
}

export function EventsCalendar({ eventDateStrings }: Props) {
  // Convert ISO strings → Date objects (at midnight local time for correct day matching)
  const eventDates = useMemo(
    () =>
      eventDateStrings.map((s) => {
        const d = new Date(s);
        return new Date(d.getFullYear(), d.getMonth(), d.getDate());
      }),
    [eventDateStrings]
  );

  // Default to the month of the first upcoming event, falling back to today
  const defaultMonth = useMemo(() => {
    const now = new Date();
    const upcoming = eventDates
      .filter((d) => d >= new Date(now.getFullYear(), now.getMonth(), now.getDate()))
      .sort((a, b) => a.getTime() - b.getTime());
    return upcoming[0] ?? now;
  }, [eventDates]);

  const [month, setMonth] = useState(defaultMonth);

  return (
    <div className="bg-sn-black rounded-sm border border-sn-gold/20 p-4">
      <DayPicker
        month={month}
        onMonthChange={setMonth}
        modifiers={{ event: eventDates }}
        modifiersClassNames={{ event: "rdp-event-day" }}
        classNames={{
          root:            "rdp-root",
          months:          "rdp-months",
          month_caption:   "rdp-month_caption",
          nav:             "rdp-nav",
          button_previous: "rdp-button_previous",
          button_next:     "rdp-button_next",
          month_grid:      "rdp-month_grid",
          weekdays:        "rdp-weekdays",
          weekday:         "rdp-weekday",
          week:            "rdp-week",
          day:             "rdp-day",
          day_button:      "rdp-day_button",
          selected:        "rdp-selected",
          today:           "rdp-today",
          outside:         "rdp-outside",
          disabled:        "rdp-disabled",
        }}
        style={
          {
            "--rdp-accent-color":      "var(--color-sn-gold, #C6A75E)",
            "--rdp-background-color":  "rgba(198,167,94,0.15)",
            "--rdp-accent-color-dark": "var(--color-sn-gold-light, #E0C97F)",
            color: "rgba(255,255,255,0.7)",
          } as React.CSSProperties
        }
      />
      <style>{`
        .rdp-root { --rdp-font-family: inherit; }
        .rdp-month_caption { color: white; font-weight: 600; }
        .rdp-weekday { color: rgba(255,255,255,0.3); font-size: 0.7rem; }
        .rdp-day_button { color: rgba(255,255,255,0.6); border-radius: 0.375rem; }
        .rdp-day_button:hover { background: rgba(255,255,255,0.08); color: white; }
        .rdp-today .rdp-day_button { color: #C6A75E; font-weight: 700; }
        .rdp-outside .rdp-day_button { color: rgba(255,255,255,0.2); }
        .rdp-event-day .rdp-day_button {
          background: rgba(198,167,94,0.25) !important;
          color: #E0C97F !important;
          font-weight: 700;
          border-radius: 0.375rem;
        }
        .rdp-button_previous, .rdp-button_next {
          color: rgba(255,255,255,0.5);
          background: transparent;
          border: none;
          cursor: pointer;
        }
        .rdp-button_previous:hover, .rdp-button_next:hover { color: white; }
      `}</style>
    </div>
  );
}
