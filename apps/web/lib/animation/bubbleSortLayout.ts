/** Geometry of the Bubble Sort bars, in SVG user units of the viz viewBox. */
export const BUBBLE_VIEW_WIDTH = 720;
export const BUBBLE_BAR_GAP = 20;

export interface BubbleBarLayout {
  barWidth: number;
  gap: number;
  startX: number;
}

export function bubbleBarLayout(count: number): BubbleBarLayout {
  const safeCount = Math.max(1, count);
  const barWidth = Math.min(72, 470 / safeCount);
  const groupWidth = safeCount * barWidth + (safeCount - 1) * BUBBLE_BAR_GAP;
  return {
    barWidth,
    gap: BUBBLE_BAR_GAP,
    startX: (BUBBLE_VIEW_WIDTH - groupWidth) / 2,
  };
}

/** Left edge of the bar that sits in slot `index`. */
export function bubbleBarX(layout: BubbleBarLayout, index: number) {
  return layout.startX + index * (layout.barWidth + layout.gap);
}

/** A dragged bar may travel at most one slot to either side. */
export function clampBarDrag(layout: BubbleBarLayout, offset: number) {
  const limit = layout.barWidth + layout.gap;
  return Math.max(-limit, Math.min(limit, offset));
}

/**
 * The neighbor a drag of `offset` units points at, or null when the drag was
 * too short to mean a swap or there is no bar on that side.
 */
export function dragSwapNeighbor(
  layout: BubbleBarLayout,
  index: number,
  offset: number,
  count: number,
): number | null {
  if (Math.abs(offset) < layout.barWidth / 2) return null;
  const neighbor = offset > 0 ? index + 1 : index - 1;
  return neighbor >= 0 && neighbor < count ? neighbor : null;
}
