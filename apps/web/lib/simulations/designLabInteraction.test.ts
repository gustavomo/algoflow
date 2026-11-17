import type { SystemDesignGraph } from '@algoflow/contracts';
import { describe, expect, it } from 'vitest';
import {
  activateNode,
  classifyStudioKeyTarget,
  resolveStudioKey,
} from './designLabInteraction';
import type { KeyTargetLike } from '../keyboardTarget';

const graph: SystemDesignGraph = {
  nodes: [
    { id: 'a', type: 'client', label: 'Client', x: 100, y: 100, config: {} },
    { id: 'b', type: 'service', label: 'Service', x: 300, y: 100, config: {} },
  ],
  edges: [],
};

function el(
  tagName: string,
  attributes: Record<string, string> = {},
  parentElement: KeyTargetLike | null = null,
): KeyTargetLike {
  return {
    tagName,
    getAttribute: (name) => attributes[name] ?? null,
    hasAttribute: (name) => name in attributes,
    parentElement,
  };
}

const nodeA = el('g', { role: 'button', 'data-system-node': 'a' });
const nodeB = el('g', { role: 'button', 'data-system-node': 'b' });
const ghost = el('g', {
  role: 'button',
  'data-system-node': 'ghost-cache',
  'data-system-ghost': '',
});
const node = (nodeId: string) => ({ kind: 'node', nodeId }) as const;

describe('design lab key routing', () => {
  it('classifies controls, blocks, ghosts and everything else', () => {
    expect(classifyStudioKeyTarget(el('INPUT'))).toEqual({ kind: 'control' });
    expect(classifyStudioKeyTarget(el('BUTTON'))).toEqual({ kind: 'control' });
    expect(classifyStudioKeyTarget(el('A'))).toEqual({ kind: 'control' });
    expect(
      classifyStudioKeyTarget({ tagName: 'DIV', isContentEditable: true }),
    ).toEqual({ kind: 'control' });
    expect(classifyStudioKeyTarget(nodeA)).toEqual(node('a'));
    expect(classifyStudioKeyTarget(el('text', {}, nodeB))).toEqual(node('b'));
    expect(classifyStudioKeyTarget(ghost)).toEqual({ kind: 'ghost' });
    expect(classifyStudioKeyTarget(el('BODY'))).toEqual({ kind: 'other' });
    expect(classifyStudioKeyTarget(null)).toEqual({ kind: 'other' });
  });

  it('lets a focused block or ghost consume Space and Enter', () => {
    for (const target of [node('a'), { kind: 'ghost' } as const]) {
      expect(resolveStudioKey({ key: ' ', code: 'Space' }, target)).toBe(null);
      expect(resolveStudioKey({ key: 'Enter' }, target)).toBe(null);
    }
    expect(
      resolveStudioKey({ key: ' ', code: 'Space' }, { kind: 'other' }),
    ).toEqual({ type: 'toggle-play' });
  });

  it('deletes and nudges the focused block, not the selected one', () => {
    // Click block A (selects it), Tab to block B, press Delete: B goes.
    const focused = classifyStudioKeyTarget(nodeB);
    expect(resolveStudioKey({ key: 'Delete' }, focused)).toEqual({
      type: 'remove',
      nodeId: 'b',
    });
    expect(resolveStudioKey({ key: 'Backspace' }, focused)).toEqual({
      type: 'remove',
      nodeId: 'b',
    });
    expect(resolveStudioKey({ key: 'ArrowUp', altKey: true }, focused)).toEqual(
      { type: 'nudge', nodeId: 'b', dx: 0, dy: -20 },
    );
    expect(resolveStudioKey({ key: 'ArrowRight' }, focused)).toEqual({
      type: 'next',
    });
  });

  it('never deletes or nudges from a ghost or an unfocused canvas', () => {
    for (const target of [
      { kind: 'ghost' } as const,
      { kind: 'other' } as const,
    ]) {
      expect(resolveStudioKey({ key: 'Delete' }, target)).toBe(null);
      expect(resolveStudioKey({ key: 'Backspace' }, target)).toBe(null);
      expect(resolveStudioKey({ key: 'ArrowLeft', altKey: true }, target)).toBe(
        null,
      );
    }
  });

  it('ignores every shortcut inside controls', () => {
    for (const key of [' ', 'Enter', 'Delete', 'ArrowLeft'])
      expect(resolveStudioKey({ key }, { kind: 'control' })).toBe(null);
  });
});

describe('node activation', () => {
  it('selects without touching the graph outside connect mode', () => {
    const result = activateNode(graph, undefined, 'b', 'e1');
    expect(result.graph).toBe(graph);
    expect(result.selectedId).toBe('b');
    expect(result.connectingFrom).toBeUndefined();
  });

  it('creates exactly one directed edge on explicit activation', () => {
    const result = activateNode(graph, 'a', 'b', 'e1');
    expect(result.graph.edges).toEqual([{ id: 'e1', from: 'a', to: 'b' }]);
    expect(result.connectingFrom).toBeUndefined();
    expect(result.message).toBe('Connected Client to Service.');
  });

  it('refuses duplicates and keeps connect mode when the source is re-activated', () => {
    const connected = activateNode(graph, 'a', 'b', 'e1').graph;
    const duplicate = activateNode(connected, 'a', 'b', 'e2');
    expect(duplicate.graph.edges).toHaveLength(1);
    expect(duplicate.message).toMatch(/already connected/);
    const self = activateNode(graph, 'a', 'a', 'e3');
    expect(self.graph.edges).toHaveLength(0);
    expect(self.connectingFrom).toBe('a');
  });
});
