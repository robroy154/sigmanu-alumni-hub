"use client";

import { useState, useEffect, useRef } from "react";
import {
  searchBigBrotherCandidates,
  getBigBrotherById,
  type BigBrotherCandidate,
} from "@/lib/auth/big-brother-search";

interface BigBrotherSearchProps {
  value:         string | null;
  // Pre-selected big_id to resolve and display (e.g. inherited from a claimed stub).
  initialBigId?: string | null;
  onChange:      (id: string | null) => void;
}

function formatDisplay(c: BigBrotherCandidate): string {
  const pin = c.pinNumber !== null
    ? ` — ΜΞ ${String(c.pinNumber).padStart(3, "0")}`
    : "";
  const pc  = c.pledgeClass !== null ? ` · ${c.pledgeClass}` : "";
  const tag = c.status === "stub" ? " (unclaimed)" : "";
  return `${c.firstName} ${c.lastName}${pin}${pc}${tag}`;
}

export function BigBrotherSearch({
  value,
  initialBigId,
  onChange,
}: BigBrotherSearchProps) {
  const [query, setQuery]               = useState("");
  const [candidates, setCandidates]     = useState<BigBrotherCandidate[]>([]);
  const [isOpen, setIsOpen]             = useState(false);
  const [selectedName, setSelectedName] = useState<string | null>(null);
  const [loading, setLoading]           = useState(false);

  const containerRef   = useRef<HTMLDivElement>(null);
  const debounceRef    = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Stable ref to avoid stale closure in effects
  const onChangeRef    = useRef(onChange);
  onChangeRef.current  = onChange;
  // Guard: only apply initialBigId once
  const initialApplied = useRef(false);

  // Load browse candidates on mount (shown on focus before typing)
  useEffect(() => {
    void searchBigBrotherCandidates("").then(setCandidates);
  }, []);

  // Resolve initialBigId → display name; runs once when prop becomes non-null
  useEffect(() => {
    if (initialApplied.current) return;
    if (initialBigId == null) return;
    initialApplied.current = true;
    void getBigBrotherById(initialBigId).then((candidate) => {
      if (candidate !== null) {
        setSelectedName(formatDisplay(candidate));
        onChangeRef.current(candidate.id);
      }
    });
  }, [initialBigId]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        containerRef.current !== null &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function handleQueryChange(raw: string) {
    setQuery(raw);
    if (raw === "") {
      onChangeRef.current(null);
      setSelectedName(null);
    }
    if (debounceRef.current !== null) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setLoading(true);
      void searchBigBrotherCandidates(raw).then((res) => {
        setCandidates(res);
        setLoading(false);
      });
    }, 300);
  }

  function handleSelect(c: BigBrotherCandidate) {
    setSelectedName(formatDisplay(c));
    setQuery("");
    setIsOpen(false);
    onChangeRef.current(c.id);
  }

  function handleClear(e: React.MouseEvent) {
    e.stopPropagation();
    setQuery("");
    setSelectedName(null);
    setIsOpen(false);
    onChangeRef.current(null);
    // Reload browse candidates for next focus
    void searchBigBrotherCandidates("").then(setCandidates);
  }

  const displayValue = selectedName !== null ? selectedName : query;
  const hasValue     = selectedName !== null || query !== "";

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <input
          type="text"
          value={displayValue}
          onChange={(e) => {
            if (selectedName !== null) {
              // User started typing after a selection — clear and start fresh
              setSelectedName(null);
              onChangeRef.current(null);
            }
            handleQueryChange(e.target.value);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Escape") setIsOpen(false);
          }}
          placeholder="Search by name or badge number"
          autoComplete="off"
          className="h-9 w-full rounded-lg border border-white/20 bg-white/10 px-3 pr-8 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-sn-gold transition-colors"
        />
        {hasValue && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors text-xs leading-none"
            aria-label="Clear selection"
            tabIndex={-1}
          >
            ✕
          </button>
        )}
      </div>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-white/20 bg-[#1a1a1d] shadow-xl overflow-hidden">
          <div className="max-h-52 overflow-y-auto">
            {loading && (
              <div className="px-3 py-2.5 text-white/40 text-sm">Searching…</div>
            )}
            {!loading && candidates.length === 0 && (
              <div className="px-3 py-2.5 text-white/40 text-sm">No brothers found</div>
            )}
            {!loading && candidates.map((c) => (
              <button
                key={c.id}
                type="button"
                onMouseDown={(e) => {
                  // Prevent input blur before click registers
                  e.preventDefault();
                  handleSelect(c);
                }}
                className={`w-full text-left px-3 py-2 text-sm transition-colors hover:bg-white/10 ${
                  value === c.id ? "text-sn-gold bg-sn-gold/5" : "text-white"
                }`}
              >
                {formatDisplay(c)}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
