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

  it('soft-wraps code on phones and measures the band from real rows', () => {
    expect(source).toContain('whitespace-pre-wrap');
    expect(source).toContain('sm:whitespace-pre');
    expect(source).toContain('from.offsetTop');
  });

  it('keeps the active pipeline station in view by scrolling the strip', () => {
    expect(source).toContain('data-pipeline-scroller');
    expect(source).toContain('layoutScroll');
    expect(source).toContain('scroller.scrollTo(');
  });

  it('renders the action caption as decoration between scene and code', () => {
    const caption = source.slice(source.indexOf('function ActionCaption'));
    expect(caption).toContain('aria-hidden');
    expect(caption).toContain('order-2');
    expect(source).toContain('className="order-3 sm:order-2"');
    expect(source).toContain('order-1 grid gap-2 sm:order-4');
  });

  it('marks the final step, statically under reduced motion', () => {
    expect(source).toContain('{isFinal && <CompletionSweep');
    expect(source).toContain("data-completion={reduced ? 'static' : 'sweep'}");
    expect(source).toContain('{!reduced && (');
  });

  it('docks the controls above the mobile navigation', () => {
    expect(player).toContain('sticky bottom-[calc(2.5rem+');
    expect(player).toContain('sm:bottom-0');
    expect(player).toContain(
      '<PlaybackBar state={state} send={send} docked />',
    );
  });

  it('is wired through an explicit lesson player branch', () => {
    expect(player).toContain("visualizationKind === 'runtime-scene'");
    expect(player).toContain('<RuntimeSceneViz');
  });
});
