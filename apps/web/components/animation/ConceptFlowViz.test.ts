import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const source = readFileSync(
  new URL('./ConceptFlowViz.tsx', import.meta.url),
  'utf8',
);

describe('ConceptFlowViz source contract', () => {
  it('carries the idea between nodes with one shared-layout token', () => {
    expect(source).toContain('<LayoutGroup id="concept-flow">');
    expect(source).toContain('layoutId="concept-token"');
    expect(source).toContain('step.token?.nodeId === node.id');
  });

  it('is a vertical rail first, with the narration beside it from sm up', () => {
    expect(source).toContain('data-concept-rail');
    expect(source).toContain('sm:grid-cols-[minmax(0,17rem)_minmax(0,1fr)]');
    // No scaled SVG: labels are HTML at reading size on a phone.
    expect(source).not.toContain('<svg');
    expect(source).not.toContain('viewBox');
    expect(source).toContain('text-sm leading-6');
  });

  it('uses theme tokens only and honours reduced motion', () => {
    expect(source).not.toMatch(/#[0-9a-f]{3,6}\b/i);
    expect(source).not.toContain('rgb(');
    expect(source).toContain('useReducedMotion()');
    expect(source).toContain('reduced ? INSTANT : MOVE');
  });

  it('announces the narration and marks state beyond colour', () => {
    expect(source).toContain('aria-live="polite"');
    expect(source).toContain("aria-current={state === 'active'");
    expect(source).toContain("? '✓'");
    expect(source).toContain("? '✗'");
    expect(source).toContain('border-dashed border-danger');
  });
});
