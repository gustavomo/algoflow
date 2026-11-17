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

  it('fades popped tokens itself instead of using AnimatePresence', () => {
    // AnimatePresence never finishes the exit of a token whose layoutId moved
    // to another region, leaving an invisible element that still takes space.
    expect(source).not.toContain('<AnimatePresence');
    expect(source).toContain('poppedTokens(shown.step, step)');
    expect(source).toContain('tokenExitVariant(token.id, false)');
    expect(source).toContain('leaving: reduced ? []');
  });

  it('only shows the event-loop indicator for scenes that model it', () => {
    expect(source).toContain('item.eventLoop !== undefined');
    expect(source).toContain('{hasEventLoop && (');
  });

  it('keeps long snippets inside a panel that scrolls itself', () => {
    expect(source).toContain('panel.scrollTo(');
    expect(source).not.toContain('scrollIntoView');
    expect(source).toContain("behavior: reduced ? 'auto' : 'smooth'");
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
