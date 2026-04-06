"use client";

import { useState } from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/style.css";

interface Props {
  eventDates: Date[];
}

export function EventsCalendar({ eventDates }: Props) {
  const [month, setMonth] = useState(new Date());

  return (
    <div className="bg-sn-black rounded-xl border border-sn-gold/20 p-4">
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
            "--rdp-accent-color":       "var(--color-sn-gold, #C6A75E)",
            "--rdp-background-color":   "rgba(198,167,94,0.15)",
            "--rdp-accent-color-dark":  "var(--color-sn-gold-light, #E0C97F)",
            color:                      "rgba(255,255,255,0.7)",
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
          background: rgba(198,167,94,0.2);
          color: #E0C97F;
          font-weight: 600;
        }
        .rdp-button_previous, .rdp-button_next {
          color: rgba(255,255,255,0.5);
          background: transparent;
          border: none;
          cursor: pointer;
        }
        .rdp-button_previous:hover, .rdp-button_next:hover {
          color: white;
        }
      `}</style>
    </div>
  );
}
