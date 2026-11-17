import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  BUBBLE_VIEW_WIDTH,
  bubbleBarLayout,
  bubbleBarX,
  clampBarDrag,
  dragSwapNeighbor,
} from './bubbleSortLayout';

const viz = readFileSync(
  new URL('../../components/animation/BubbleSortViz.tsx', import.meta.url),
  'utf8',
);

describe('bubble sort bar layout', () => {
  it('spreads the bars across the viewBox instead of stacking them', () => {
    const layout = bubbleBarLayout(5);
    const xs = [0, 1, 2, 3, 4].map((index) => bubbleBarX(layout, index));
    expect(xs).toEqual([140, 232, 324, 416, 508]);
    expect(new Set(xs).size).toBe(5);
    for (let index = 1; index < xs.length; index += 1)
      expect(xs[index] - xs[index - 1]).toBe(layout.barWidth + layout.gap);
  });

  it.each([1, 2, 5, 8, 12])('centres %i bars inside the viewBox', (count) => {
    const layout = bubbleBarLayout(count);
    const first = bubbleBarX(layout, 0);
    const end = bubbleBarX(layout, count - 1) + layout.barWidth;
    expect(first).toBeGreaterThanOrEqual(0);
    expect(end).toBeLessThanOrEqual(BUBBLE_VIEW_WIDTH);
    expect(first).toBeCloseTo(BUBBLE_VIEW_WIDTH - end);
  });

  it('resolves a drag to the adjacent bar only past half a bar', () => {
    const layout = bubbleBarLayout(5);
    expect(dragSwapNeighbor(layout, 2, 10, 5)).toBeNull();
    expect(dragSwapNeighbor(layout, 2, 40, 5)).toBe(3);
    expect(dragSwapNeighbor(layout, 2, -40, 5)).toBe(1);
    expect(dragSwapNeighbor(layout, 0, -60, 5)).toBeNull();
    expect(dragSwapNeighbor(layout, 4, 60, 5)).toBeNull();
  });

  it('keeps a dragged bar within one slot of its origin', () => {
    const layout = bubbleBarLayout(5);
    expect(clampBarDrag(layout, 500)).toBe(92);
    expect(clampBarDrag(layout, -500)).toBe(-92);
    expect(clampBarDrag(layout, 12)).toBe(12);
  });
});

describe('BubbleSortViz source contract', () => {
  it('never puts framer-motion drag on the SVG bar groups', () => {
    // framer-motion's drag gesture attaches a layout projection node whose
    // reset writes `transform: none` on the <g>, erasing the animated x and
    // stacking every bar at the origin.
    expect(viz).not.toMatch(/\bdrag=/);
    expect(viz).not.toContain('dragSnapToOrigin');
    expect(viz).not.toContain('dragConstraints');
    expect(viz).toContain('animate={{ x: bubbleBarX(layout, index) }}');
    expect(viz).toContain('onPointerDown');
  });
});
