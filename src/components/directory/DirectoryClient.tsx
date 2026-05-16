"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Users, X } from "lucide-react";

export interface DirectoryMember {
  id:               string;
  first_name:       string;
  last_name:        string;
  nickname:         string | null;
  pledge_class:     string | null;
  pin_number:       string | null;
  city:             string | null;
  state:            string | null;
  photo_url:        string | null; // pre-resolved signed URL or null
}

interface DirectoryClientProps {
  members:       DirectoryMember[];
  pledgeClasses: string[]; // sorted list of classes present in DB
}

type SortKey = "last-name" | "first-name" | "pledge-class";

export function DirectoryClient({ members, pledgeClasses }: DirectoryClientProps) {
  const [query, setQuery]       = useState("");
  const [classFilter, setClass] = useState("");
  const [sort, setSort]         = useState<SortKey>("last-name");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const results = members.filter((m) => {
      if (classFilter !== "" && (m.pledge_class ?? "") !== classFilter) return false;
      if (q === "") return true;
      return (
        m.first_name.toLowerCase().includes(q) ||
        m.last_name.toLowerCase().includes(q) ||
        (m.nickname ?? "").toLowerCase().includes(q) ||
        (m.pin_number ?? "").toLowerCase().includes(q)
      );
    });

    results.sort((a, b) => {
      if (sort === "first-name") {
        return a.first_name.localeCompare(b.first_name) || a.last_name.localeCompare(b.last_name);
      }
      if (sort === "pledge-class") {
        const ai = pledgeClasses.indexOf(a.pledge_class ?? "");
        const bi = pledgeClasses.indexOf(b.pledge_class ?? "");
        const diff = (ai === -1 ? 9999 : ai) - (bi === -1 ? 9999 : bi);
        return diff !== 0 ? diff : a.last_name.localeCompare(b.last_name);
      }
      // default: last-name
      return a.last_name.localeCompare(b.last_name) || a.first_name.localeCompare(b.first_name);
    });

    return results;
  }, [members, query, classFilter, sort, pledgeClasses]);

  return (
    <div className="space-y-5">
      {/* Controls */}
      <div className="flex flex-wrap gap-2 items-center">
        {/* Search with clear button */}
        <div className="relative">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search brothers…"
            className="h-9 rounded-lg border border-white/20 bg-white/10 px-3 pr-8 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-sn-gold w-52"
          />
          {query !== "" && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Clear search"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <select
          value={classFilter}
          onChange={(e) => setClass(e.target.value)}
          className="h-9 rounded-lg border border-white/20 bg-sn-black px-3 text-sm text-white focus:outline-none focus:border-sn-gold"
        >
          <option value="">All pledge classes</option>
          {pledgeClasses.map((pc) => (
            <option key={pc} value={pc}>{pc}</option>
          ))}
        </select>

        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          className="h-9 rounded-lg border border-white/20 bg-sn-black px-3 text-sm text-white focus:outline-none focus:border-sn-gold"
        >
          <option value="last-name">Last name A–Z</option>
          <option value="first-name">First name A–Z</option>
          <option value="pledge-class">Pledge class</option>
        </select>

        <span className="text-white/40 text-sm ml-auto">
          {filtered.length} brother{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Cards */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <Users className="size-8 text-sn-gray-medium" />
          <p className="text-sn-gray-text text-sm">No brothers match your search.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((m) => (
            <MemberCard key={m.id} member={m} />
          ))}
        </div>
      )}
    </div>
  );
}

function MemberCard({ member: m }: { member: DirectoryMember }) {
  const initials =
    (m.first_name[0] ?? "") + (m.last_name[0] ?? "");
  const location =
    m.city !== null && m.state !== null
      ? `${m.city}, ${m.state}`
      : (m.city ?? m.state ?? null);

  return (
    <Link
      href={`/profile/${m.id}`}
      className="group bg-sn-black rounded-xl border border-sn-gold/20 p-4 flex flex-col items-center text-center gap-3 hover:border-sn-gold/50 hover:bg-sn-black/80 transition-colors"
    >
      {/* Avatar */}
      <div className="w-16 h-16 rounded-full overflow-hidden bg-sn-black-secondary border-2 border-sn-gold/30 flex items-center justify-center shrink-0 select-none group-hover:border-sn-gold/60 transition-colors">
        {m.photo_url !== null ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={m.photo_url}
            alt={`${m.first_name} ${m.last_name}`}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-sn-gold font-bold text-lg">{initials}</span>
        )}
      </div>

      {/* Name */}
      <div className="min-w-0 w-full">
        <p className="text-white font-semibold text-sm leading-tight truncate">
          {m.first_name} {m.last_name}
        </p>
        {m.nickname !== null && m.nickname !== "" && (
          <p className="text-sn-gold text-xs mt-0.5 truncate">
            &ldquo;{m.nickname}&rdquo;
          </p>
        )}
        {m.pledge_class !== null && (
          <p className="text-white/50 text-xs mt-1">{m.pledge_class} Class</p>
        )}
        {location !== null && (
          <p className="text-white/30 text-xs mt-0.5 truncate">{location}</p>
        )}
      </div>
    </Link>
  );
}
