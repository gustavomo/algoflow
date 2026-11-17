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

const data = readFileSync(
  new URL('./RuntimeSceneData.tsx', import.meta.url),
  'utf8',
);
const table = readFileSync(
  new URL('./RuntimeSceneTable.tsx', import.meta.url),
  'utf8',
);
const plot = readFileSync(
  new URL('./RuntimeScenePlot.tsx', import.meta.url),
  'utf8',
);
const challenge = readFileSync(
  new URL('../lesson/PredictChallenge.tsx', import.meta.url),
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
    expect(source).toContain('useHydratedReducedMotion()');
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

  it('animates array cells by stable id and lifts the compared pair', () => {
    expect(data).toContain('layoutId={`${region.id}:${cell.id}`}');
    expect(data).toContain('y: lifted ? -LIFT : 0');
    expect(data).toContain('data-comparator=');
    expect(data).toContain(
      'layoutId={`${region.id}:pointer:${pointer.label}`}',
    );
    expect(data).toContain('reduced ? INSTANT : MOVE');
  });

  it('keeps grid cells static and memoised, with one token in motion', () => {
    expect(data).toContain('const GridCell = memo(');
    expect(data).toContain('const ArrayCell = memo(');
    const cell = data.slice(
      data.indexOf('const GridCell = memo('),
      data.indexOf('export function GridRegion'),
    );
    // Only the visiting token has a layoutId; the cell itself is plain CSS.
    expect(cell.match(/layoutId=/g)).toHaveLength(1);
    expect(cell).toContain('layoutId={tokenId}');
    expect(cell).toContain("state === 'frontier' ? 'scene-frontier' : ''");
    expect(data).toContain('{path.length > 1 && !reduced && (');
  });

  it('flies a discovered cell token from the grid into its frontier', () => {
    expect(source).toContain('[data-grid-cell="${fliesIn.current}"]');
    expect(source).toContain('isNew && !reduced && token.cell');
    expect(source).toContain('<ArrayRegion');
    expect(source).toContain('<GridRegion');
  });

  it('draws tables that exist and links their rows by foreign key', () => {
    expect(source).toContain('<TableRegions');
    expect(source).toContain('views={step.tables ?? []}');
    // A table without a view is not drawn at all.
    expect(table).toContain('return view ? [{ region, view }] : [];');
    expect(table).toContain('data-table-row={rowKey(region.id, row.id)}');
    expect(table).toContain('tableLinkPath(source, target)');
    expect(table).toContain("data-link={link.orphan ? 'orphan' : 'resolved'}");
    expect(table).toContain('new ResizeObserver(measure)');
    // The gutter that stacked links bow into only exists on phones.
    expect(table).toContain('pr-6 sm:gap-10 sm:pr-0');
    expect(table).toContain('reduced ? INSTANT');
  });

  it('plots points that glide, with the query, its angle and neighbours', () => {
    expect(source).toContain('<PlotRegion');
    expect(plot).toContain('data-plot-point={id}');
    expect(plot).toContain('animate={{ left: `${at.x}%`, top: `${at.y}%`');
    expect(plot).toContain('data-plot-query');
    expect(plot).toContain('plotArcPath(query, anglePoint, ANGLE_RADIUS)');
    expect(plot).toContain('data-plot-neighbour=');
    expect(plot).toContain('data-unit-arc');
    expect(plot).toContain('reduced ? INSTANT : MOVE');
    // Labels are HTML at a fixed size, so they stay readable on a phone.
    expect(plot).toContain('font-mono text-xs');
  });

  it('leads with the scene for every data region kind', () => {
    expect(source).toContain("['array', 'grid', 'table', 'plot'].includes(");
  });

  it('offers a predict-first challenge driven by the same steps', () => {
    expect(player).toContain('<PredictChallenge');
    expect(player).toContain('step.challenge');
    expect(player).toContain("mode !== 'scene'");
    expect(challenge).toContain('<RuntimeSceneViz');
    expect(challenge).toContain("send({ type: 'PICK', option: index })");
    // Picked answers stay focusable so keyboard focus survives the answer.
    expect(challenge).toContain('aria-disabled={inert || undefined}');
    expect(challenge).not.toContain('disabled={tried');
    // Answers are buttons with a touch-sized target, never drag-only.
    expect(challenge).toContain('min-h-11');
    expect(challenge).not.toContain('onDrag');
    expect(challenge).toContain('sticky bottom-[calc(2.5rem+');
  });
});
