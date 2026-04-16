"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  useReactFlow,
  Handle,
  Position,
  type Node,
  type Edge,
} from "@xyflow/react";
import { Graph, layout } from "@dagrejs/dagre";
import "@xyflow/react/dist/style.css";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface FamilyTreeMember {
  id:           string;
  first_name:   string;
  last_name:    string;
  nickname:     string | null;
  pledge_class: string | null;
  pin_number:   string | null;
  photo_url:    string | null;
  big_id:       string | null;
  is_stub:      boolean;
}

// Data passed into each React Flow node — extends member with display flags
interface MemberNodeData extends FamilyTreeMember {
  isSelected:  boolean;
  isDimmed:    boolean;
}

// ---------------------------------------------------------------------------
// Node dimensions — must match what dagre uses for positioning
// ---------------------------------------------------------------------------

const NODE_W = 190;
const NODE_H = 88;

// ---------------------------------------------------------------------------
// Custom member node
// ---------------------------------------------------------------------------

interface MemberNodeProps {
  data: MemberNodeData;
}

function MemberNode({ data: m }: MemberNodeProps) {
  const pinDisplay =
    m.pin_number !== null && m.pin_number !== ""
      ? `ΜΞ ${String(m.pin_number).padStart(3, "0")}`
      : null;

  return (
    <div
      style={{ width: NODE_W }}
      className={[
        "relative rounded-sm p-2.5 flex items-center gap-2.5 transition-all select-none cursor-pointer",
        m.isSelected
          ? "bg-sn-surface border-l-2 border-l-sn-gold border-t border-t-transparent border-r border-r-transparent border-b border-b-transparent"
          : m.isDimmed
            ? "bg-sn-surface/40 border border-sn-gray-dark/30"
            : m.is_stub
              ? "bg-sn-surface/60 border border-sn-gray-dark/50"
              : "bg-sn-surface border border-sn-gray-dark hover:border-sn-gold/40",
      ].join(" ")}
    >
      <Handle
        type="target"
        position={Position.Top}
        style={{ background: "transparent", border: "none", width: 0, height: 0 }}
      />

      {/* "Unclaimed" badge — stub nodes only, pinned to top-right corner.
          The info section uses pr-16 when stub to guarantee the name text
          never reaches this badge, regardless of name length or font size. */}
      {m.is_stub && (
        <span className="absolute top-1.5 right-1.5 bg-white/10 text-white/40 text-[9px] px-1.5 py-0.5 rounded-full leading-none pointer-events-none z-10">
          Unclaimed
        </span>
      )}

      {/* Avatar — initials at half-opacity for stubs; photo for claimed members */}
      {m.is_stub ? (
        <div
          className={[
            "w-6 h-6 rounded-full bg-white/10 flex items-center justify-center shrink-0",
            m.isDimmed ? "opacity-20" : "opacity-50",
          ].join(" ")}
        >
          <span className="text-[8px] text-white/60 font-semibold leading-none">
            {m.first_name[0]}{m.last_name[0]}
          </span>
        </div>
      ) : m.photo_url !== null ? (
        <div className="w-6 h-6 rounded-full overflow-hidden shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={m.photo_url}
            alt={`${m.first_name} ${m.last_name}`}
            className={["w-full h-full object-cover", m.isDimmed ? "opacity-30" : ""].join(" ")}
          />
        </div>
      ) : null}

      {/* Info — pr-16 on stub nodes ensures name text stays clear of the Unclaimed badge */}
      <div className={["min-w-0 flex-1", m.is_stub ? "pr-16" : ""].join(" ")}>
        <p
          className={[
            "text-[11px] font-medium leading-tight truncate",
            m.isDimmed ? "text-sn-off-white/20" : "text-sn-off-white",
          ].join(" ")}
        >
          {m.first_name} {m.last_name}
        </p>
        {m.pledge_class !== null && (
          <p
            className={[
              "text-[9px] uppercase tracking-widest leading-tight mt-0.5 truncate",
              m.isDimmed ? "text-sn-gray-text/20" : "text-sn-gray-text",
            ].join(" ")}
          >
            {m.pledge_class}
          </p>
        )}
        {pinDisplay !== null && (
          <p
            className={[
              "text-[9px] tracking-wide leading-tight mt-0.5 truncate",
              m.isDimmed ? "text-sn-gray-text/20" : "text-sn-gray-text",
            ].join(" ")}
          >
            {pinDisplay}
          </p>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        style={{ background: "transparent", border: "none", width: 0, height: 0 }}
      />

      {/* Profile link — floats below the node when selected; stubs have no profile */}
      {m.isSelected && !m.is_stub && (
        <Link
          href={`/profile/${m.id}`}
          onClick={(e) => e.stopPropagation()}
          className="absolute left-0 right-0 top-[calc(100%+5px)] bg-sn-gold text-sn-black text-[10px] font-bold py-1.5 px-2 rounded-sm text-center hover:bg-sn-gold-light transition-colors z-10 whitespace-nowrap"
        >
          View Profile →
        </Link>
      )}
    </div>
  );
}

const nodeTypes = { member: MemberNode };

// ---------------------------------------------------------------------------
// Dagre layout — recomputed whenever the member set changes
// ---------------------------------------------------------------------------

function buildLayout(members: FamilyTreeMember[]): {
  nodes: Node[];
  edges: Edge[];
} {
  const g = new Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: "TB", nodesep: 70, ranksep: 120, marginx: 40, marginy: 40 });

  const memberIds = new Set(members.map((m) => m.id));

  members.forEach((m) => {
    g.setNode(m.id, { width: NODE_W, height: NODE_H });
  });

  members.forEach((m) => {
    if (m.big_id !== null && memberIds.has(m.big_id)) {
      g.setEdge(m.big_id, m.id);
    }
  });

  layout(g);

  const nodes = members.map((m) => {
    const pos = g.node(m.id);
    return {
      id:       m.id,
      type:     "member",
      position: { x: pos.x - NODE_W / 2, y: pos.y - NODE_H / 2 },
      data:     { ...m, isSelected: false, isDimmed: false } as MemberNodeData,
    };
  }) as unknown as Node[];

  const edges: Edge[] = [];
  members.forEach((m) => {
    if (m.big_id !== null && memberIds.has(m.big_id)) {
      edges.push({
        id:     `e-${m.big_id}-${m.id}`,
        source: m.big_id,
        target: m.id,
        style:  { stroke: "#C6A75E", strokeWidth: 1.5, opacity: 0.45 },
        type:   "smoothstep",
      });
    }
  });

  return { nodes, edges };
}

// ---------------------------------------------------------------------------
// Compute the set of IDs connected to the selected node (ancestors + descendants)
// ---------------------------------------------------------------------------

function getConnectedIds(
  selectedId: string,
  members: FamilyTreeMember[]
): Set<string> {
  const result = new Set<string>([selectedId]);

  const bigMap: Record<string, string | null> = {};
  const littlesMap: Record<string, string[]> = {};

  members.forEach((m) => {
    bigMap[m.id] = m.big_id;
    if (m.big_id !== null) {
      (littlesMap[m.big_id] ??= []).push(m.id);
    }
  });

  // Walk ancestors
  let cur: string | null | undefined = bigMap[selectedId];
  while (cur !== null && cur !== undefined) {
    result.add(cur);
    cur = bigMap[cur];
  }

  // Walk descendants (BFS)
  const queue = [selectedId];
  while (queue.length > 0) {
    const id = queue.shift()!;
    for (const lid of littlesMap[id] ?? []) {
      if (!result.has(lid)) {
        result.add(lid);
        queue.push(lid);
      }
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// Inner component — must be inside ReactFlowProvider to use useReactFlow
// ---------------------------------------------------------------------------

function FamilyTreeInner({ members }: { members: FamilyTreeMember[] }) {
  const rf = useReactFlow();
  const searchRef = useRef<HTMLInputElement>(null);
  const [query, setQuery]           = useState("");
  const [selectedId, setSelected]   = useState<string | null>(null);
  const [hideIsolated, setHideIsolated] = useState(true);

  // ── Isolated node detection ───────────────────────────────────────────────
  // A node is isolated when it has no big_id (no parent) AND no other node
  // has big_id pointing to it (no children). These float disconnected.
  const isolatedIds = useMemo(() => {
    const hasChildrenOf = new Set(
      members.map((m) => m.big_id).filter((id): id is string => id !== null)
    );
    return new Set(
      members
        .filter((m) => m.big_id === null && !hasChildrenOf.has(m.id))
        .map((m) => m.id)
    );
  }, [members]);

  // ── Visible members (filtered when hideIsolated is on) ───────────────────
  const visibleMembers = useMemo(
    () => (hideIsolated ? members.filter((m) => !isolatedIds.has(m.id)) : members),
    [hideIsolated, members, isolatedIds]
  );

  // ── Dagre layout — recomputed only when visible members change ───────────
  const { nodes: layoutNodes, edges: layoutEdges } = useMemo(
    () => buildLayout(visibleMembers),
    [visibleMembers]
  );

  // ── fitView: deferred on initial load so all nodes are registered first ──
  const hasFitViewRef = useRef(false);
  useEffect(() => {
    if (hasFitViewRef.current || layoutNodes.length === 0) return;
    hasFitViewRef.current = true;
    const timer = setTimeout(() => {
      void rf.fitView({ padding: 0.15, maxZoom: 1.2 });
    }, 100);
    return () => clearTimeout(timer);
  }, [layoutNodes.length, rf]);

  // ── fitView: re-fit when hideIsolated toggle changes (skip initial mount) ─
  const isFirstMount = useRef(true);
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    const timer = setTimeout(() => {
      void rf.fitView({ padding: 0.15, maxZoom: 1.2, duration: 400 });
    }, 50);
    return () => clearTimeout(timer);
  }, [hideIsolated, rf]);

  // ── Connected ID set — recomputed when selection or visible set changes ───
  const connectedIds = useMemo(
    () => (selectedId !== null ? getConnectedIds(selectedId, visibleMembers) : null),
    [selectedId, visibleMembers]
  );

  // ── Display nodes: layout positions + selection/dim flags ────────────────
  // Using layoutNodes directly (no useNodesState) because nodes are not
  // draggable — no internal state needed beyond what we derive here.
  const displayNodes = useMemo(() => {
    return layoutNodes.map((n) => ({
      ...n,
      data: {
        ...(n.data as unknown as MemberNodeData),
        isSelected: n.id === selectedId,
        isDimmed:   connectedIds !== null && !connectedIds.has(n.id),
      },
    }));
  }, [layoutNodes, selectedId, connectedIds]);

  // ── Display edges: highlight connected path ───────────────────────────────
  const displayEdges = useMemo(() => {
    return layoutEdges.map((e) => {
      if (connectedIds === null) return e;
      const isActive = connectedIds.has(e.source) && connectedIds.has(e.target);
      return {
        ...e,
        style: isActive
          ? { stroke: "#C6A75E", strokeWidth: 3, opacity: 1 }
          : { stroke: "#555", strokeWidth: 1, opacity: 0.1 },
      };
    });
  }, [layoutEdges, connectedIds]);

  // ── Search: fly to matching visible node ─────────────────────────────────
  const handleSearch = useCallback(
    (q: string) => {
      setQuery(q);
      if (q.trim() === "") {
        void rf.fitView({ padding: 0.08, duration: 400 });
        return;
      }
      const lower = q.trim().toLowerCase();
      const match = visibleMembers.find(
        (m) =>
          m.first_name.toLowerCase().includes(lower) ||
          m.last_name.toLowerCase().includes(lower) ||
          (m.nickname ?? "").toLowerCase().includes(lower)
      );
      if (match === undefined) {
        void rf.fitView({ padding: 0.08, duration: 400 });
        return;
      }

      const node = layoutNodes.find((n) => n.id === match.id);
      if (node === undefined) return;

      rf.setCenter(
        node.position.x + NODE_W / 2,
        node.position.y + NODE_H / 2,
        { zoom: 1.5, duration: 700 }
      );
    },
    [visibleMembers, layoutNodes, rf]
  );

  // ── Node click: zoom for all nodes; profile link only for non-stubs ───────
  // Stub nodes zoom in the same way as member nodes but do not navigate to a
  // profile (stubs have no profile page).
  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      const nodeData = node.data as unknown as MemberNodeData;
      const isDeselecting = selectedId === node.id;
      setSelected(isDeselecting ? null : node.id);

      if (!isDeselecting) {
        const allRfNodes = rf.getNodes();

        const directLittles = allRfNodes.filter(
          (n) => (n.data as unknown as MemberNodeData).big_id === node.id
        );

        const bigId = nodeData.big_id;
        const bigNode = bigId !== null ? allRfNodes.find((n) => n.id === bigId) : undefined;

        const targetNodes = [
          ...(bigNode !== undefined ? [bigNode] : []),
          node,
          ...directLittles,
        ];

        void rf.fitView({
          nodes:    targetNodes,
          padding:  0.35,
          maxZoom:  1.0,
          duration: 600,
        });
      }
    },
    [selectedId, rf]
  );

  // ── Click empty canvas → deselect ────────────────────────────────────────
  const handlePaneClick = useCallback(() => {
    setSelected(null);
  }, []);

  // ── Count display (visible vs. total) ────────────────────────────────────
  const totalClaimed  = members.filter((m) => !m.is_stub).length;
  const totalStubs    = members.filter((m) => m.is_stub).length;
  const visibleClaimed = visibleMembers.filter((m) => !m.is_stub).length;
  const visibleStubs   = visibleMembers.filter((m) => m.is_stub).length;

  const countLabel = (() => {
    if (!hideIsolated) {
      return totalStubs > 0
        ? `${totalClaimed} member${totalClaimed !== 1 ? "s" : ""} · ${totalStubs} unclaimed`
        : `${totalClaimed} member${totalClaimed !== 1 ? "s" : ""}`;
    }
    return visibleStubs > 0
      ? `${visibleClaimed} member${visibleClaimed !== 1 ? "s" : ""} · ${visibleStubs} unclaimed (filtered)`
      : `${visibleClaimed} member${visibleClaimed !== 1 ? "s" : ""} (filtered)`;
  })();

  return (
    <div className="relative w-full" style={{ height: "calc(100vh - 10rem)" }}>
      {/* ── Top-left overlay: search + hide-isolated toggle ─────────────── */}
      <div className="absolute top-3 left-3 z-10 flex items-center gap-2">
        <input
          ref={searchRef}
          type="search"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search brothers…"
          className="h-9 rounded-lg border border-white/20 bg-sn-black/90 backdrop-blur-sm px-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-sn-gold w-52"
        />
        <button
          type="button"
          onClick={() => setHideIsolated((v) => !v)}
          className={[
            "h-9 px-3 rounded-lg border text-xs transition-colors backdrop-blur-sm",
            hideIsolated
              ? "bg-sn-gold/20 border-sn-gold/60 text-sn-gold"
              : "bg-sn-black/90 border-white/20 text-white/50 hover:text-white",
          ].join(" ")}
        >
          {hideIsolated ? "Show Unlinked" : "Hide Unlinked"}
        </button>
        {selectedId !== null && (
          <button
            onClick={() => setSelected(null)}
            className="h-9 px-3 rounded-lg border border-white/20 bg-sn-black/90 backdrop-blur-sm text-white/50 hover:text-white text-xs transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      {/* ── Top-right overlay: member count ─────────────────────────────── */}
      <div className="absolute top-3 right-3 z-10 pointer-events-none">
        <span className="text-white/40 text-xs bg-sn-black/70 backdrop-blur-sm px-2.5 py-1.5 rounded-lg border border-white/10">
          {countLabel}
        </span>
      </div>

      <ReactFlow
        nodes={displayNodes as Node[]}
        edges={displayEdges}
        onNodeClick={handleNodeClick}
        onPaneClick={handlePaneClick}
        nodeTypes={nodeTypes}
        minZoom={0.05}
        maxZoom={2}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        panOnDrag={true}
        zoomOnPinch={true}
        preventScrolling={true}
        panOnScroll={true}
        colorMode="dark"
        style={{ background: "#111827" }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          color="#C6A75E"
          style={{ opacity: 0.1 }}
        />
        <Controls showInteractive={false} />
        <div className="hidden md:block">
          <MiniMap
            nodeColor={(n) => {
              const data = n.data as unknown as MemberNodeData;
              if (data.isSelected) return "#C6A75E";
              if (data.isDimmed)   return "#333";
              return "#C6A75E";
            }}
            maskColor="rgba(17, 24, 39, 0.85)"
            style={{ background: "#0B0B0C", border: "1px solid rgba(198,167,94,0.2)" }}
            position="bottom-right"
          />
        </div>
      </ReactFlow>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Public export — wraps inner with ReactFlowProvider
// ---------------------------------------------------------------------------

export function FamilyTreeClient({ members }: { members: FamilyTreeMember[] }) {
  return (
    <ReactFlowProvider>
      <FamilyTreeInner members={members} />
    </ReactFlowProvider>
  );
}
