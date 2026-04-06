"use client";

import { useState } from "react";

interface Props {
  title: string;
  body:  string;
  date:  string;
}

export function AnnouncementCard({ title, body, date }: Props) {
  const [expanded, setExpanded] = useState(false);
  const isLong = body.length > 200;
  const displayBody = !expanded && isLong ? body.slice(0, 200) + "…" : body;

  return (
    <div className="bg-sn-black rounded-xl border border-sn-gold/20 px-5 py-4">
      <div className="flex items-start justify-between gap-3 mb-2">
        <h3 className="text-white font-semibold text-sm">{title}</h3>
        <span className="text-white/30 text-xs shrink-0">
          {new Date(date).toLocaleDateString("en-US", {
            month: "short", day: "numeric", year: "numeric",
          })}
        </span>
      </div>
      <p className="text-white/60 text-sm leading-relaxed whitespace-pre-wrap">{displayBody}</p>
      {isLong && (
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="mt-2 text-sn-gold text-xs hover:text-sn-gold-light transition-colors"
        >
          {expanded ? "Show less" : "Read more"}
        </button>
      )}
    </div>
  );
}
