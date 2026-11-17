import type { SystemDesignGraph } from '@algoflow/contracts';

/**
 * Where a keydown landed in the Design Lab. Form controls own every key, a
 * focused canvas node owns Space and Enter (they activate it), and anything
 * else gets the studio shortcuts.
 */
export type StudioKeyTarget = 'control' | 'node' | 'other';

export type StudioKeyAction =
  | { type: 'remove' }
  | { type: 'nudge'; dx: number; dy: number }
  | { type: 'toggle-play' }
  | { type: 'prev' }
  | { type: 'next' };

const CONTROL_TAGS = new Set(['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON']);

export function classifyStudioKeyTarget(target: {
  tagName?: string;
  isContentEditable?: boolean;
  insideNode?: boolean;
}): StudioKeyTarget {
  if (target.isContentEditable) return 'control';
  if (target.tagName && CONTROL_TAGS.has(target.tagName.toUpperCase()))
    return 'control';
  return target.insideNode ? 'node' : 'other';
}

const NUDGE: Record<string, [number, number]> = {
  ArrowLeft: [-20, 0],
  ArrowRight: [20, 0],
  ArrowUp: [0, -20],
  ArrowDown: [0, 20],
};

/** Maps a window-level keydown to a studio action, or null to ignore it. */
export function resolveStudioKey(
  event: { key: string; code?: string; altKey?: boolean },
  target: StudioKeyTarget,
  hasSelection: boolean,
): StudioKeyAction | null {
  if (target === 'control') return null;
  if ((event.key === 'Delete' || event.key === 'Backspace') && hasSelection)
    return { type: 'remove' };
  if (event.altKey && hasSelection && NUDGE[event.key]) {
    const [dx, dy] = NUDGE[event.key];
    return { type: 'nudge', dx, dy };
  }
  const space = event.code === 'Space' || event.key === ' ';
  // A focused node consumes Space and Enter as its own activation.
  if (target === 'node' && (space || event.key === 'Enter')) return null;
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
