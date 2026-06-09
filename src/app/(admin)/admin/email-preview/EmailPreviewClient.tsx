"use client";

import { useState } from "react";

interface Template {
  name: string;
  html: string;
}

interface Props {
  templates: Template[];
}

export function EmailPreviewClient({ templates }: Props) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const selected = templates[selectedIndex];

  return (
    <div className="flex gap-4" style={{ height: "calc(100vh - 160px)" }}>

      {/* Template list */}
      <div className="w-52 shrink-0 flex flex-col gap-0.5">
        {templates.map((t, i) => (
          <button
            key={t.name}
            type="button"
            onClick={() => setSelectedIndex(i)}
            className={`text-left px-3 py-2 rounded text-sm transition-colors ${
              i === selectedIndex
                ? "bg-sn-gold/15 text-sn-gold border border-sn-gold/25"
                : "text-white/55 hover:text-white hover:bg-white/5 border border-transparent"
            }`}
          >
            {t.name}
          </button>
        ))}
      </div>

      {/* Rendered preview */}
      <div className="flex-1 flex flex-col gap-2 min-w-0">
        <div className="flex items-center justify-between">
          <span className="text-sm text-white/50">{selected?.name}</span>
          <span className="text-xs text-white/30">
            {selected !== undefined
              ? `${Math.round(selected.html.length / 1024)}KB rendered HTML`
              : ""}
          </span>
        </div>
        <div className="flex-1 rounded-lg overflow-hidden border border-white/10 bg-white">
          {selected !== undefined && (
            <iframe
              srcDoc={selected.html}
              title={selected.name}
              className="w-full h-full"
              sandbox="allow-same-origin"
            />
          )}
        </div>
      </div>

    </div>
  );
}
