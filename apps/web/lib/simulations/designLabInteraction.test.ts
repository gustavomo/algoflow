import type { SystemDesignGraph } from '@algoflow/contracts';
import { describe, expect, it } from 'vitest';
import {
  activateNode,
  classifyStudioKeyTarget,
  resolveStudioKey,
} from './designLabInteraction';

const graph: SystemDesignGraph = {
  nodes: [
    { id: 'a', type: 'client', label: 'Client', x: 100, y: 100, config: {} },
    { id: 'b', type: 'service', label: 'Service', x: 300, y: 100, config: {} },
  ],
  edges: [],
};

describe('design lab key routing', () => {
  it('classifies form controls, canvas nodes and everything else', () => {
    expect(classifyStudioKeyTarget({ tagName: 'input' })).toBe('control');
    expect(classifyStudioKeyTarget({ tagName: 'BUTTON' })).toBe('control');
    expect(
      classifyStudioKeyTarget({ tagName: 'DIV', isContentEditable: true }),
    ).toBe('control');
    expect(classifyStudioKeyTarget({ tagName: 'g', insideNode: true })).toBe(
      'node',
    );
    expect(classifyStudioKeyTarget({ tagName: 'BODY' })).toBe('other');
  });

  it('lets a focused node consume Space and Enter instead of toggling play', () => {
    expect(resolveStudioKey({ key: ' ', code: 'Space' }, 'node', true)).toBe(
      null,
    );
    expect(resolveStudioKey({ key: 'Enter' }, 'node', true)).toBe(null);
    expect(
      resolveStudioKey({ key: ' ', code: 'Space' }, 'other', false),
    ).toEqual({ type: 'toggle-play' });
  });

  it('keeps delete, nudge and stepping available on a focused node', () => {
    expect(resolveStudioKey({ key: 'Delete' }, 'node', true)).toEqual({
      type: 'remove',
    });
    expect(
      resolveStudioKey({ key: 'ArrowUp', altKey: true }, 'node', true),
    ).toEqual({ type: 'nudge', dx: 0, dy: -20 });
    expect(resolveStudioKey({ key: 'ArrowRight' }, 'node', true)).toEqual({
      type: 'next',
    });
  });

  it('ignores every shortcut inside form controls', () => {
    for (const key of [' ', 'Enter', 'Delete', 'ArrowLeft'])
      expect(resolveStudioKey({ key }, 'control', true)).toBe(null);
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
