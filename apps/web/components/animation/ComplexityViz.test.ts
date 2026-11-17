import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const source = readFileSync(
  new URL('./ComplexityViz.tsx', import.meta.url),
  'utf8',
);
const player = readFileSync(
  new URL('../lesson/LessonVizPlayer.tsx', import.meta.url),
  'utf8',
);

describe('ComplexityViz source contract', () => {
  it('drives n from a touch-sized slider', () => {
    expect(source).toContain('type="range"');
    expect(source).toContain('aria-label="Input size n"');
    expect(source).toContain('aria-valuetext=');
    expect(source).toContain('h-11 min-w-0 flex-1');
  });

  it('counts every class at the current n and selects one as a radio', () => {
    expect(source).toContain('role="radiogroup"');
    expect(source).toContain('aria-checked={isSelected}');
    expect(source).toContain('count(operations[item.id])');
    expect(source).toContain('data-ops-readout');
  });

  it('syncs a code snippet to the selected curve', () => {
    expect(source).toContain('data-code-class={selected}');
    expect(source).toContain('index === current.hotLine');
    expect(source).toContain('// runs ${count(currentOps)}× at n = ${n}');
  });

  it('has a step mode that slows down under reduced motion', () => {
    expect(source).toContain('data-step-mode');
    expect(source).toContain('nextGrowthStep(n, reduced)');
    expect(source).toContain('reduced ? GROW_REDUCED_MS : GROW_MS');
    expect(source).toContain('useReducedMotion()');
  });

  it('tells curves apart without relying on colour', () => {
    expect(source).toContain('strokeDasharray={item.dash}');
    expect(source).toContain("isSelected ? item.tone : '--color-muted'");
    expect(source).not.toMatch(/#[0-9a-f]{6}\b/i);
  });

  it('is explored without the playback bar', () => {
    expect(player).toContain('<ComplexityViz />');
    expect(player).toContain('{!isComplexity && playback}');
    expect(player).toContain("mode !== 'scene' || isComplexity");
  });
});
