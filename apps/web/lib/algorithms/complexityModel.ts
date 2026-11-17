export const COMPLEXITY_IDS = [
  'constant',
  'logarithmic',
  'linear',
  'linearithmic',
  'quadratic',
] as const;
export type ComplexityId = (typeof COMPLEXITY_IDS)[number];

export const COMPLEXITY_N_MIN = 1;
export const COMPLEXITY_N_MAX = 64;
/** Top of the chart, in operations. Steeper curves leave through it. */
export const COMPLEXITY_OPS_MAX = 450;

/** Iterations of `for (i = n; i >= 1; i = floor(i / 2))`. */
export const halvings = (n: number) => Math.floor(Math.log2(n)) + 1;

export interface ComplexityClass {
  id: ComplexityId;
  /** Big-O notation, e.g. `O(n log n)`. */
  label: string;
  name: string;
  /** Operations the snippet performs for an input of size n. */
  operations: (n: number) => number;
  /** A JavaScript function with exactly this growth. */
  code: string[];
  /** Zero-based index of the line that is counted. */
  hotLine: number;
  /** What doubling the input does to the work. */
  doubling: string;
  /** Theme colour of the curve while it is selected. */
  tone: string;
  /** Stroke dash pattern, so curves differ by more than colour. */
  dash?: string;
}

export const COMPLEXITY_CLASSES: readonly ComplexityClass[] = [
  {
    id: 'constant',
    label: 'O(1)',
    name: 'constant',
    operations: () => 1,
    code: ['function first(items) {', '  return items[0];', '}'],
    hotLine: 1,
    doubling: 'Doubling n changes nothing: one step, whatever the input.',
    tone: '--color-success',
    dash: '1 5',
  },
  {
    id: 'logarithmic',
    label: 'O(log n)',
    name: 'logarithmic',
    operations: halvings,
    code: [
      'function halvings(n) {',
      '  let steps = 0;',
      '  for (let i = n; i >= 1; i = Math.floor(i / 2)) {',
      '    steps++;',
      '  }',
      '  return steps;',
      '}',
    ],
    hotLine: 3,
    doubling:
      'Doubling n adds a single step, because each step halves the rest.',
    tone: '--color-scene-teal',
    dash: '6 4',
  },
  {
    id: 'linear',
    label: 'O(n)',
    name: 'linear',
    operations: (n) => n,
    code: [
      'function sum(items) {',
      '  let total = 0;',
      '  for (const item of items) {',
      '    total += item;',
      '  }',
      '  return total;',
      '}',
    ],
    hotLine: 3,
    doubling: 'Doubling n doubles the work: every item is visited once.',
    tone: '--color-warning',
  },
  {
    id: 'linearithmic',
    label: 'O(n log n)',
    name: 'linearithmic',
    operations: (n) => n * halvings(n),
    code: [
      'function halveForEach(items) {',
      '  let steps = 0;',
      '  for (const item of items) {',
      '    for (let i = items.length; i >= 1; i = Math.floor(i / 2)) {',
      '      steps++;',
      '    }',
      '  }',
      '  return steps;',
      '}',
    ],
    hotLine: 4,
    doubling:
      'Doubling n a little more than doubles the work: n items, log n steps each.',
    tone: '--color-scene-orange',
    dash: '10 3 2 3',
  },
  {
    id: 'quadratic',
    label: 'O(n²)',
    name: 'quadratic',
    operations: (n) => n * n,
    code: [
      'function countPairs(items) {',
      '  let pairs = 0;',
      '  for (const a of items) {',
      '    for (const b of items) {',
      '      pairs++;',
      '    }',
      '  }',
      '  return pairs;',
      '}',
    ],
    hotLine: 4,
    doubling: 'Doubling n quadruples the work: every item meets every item.',
    tone: '--color-danger',
    dash: '14 4',
  },
];

export const complexityClass = (id: ComplexityId) =>
  COMPLEXITY_CLASSES.find((item) => item.id === id)!;

export const clampN = (n: number) =>
  Math.min(
    COMPLEXITY_N_MAX,
    Math.max(COMPLEXITY_N_MIN, Math.round(Number.isFinite(n) ? n : 1)),
  );

/** Operations of every class at one input size. */
export function operationsAt(n: number): Record<ComplexityId, number> {
  const size = clampN(n);
  return Object.fromEntries(
    COMPLEXITY_CLASSES.map((item) => [item.id, item.operations(size)]),
  ) as Record<ComplexityId, number>;
}

/**
 * The next input size of step mode. Normally n grows by one; with reduced
 * motion it doubles instead, so the same story takes seven calm steps.
 * Returns null once n has reached the maximum.
 */
export function nextGrowthStep(n: number, doubling = false): number | null {
  if (n >= COMPLEXITY_N_MAX) return null;
  return clampN(doubling ? n * 2 : n + 1);
}

export interface ChartBox {
  left: number;
  top: number;
  width: number;
  height: number;
}

export const chartX = (n: number, box: ChartBox) =>
  box.left +
  ((n - COMPLEXITY_N_MIN) / (COMPLEXITY_N_MAX - COMPLEXITY_N_MIN)) * box.width;

/** Operations above the chart's maximum are pinned to its top edge. */
export const chartY = (operations: number, box: ChartBox) =>
  box.top +
  box.height -
  (Math.min(operations, COMPLEXITY_OPS_MAX) / COMPLEXITY_OPS_MAX) * box.height;

/**
 * The curve of one class as an SVG path through every integer n. A curve that
 * outgrows the chart ends exactly where it crosses the top edge.
 */
export function curvePath(item: ComplexityClass, box: ChartBox) {
  const parts: string[] = [];
  for (let n = COMPLEXITY_N_MIN; n <= COMPLEXITY_N_MAX; n++) {
    const operations = item.operations(n);
    if (operations > COMPLEXITY_OPS_MAX && n > COMPLEXITY_N_MIN) {
      const previous = item.operations(n - 1);
      const crossing =
        n - 1 + (COMPLEXITY_OPS_MAX - previous) / (operations - previous);
      parts.push(`L ${chartX(crossing, box).toFixed(1)} ${box.top.toFixed(1)}`);
      break;
    }
    parts.push(
      `${n === COMPLEXITY_N_MIN ? 'M' : 'L'} ${chartX(n, box).toFixed(1)} ${chartY(operations, box).toFixed(1)}`,
    );
  }
  return parts.join(' ');
}

const count = (value: number) => value.toLocaleString('en-US');

/** What the selected class costs at n and at 2n, and why. */
export function describeGrowth(id: ComplexityId, n: number) {
  const item = complexityClass(id);
  const size = clampN(n);
  const now = item.operations(size);
  const doubled = item.operations(size * 2);
  const factor = doubled / now;
  const times = Number.isInteger(factor) ? factor : factor.toFixed(1);
  return `At n = ${size}, ${item.label} takes ${count(now)} ${now === 1 ? 'step' : 'steps'}; at n = ${size * 2}, ${count(doubled)} (×${times}). ${item.doubling}`;
}
