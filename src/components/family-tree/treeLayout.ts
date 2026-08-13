import { hierarchy, tree } from "d3-hierarchy";

export interface TreeMemberInput {
  id: string;
  big_id: string | null;
}

interface RawNode<T> {
  data: T;
  children: RawNode<T>[];
}

export interface PositionedNode<T> {
  id: string;
  data: T;
  x: number;
  y: number;
  parentId: string | null;
}

export const NODE_W = 198;
export const NODE_H = 74;
const GAP_X = 26;
const GAP_Y = 66;
const TREE_GAP = NODE_W + GAP_X * 3;

// Builds a forest: members with big_id null (or pointing outside the loaded
// set) become roots. Cycles are broken defensively — a node already on the
// current ancestor path is dropped from that branch rather than recursed
// into again, so malformed data can't blow the stack or hang the layout.
function buildForest<T extends TreeMemberInput>(members: T[]): RawNode<T>[] {
  const byId = new Map(members.map((m) => [m.id, m]));
  const childrenOf = new Map<string, T[]>();
  const roots: T[] = [];

  for (const m of members) {
    if (m.big_id !== null && byId.has(m.big_id) && m.big_id !== m.id) {
      const arr = childrenOf.get(m.big_id) ?? [];
      arr.push(m);
      childrenOf.set(m.big_id, arr);
    } else {
      roots.push(m);
    }
  }

  function build(m: T, visited: Set<string>): RawNode<T> {
    const kids = (childrenOf.get(m.id) ?? []).filter((c) => !visited.has(c.id));
    return {
      data: m,
      children: kids.map((c) => {
        const next = new Set(visited);
        next.add(c.id);
        return build(c, next);
      }),
    };
  }

  return roots.map((r) => build(r, new Set([r.id])));
}

export function layoutForest<T extends TreeMemberInput>(members: T[]): PositionedNode<T>[] {
  const forest = buildForest(members);
  const nodes: PositionedNode<T>[] = [];
  let xOffset = 0;

  for (const root of forest) {
    const h = hierarchy(root, (d) => d.children);
    const layout = tree<RawNode<T>>().nodeSize([NODE_W + GAP_X, NODE_H + GAP_Y]);
    const positioned = layout(h);

    let minX = Infinity;
    let maxX = -Infinity;
    positioned.each((n) => {
      minX = Math.min(minX, n.x);
      maxX = Math.max(maxX, n.x);
    });
    const shift = xOffset - minX;

    positioned.each((n) => {
      nodes.push({
        id: n.data.data.id,
        data: n.data.data,
        x: n.x + shift,
        y: n.y,
        parentId: n.parent?.data.data.id ?? null,
      });
    });

    xOffset += (maxX - minX) + TREE_GAP;
  }

  return nodes;
}

export function getBounds<T>(nodes: PositionedNode<T>[]) {
  if (nodes.length === 0) return { minX: 0, maxX: 0, minY: 0, maxY: 0 };
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const n of nodes) {
    minX = Math.min(minX, n.x - NODE_W / 2);
    maxX = Math.max(maxX, n.x + NODE_W / 2);
    minY = Math.min(minY, n.y);
    maxY = Math.max(maxY, n.y + NODE_H);
  }
  return { minX, maxX, minY, maxY };
}
