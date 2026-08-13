"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "cmdk";
import { Search, Users, Calendar } from "lucide-react";
import { searchCommandPalette, type CommandSearchResults } from "@/lib/search/commandSearchActions";
import { eventHref } from "@/lib/events/slug";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

const EMPTY: CommandSearchResults = { members: [], events: [] };

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CommandSearchResults>(EMPTY);
  const [loading, setLoading] = useState(false);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!isOpen) {
      setQuery("");
      setResults(EMPTY);
    }
  }, [isOpen]);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults(EMPTY);
      setLoading(false);
      return;
    }
    setLoading(true);
    const t = setTimeout(() => {
      searchCommandPalette(query).then((r) => setResults(r)).finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(t);
  }, [query]);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (!isOpen) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  function go(href: string) {
    onClose();
    router.push(href);
  }

  return (
    <div className="fixed inset-0 z-[60]">
      <button type="button" aria-label="Close search" onClick={onClose} className="absolute inset-0 bg-black/60" />
      <div className="absolute inset-0 flex items-start justify-center pt-0 sm:pt-24 sm:px-4">
        <Command
          shouldFilter={false}
          className="relative w-full h-full sm:h-auto sm:max-w-lg bg-sn-surface sm:rounded-2xl border-0 sm:border sm:border-white/8 flex flex-col overflow-hidden"
        >
          <div className="flex items-center gap-2.5 px-4 border-b border-white/8">
            <Search size={15} className="text-sn-gray-medium shrink-0" />
            <CommandInput
              autoFocus
              value={query}
              onValueChange={setQuery}
              placeholder="Search brothers and events…"
              className="flex-1 bg-transparent py-3.5 text-sm text-sn-text placeholder:text-sn-gray-medium focus:outline-none"
            />
            <button type="button" onClick={onClose} className="sm:hidden text-sn-gray-medium text-xs shrink-0">
              Cancel
            </button>
          </div>

          <CommandList className="flex-1 sm:max-h-96 overflow-y-auto p-2">
            {query.trim().length < 2 ? (
              <p className="text-sn-gray-medium text-xs text-center py-8">Type at least 2 characters to search.</p>
            ) : loading ? (
              <p className="text-sn-gray-medium text-xs text-center py-8">Searching…</p>
            ) : (
              <CommandEmpty>
                <p className="text-sn-gray-medium text-xs text-center py-8">No brothers match your search.</p>
              </CommandEmpty>
            )}

            {results.members.length > 0 && (
              <CommandGroup
                heading="Brothers"
                className="[&_[cmdk-group-heading]]:text-sn-gray-medium [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wide [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5"
              >
                {results.members.map((m) => (
                  <CommandItem
                    key={m.id}
                    value={`member-${m.id}`}
                    onSelect={() => go(`/profile/${m.id}`)}
                    className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm text-sn-text cursor-pointer data-[selected=true]:bg-sn-gold/14 data-[selected=true]:text-sn-gold-light"
                  >
                    <Users size={14} className="text-sn-gray-medium shrink-0" />
                    <span className="flex-1 truncate">{m.name}</span>
                    {m.meta !== null && <span className="text-sn-gray-medium text-xs shrink-0">{m.meta}</span>}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {results.events.length > 0 && (
              <CommandGroup
                heading="Events"
                className="[&_[cmdk-group-heading]]:text-sn-gray-medium [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wide [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5"
              >
                {results.events.map((e) => (
                  <CommandItem
                    key={e.id}
                    value={`event-${e.id}`}
                    onSelect={() => go(eventHref(e))}
                    className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm text-sn-text cursor-pointer data-[selected=true]:bg-sn-gold/14 data-[selected=true]:text-sn-gold-light"
                  >
                    <Calendar size={14} className="text-sn-gray-medium shrink-0" />
                    <span className="flex-1 truncate">{e.title}</span>
                    <span className="text-sn-gray-medium text-xs shrink-0">{e.dateLabel}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </div>
    </div>
  );
}
