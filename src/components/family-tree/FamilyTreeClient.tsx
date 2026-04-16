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
  useViewport,
  Handle,
  Position,
  type Node,
  type Edge,
} from "@xyflow/react";
import { Graph, layout } from "@dagrejs/dagre";
import { Info, Maximize2, Minimize2, X } from "lucide-react";
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
  status:       "member" | "admin" | "stub";
}

interface MemberNodeData extends FamilyTreeMember {
  isSelected: boolean;
  isDimmed:   boolean;
}

// ---------------------------------------------------------------------------
// Node dimensions — must match dagre
// ---------------------------------------------------------------------------

const NODE_W = 220;
const NODE_H = 90;

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

  // Build node border/shadow style
  const nodeStyle: React.CSSProperties = {
    width:        NODE_W,
    padding:      "12px 16px",
    display:      "flex",
    alignItems:   "center",
    gap:          10,
    borderRadius: 8,
    cursor:       "pointer",
    userSelect:   "none",
    transition:   "opacity 0.15s ease",
    position:     "relative",
    overflow:     "visible",
    ...(m.isDimmed
      ? {
          background:  "#0B0B0C",
          border:      "1px solid #3e2e14",
          borderLeft:  "4px solid #C6A75E",
          opacity:     0.25,
        }
      : m.isSelected
        ? {
            background: "#0B0B0C",
            border:     "2px solid #C6A75E",
            borderLeft: "4px solid #C6A75E",
            boxShadow:  "0 0 0 3px rgba(198,167,94,0.2)",
          }
        : {
            background: "#0B0B0C",
            border:     "1px solid #3e2e14",
            borderLeft: "4px solid #C6A75E",
          }),
  };

  return (
    <div style={nodeStyle}>
      <Handle
        type="target"
        position={Position.Top}
        style={{ background: "transparent", border: "none", width: 0, height: 0 }}
      />

      {/* Unclaimed badge — floats above the top-right corner (negative top) */}
      {m.is_stub && (
        <span
          style={{
            position:   "absolute",
            top:        -9,
            right:      8,
            background: "#2e2010",
            color:      "#8a6830",
            border:     "1px solid #5a3e18",
            fontSize:   9,
            padding:    "2px 6px",
            borderRadius: 999,
            lineHeight: 1,
            pointerEvents: "none",
            zIndex:     10,
            whiteSpace: "nowrap",
          }}
        >
          Unclaimed
        </span>
      )}

      {/* Avatar */}
      {m.is_stub ? (
        <div
          style={{
            width:          40,
            height:         40,
            borderRadius:   "50%",
            background:     "rgba(255,255,255,0.08)",
            display:        "flex",
            alignItems:     "center",
            justifyContent: "center",
            flexShrink:     0,
            opacity:        0.5,
          }}
        >
          <span style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>
            {m.first_name[0]}{m.last_name[0]}
          </span>
        </div>
      ) : m.photo_url !== null ? (
        <div
          style={{
            width:      40,
            height:     40,
            borderRadius: "50%",
            overflow:   "hidden",
            flexShrink: 0,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={m.photo_url}
            alt={`${m.first_name} ${m.last_name}`}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </div>
      ) : (
        <div
          style={{
            width:          40,
            height:         40,
            borderRadius:   "50%",
            background:     "rgba(198,167,94,0.15)",
            display:        "flex",
            alignItems:     "center",
            justifyContent: "center",
            flexShrink:     0,
          }}
        >
          <span style={{ fontSize: 13, color: "#C6A75E", fontWeight: 600 }}>
            {m.first_name[0]}{m.last_name[0]}
          </span>
        </div>
      )}

      {/* Info — pr for stubs to avoid badge overlap */}
      <div style={{ minWidth: 0, flex: 1, paddingRight: m.is_stub ? 48 : 0 }}>
        <p
          style={{
            fontSize:     14,
            fontWeight:   500,
            color:        "#ffffff",
            overflow:     "hidden",
            textOverflow: "ellipsis",
            whiteSpace:   "nowrap",
            lineHeight:   1.2,
          }}
        >
          {m.first_name} {m.last_name}
        </p>
        {m.pledge_class !== null && (
          <p
            style={{
              fontSize:      11,
              color:         "#C6A75E",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              lineHeight:    1.2,
              marginTop:     2,
              overflow:      "hidden",
              textOverflow:  "ellipsis",
              whiteSpace:    "nowrap",
            }}
          >
            {m.pledge_class}
          </p>
        )}
        {pinDisplay !== null && (
          <p
            style={{
              fontSize:    11,
              color:       "#C6A75E",
              lineHeight:  1.2,
              marginTop:   2,
              overflow:    "hidden",
              textOverflow: "ellipsis",
              whiteSpace:  "nowrap",
            }}
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
    </div>
  );
}

const nodeTypes = { member: MemberNode };

// ---------------------------------------------------------------------------
// Dagre layout
// ---------------------------------------------------------------------------

function buildLayout(members: FamilyTreeMember[]): {
  nodes: Node[];
  edges: Edge[];
} {
  const g = new Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: "TB", nodesep: 80, ranksep: 120, marginx: 40, marginy: 40 });

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
      // pathOptions.borderRadius is a smoothstep-specific runtime prop not reflected in the
      // generic Edge type — attach it via Object.assign to satisfy strict TS.
      const edge: Edge = {
        id:    `e-${m.big_id}-${m.id}`,
        source: m.big_id,
        target: m.id,
        type:  "smoothstep",
        style: { stroke: "rgba(198,167,94,0.35)", strokeWidth: 1.5 },
      };
      Object.assign(edge, { pathOptions: { borderRadius: 12 } });
      edges.push(edge);
    }
  });

  return { nodes, edges };
}

// ---------------------------------------------------------------------------
// Compute full lineage set for a selected node (ancestors + descendants)
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

  // Ancestors
  let cur: string | null | undefined = bigMap[selectedId];
  while (cur !== null && cur !== undefined) {
    result.add(cur);
    cur = bigMap[cur];
  }

  // Descendants (BFS)
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
// Compute generation depths (BFS from roots)
// ---------------------------------------------------------------------------

function getGenerationDepths(members: FamilyTreeMember[]): Record<string, number> {
  const memberIds = new Set(members.map((m) => m.id));
  const depths: Record<string, number> = {};
  const littlesMap: Record<string, string[]> = {};

  members.forEach((m) => {
    if (m.big_id !== null) {
      (littlesMap[m.big_id] ??= []).push(m.id);
    }
  });

  const queue: string[] = [];
  members.forEach((m) => {
    if (m.big_id === null || !memberIds.has(m.big_id)) {
      depths[m.id] = 0;
      queue.push(m.id);
    }
  });

  while (queue.length > 0) {
    const id = queue.shift()!;
    for (const lid of littlesMap[id] ?? []) {
      if (depths[lid] === undefined) {
        depths[lid] = (depths[id] ?? 0) + 1;
        queue.push(lid);
      }
    }
  }

  return depths;
}

// ---------------------------------------------------------------------------
// Get members to include when a pledge class is selected (class + lineage)
// ---------------------------------------------------------------------------

function getMembersForPledgeClass(
  cls: string,
  allMembers: FamilyTreeMember[]
): Set<string> {
  const inClass = allMembers
    .filter((m) => m.pledge_class === cls)
    .map((m) => m.id);
  const result = new Set<string>();
  inClass.forEach((id) =>
    getConnectedIds(id, allMembers).forEach((cid) => result.add(cid))
  );
  return result;
}

// ---------------------------------------------------------------------------
// Generation label helper
// ---------------------------------------------------------------------------

function genLabel(n: number): string {
  const labels: Record<number, string> = {
    0: "Founders",
    1: "1st Gen",
    2: "2nd Gen",
    3: "3rd Gen",
    4: "4th Gen",
  };
  if (n in labels) return labels[n]!;
  return `${n}th Gen`;
}

// ---------------------------------------------------------------------------
// Side panel
// ---------------------------------------------------------------------------

interface SidePanelProps {
  member:       FamilyTreeMember | null;
  bigMember:    FamilyTreeMember | null;
  littleCount:  number;
  onClose:      () => void;
  onFlyTo:      (id: string) => void;
  onFitLittles: () => void;
  viewerStatus: "member" | "admin";
}

function SidePanel({
  member,
  bigMember,
  littleCount,
  onClose,
  onFlyTo,
  onFitLittles,
  viewerStatus,
}: SidePanelProps) {
  const isOpen = member !== null;

  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteEmail, setInviteEmail]       = useState("");
  const [inviteLoading, setInviteLoading]   = useState(false);
  const [showTooltip, setShowTooltip]       = useState(false);
  const inviteBtnRef                        = useRef<HTMLButtonElement>(null);
  const [tooltipPos, setTooltipPos]         = useState<{ bottom: number; left: number } | null>(null);

  // Reset invite form whenever the selected member changes
  useEffect(() => {
    setShowInviteForm(false);
    setInviteEmail("");
    setInviteLoading(false);
  }, [member?.id]);

  const handleInvite = async () => {
    if (member === null || inviteEmail.trim() === "") return;
    setInviteLoading(true);
    try {
      const res = await fetch("/api/referrals", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          first_name: member.first_name,
          last_name:  member.last_name,
          email:      inviteEmail.trim(),
        }),
      });
      const json = await res.json() as { error?: string };
      if (!res.ok) {
        // Show error inline (no imported toast from here — use alert as last resort)
        alert(json.error ?? "Failed to send invite.");
      } else {
        setShowInviteForm(false);
        setInviteEmail("");
        alert(`Invite sent to ${inviteEmail.trim()}.`);
      }
    } catch {
      alert("Failed to send invite. Please try again.");
    } finally {
      setInviteLoading(false);
    }
  };

  const pinDisplay = (pin: string | null) =>
    pin !== null && pin !== ""
      ? `ΜΞ ${String(pin).padStart(3, "0")}`
      : null;

  return (
    <div
      style={{
        position:   "absolute",
        right:      0,
        top:        0,
        bottom:     0,
        width:      280,
        background: "#1a1208",
        borderLeft: "1px solid rgba(198,167,94,0.25)",
        zIndex:     10,
        transform:  isOpen ? "translateX(0%)" : "translateX(100%)",
        transition: "transform 0.2s ease",
        display:    "flex",
        flexDirection: "column",
        overflow:   "hidden",
      }}
    >
      {member !== null && (
        <>
          {/* Header */}
          <div
            style={{
              padding:        "16px 16px 12px",
              borderBottom:   "1px solid rgba(198,167,94,0.15)",
              display:        "flex",
              alignItems:     "flex-start",
              gap:            12,
              flexShrink:     0,
            }}
          >
            {/* Avatar */}
            {member.is_stub ? (
              <div
                style={{
                  width:          56,
                  height:         56,
                  borderRadius:   "50%",
                  background:     "rgba(255,255,255,0.08)",
                  display:        "flex",
                  alignItems:     "center",
                  justifyContent: "center",
                  flexShrink:     0,
                  opacity:        0.6,
                }}
              >
                <span style={{ fontSize: 20, color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>
                  {member.first_name[0]}{member.last_name[0]}
                </span>
              </div>
            ) : member.photo_url !== null ? (
              <div
                style={{
                  width:      56,
                  height:     56,
                  borderRadius: "50%",
                  overflow:   "hidden",
                  flexShrink: 0,
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={member.photo_url}
                  alt={`${member.first_name} ${member.last_name}`}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </div>
            ) : (
              <div
                style={{
                  width:          56,
                  height:         56,
                  borderRadius:   "50%",
                  background:     "rgba(198,167,94,0.15)",
                  display:        "flex",
                  alignItems:     "center",
                  justifyContent: "center",
                  flexShrink:     0,
                }}
              >
                <span style={{ fontSize: 20, color: "#C6A75E", fontWeight: 600 }}>
                  {member.first_name[0]}{member.last_name[0]}
                </span>
              </div>
            )}

            {/* Name + meta */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p
                style={{
                  fontSize:   16,
                  fontWeight: 700,
                  color:      member.is_stub ? "rgba(255,255,255,0.75)" : "#ffffff",
                  lineHeight: 1.2,
                  wordBreak:  "break-word",
                }}
              >
                {member.first_name} {member.last_name}
                {member.nickname !== null && member.nickname !== "" && (
                  <span style={{ fontWeight: 400, color: "rgba(255,255,255,0.45)", fontSize: 13 }}>
                    {" "}"{member.nickname}"
                  </span>
                )}
              </p>
              {member.pledge_class !== null && (
                <p style={{ fontSize: 12, color: "#C6A75E", marginTop: 3 }}>
                  {member.pledge_class} Class
                </p>
              )}
              {pinDisplay(member.pin_number) !== null && (
                <p style={{ fontSize: 12, color: "#C6A75E", marginTop: 2 }}>
                  {pinDisplay(member.pin_number)}
                </p>
              )}
              {member.is_stub && (
                <span
                  style={{
                    display:      "inline-block",
                    marginTop:    6,
                    fontSize:     11,
                    color:        "#C6A75E",
                    background:   "rgba(198,167,94,0.1)",
                    border:       "1px solid rgba(198,167,94,0.3)",
                    borderRadius: 999,
                    padding:      "2px 8px",
                  }}
                >
                  Unclaimed
                </span>
              )}
            </div>

            {/* Close button */}
            <button
              type="button"
              onClick={onClose}
              style={{
                background: "transparent",
                border:     "none",
                color:      "rgba(255,255,255,0.4)",
                cursor:     "pointer",
                padding:    4,
                flexShrink: 0,
              }}
              aria-label="Close panel"
            >
              <X size={16} />
            </button>
          </div>

          {/* Body */}
          <div style={{ flex: 1, overflowY: "auto", padding: "12px 16px", display: "flex", flexDirection: "column", gap: 12 }}>

            {/* Big brother */}
            {bigMember !== null && (
              <div>
                <p style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>
                  Big Brother
                </p>
                {bigMember.status === "member" || bigMember.status === "admin" ? (
                  <button
                    type="button"
                    onClick={() => onFlyTo(bigMember.id)}
                    style={{
                      background: "transparent",
                      border:     "none",
                      color:      "#C6A75E",
                      cursor:     "pointer",
                      fontSize:   13,
                      padding:    0,
                      textAlign:  "left",
                    }}
                  >
                    {bigMember.first_name} {bigMember.last_name} →
                  </button>
                ) : (
                  <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>
                    {bigMember.first_name} {bigMember.last_name}{" "}
                    <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>(unclaimed)</span>
                  </p>
                )}
              </div>
            )}

            {/* Little brothers */}
            {littleCount > 0 && (
              <div>
                <p style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>
                  Little Brothers
                </p>
                <button
                  type="button"
                  onClick={onFitLittles}
                  style={{
                    background: "transparent",
                    border:     "none",
                    color:      "#C6A75E",
                    cursor:     "pointer",
                    fontSize:   13,
                    padding:    0,
                    textAlign:  "left",
                  }}
                >
                  {littleCount} little brother{littleCount !== 1 ? "s" : ""} →
                </button>
              </div>
            )}

            {/* View profile (real members only) */}
            {!member.is_stub && (
              <Link
                href={`/profile/${member.id}`}
                onClick={(e) => e.stopPropagation()}
                style={{
                  display:        "block",
                  background:     "#C6A75E",
                  color:          "#0B0B0C",
                  fontSize:       12,
                  fontWeight:     700,
                  textAlign:      "center",
                  padding:        "8px 0",
                  borderRadius:   4,
                  textDecoration: "none",
                  marginTop:      4,
                }}
              >
                View Full Profile →
              </Link>
            )}

            {/* Invite to claim (stub only, member/admin viewer) */}
            {member.is_stub && viewerStatus !== undefined && (
              <div style={{ marginTop: 4 }}>
                {!showInviteForm ? (
                  <div style={{ display: "inline-block", width: "100%" }}>
                    {/* Tooltip — position:fixed so it escapes the overflowY:auto scroll container */}
                    {showTooltip && tooltipPos !== null && (
                      <div
                        style={{
                          position:     "fixed",
                          bottom:       tooltipPos.bottom,
                          left:         tooltipPos.left,
                          transform:    "translateX(-50%)",
                          background:   "#0B0B0C",
                          border:       "1px solid rgba(198,167,94,0.3)",
                          borderRadius: 6,
                          padding:      "8px 10px",
                          fontSize:     11,
                          color:        "rgba(255,255,255,0.75)",
                          width:        220,
                          lineHeight:   1.5,
                          zIndex:       9999,
                          whiteSpace:   "normal",
                          pointerEvents: "none",
                        }}
                      >
                        Send {member.first_name} an email invitation to join the Alumni Hub. When they sign up, their profile will be pre-populated with their pledge class, badge number, and big brother from our records.
                        {/* Triangle pointer */}
                        <div
                          style={{
                            position:    "absolute",
                            bottom:      -5,
                            left:        "50%",
                            transform:   "translateX(-50%)",
                            width:       0,
                            height:      0,
                            borderLeft:  "5px solid transparent",
                            borderRight: "5px solid transparent",
                            borderTop:   "5px solid rgba(198,167,94,0.3)",
                          }}
                        />
                      </div>
                    )}
                    <button
                      ref={inviteBtnRef}
                      type="button"
                      onClick={() => setShowInviteForm(true)}
                      onMouseEnter={() => {
                        const rect = inviteBtnRef.current?.getBoundingClientRect();
                        if (rect !== undefined) {
                          setTooltipPos({
                            bottom: window.innerHeight - rect.top + 8,
                            left:   rect.left + rect.width / 2,
                          });
                        }
                        setShowTooltip(true);
                      }}
                      onMouseLeave={() => setShowTooltip(false)}
                      style={{
                        width:        "100%",
                        display:      "flex",
                        alignItems:   "center",
                        justifyContent: "center",
                        gap:          6,
                        background:   "rgba(198,167,94,0.1)",
                        border:       "1px solid rgba(198,167,94,0.3)",
                        borderRadius: 4,
                        color:        "#C6A75E",
                        fontSize:     12,
                        fontWeight:   600,
                        padding:      "8px 0",
                        cursor:       "pointer",
                      }}
                    >
                      <Info size={14} />
                      Invite to claim →
                    </button>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <p style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>
                      Enter {member.first_name}'s email address to send them an invite:
                    </p>
                    <input
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="email@example.com"
                      onKeyDown={(e) => { if (e.key === "Enter") void handleInvite(); }}
                      style={{
                        background:   "rgba(255,255,255,0.07)",
                        border:       "1px solid rgba(255,255,255,0.15)",
                        borderRadius: 4,
                        color:        "#ffffff",
                        fontSize:     12,
                        padding:      "7px 10px",
                        outline:      "none",
                        width:        "100%",
                        boxSizing:    "border-box",
                      }}
                    />
                    <div style={{ display: "flex", gap: 6 }}>
                      <button
                        type="button"
                        onClick={() => void handleInvite()}
                        disabled={inviteLoading || inviteEmail.trim() === ""}
                        style={{
                          flex:         1,
                          background:   "#C6A75E",
                          border:       "none",
                          borderRadius: 4,
                          color:        "#0B0B0C",
                          fontSize:     12,
                          fontWeight:   700,
                          padding:      "7px 0",
                          cursor:       inviteLoading ? "not-allowed" : "pointer",
                          opacity:      inviteLoading || inviteEmail.trim() === "" ? 0.6 : 1,
                        }}
                      >
                        {inviteLoading ? "Sending…" : "Send Invite"}
                      </button>
                      <button
                        type="button"
                        onClick={() => { setShowInviteForm(false); setInviteEmail(""); }}
                        style={{
                          background:   "transparent",
                          border:       "1px solid rgba(255,255,255,0.15)",
                          borderRadius: 4,
                          color:        "rgba(255,255,255,0.4)",
                          fontSize:     12,
                          padding:      "7px 10px",
                          cursor:       "pointer",
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Generation rail — rendered over the canvas, only when hideIsolated=true
// ---------------------------------------------------------------------------

interface GenerationRailProps {
  layoutNodes: Node[];
  visibleMembers: FamilyTreeMember[];
}

function GenerationRail({ layoutNodes, visibleMembers }: GenerationRailProps) {
  const { y: panY, zoom } = useViewport();

  const genYData = useMemo(() => {
    const depthMap = getGenerationDepths(visibleMembers);

    // Compute average flow-space Y per depth
    const sumY: Record<number, number>   = {};
    const count: Record<number, number>  = {};
    const maxDepth: { v: number }        = { v: 0 };

    layoutNodes.forEach((n) => {
      const depth = depthMap[n.id];
      if (depth === undefined) return;
      const flowY = n.position.y + NODE_H / 2;
      sumY[depth]  = (sumY[depth]  ?? 0) + flowY;
      count[depth] = (count[depth] ?? 0) + 1;
      if (depth > maxDepth.v) maxDepth.v = depth;
    });

    const result: Array<{ depth: number; avgFlowY: number }> = [];
    for (let d = 0; d <= maxDepth.v; d++) {
      if (count[d] !== undefined && count[d]! > 0) {
        result.push({ depth: d, avgFlowY: sumY[d]! / count[d]! });
      }
    }
    return result;
  }, [layoutNodes, visibleMembers]);

  return (
    <div
      style={{
        position:      "absolute",
        left:          0,
        top:           0,
        bottom:        0,
        width:         48,
        zIndex:        5,
        pointerEvents: "none",
        borderRight:   "1px solid rgba(198,167,94,0.15)",
        overflow:      "hidden",
      }}
    >
      {genYData.map(({ depth, avgFlowY }) => {
        const screenY = avgFlowY * zoom + panY;
        return (
          <div
            key={depth}
            style={{
              position:      "absolute",
              top:           screenY - 9,
              right:         6,
              fontSize:      9,
              color:         "rgba(198,167,94,0.45)",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              whiteSpace:    "nowrap",
              lineHeight:    1,
            }}
          >
            {genLabel(depth)}
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Inner component — must be inside ReactFlowProvider
// ---------------------------------------------------------------------------

function FamilyTreeInner({
  members,
  viewerStatus,
}: {
  members:      FamilyTreeMember[];
  viewerStatus: "member" | "admin";
}) {
  const rf = useReactFlow();

  // Container ref for full screen
  const containerRef = useRef<HTMLDivElement>(null);

  // Search
  const searchRef           = useRef<HTMLInputElement>(null);
  const debounceRef         = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [query, setQuery]   = useState("");
  const [searchResults, setSearchResults] = useState<FamilyTreeMember[]>([]);
  const [showDropdown, setShowDropdown]   = useState(false);
  const [noMatch, setNoMatch]             = useState(false);

  // Selection / panel
  const [selectedId, setSelected] = useState<string | null>(null);

  // Filters
  const [hideIsolated, setHideIsolated]           = useState(true);
  const [selectedPledgeClass, setSelectedPledgeClass] = useState<string | null>(null);

  // Full screen
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const onFSChange = () => setIsFullscreen(document.fullscreenElement !== null);
    document.addEventListener("fullscreenchange", onFSChange);
    return () => document.removeEventListener("fullscreenchange", onFSChange);
  }, []);

  const handleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      void containerRef.current?.requestFullscreen();
    } else {
      void document.exitFullscreen();
    }
  }, []);

  // Pledge classes (distinct, from all members)
  const pledgeClasses = useMemo(() => {
    const unique = Array.from(
      new Set(members.map((m) => m.pledge_class).filter((c): c is string => c !== null))
    );
    return unique; // already ordered from DB
  }, [members]);

  // Isolated node detection
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

  // Visible members: hideIsolated → pledgeClass filter
  const visibleMembers = useMemo(() => {
    let base = hideIsolated ? members.filter((m) => !isolatedIds.has(m.id)) : members;
    if (selectedPledgeClass !== null) {
      const allowed = getMembersForPledgeClass(selectedPledgeClass, members);
      base = base.filter((m) => allowed.has(m.id));
    }
    return base;
  }, [hideIsolated, members, isolatedIds, selectedPledgeClass]);

  // Dagre layout
  const { nodes: layoutNodes, edges: layoutEdges } = useMemo(
    () => buildLayout(visibleMembers),
    [visibleMembers]
  );

  // fitView: deferred on initial load
  const hasFitViewRef = useRef(false);
  useEffect(() => {
    if (hasFitViewRef.current || layoutNodes.length === 0) return;
    hasFitViewRef.current = true;
    const timer = setTimeout(() => {
      void rf.fitView({ padding: 0.15, maxZoom: 1.2 });
    }, 100);
    return () => clearTimeout(timer);
  }, [layoutNodes.length, rf]);

  // fitView: re-fit on hideIsolated or pledgeClass change (skip first mount)
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
  }, [hideIsolated, selectedPledgeClass, rf]);

  // Connected ID set for selected node
  const connectedIds = useMemo(
    () => (selectedId !== null ? getConnectedIds(selectedId, visibleMembers) : null),
    [selectedId, visibleMembers]
  );

  // Display nodes
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

  // Display edges
  const displayEdges = useMemo(() => {
    return layoutEdges.map((e) => {
      if (connectedIds === null) return e;
      const isActive = connectedIds.has(e.source) && connectedIds.has(e.target);
      return {
        ...e,
        style: isActive
          ? { stroke: "#C6A75E", strokeWidth: 2, opacity: 1 }
          : { stroke: "rgba(198,167,94,0.35)", strokeWidth: 1, opacity: 0.1 },
      };
    });
  }, [layoutEdges, connectedIds]);

  // Search handler (debounced 200ms)
  const executeSearch = useCallback(
    (q: string) => {
      if (q.trim() === "") {
        setSearchResults([]);
        setShowDropdown(false);
        setNoMatch(false);
        void rf.fitView({ padding: 0.08, duration: 400 });
        return;
      }

      const lower       = q.trim().toLowerCase();
      const numericQuery = q.replace(/\D/g, "");

      const matches = visibleMembers.filter((m) => {
        const fullName = `${m.first_name} ${m.last_name}`.toLowerCase();
        if (fullName.includes(lower)) return true;
        if (m.first_name.toLowerCase().includes(lower)) return true;
        if (m.last_name.toLowerCase().includes(lower)) return true;
        if ((m.nickname ?? "").toLowerCase().includes(lower)) return true;
        if (
          numericQuery.length > 0 &&
          m.pin_number !== null &&
          parseInt(m.pin_number, 10) === parseInt(numericQuery, 10)
        ) return true;
        return false;
      });

      if (matches.length === 0) {
        setSearchResults([]);
        setShowDropdown(false);
        setNoMatch(true);
        void rf.fitView({ padding: 0.08, duration: 400 });
        return;
      }

      setNoMatch(false);

      if (matches.length === 1) {
        // Single result: fly to node + open panel
        const match = matches[0]!;
        setSearchResults([]);
        setShowDropdown(false);
        setSelected(match.id);
        const node = layoutNodes.find((n) => n.id === match.id);
        if (node !== undefined) {
          rf.setCenter(
            node.position.x + NODE_W / 2,
            node.position.y + NODE_H / 2,
            { zoom: 1.5, duration: 700 }
          );
        }
      } else {
        // Multiple: show dropdown (up to 8)
        setSearchResults(matches.slice(0, 8));
        setShowDropdown(true);
      }
    },
    [visibleMembers, layoutNodes, rf]
  );

  const handleSearchChange = useCallback(
    (q: string) => {
      setQuery(q);
      if (debounceRef.current !== undefined) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => executeSearch(q), 200);
    },
    [executeSearch]
  );

  const handleDropdownSelect = useCallback(
    (m: FamilyTreeMember) => {
      setShowDropdown(false);
      setSelected(m.id);
      const node = layoutNodes.find((n) => n.id === m.id);
      if (node !== undefined) {
        rf.setCenter(
          node.position.x + NODE_W / 2,
          node.position.y + NODE_H / 2,
          { zoom: 1.5, duration: 700 }
        );
      }
    },
    [layoutNodes, rf]
  );

  // Node click: zoom + open panel (same node toggles off)
  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      const nodeData    = node.data as unknown as MemberNodeData;
      const isDeselect  = selectedId === node.id;
      setSelected(isDeselect ? null : node.id);

      if (!isDeselect) {
        const allRfNodes   = rf.getNodes();
        const directLittles = allRfNodes.filter(
          (n) => (n.data as unknown as MemberNodeData).big_id === node.id
        );
        const bigId  = nodeData.big_id;
        const bigNode = bigId !== null ? allRfNodes.find((n) => n.id === bigId) : undefined;
        const targetNodes = [
          ...(bigNode !== undefined ? [bigNode] : []),
          node,
          ...directLittles,
        ];
        void rf.fitView({ nodes: targetNodes, padding: 0.35, maxZoom: 1.0, duration: 600 });
      }
    },
    [selectedId, rf]
  );

  // Click canvas → deselect
  const handlePaneClick = useCallback(() => {
    setSelected(null);
  }, []);

  // Fly to a specific node (from panel link clicks)
  const handleFlyTo = useCallback(
    (id: string) => {
      setSelected(id);
      const target = rf.getNode(id);
      if (target !== undefined) {
        void rf.fitView({ nodes: [target], padding: 0.5, maxZoom: 1.2, duration: 600 });
      }
    },
    [rf]
  );

  // Fit to littles of selected node
  const handleFitLittles = useCallback(() => {
    if (selectedId === null) return;
    const littles = rf.getNodes().filter(
      (n) => (n.data as unknown as MemberNodeData).big_id === selectedId
    );
    if (littles.length > 0) {
      void rf.fitView({ nodes: littles, padding: 0.3, duration: 400 });
    }
  }, [selectedId, rf]);

  // Fit lineage button
  const handleFitLineage = useCallback(() => {
    if (connectedIds === null || connectedIds.size === 0) return;
    const lineageNodes = rf.getNodes().filter((n) => connectedIds.has(n.id));
    void rf.fitView({ nodes: lineageNodes, padding: 0.2, duration: 400 });
  }, [connectedIds, rf]);

  // Panel data
  const selectedMember = useMemo(
    () => (selectedId !== null ? visibleMembers.find((m) => m.id === selectedId) ?? null : null),
    [selectedId, visibleMembers]
  );
  const panelBig = useMemo(() => {
    if (selectedMember === null || selectedMember.big_id === null) return null;
    return members.find((m) => m.id === selectedMember.big_id) ?? null;
  }, [selectedMember, members]);
  const panelLittleCount = useMemo(() => {
    if (selectedMember === null) return 0;
    return visibleMembers.filter((m) => m.big_id === selectedMember.id).length;
  }, [selectedMember, visibleMembers]);

  // Count display
  const totalClaimed   = members.filter((m) => !m.is_stub).length;
  const totalStubs     = members.filter((m) => m.is_stub).length;
  const visibleClaimed = visibleMembers.filter((m) => !m.is_stub).length;
  const visibleStubs   = visibleMembers.filter((m) => m.is_stub).length;

  const countLabel = (() => {
    if (!hideIsolated && selectedPledgeClass === null) {
      return totalStubs > 0
        ? `${totalClaimed} members · ${totalStubs} unclaimed`
        : `${totalClaimed} members`;
    }
    return visibleStubs > 0
      ? `${visibleClaimed} members · ${visibleStubs} unclaimed (filtered)`
      : `${visibleClaimed} members (filtered)`;
  })();

  return (
    <div
      ref={containerRef}
      className="relative w-full"
      style={{ height: "calc(100vh - 10rem)" }}
    >
      {/* Generation rail (left side, hideIsolated only) */}
      {hideIsolated && (
        <GenerationRail layoutNodes={layoutNodes} visibleMembers={visibleMembers} />
      )}

      {/* Top-left overlay: search + pledge class filter + controls */}
      <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5">
        {/* Row 1: search + pledge class */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <input
              ref={searchRef}
              type="search"
              value={query}
              onChange={(e) => handleSearchChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  setShowDropdown(false);
                  setQuery("");
                  handleSearchChange("");
                }
              }}
              onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
              placeholder="Search brothers…"
              className="h-9 rounded-lg border border-white/20 bg-sn-black/90 backdrop-blur-sm px-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-sn-gold w-52"
            />
            {/* No-match message */}
            {noMatch && query.trim() !== "" && (
              <div
                style={{
                  position:   "absolute",
                  top:        "100%",
                  left:       0,
                  marginTop:  4,
                  background: "rgba(11,11,12,0.95)",
                  border:     "1px solid rgba(255,255,255,0.12)",
                  borderRadius: 6,
                  padding:    "6px 10px",
                  fontSize:   12,
                  color:      "rgba(255,255,255,0.45)",
                  whiteSpace: "nowrap",
                  zIndex:     20,
                }}
              >
                No brothers found
              </div>
            )}
            {/* Dropdown */}
            {showDropdown && searchResults.length > 0 && (
              <div
                style={{
                  position:   "absolute",
                  top:        "100%",
                  left:       0,
                  marginTop:  4,
                  background: "rgba(11,11,12,0.97)",
                  border:     "1px solid rgba(198,167,94,0.25)",
                  borderRadius: 6,
                  overflow:   "hidden",
                  zIndex:     20,
                  minWidth:   220,
                }}
              >
                {searchResults.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onMouseDown={() => handleDropdownSelect(m)}
                    style={{
                      display:    "block",
                      width:      "100%",
                      textAlign:  "left",
                      background: "transparent",
                      border:     "none",
                      padding:    "8px 12px",
                      cursor:     "pointer",
                      borderBottom: "1px solid rgba(255,255,255,0.06)",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.background = "rgba(198,167,94,0.08)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                    }}
                  >
                    <p style={{ fontSize: 13, color: "#ffffff", lineHeight: 1.2 }}>
                      {m.first_name} {m.last_name}
                    </p>
                    <p style={{ fontSize: 11, color: "#C6A75E", marginTop: 2 }}>
                      {[m.pledge_class, m.pin_number !== null ? `ΜΞ ${String(m.pin_number).padStart(3, "0")}` : null]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Pledge class filter */}
          <div className="flex items-center gap-1">
            <select
              value={selectedPledgeClass ?? ""}
              onChange={(e) => setSelectedPledgeClass(e.target.value === "" ? null : e.target.value)}
              className="h-9 rounded-lg border border-white/20 bg-sn-black/90 backdrop-blur-sm px-2 text-sm text-white focus:outline-none focus:border-sn-gold max-w-35"
            >
              <option value="">All classes</option>
              {pledgeClasses.map((cls) => (
                <option key={cls} value={cls}>{cls}</option>
              ))}
            </select>
            {selectedPledgeClass !== null && (
              <button
                type="button"
                onClick={() => setSelectedPledgeClass(null)}
                className="h-9 w-9 flex items-center justify-center rounded-lg border border-white/20 bg-sn-black/90 backdrop-blur-sm text-white/50 hover:text-sn-gold transition-colors"
              >
                ×
              </button>
            )}
          </div>
        </div>

        {/* Row 2: toggle + selection controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setHideIsolated((v) => !v)}
            className={[
              "h-8 px-3 rounded-lg border text-xs transition-colors backdrop-blur-sm",
              hideIsolated
                ? "bg-sn-gold/20 border-sn-gold/60 text-sn-gold"
                : "bg-sn-black/90 border-white/20 text-white/50 hover:text-white",
            ].join(" ")}
          >
            {hideIsolated ? "Show Unlinked" : "Hide Unlinked"}
          </button>
          {selectedId !== null && (
            <>
              <button
                type="button"
                onClick={handleFitLineage}
                className="h-8 px-3 rounded-lg border border-white/20 bg-sn-black/90 backdrop-blur-sm text-white/50 hover:text-white text-xs transition-colors"
              >
                Fit lineage
              </button>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="h-8 px-3 rounded-lg border border-white/20 bg-sn-black/90 backdrop-blur-sm text-white/50 hover:text-white text-xs transition-colors"
              >
                Clear
              </button>
            </>
          )}
          {/* Full screen toggle */}
          <button
            type="button"
            onClick={handleFullscreen}
            className="h-8 w-8 flex items-center justify-center rounded-lg border border-white/20 bg-sn-black/90 backdrop-blur-sm text-white/50 hover:text-white transition-colors"
            title={isFullscreen ? "Exit full screen" : "Full screen"}
          >
            {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>
        </div>
      </div>

      {/* Top-right overlay: member count */}
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
        style={{ background: "#2e2010" }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          color="#4a3418"
        />
        <Controls showInteractive={false} />
        <div className="hidden md:block">
          <MiniMap
            nodeColor="rgba(198,167,94,0.4)"
            maskColor="rgba(198,167,94,0.08)"
            style={{ background: "#1a1208", border: "1px solid rgba(198,167,94,0.2)" }}
            position="bottom-right"
          />
        </div>
      </ReactFlow>

      {/* Side panel */}
      <SidePanel
        member={selectedMember}
        bigMember={panelBig}
        littleCount={panelLittleCount}
        onClose={() => setSelected(null)}
        onFlyTo={handleFlyTo}
        onFitLittles={handleFitLittles}
        viewerStatus={viewerStatus}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Public export
// ---------------------------------------------------------------------------

export function FamilyTreeClient({
  members,
  viewerStatus,
}: {
  members:      FamilyTreeMember[];
  viewerStatus: "member" | "admin";
}) {
  return (
    <ReactFlowProvider>
      <FamilyTreeInner members={members} viewerStatus={viewerStatus} />
    </ReactFlowProvider>
  );
}
