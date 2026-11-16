import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const source = readFileSync(
  new URL('./RuntimeSceneViz.tsx', import.meta.url),
  'utf8',
);
const player = readFileSync(
  new URL('../lesson/LessonVizPlayer.tsx', import.meta.url),
  'utf8',
);

describe('RuntimeSceneViz source contract', () => {
  it('moves tokens between HTML regions with shared layout animation', () => {
    expect(source).toContain('<LayoutGroup');
    expect(source).toContain('layoutId={token.id}');
    expect(source).toContain('flex-col-reverse');
  });

  it('announces narration and honours reduced motion', () => {
    expect(source).toContain('aria-live="polite"');
    expect(source).toContain('useReducedMotion()');
    expect(source).toContain('reduced ? INSTANT : MOVE');
    expect(source).toContain('motion-reduce:animate-none');
  });

  it('is wired through an explicit lesson player branch', () => {
    expect(player).toContain("visualizationKind === 'runtime-scene'");
    expect(player).toContain('<RuntimeSceneViz');
  });
});
