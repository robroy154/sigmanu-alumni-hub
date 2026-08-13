"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Minus, Plus, Maximize2, List, GitBranch } from "lucide-react";
import { layoutForest, getBounds, NODE_W, NODE_H, type PositionedNode } from "./treeLayout";
import { NodePanel } from "./NodePanel";
import type { FamilyTreeMember } from "./types";

interface FamilyTreeCanvasProps {
  members: FamilyTreeMember[];
  viewerId: string;
  viewerStatus: "member" | "admin";
}

const MIN_ZOOM = 0.4;
const MAX_ZOOM = 2.5;

export function FamilyTreeCanvas({ members, viewerId, viewerStatus }: FamilyTreeCanvasProps) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef<{ x: number; y: number } | null>(null);
  const pinchRef = useRef<{ dist: number; zoom: number } | null>(null);

  const [pledgeClass, setPledgeClass] = useState<string>("");
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(viewerId);
  const [viewMode, setViewMode] = useState<"tree" | "list">("tree");
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [animating, setAnimating] = useState(false);
  const [hasFit, setHasFit] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 200);
    return () => clearTimeout(t);
  }, [query]);

  const memberMap = useMemo(() => new Map(members.map((m) => [m.id, m])), [members]);
  const childrenMap = useMemo(() => {
    const m = new Map<string, string[]>();
    for (const mem of members) {
      if (mem.big_id !== null) {
        const arr = m.get(mem.big_id) ?? [];
        arr.push(mem.id);
        m.set(mem.big_id, arr);
      }
    }
    return m;
  }, [members]);

  const pledgeClasses = useMemo(
    () => Array.from(new Set(members.map((m) => m.pledge_class).filter((c): c is string => c !== null))).sort(),
    [members]
  );

  // When a pledge class is chosen, include that class plus every ancestor/descendant
  // needed to keep parent chains intact — otherwise edges would dangle.
  const visibleMembers = useMemo(() => {
    if (pledgeClass === "") return members;
    const keep = new Set<string>();
    for (const m of members) {
      if (m.pledge_class !== pledgeClass) continue;
      keep.add(m.id);
      let cur = memberMap.get(m.id);
      while (cur?.big_id) {
        keep.add(cur.big_id);
        cur = memberMap.get(cur.big_id);
      }
      const queue = [m.id];
      while (queue.length > 0) {
        const next = queue.shift() as string;
        for (const childId of childrenMap.get(next) ?? []) {
          if (!keep.has(childId)) { keep.add(childId); queue.push(childId); }
        }
      }
    }
    return members.filter((m) => keep.has(m.id));
  }, [members, pledgeClass, memberMap, childrenMap]);

  const nodes = useMemo(() => layoutForest(visibleMembers), [visibleMembers]);
  const nodesById = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);
  const bounds = useMemo(() => getBounds(nodes), [nodes]);

  function getConnectedIds(id: string) {
    const ancestors = new Set<string>([id]);
    let cur = memberMap.get(id);
    while (cur?.big_id) {
      ancestors.add(cur.big_id);
      cur = memberMap.get(cur.big_id);
    }
    const descendants = new Set<string>();
    const queue = [id];
    while (queue.length > 0) {
      const next = queue.shift() as string;
      for (const childId of childrenMap.get(next) ?? []) {
        if (!descendants.has(childId)) { descendants.add(childId); queue.push(childId); }
      }
    }
    return { ancestors, descendants };
  }

  const { ancestors: selectedAncestors, descendants: selectedDescendants } = useMemo(
    () => (selectedId !== null ? getConnectedIds(selectedId) : { ancestors: new Set<string>(), descendants: new Set<string>() }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedId, memberMap, childrenMap]
  );
  const connectedIds = useMemo(
    () => new Set([...selectedAncestors, ...selectedDescendants]),
    [selectedAncestors, selectedDescendants]
  );

  const applyTransform = useCallback((nextPan: { x: number; y: number }, nextZoom: number, animate: boolean) => {
    setAnimating(animate);
    setPan(nextPan);
    setZoom(Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, nextZoom)));
    if (animate) setTimeout(() => setAnimating(false), 300);
  }, []);

  const fitToScreen = useCallback((animate: boolean) => {
    const el = containerRef.current;
    if (el === null || nodes.length === 0) return;
    const { width, height } = el.getBoundingClientRect();
    const bw = bounds.maxX - bounds.minX + NODE_W;
    const bh = bounds.maxY - bounds.minY + NODE_H;
    const nextZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Math.min(width / bw, height / bh) * 0.92));
    const cx = (bounds.minX + bounds.maxX) / 2;
    const cy = (bounds.minY + bounds.maxY) / 2;
    applyTransform({ x: width / 2 - cx * nextZoom, y: height / 2 - cy * nextZoom }, nextZoom, animate);
  }, [nodes, bounds, applyTransform]);

  // Initial fit — driven by ResizeObserver rather than a mount effect, since
  // this component may mount while CSS-hidden on phone (width 0) and only
  // become visible later when the viewport crosses the md breakpoint.
  useEffect(() => {
    const el = containerRef.current;
    if (el === null) return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry === undefined) return;
      if (!hasFit && entry.contentRect.width > 0 && nodes.length > 0) {
        fitToScreen(false);
        setHasFit(true);
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasFit, nodes, fitToScreen]);

  // Re-fit when the pledge class filter changes the node set.
  const prevFilterKey = useRef(pledgeClass);
  useEffect(() => {
    if (prevFilterKey.current !== pledgeClass) {
      prevFilterKey.current = pledgeClass;
      fitToScreen(true);
    }
  }, [pledgeClass, fitToScreen]);

  function recenterOn(id: string, animate = true) {
    const node = nodesById.get(id);
    const el = containerRef.current;
    if (node === undefined || el === null) return;
    const { width, height } = el.getBoundingClientRect();
    const targetZoom = Math.max(zoom, 1);
    applyTransform({ x: width / 2 - node.x * targetZoom, y: height / 2 - node.y * targetZoom }, targetZoom, animate);
  }

  function selectNode(id: string) {
    setSelectedId(id);
    recenterOn(id);
  }

  // ── Pan/zoom interaction ──────────────────────────────────────────────────
  function onPointerDown(e: React.PointerEvent) {
    if (e.button !== 0) return;
    draggingRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  }
  function onPointerMove(e: React.PointerEvent) {
    if (draggingRef.current === null) return;
    setPan({ x: e.clientX - draggingRef.current.x, y: e.clientY - draggingRef.current.y });
  }
  function onPointerUp() {
    draggingRef.current = null;
  }
  function onWheel(e: React.WheelEvent) {
    e.preventDefault();
    const el = containerRef.current;
    if (el === null) return;
    const rect = el.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;
    const nextZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom * (1 - e.deltaY * 0.0015)));
    const wx = (cx - pan.x) / zoom;
    const wy = (cy - pan.y) / zoom;
    setPan({ x: cx - wx * nextZoom, y: cy - wy * nextZoom });
    setZoom(nextZoom);
  }
  function onTouchStart(e: React.TouchEvent) {
    const a = e.touches[0];
    const b = e.touches[1];
    if (e.touches.length === 2 && a !== undefined && b !== undefined) {
      const dist = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
      pinchRef.current = { dist, zoom };
    } else if (e.touches.length === 1 && a !== undefined) {
      draggingRef.current = { x: a.clientX - pan.x, y: a.clientY - pan.y };
    }
  }
  function onTouchMove(e: React.TouchEvent) {
    const a = e.touches[0];
    const b = e.touches[1];
    if (e.touches.length === 2 && a !== undefined && b !== undefined && pinchRef.current !== null) {
      const dist = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
      const nextZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, pinchRef.current.zoom * (dist / pinchRef.current.dist)));
      setZoom(nextZoom);
    } else if (e.touches.length === 1 && a !== undefined && draggingRef.current !== null) {
      setPan({ x: a.clientX - draggingRef.current.x, y: a.clientY - draggingRef.current.y });
    }
  }
  function onTouchEnd() {
    draggingRef.current = null;
    pinchRef.current = null;
  }

  const matches = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase();
    if (q.length < 2) return [];
    const qDigits = q.replace(/\D/g, "");
    return visibleMembers.filter((m) => {
      const name = `${m.first_name} ${m.last_name}`.toLowerCase();
      const nick = m.nickname?.toLowerCase() ?? "";
      const pinMatch = qDigits !== "" && m.pin_number !== null && String(m.pin_number).includes(qDigits);
      return name.includes(q) || nick.includes(q) || pinMatch;
    }).slice(0, 6);
  }, [debouncedQuery, visibleMembers]);

  const selectedMember = selectedId !== null ? memberMap.get(selectedId) ?? null : null;
  const selectedBig = selectedMember?.big_id !== undefined && selectedMember?.big_id !== null ? memberMap.get(selectedMember.big_id) ?? null : null;
  const selectedLittleCount = selectedId !== null ? (childrenMap.get(selectedId) ?? []).length : 0;

  const memberCount = members.filter((m) => !m.is_stub).length;

  return (
    <div className="bg-sn-black border border-white/8 rounded-2xl overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 px-4.5 py-3.25 border-b border-white/7">
        <div>
          <p className="text-sn-off-white font-semibold text-[12.5px]">Family Tree</p>
          <p className="text-sn-gray-medium text-[11.5px]">
            {memberCount.toLocaleString()} brothers · {pledgeClasses.length} pledge classes
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sn-gray-medium" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Find a brother"
              className="h-8 w-40 rounded-lg bg-sn-surface-2 border border-white/8 pl-8 pr-2 text-xs text-sn-text placeholder:text-sn-gray-medium focus:outline-none focus:border-sn-gold/50"
            />
            {matches.length > 0 && (
              <div className="absolute z-20 mt-1 w-56 right-0 bg-sn-surface border border-white/8 rounded-xl overflow-hidden shadow-xl">
                {matches.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => { selectNode(m.id); setQuery(""); }}
                    className="w-full text-left px-3 py-2 text-xs text-sn-text hover:bg-white/5 transition-colors"
                  >
                    {m.first_name} {m.last_name}
                    {m.pledge_class !== null && <span className="text-sn-gray-medium"> · {m.pledge_class}</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
          <select
            value={pledgeClass}
            onChange={(e) => setPledgeClass(e.target.value)}
            className="h-8 rounded-lg bg-sn-surface-2 border border-white/8 px-2 text-xs text-sn-text focus:outline-none"
          >
            <option value="">All classes</option>
            {pledgeClasses.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <div className="flex rounded-lg overflow-hidden border border-white/10 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setViewMode("tree")}
              className={`px-3 py-1.5 flex items-center gap-1.5 transition-colors ${viewMode === "tree" ? "bg-sn-gold text-sn-black-secondary" : "text-sn-gray-text hover:bg-white/5"}`}
            >
              <GitBranch size={12} /> Tree
            </button>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`px-3 py-1.5 flex items-center gap-1.5 transition-colors ${viewMode === "list" ? "bg-sn-gold text-sn-black-secondary" : "text-sn-gray-text hover:bg-white/5"}`}
            >
              <List size={12} /> List
            </button>
          </div>
        </div>
      </div>

      <div className="relative flex">
        {viewMode === "tree" ? (
          <div
            ref={containerRef}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerLeave={onPointerUp}
            onWheel={onWheel}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            className="relative flex-1 h-[560px] overflow-hidden cursor-grab active:cursor-grabbing touch-none"
            style={{
              background: "radial-gradient(120% 90% at 50% 0%, #161519 0%, #0a0a0b 62%)",
            }}
          >
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: "radial-gradient(rgba(255,255,255,.05) 1px, transparent 1px)",
                backgroundSize: "24px 24px",
                backgroundPosition: `${pan.x}px ${pan.y}px`,
              }}
            />
            <div
              className={animating ? "absolute top-0 left-0 transition-transform duration-300 ease-out" : "absolute top-0 left-0"}
              style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: "0 0" }}
            >
              <svg
                className="absolute overflow-visible pointer-events-none"
                style={{ left: 0, top: 0, width: 1, height: 1 }}
              >
                {nodes.filter((n) => n.parentId !== null).map((n) => {
                  const parent = nodesById.get(n.parentId as string);
                  if (parent === undefined) return null;
                  const x1 = parent.x, y1 = parent.y + NODE_H;
                  const x2 = n.x, y2 = n.y;
                  const midY = (y1 + y2) / 2;
                  const inAncestorPath = selectedAncestors.has(n.id) && selectedAncestors.has(parent.id);
                  const inDescentPath = (parent.id === selectedId || selectedDescendants.has(parent.id)) && selectedDescendants.has(n.id);
                  const stroke = inAncestorPath ? "rgba(198,167,94,.8)" : inDescentPath ? "rgba(198,167,94,.5)" : "rgba(255,255,255,.14)";
                  const width = inAncestorPath ? 2 : 1.5;
                  return (
                    <path
                      key={n.id}
                      d={`M ${x1} ${y1} L ${x1} ${midY} L ${x2} ${midY} L ${x2} ${y2}`}
                      fill="none"
                      stroke={stroke}
                      strokeWidth={width}
                    />
                  );
                })}
              </svg>

              {nodes.map((n) => (
                <TreeNode
                  key={n.id}
                  node={n}
                  isSelected={n.id === selectedId}
                  isConnected={selectedId === null || connectedIds.has(n.id)}
                  isBig={selectedMember?.big_id === n.id}
                  isYou={n.id === viewerId}
                  onClick={() => selectNode(n.id)}
                  onDoubleClick={() => { if (!n.data.is_stub) router.push(`/profile/${n.id}`); }}
                />
              ))}
            </div>

            {/* Zoom cluster */}
            <div className="absolute left-3 bottom-3 flex flex-col gap-1.5 bg-[rgba(20,20,22,.85)] border border-white/9 rounded-[10px] p-1.5">
              <button type="button" onClick={() => applyTransform(pan, zoom + 0.2, true)} aria-label="Zoom in" className="w-7 h-7 rounded-md bg-[#232326] text-sn-off-white flex items-center justify-center">
                <Plus size={13} />
              </button>
              <button type="button" onClick={() => applyTransform(pan, zoom - 0.2, true)} aria-label="Zoom out" className="w-7 h-7 rounded-md bg-[#232326] text-sn-off-white flex items-center justify-center">
                <Minus size={13} />
              </button>
              <button type="button" onClick={() => fitToScreen(true)} aria-label="Fit to screen" className="w-7 h-7 rounded-md bg-[#232326] text-sn-off-white flex items-center justify-center">
                <Maximize2 size={12} />
              </button>
            </div>

            {/* Legend */}
            <div className="absolute right-3 bottom-3 flex items-center gap-2 bg-[rgba(20,20,22,.85)] border border-white/9 rounded-[10px] px-3 py-2 text-[11px] text-sn-gray-text">
              <span className="w-2 h-2 rounded-full bg-sn-gold" />
              Your line highlighted
            </div>
          </div>
        ) : (
          <div className="flex-1 h-[560px] overflow-y-auto p-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-sn-gray-medium text-xs uppercase tracking-wide">
                  <th className="pb-2 font-semibold">Name</th>
                  <th className="pb-2 font-semibold">Pledge Class</th>
                  <th className="pb-2 font-semibold">Big Brother</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {visibleMembers.map((m) => {
                  const bigMember = m.big_id !== null ? memberMap.get(m.big_id) : null;
                  return (
                    <tr
                      key={m.id}
                      onClick={() => { setViewMode("tree"); selectNode(m.id); }}
                      className="cursor-pointer hover:bg-white/5"
                    >
                      <td className="py-2 text-sn-text">
                        {m.first_name} {m.last_name}
                        {m.is_stub && <span className="ml-1.5 text-[10px] text-sn-gray-medium">(unclaimed)</span>}
                      </td>
                      <td className="py-2 text-sn-gray-text">{m.pledge_class ?? "—"}</td>
                      <td className="py-2 text-sn-gray-text">{bigMember !== null && bigMember !== undefined ? `${bigMember.first_name} ${bigMember.last_name}` : "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {selectedMember !== null && viewMode === "tree" && (
          <NodePanel
            member={selectedMember}
            big={selectedBig}
            littleCount={selectedLittleCount}
            canInvite={viewerStatus === "admin" || viewerStatus === "member"}
            onClose={() => setSelectedId(null)}
            onFlyToBig={() => { if (selectedMember.big_id !== null) selectNode(selectedMember.big_id); }}
            onFlyToLittles={() => fitToScreen(true)}
          />
        )}
      </div>
    </div>
  );
}

interface TreeNodeProps {
  node: PositionedNode<FamilyTreeMember>;
  isSelected: boolean;
  isConnected: boolean;
  isBig: boolean;
  isYou: boolean;
  onClick: () => void;
  onDoubleClick: () => void;
}

function TreeNode({ node, isSelected, isConnected, isBig, isYou, onClick, onDoubleClick }: TreeNodeProps) {
  const m = node.data;
  const initials = [m.first_name[0], m.last_name[0]].filter(Boolean).join("").toUpperCase();

  let bg = "#141416";
  let border = "1px solid rgba(255,255,255,.08)";
  if (isYou) {
    border = "2px solid #c6a75e";
    bg = "#17171a";
  } else if (isBig) {
    bg = "linear-gradient(160deg, rgba(198,167,94,.20), rgba(198,167,94,.05))";
    border = "1px solid rgba(198,167,94,.5)";
  }
  const boxShadow = isSelected && !isYou ? "0 0 0 2px rgba(198,167,94,.5)" : undefined;

  return (
    <button
      type="button"
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      className="absolute text-left transition-opacity"
      style={{
        left: node.x - NODE_W / 2,
        top: node.y,
        width: NODE_W,
        minHeight: NODE_H,
        background: bg,
        border,
        borderRadius: 13,
        padding: "11px 13px",
        opacity: isConnected ? 1 : 0.25,
        boxShadow,
      }}
    >
      <div className="flex items-center gap-2 min-w-0">
        <span className="shrink-0 w-6 h-6 rounded-full bg-sn-gray-dark text-sn-gold text-[10px] font-semibold flex items-center justify-center overflow-hidden">
          {m.photo_url !== null
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={m.photo_url} alt="" className="w-full h-full object-cover" />
            : initials}
        </span>
        <span className="min-w-0">
          <p className={`text-[12.5px] font-semibold truncate ${isYou ? "text-[#faf7f1]" : "text-[#ece9e3]"}`}>
            {m.first_name} {m.last_name}
          </p>
          <p className={`text-[11px] truncate ${isYou ? "text-sn-gold" : "text-sn-gray-medium"}`}>
            {m.is_stub ? "Unclaimed" : (m.pledge_class ?? "—")}
            {isYou ? " · You" : isBig ? " · Your Big" : ""}
          </p>
        </span>
      </div>
    </button>
  );
}
