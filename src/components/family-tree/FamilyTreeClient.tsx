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

const NODE_W = 168;
const NODE_H = 80;

// ---------------------------------------------------------------------------
// Custom member node
// ---------------------------------------------------------------------------

interface MemberNodeProps {
  data: MemberNodeData;
}

function MemberNode({ data: m }: MemberNodeProps) {
  return (
    <div
      style={{ width: NODE_W }}
      className={[
        "relative rounded-sm p-2.5 flex items-center gap-2.5 transition-all select-none",
        m.is_stub ? "cursor-default" : "cursor-pointer",
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

      {/* "Unclaimed" badge for stub nodes */}
      {m.is_stub && (
        <span className="absolute top-1 right-1 bg-white/10 text-white/40 text-[10px] px-1.5 py-0.5 rounded-full leading-none">
          Unclaimed
        </span>
      )}

      {/* Avatar — initials at half-opacity for stubs; photo for claimed members */}
      {m.is_stub ? (
        <div className={[
          "w-5 h-5 rounded-full bg-white/10 flex items-center justify-center shrink-0",
          m.isDimmed ? "opacity-20" : "opacity-50",
        ].join(" ")}>
          <span className="text-[7px] text-white/60 font-semibold leading-none">
            {m.first_name[0]}{m.last_name[0]}
          </span>
        </div>
      ) : m.photo_url !== null ? (
        <div className="w-5 h-5 rounded-full overflow-hidden shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={m.photo_url}
            alt={`${m.first_name} ${m.last_name}`}
            className={["w-full h-full object-cover", m.isDimmed ? "opacity-30" : ""].join(" ")}
          />
        </div>
      ) : null}

      {/* Info */}
      <div className="min-w-0 flex-1">
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

  // fitView timing fix: the fitView prop fires before React Flow finishes
  // mounting all nodes (especially large trees with 200+ nodes). Instead, defer
  // until after the first paint via setTimeout so all node positions are registered.
  const hasFitViewRef = useRef(false);
  useEffect(() => {
    if (hasFitViewRef.current || nodes.length === 0) return;
    hasFitViewRef.current = true;
    const timer = setTimeout(() => {
      void rf.fitView({ padding: 0.15, maxZoom: 1.2 });
    }, 100);
    return () => clearTimeout(timer);
  }, [nodes.length, rf]);

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
      if (q.trim() === "") {
        void rf.fitView({ padding: 0.08, duration: 400 });
        return;
      }
      const lower = q.trim().toLowerCase();
      const match = members.find(
        (m) =>
          m.first_name.toLowerCase().includes(lower) ||
          m.last_name.toLowerCase().includes(lower) ||
          (m.nickname ?? "").toLowerCase().includes(lower)
      );
      if (match === undefined) {
        void rf.fitView({ padding: 0.08, duration: 400 });
        return;
      }

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

  // Click a node → select it (or deselect if already selected), then fitView to
  // one level above + the node itself + one level below. maxZoom caps the zoom-in.
  // Stub nodes are not clickable — clicking does nothing.
  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      const nodeData = node.data as unknown as MemberNodeData;
      if (nodeData.is_stub) return;

      const isDeselecting = selectedId === node.id;
      setSelected(isDeselecting ? null : node.id);

      if (!isDeselecting) {
        const allNodes = rf.getNodes();

        // One level below: direct littles
        const directLittles = allNodes.filter(
          (n) => (n.data as unknown as MemberNodeData).big_id === node.id
        );

        // One level above: the node's big
        const bigId = (node.data as unknown as MemberNodeData).big_id;
        const bigNode = bigId !== null ? allNodes.find((n) => n.id === bigId) : undefined;

        const targetNodes = [
          ...(bigNode !== undefined ? [bigNode] : []),
          node,
          ...directLittles,
        ];

        void rf.fitView({
          nodes:   targetNodes,
          padding: 0.35,
          maxZoom: 1.0,
          duration: 600,
        });
      }
    },
    [selectedId, rf]
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
