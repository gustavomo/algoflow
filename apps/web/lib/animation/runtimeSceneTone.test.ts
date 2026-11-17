import { describe, expect, it } from 'vitest';
import {
  cellCentrePercent,
  comparatorSpan,
  isLifted,
  spanPercent,
} from './runtimeSceneTone';

describe('runtime scene data geometry', () => {
  it('lifts only the cells being compared or swapped', () => {
    expect(isLifted('compare')).toBe(true);
    expect(isLifted('swap')).toBe(true);
    expect(isLifted('sorted')).toBe(false);
    expect(isLifted(undefined)).toBe(false);
  });

  it('bridges the comparator from the first to the last lifted cell', () => {
    expect(comparatorSpan([undefined, 'sorted', 'default'])).toBeNull();
    expect(comparatorSpan([undefined, 'compare', 'compare', 'sorted'])).toEqual(
      { from: 1, to: 2, swapping: false },
    );
    // Two pointers compare the two ends of the remaining range.
    expect(
      comparatorSpan(['visited', 'compare', undefined, 'compare']),
    ).toEqual({ from: 1, to: 3, swapping: false });
    expect(comparatorSpan(['swap', 'swap'])?.swapping).toBe(true);
  });

  it('places spans and cell centres in percent of a gapless grid', () => {
    expect(spanPercent(2, 4, 8)).toEqual({ left: '25%', width: '37.5%' });
    expect(spanPercent(0, 0, 0)).toEqual({ left: '0%', width: '100%' });
    expect(cellCentrePercent(0, 6, 6)).toEqual({
      left: `${(0.5 / 6) * 100}%`,
      top: `${(0.5 / 6) * 100}%`,
    });
    expect(cellCentrePercent(35, 6, 6)).toEqual({
      left: `${(5.5 / 6) * 100}%`,
      top: `${(5.5 / 6) * 100}%`,
    });
  });
});
