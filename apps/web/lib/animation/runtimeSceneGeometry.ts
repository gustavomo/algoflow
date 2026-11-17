/** A box measured relative to the element that hosts the link overlay. */
export interface LinkRect {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

const middle = (rect: LinkRect) => (rect.top + rect.bottom) / 2;

/** How far a stacked link bows out into the gutter beside the tables. */
export const TABLE_LINK_GUTTER = 14;
const ORPHAN_STUB = 14;

/**
 * The curve that joins a foreign-key row to the row it references. Tables
 * that sit side by side are joined across the gap between them; tables
 * stacked on a phone are joined through the gutter on their right. Without a
 * target the reference is an orphan: a short stub that ends in mid-air.
 */
export function tableLinkPath(
  source: LinkRect,
  target: LinkRect | null,
): { d: string; end: { x: number; y: number } } {
  const sy = middle(source);
  if (!target) {
    // Point towards the neighbouring table when there is one on the left.
    const leftwards = source.left > ORPHAN_STUB * 2;
    const from = leftwards ? source.left : source.right;
    const x = from + (leftwards ? -ORPHAN_STUB : ORPHAN_STUB);
    return { d: `M ${from} ${sy} L ${x} ${sy}`, end: { x, y: sy } };
  }
  const ty = middle(target);
  if (source.left >= target.right || target.left >= source.right) {
    const leftwards = source.left >= target.right;
    const from = leftwards ? source.left : source.right;
    const to = leftwards ? target.right : target.left;
    const mid = (from + to) / 2;
    return {
      d: `M ${from} ${sy} C ${mid} ${sy}, ${mid} ${ty}, ${to} ${ty}`,
      end: { x: to, y: ty },
    };
  }
  const edge = Math.max(source.right, target.right);
  const bow = edge + TABLE_LINK_GUTTER * 1.6;
  return {
    d: `M ${source.right} ${sy} C ${bow} ${sy}, ${bow} ${ty}, ${target.right} ${ty}`,
    end: { x: target.right, y: ty },
  };
}

/**
 * Plot space: a 100x100 box whose origin sits bottom left. Both axes share
 * one scale so angles survive, and the top and right keep room for labels.
 */
export const PLOT_ORIGIN = { x: 10, y: 90 };
export const PLOT_SIDE = 72;

/** A point with coordinates from 0 to 1, in plot-box units (also percent). */
export function plotProject(x: number, y: number) {
  return { x: PLOT_ORIGIN.x + x * PLOT_SIDE, y: PLOT_ORIGIN.y - y * PLOT_SIDE };
}

/** Pixel offset that pushes a label away from the origin, past its point. */
export function plotLabelOffset(x: number, y: number, label: string) {
  const length = Math.hypot(x, y) || 1;
  const reach = 14 + label.length * 3 * (x / length);
  return {
    x: Math.round((x / length) * reach),
    y: Math.round(-(y / length) * 16),
  };
}

/** Angle of a vector in degrees, counter-clockwise from the x axis. */
export const plotAngle = (x: number, y: number) =>
  (Math.atan2(y, x) * 180) / Math.PI;

/** An arc around the plot origin between the directions of two vectors. */
export function plotArcPath(
  a: { x: number; y: number },
  b: { x: number; y: number },
  radius: number,
) {
  const [from, to] = [Math.atan2(a.y, a.x), Math.atan2(b.y, b.x)].sort(
    (first, second) => first - second,
  );
  const at = (angle: number) =>
    `${(PLOT_ORIGIN.x + Math.cos(angle) * radius).toFixed(2)} ${(PLOT_ORIGIN.y - Math.sin(angle) * radius).toFixed(2)}`;
  // Sweep flag 0: counter-clockwise on screen, where y grows downwards.
  return `M ${at(from)} A ${radius} ${radius} 0 0 0 ${at(to)}`;
}
