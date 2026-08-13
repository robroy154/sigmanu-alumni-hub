"use client";

import Link from "next/link";
import type { FamilyTreeMember } from "./types";

interface FamilyTreeMobileChainProps {
  members: FamilyTreeMember[];
  viewerId: string;
}

export function FamilyTreeMobileChain({ members, viewerId }: FamilyTreeMobileChainProps) {
  const memberMap = new Map(members.map((m) => [m.id, m]));
  const viewer = memberMap.get(viewerId) ?? null;

  // Ancestor chain, root-first.
  const ancestors: FamilyTreeMember[] = [];
  let cur = viewer;
  while (cur?.big_id) {
    const big = memberMap.get(cur.big_id);
    if (big === undefined) break;
    ancestors.unshift(big);
    cur = big;
  }

  const littles = members.filter((m) => m.big_id === viewerId);
  const generations = ancestors.length + 1;

  if (viewer === null) {
    return (
      <div className="bg-sn-surface border border-white/8 rounded-2xl p-6 text-center">
        <p className="text-sn-gray-text text-sm">Your profile isn&apos;t linked to the tree yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-24">
      <div>
        <h1 className="font-heading text-sn-off-white text-lg">Your Line</h1>
        <p className="text-sn-gray-medium text-[11px] mt-0.5">
          {generations} generation{generations === 1 ? "" : "s"} · tap a name to view their profile
        </p>
      </div>

      <div className="flex flex-col">
        {ancestors.map((m, i) => (
          <div key={m.id}>
            <ChainRow member={m} relation={i === ancestors.length - 1 ? "Your Big" : undefined} />
            <Connector gold={i === ancestors.length - 1} />
          </div>
        ))}

        <ChainRow member={viewer} relation="You" isYou />

        {littles.length > 0 && (
          <>
            <Connector gold />
            <div className="flex gap-2 pl-13.5">
              {littles.slice(0, 2).map((l) => (
                <div key={l.id} className="flex-1 min-w-0">
                  <ChainRow member={l} relation="Little" compact />
                </div>
              ))}
            </div>
            {littles.length > 2 && (
              <p className="text-sn-gray-medium text-xs pl-13.5 mt-1">+{littles.length - 2} more</p>
            )}
          </>
        )}
      </div>

      <div className="fixed bottom-16 left-4 right-4 z-30">
        <Link
          href="/directory"
          className="block w-full text-center border border-sn-gold/45 text-sn-gold-light font-semibold text-sm rounded-[11px] py-3 bg-sn-black-secondary"
        >
          Browse whole chapter
        </Link>
      </div>
    </div>
  );
}

function Connector({ gold }: { gold: boolean }) {
  return <div className="w-0.5 h-3.5" style={{ marginLeft: 27, background: gold ? "#c6a75e" : "rgba(198,167,94,.4)" }} />;
}

function ChainRow({ member, relation, isYou = false, compact = false }: { member: FamilyTreeMember; relation?: string | undefined; isYou?: boolean; compact?: boolean }) {
  const initials = [member.first_name[0], member.last_name[0]].filter(Boolean).join("").toUpperCase();
  const content = (
    <div
      className={`flex items-center gap-2.75 rounded-xl px-3 py-2.75 ${isYou ? "bg-[rgba(198,167,94,.13)] border border-[rgba(198,167,94,.45)]" : "bg-[#141416] border border-white/7"}`}
    >
      <span
        className={`shrink-0 rounded-full flex items-center justify-center font-semibold overflow-hidden ${isYou ? "w-8 h-8 bg-sn-gold text-sn-black-secondary text-xs" : "w-7.5 h-7.5 bg-sn-gray-dark text-sn-gold text-[10.5px]"}`}
      >
        {member.photo_url !== null
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={member.photo_url} alt="" className="w-full h-full object-cover" />
          : initials}
      </span>
      <span className="min-w-0">
        <p className={`text-[12.5px] font-semibold truncate ${isYou ? "text-[#faf7f1]" : "text-sn-text"}`}>
          {member.first_name} {member.last_name}
        </p>
        {relation !== undefined && (
          <p className={`text-[10.5px] truncate ${isYou ? "text-[#d6bd84]" : "text-sn-gray-medium"}`}>
            {member.is_stub ? "Unclaimed" : (member.pledge_class ?? "—")} · {relation}
          </p>
        )}
      </span>
    </div>
  );

  if (member.is_stub || isYou) {
    return <div className={compact ? "" : ""}>{content}</div>;
  }

  return (
    <Link href={`/profile/${member.id}`} className="block">
      {content}
    </Link>
  );
}
