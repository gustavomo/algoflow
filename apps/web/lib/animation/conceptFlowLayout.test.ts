import { describe, expect, it } from 'vitest';
import type {
  ConceptFlowNarrative,
  ConceptFlowStep,
} from '@algoflow/contracts';
import { conceptNodeState, splitConceptConnections } from './conceptFlowLayout';

const step = (extra: Partial<ConceptFlowStep>): ConceptFlowStep => ({
  id: 's',
  phase: 'transition',
  label: 'l',
  narration: 'n',
  activeNodeIds: [],
  ...extra,
});

describe('concept flow layout', () => {
  it('ranks failed over active over completed', () => {
    const current = step({
      activeNodeIds: ['a', 'b'],
      completedNodeIds: ['b', 'c'],
      failedNodeIds: ['a'],
    });
    expect(conceptNodeState(current, 'a')).toBe('failed');
    expect(conceptNodeState(current, 'b')).toBe('active');
    expect(conceptNodeState(current, 'c')).toBe('completed');
    expect(conceptNodeState(current, 'd')).toBe('pending');
  });

  it('draws consecutive connections on the rail and lists the rest', () => {
    const narrative: ConceptFlowNarrative = {
      version: 1,
      scene: 'system-boundaries',
      nodes: ['a', 'b', 'c'].map((id) => ({ id, label: id })),
      connections: [
        { from: 'c', to: 'a', label: 'loop' },
        { from: 'a', to: 'b' },
        { from: 'b', to: 'c' },
        { from: 'a', to: 'c' },
        { from: 'a', to: 'ghost' },
      ],
      steps: [],
      terminalSummary: 'done',
    };
    const { forward, returns } = splitConceptConnections(narrative);
    // Indexes are the ones steps use in `activeConnectionIndexes`.
    expect(forward.map((item) => item?.index)).toEqual([1, 2]);
    expect(returns.map((item) => item.index)).toEqual([0, 3]);
    expect(returns[0].connection.label).toBe('loop');
  });

  it('leaves a gap where two neighbours are not connected', () => {
    const { forward } = splitConceptConnections({
      version: 1,
      scene: 'strategy-map',
      nodes: ['a', 'b', 'c'].map((id) => ({ id, label: id })),
      connections: [{ from: 'b', to: 'c' }],
      steps: [],
      terminalSummary: 'done',
    });
    expect(forward).toEqual([
      undefined,
      { connection: { from: 'b', to: 'c' }, index: 0 },
    ]);
  });
});
