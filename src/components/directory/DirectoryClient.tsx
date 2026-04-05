"use client";

import { useState, useMemo } from "react";
import Link from "next/link";

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

export function DirectoryClient({ members, pledgeClasses }: DirectoryClientProps) {
  const [query, setQuery]         = useState("");
  const [classFilter, setClass]   = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return members.filter((m) => {
      if (
        classFilter !== "" &&
        (m.pledge_class ?? "") !== classFilter
      ) {
        return false;
      }
      if (q === "") return true;
      return (
        m.first_name.toLowerCase().includes(q) ||
        m.last_name.toLowerCase().includes(q) ||
        (m.nickname ?? "").toLowerCase().includes(q) ||
        (m.pin_number ?? "").toLowerCase().includes(q)
      );
    });
  }, [members, query, classFilter]);

  return (
    <div className="space-y-5">
      {/* Controls */}
      <div className="flex flex-wrap gap-2 items-center">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search brothers…"
          className="h-9 rounded-lg border border-white/20 bg-white/10 px-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-sn-gold w-52"
        />
        <select
          value={classFilter}
          onChange={(e) => setClass(e.target.value)}
          className="h-9 rounded-lg border border-white/20 bg-sn-navy px-3 text-sm text-white focus:outline-none focus:border-sn-gold"
        >
          <option value="">All pledge classes</option>
          {pledgeClasses.map((pc) => (
            <option key={pc} value={pc}>{pc}</option>
          ))}
        </select>
        <span className="text-white/40 text-sm ml-auto">
          {filtered.length} brother{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Cards */}
      {filtered.length === 0 ? (
        <p className="text-center text-white/40 py-16">No brothers match your search.</p>
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
      className="group bg-sn-navy rounded-xl border border-sn-gold/20 p-4 flex flex-col items-center text-center gap-3 hover:border-sn-gold/50 hover:bg-sn-navy/80 transition-colors"
    >
      {/* Avatar */}
      <div className="w-16 h-16 rounded-full overflow-hidden bg-sn-navy-dark border-2 border-sn-gold/30 flex items-center justify-center shrink-0 select-none group-hover:border-sn-gold/60 transition-colors">
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
