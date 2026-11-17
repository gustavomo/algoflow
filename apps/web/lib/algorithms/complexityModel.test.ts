import { describe, expect, it } from 'vitest';
import {
  COMPLEXITY_CLASSES,
  COMPLEXITY_N_MAX,
  COMPLEXITY_OPS_MAX,
  chartX,
  chartY,
  clampN,
  complexityClass,
  curvePath,
  describeGrowth,
  halvings,
  nextGrowthStep,
  operationsAt,
} from './complexityModel';

const box = { left: 10, top: 0, width: 630, height: 450 };

/** Runs a class's own snippet and counts how often its hot line executes. */
function measure(id: string, n: number) {
  const item = complexityClass(id as never);
  const lines = item.code.map((line, index) =>
    index === item.hotLine ? `__count++; ${line}` : line,
  );
  const name = /function (\w+)/.exec(lines[0])![1];
  const run = new Function(
    'input',
    `let __count = 0; ${lines.join('\n')}\n${name}(input); return __count;`,
  );
  const input =
    id === 'logarithmic' ? n : Array.from({ length: n }, (_, i) => i);
  return run(input) as number;
}

describe('complexity model', () => {
  it('offers the five classes in growth order', () => {
    expect(COMPLEXITY_CLASSES.map((item) => item.label)).toEqual([
      'O(1)',
      'O(log n)',
      'O(n)',
      'O(n log n)',
      'O(n²)',
    ]);
    for (const n of [2, 8, 33, 64]) {
      const values = Object.values(operationsAt(n));
      expect([...values].sort((a, b) => a - b)).toEqual(values);
    }
  });

  it('counts exactly what each snippet executes', () => {
    for (const item of COMPLEXITY_CLASSES)
      for (const n of [1, 2, 7, 16, 64])
        expect(measure(item.id, n), `${item.label} at n = ${n}`).toBe(
          item.operations(n),
        );
    expect(operationsAt(16)).toEqual({
      constant: 1,
      logarithmic: 5,
      linear: 16,
      linearithmic: 80,
      quadratic: 256,
    });
    expect(halvings(1)).toBe(1);
    expect(halvings(64)).toBe(7);
  });

  it('marks a counted line inside every snippet and a distinct dash', () => {
    for (const item of COMPLEXITY_CLASSES)
      expect(item.code[item.hotLine]).toMatch(/\+\+|\+=|return items\[0\]/);
    const dashes = COMPLEXITY_CLASSES.map((item) => item.dash ?? 'solid');
    expect(new Set(dashes).size).toBe(dashes.length);
  });

  it('clamps n and steps it for step mode', () => {
    expect(clampN(0)).toBe(1);
    expect(clampN(999)).toBe(COMPLEXITY_N_MAX);
    expect(clampN(Number.NaN)).toBe(1);
    expect(clampN(7.6)).toBe(8);
    expect(nextGrowthStep(1)).toBe(2);
    expect(nextGrowthStep(24, true)).toBe(48);
    expect(nextGrowthStep(48, true)).toBe(COMPLEXITY_N_MAX);
    expect(nextGrowthStep(COMPLEXITY_N_MAX)).toBeNull();
  });

  it('pins operations beyond the chart to its top edge', () => {
    expect(chartX(1, box)).toBe(10);
    expect(chartX(COMPLEXITY_N_MAX, box)).toBe(640);
    expect(chartY(0, box)).toBe(450);
    expect(chartY(COMPLEXITY_OPS_MAX, box)).toBe(0);
    expect(chartY(4096, box)).toBe(0);
  });

  it('ends a curve where it leaves the chart', () => {
    const linear = curvePath(complexityClass('linear'), box);
    expect(linear.startsWith('M 10.0 449.0')).toBe(true);
    expect(linear.endsWith('L 640.0 386.0')).toBe(true);
    const quadratic = curvePath(complexityClass('quadratic'), box);
    const last = quadratic.split(' L ').at(-1)!.split(' ').map(Number);
    // n² crosses 450 between n = 21 (441) and n = 22 (484).
    expect(last[1]).toBe(0);
    expect(last[0]).toBeGreaterThan(chartX(21, box));
    expect(last[0]).toBeLessThan(chartX(22, box));
  });

  it('describes what doubling the input costs', () => {
    expect(describeGrowth('quadratic', 16)).toBe(
      'At n = 16, O(n²) takes 256 steps; at n = 32, 1,024 (×4). Doubling n quadruples the work: every item meets every item.',
    );
    expect(describeGrowth('constant', 8)).toContain('takes 1 step; at n = 16');
    expect(describeGrowth('logarithmic', 16)).toContain(
      '5 steps; at n = 32, 6',
    );
    expect(describeGrowth('linearithmic', 16)).toContain('(×2.4)');
  });
});
