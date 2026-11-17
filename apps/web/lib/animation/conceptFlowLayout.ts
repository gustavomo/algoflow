import type {
  ConceptFlowConnection,
  ConceptFlowNarrative,
  ConceptFlowStep,
} from '@algoflow/contracts';

export type ConceptNodeState = 'active' | 'failed' | 'completed' | 'pending';

/** A failure outranks being active, which outranks having been completed. */
export function conceptNodeState(
  step: ConceptFlowStep,
  nodeId: string,
): ConceptNodeState {
  if (step.failedNodeIds?.includes(nodeId)) return 'failed';
  if (step.activeNodeIds.includes(nodeId)) return 'active';
  if (step.completedNodeIds?.includes(nodeId)) return 'completed';
  return 'pending';
}

interface IndexedConnection {
  connection: ConceptFlowConnection;
  /** Position in `narrative.connections`, as steps refer to it. */
  index: number;
}

/**
 * Splits connections for a vertical rail. `forward[i]` joins node `i` to node
 * `i + 1` and is drawn between them; every other connection (a loop back, a
 * jump) is a return, listed under the rail.
 */
export function splitConceptConnections(narrative: ConceptFlowNarrative): {
  forward: Array<IndexedConnection | undefined>;
  returns: IndexedConnection[];
} {
  const position = new Map(
    narrative.nodes.map((node, index) => [node.id, index]),
  );
  const forward: Array<IndexedConnection | undefined> = narrative.nodes
    .slice(1)
    .map(() => undefined);
  const returns: IndexedConnection[] = [];
  narrative.connections.forEach((connection, index) => {
    const from = position.get(connection.from);
    const to = position.get(connection.to);
    if (from === undefined || to === undefined) return;
    if (to === from + 1 && !forward[from])
      forward[from] = { connection, index };
    else returns.push({ connection, index });
  });
  return { forward, returns };
}
