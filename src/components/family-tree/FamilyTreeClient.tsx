"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
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
  photo_url:    string | null;
  big_id:       string | null;
}

// Data passed into each React Flow node — extends member with display flags
interface MemberNodeData extends FamilyTreeMember {
  isSelected:  boolean;
  isDimmed:    boolean;
}

// ---------------------------------------------------------------------------
// Node dimensions — must match what dagre uses for positioning
// ---------------------------------------------------------------------------

const NODE_W = 168;
const NODE_H = 80;

// ---------------------------------------------------------------------------
// Custom member node
// ---------------------------------------------------------------------------

interface MemberNodeProps {
  data: MemberNodeData;
}

function MemberNode({ data: m }: MemberNodeProps) {
  const initials = (m.first_name[0] ?? "") + (m.last_name[0] ?? "");

  return (
    <div
      style={{ width: NODE_W }}
      className={[
        "relative rounded-xl p-2.5 flex items-center gap-2.5 cursor-pointer transition-all select-none group",
        m.isSelected
          ? "bg-sn-black border-2 border-sn-gold shadow-[0_0_16px_rgba(201,168,76,0.35)]"
          : m.isDimmed
            ? "bg-sn-black/40 border border-sn-gold/10"
            : "bg-sn-black border border-sn-gold/30 hover:border-sn-gold/70",
      ].join(" ")}
    >
      <Handle
        type="target"
        position={Position.Top}
        style={{ background: "transparent", border: "none", width: 0, height: 0 }}
      />

      {/* Avatar */}
      <div
        className={[
          "w-10 h-10 rounded-full overflow-hidden flex items-center justify-center shrink-0 transition-all",
          m.isSelected
            ? "border-2 border-sn-gold bg-sn-black-secondary"
            : m.isDimmed
              ? "border border-sn-gold/10 bg-sn-black-secondary/50"
              : "border border-sn-gold/30 bg-sn-black-secondary group-hover:border-sn-gold/60",
        ].join(" ")}
      >
        {m.photo_url !== null ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={m.photo_url}
            alt={`${m.first_name} ${m.last_name}`}
            className={["w-full h-full object-cover", m.isDimmed ? "opacity-30" : ""].join(" ")}
          />
        ) : (
          <span
            className={[
              "font-bold text-xs",
              m.isDimmed ? "text-sn-gold/20" : "text-sn-gold",
            ].join(" ")}
          >
            {initials}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <p
          className={[
            "text-[11px] font-semibold leading-tight truncate",
            m.isDimmed ? "text-white/20" : "text-white",
          ].join(" ")}
        >
          {m.first_name} {m.last_name}
        </p>
        {m.nickname !== null && m.nickname !== "" && (
          <p
            className={[
              "text-[10px] truncate leading-tight mt-0.5",
              m.isDimmed ? "text-sn-gold/15" : "text-sn-gold",
            ].join(" ")}
          >
            &ldquo;{m.nickname}&rdquo;
          </p>
        )}
        {m.pledge_class !== null && (
          <p
            className={[
              "text-[10px] leading-tight mt-0.5 truncate",
              m.isDimmed ? "text-white/10" : "text-white/40",
            ].join(" ")}
          >
            {m.pledge_class}
          </p>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        style={{ background: "transparent", border: "none", width: 0, height: 0 }}
      />

      {/* Profile link — floats below the node when selected */}
      {m.isSelected && (
        <Link
          href={`/profile/${m.id}`}
          onClick={(e) => e.stopPropagation()}
          className="absolute left-0 right-0 top-[calc(100%+5px)] bg-sn-gold text-sn-black text-[10px] font-bold py-1.5 px-2 rounded-lg text-center hover:bg-sn-gold-light transition-colors z-10 whitespace-nowrap"
        >
          View Profile →
        </Link>
      )}
    </div>
  );
}

const nodeTypes = { member: MemberNode };

// ---------------------------------------------------------------------------
// Dagre layout — runs once when members are loaded
// ---------------------------------------------------------------------------

function buildLayout(members: FamilyTreeMember[]): {
  nodes: Node[];
  edges: Edge[];
} {
  const g = new Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: "TB", nodesep: 64, ranksep: 100, marginx: 40, marginy: 40 });

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

  // Build maps
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
  const [query, setQuery]         = useState("");
  const [selectedId, setSelected] = useState<string | null>(null);

  const { nodes: layoutNodes, edges: layoutEdges } = useMemo(
    () => buildLayout(members),
    [members]
  );

  const [nodes, , onNodesChange] = useNodesState(layoutNodes);
  const [edges, , onEdgesChange] = useEdgesState(layoutEdges);

  // Connected ID set — recomputed only when selection changes
  const connectedIds = useMemo(
    () => (selectedId !== null ? getConnectedIds(selectedId, members) : null),
    [selectedId, members]
  );

  // Derive display nodes with selection/dim flags applied
  const displayNodes = useMemo(() => {
    return nodes.map((n) => ({
      ...n,
      data: {
        ...(n.data as unknown as MemberNodeData),
        isSelected:  n.id === selectedId,
        isDimmed:    connectedIds !== null && !connectedIds.has(n.id),
      },
    }));
  }, [nodes, selectedId, connectedIds]);

  // Derive display edges with highlight applied
  const displayEdges = useMemo(() => {
    return edges.map((e) => {
      if (connectedIds === null) return e;
      const isActive = connectedIds.has(e.source) && connectedIds.has(e.target);
      return {
        ...e,
        style: isActive
          ? { stroke: "#C6A75E", strokeWidth: 3, opacity: 1 }
          : { stroke: "#555", strokeWidth: 1, opacity: 0.1 },
      };
    });
  }, [edges, connectedIds]);

  // Search: fly to matching node using its dagre-computed center position
  const handleSearch = useCallback(
    (q: string) => {
      setQuery(q);
      if (q.trim() === "") return;
      const lower = q.trim().toLowerCase();
      const match = members.find(
        (m) =>
          m.first_name.toLowerCase().includes(lower) ||
          m.last_name.toLowerCase().includes(lower) ||
          (m.nickname ?? "").toLowerCase().includes(lower)
      );
      if (match === undefined) return;

      // Use the position from the computed layout (dagre top-left → center)
      const node = layoutNodes.find((n) => n.id === match.id);
      if (node === undefined) return;

      rf.setCenter(
        node.position.x + NODE_W / 2,
        node.position.y + NODE_H / 2,
        { zoom: 1.5, duration: 700 }
      );
    },
    [members, layoutNodes, rf]
  );

  // Click a node → select it (or deselect if already selected)
  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      setSelected((prev) => (prev === node.id ? null : node.id));
    },
    []
  );

  // Click empty canvas → deselect
  const handlePaneClick = useCallback(() => {
    setSelected(null);
  }, []);

  return (
    <div className="relative w-full" style={{ height: "calc(100vh - 10rem)" }}>
      {/* Search overlay */}
      <div className="absolute top-3 left-3 z-10 flex items-center gap-2">
        <input
          ref={searchRef}
          type="search"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search brothers…"
          className="h-9 rounded-lg border border-white/20 bg-sn-black/90 backdrop-blur-sm px-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-sn-gold w-52"
        />
        {selectedId !== null && (
          <button
            onClick={() => setSelected(null)}
            className="h-9 px-3 rounded-lg border border-white/20 bg-sn-black/90 backdrop-blur-sm text-white/50 hover:text-white text-xs transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      <ReactFlow
        nodes={displayNodes as Node[]}
        edges={displayEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        onPaneClick={handlePaneClick}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.15, maxZoom: 1.2 }}
        minZoom={0.05}
        maxZoom={2}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
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
