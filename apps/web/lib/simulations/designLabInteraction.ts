import type { SystemDesignGraph } from '@algoflow/contracts';
import { type KeyTargetLike, targetOwnsKeys } from '../keyboardTarget';

/**
 * Where a keydown landed in the Design Lab. A focused canvas block owns Space
 * and Enter (they activate it) and is the block Delete and Alt+Arrow act on;
 * a suggested (ghost) block only owns Space and Enter. Controls that handle
 * keys themselves own every key, and anything else gets the studio shortcuts.
 */
export type StudioKeyTarget =
  | { kind: 'control' }
  | { kind: 'node'; nodeId: string }
  | { kind: 'ghost' }
  | { kind: 'other' };

export type StudioKeyAction =
  | { type: 'remove'; nodeId: string }
  | { type: 'nudge'; nodeId: string; dx: number; dy: number }
  | { type: 'toggle-play' }
  | { type: 'prev' }
  | { type: 'next' };

/**
 * Classifies a keydown target from the DOM: the nearest `[data-system-node]`
 * ancestor names the block (ghosts also carry `data-system-ghost`); otherwise
 * the shared rule decides whether the target handles keys itself.
 */
export function classifyStudioKeyTarget(
  target: KeyTargetLike | null | undefined,
): StudioKeyTarget {
  for (let node = target; node; node = node.parentElement) {
    const nodeId = node.getAttribute?.('data-system-node');
    if (nodeId)
      return node.hasAttribute?.('data-system-ghost')
        ? { kind: 'ghost' }
        : { kind: 'node', nodeId };
  }
  return targetOwnsKeys(target) ? { kind: 'control' } : { kind: 'other' };
}

const NUDGE: Record<string, [number, number]> = {
  ArrowLeft: [-20, 0],
  ArrowRight: [20, 0],
  ArrowUp: [0, -20],
  ArrowDown: [0, 20],
};

/**
 * Maps a window-level keydown to a studio action, or null to ignore it.
 * Delete and Alt+Arrow act on the focused block, never on the selection, so
 * tabbing to another block and pressing Delete removes the block in focus.
 */
export function resolveStudioKey(
  event: { key: string; code?: string; altKey?: boolean },
  target: StudioKeyTarget,
): StudioKeyAction | null {
  if (target.kind === 'control') return null;
  const nodeId = target.kind === 'node' ? target.nodeId : undefined;
  if (event.key === 'Delete' || event.key === 'Backspace')
    return nodeId ? { type: 'remove', nodeId } : null;
  if (event.altKey && NUDGE[event.key]) {
    if (!nodeId) return null;
    const [dx, dy] = NUDGE[event.key];
    return { type: 'nudge', nodeId, dx, dy };
  }
  const space = event.code === 'Space' || event.key === ' ';
  // A focused block or ghost consumes Space and Enter as its own activation.
  if (target.kind !== 'other' && (space || event.key === 'Enter')) return null;
  if (space) return { type: 'toggle-play' };
  if (event.key === 'ArrowLeft') return { type: 'prev' };
  if (event.key === 'ArrowRight') return { type: 'next' };
  return null;
}

export interface NodeActivation {
  graph: SystemDesignGraph;
  selectedId: string;
  connectingFrom?: string;
  message?: string;
}

/**
 * Explicit activation of a node (click, tap, Enter or Space). In connect mode
 * it completes a directed edge from the source; otherwise it selects. Focus
 * alone never calls this, so tabbing across nodes cannot create edges.
 */
export function activateNode(
  graph: SystemDesignGraph,
  connectingFrom: string | undefined,
  id: string,
  edgeId: string,
): NodeActivation {
  if (!connectingFrom || connectingFrom === id)
    return { graph, selectedId: id, connectingFrom };
  const duplicate = graph.edges.some(
    (edge) => edge.from === connectingFrom && edge.to === id,
  );
  if (duplicate)
    return {
      graph,
      selectedId: id,
      message: 'Those blocks are already connected.',
    };
  const from = graph.nodes.find((node) => node.id === connectingFrom);
  const to = graph.nodes.find((node) => node.id === id);
  return {
    graph: {
      ...graph,
      edges: [...graph.edges, { id: edgeId, from: connectingFrom, to: id }],
    },
    selectedId: id,
    message: from && to ? `Connected ${from.label} to ${to.label}.` : undefined,
  };
}
