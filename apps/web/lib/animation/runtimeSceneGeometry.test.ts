import { describe, expect, it } from 'vitest';
import {
  PLOT_ORIGIN,
  PLOT_SIDE,
  TABLE_LINK_GUTTER,
  plotAngle,
  plotArcPath,
  plotLabelOffset,
  plotProject,
  tableLinkPath,
} from './runtimeSceneGeometry';

const rect = (left: number, top: number, width = 100, height = 20) => ({
  left,
  right: left + width,
  top,
  bottom: top + height,
});

describe('table link geometry', () => {
  it('joins side-by-side tables across the gap between them', () => {
    // The referencing table sits on the right of the referenced one.
    const link = tableLinkPath(rect(140, 60), rect(0, 20));
    expect(link.d).toBe('M 140 70 C 120 70, 120 30, 100 30');
    expect(link.end).toEqual({ x: 100, y: 30 });
    const mirrored = tableLinkPath(rect(0, 20), rect(140, 60));
    expect(mirrored.d).toBe('M 100 30 C 120 30, 120 70, 140 70');
  });

  it('bows through the right gutter when tables are stacked', () => {
    const link = tableLinkPath(rect(0, 100), rect(0, 20));
    const bow = 100 + TABLE_LINK_GUTTER * 1.6;
    expect(link.d).toBe(`M 100 110 C ${bow} 110, ${bow} 30, 100 30`);
    expect(link.end).toEqual({ x: 100, y: 30 });
  });

  it('ends an orphan reference in mid-air, towards its neighbour', () => {
    expect(tableLinkPath(rect(0, 100), null)).toEqual({
      d: 'M 100 110 L 114 110',
      end: { x: 114, y: 110 },
    });
    expect(tableLinkPath(rect(140, 100), null).end).toEqual({
      x: 126,
      y: 110,
    });
  });
});

describe('plot geometry', () => {
  it('projects with the origin bottom left and one scale on both axes', () => {
    expect(plotProject(0, 0)).toEqual(PLOT_ORIGIN);
    expect(plotProject(1, 1)).toEqual({
      x: PLOT_ORIGIN.x + PLOT_SIDE,
      y: PLOT_ORIGIN.y - PLOT_SIDE,
    });
    const a = plotProject(0.3, 0.4);
    // A 3-4-5 triangle keeps its proportions, so angles are preserved.
    expect(Math.hypot(a.x - PLOT_ORIGIN.x, a.y - PLOT_ORIGIN.y)).toBeCloseTo(
      0.5 * PLOT_SIDE,
    );
  });

  it('pushes labels away from the origin', () => {
    expect(plotLabelOffset(0, 1, 'kitten')).toEqual({ x: 0, y: -16 });
    const right = plotLabelOffset(1, 0, 'truck');
    expect(right.x).toBeGreaterThan(14);
    expect(right.y).toBe(-0);
    expect(plotLabelOffset(0, 0, 'origin')).toEqual({ x: 0, y: -0 });
  });

  it('measures angles and draws the arc from the lower to the upper', () => {
    expect(plotAngle(1, 1)).toBeCloseTo(45);
    expect(plotAngle(0, 1)).toBeCloseTo(90);
    const arc = plotArcPath({ x: 0, y: 1 }, { x: 1, y: 0 }, 10);
    expect(arc).toBe(
      `M ${(PLOT_ORIGIN.x + 10).toFixed(2)} ${PLOT_ORIGIN.y.toFixed(2)} A 10 10 0 0 0 ${PLOT_ORIGIN.x.toFixed(2)} ${(PLOT_ORIGIN.y - 10).toFixed(2)}`,
    );
    expect(plotArcPath({ x: 1, y: 0 }, { x: 0, y: 1 }, 10)).toBe(arc);
  });
});
