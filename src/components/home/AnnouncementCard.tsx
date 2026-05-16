"use client";

import { useState } from "react";
import { Pin } from "lucide-react";
import { RichTextContent } from "@/components/ui/RichTextContent";

interface Props {
  title:     string;
  body:      string;
  date:      string;
  isPinned?: boolean;
}

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7)  return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} week${Math.floor(days / 7) !== 1 ? "s" : ""} ago`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function AnnouncementCard({ title, body, date, isPinned }: Props) {
  const [expanded, setExpanded] = useState(false);
  const isLong = body.length > 200;

  return (
    <div className="bg-sn-surface rounded-xl border-t-2 border-t-sn-gold px-5 py-4">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          {isPinned === true && (
            <Pin className="w-3 h-3 text-sn-gold shrink-0" />
          )}
          <h3 className="text-sn-off-white font-semibold text-sm truncate">{title}</h3>
        </div>
        <span
          className="text-sn-gray-medium text-xs shrink-0"
          title={new Date(date).toLocaleDateString("en-US", {
            month: "long", day: "numeric", year: "numeric",
          })}
        >
          {relativeTime(date)}
        </span>
      </div>

      <div className={`relative ${!expanded && isLong ? "max-h-24 overflow-hidden" : ""}`}>
        <RichTextContent
          content={body}
          className="text-sn-gray-text text-sm leading-relaxed"
        />
        {!expanded && isLong && (
          <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-sn-surface to-transparent pointer-events-none" />
        )}
      </div>

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
