import type {
  RuntimeScene,
  RuntimeSceneAction,
  RuntimeSceneActionTone,
  RuntimeSceneArrayCell,
  RuntimeSceneArrayPointer,
  RuntimeSceneArrayView,
  RuntimeSceneCellState,
  RuntimeSceneChallenge,
  RuntimeSceneGridLayout,
  RuntimeSceneStep,
  RuntimeSceneToken,
} from '@algoflow/contracts';

/**
 * Algorithm scenes are generated, never hand-written: each function below runs
 * the real algorithm on its input and records one full snapshot per step. The
 * same input always yields the same scene.
 */

const act = (
  text: string,
  tone: RuntimeSceneActionTone,
): RuntimeSceneAction => ({
  text,
  tone,
});

interface StepInput {
  label: string;
  narration: string;
  codeLines: number[];
  action?: RuntimeSceneAction;
  tokens?: RuntimeSceneToken[];
  activeRegionIds?: string[];
  challenge?: RuntimeSceneChallenge;
}

const range = (from: number, to: number) =>
  Array.from({ length: to - from + 1 }, (_, index) => from + index);

interface Item {
  id: string;
  value: number;
}

const toItems = (values: number[]): Item[] =>
  values.map((value, index) => ({ id: `v${index}`, value }));

function arrayView(
  items: Item[],
  stateAt: (index: number) => RuntimeSceneCellState,
  extra: {
    pointers?: RuntimeSceneArrayPointer[];
    range?: RuntimeSceneArrayView['range'];
    weights?: boolean;
  } = {},
): RuntimeSceneArrayView {
  const max = Math.max(1, ...items.map((item) => Math.abs(item.value)));
  return {
    regionId: 'a',
    cells: items.map((item, index): RuntimeSceneArrayCell => {
      const state = stateAt(index);
      return {
        id: item.id,
        label: String(item.value),
        ...(state === 'default' ? {} : { state }),
        ...(extra.weights ? { weight: Math.abs(item.value) / max } : {}),
      };
    }),
    ...(extra.pointers ? { pointers: extra.pointers } : {}),
    ...(extra.range ? { range: extra.range } : {}),
  };
}

export const BUBBLE_SORT_CODE = [
  'function bubbleSort(a) {',
  '  for (let end = a.length - 1; end > 0; end--) {',
  '    let swapped = false;',
  '    for (let i = 0; i < end; i++) {',
  '      if (a[i] > a[i + 1]) {',
  '        [a[i], a[i + 1]] = [a[i + 1], a[i]];',
  '        swapped = true;',
  '      }',
  '    }',
  '    if (!swapped) break;',
  '  }',
  '  return a;',
  '}',
];

/**
 * Bubble sort with early exit. Every comparison is two steps: the pair is
 * lifted onto the comparator, then it either swaps in the air or stays put.
 */
export function bubbleSortScene(values: number[]): RuntimeScene {
  const items = toItems(values);
  const n = items.length;
  const steps: RuntimeSceneStep[] = [];
  // Cells at this index and beyond are in their final position.
  let sortedFrom = n;

  const push = (
    input: StepInput,
    marks: Record<number, RuntimeSceneCellState> = {},
    pointers?: RuntimeSceneArrayPointer[],
  ) =>
    steps.push({
      label: input.label,
      narration: input.narration,
      codeLines: input.codeLines,
      tokens: [],
      output: [],
      activeRegionIds: ['a'],
      ...(input.action ? { action: input.action } : {}),
      ...(input.challenge ? { challenge: input.challenge } : {}),
      arrays: [
        arrayView(
          items,
          (index) =>
            marks[index] ?? (index >= sortedFrom ? 'sorted' : 'default'),
          {
            weights: true,
            pointers,
            range:
              sortedFrom < n
                ? { from: sortedFrom, to: n - 1, label: 'sorted' }
                : undefined,
          },
        ),
      ],
    });

  push({
    label: 'Unsorted input',
    narration: `The array holds ${n} values in arbitrary order. Bubble sort only ever looks at two neighbours at a time, and each pass carries the largest remaining value to the right end.`,
    codeLines: [0],
    action: act(`n = ${n} → at most ${Math.max(0, n - 1)} passes`, 'compare'),
  });

  let pass = 0;
  for (let end = n - 1; end > 0; end--) {
    pass += 1;
    let swapped = false;
    for (let i = 0; i < end; i++) {
      const left = items[i].value;
      const right = items[i + 1].value;
      const shouldSwap = left > right;
      const pointers = [
        { label: 'i', index: i },
        { label: 'i+1', index: i + 1 },
      ];
      push(
        {
          label: `Pass ${pass}: compare a[${i}] and a[${i + 1}]`,
          narration: `The comparator lifts the neighbours at indexes ${i} and ${i + 1}: ${left} on the left, ${right} on the right. The rule never changes: they swap only when the left value is greater.`,
          codeLines: [4],
          action: act(`a[${i}]=${left} ? a[${i + 1}]=${right}`, 'compare'),
          challenge: {
            prompt: `a[${i}]=${left} and a[${i + 1}]=${right}: what does this comparison do?`,
            options: ['Swap them', 'Keep the order'],
            answer: shouldSwap ? 0 : 1,
            explanation: shouldSwap
              ? `${left} > ${right}, so the pair is out of order and must swap.`
              : `${left} ≤ ${right}, so the pair is already in order and stays.`,
          },
        },
        { [i]: 'compare', [i + 1]: 'compare' },
        pointers,
      );
      if (shouldSwap) {
        [items[i], items[i + 1]] = [items[i + 1], items[i]];
        swapped = true;
        push(
          {
            label: `Swap ${left} and ${right}`,
            narration: `${left} is greater than ${right}, so the two trade places while still in the air. The larger value moved one slot to the right and keeps bubbling toward the end of the pass.`,
            codeLines: [5, 6],
            action: act(
              `a[${i}]=${left} > a[${i + 1}]=${right} → swap`,
              'swap',
            ),
          },
          { [i]: 'swap', [i + 1]: 'swap' },
          pointers,
        );
      } else {
        push(
          {
            label: `Keep ${left} and ${right}`,
            narration: `${left} is not greater than ${right}, so the pair is already in order. Both values are lowered back untouched and the comparator moves one slot to the right.`,
            codeLines: [3],
            action: act(`a[${i}]=${left} ≤ a[${i + 1}]=${right} → keep`, 'ok'),
          },
          {},
          pointers,
        );
      }
    }
    if (!swapped) {
      sortedFrom = 0;
      push({
        label: `Pass ${pass}: no swaps`,
        narration: `A whole pass finished without a single swap, which proves every neighbour pair is in order. The early exit skips the remaining passes: the array is sorted.`,
        codeLines: [9],
        action: act(`pass ${pass}: swapped = false → break`, 'ok'),
      });
      break;
    }
    sortedFrom = end === 1 ? 0 : end;
    push({
      label: `Pass ${pass} complete`,
      narration:
        end === 1
          ? `The last pass placed ${items[1].value}, and the one value left over can only be the smallest. Every position now holds its final value.`
          : `The largest value of the unsorted part, ${items[end].value}, has bubbled to index ${end} and joins the sorted suffix. The next pass can stop one slot earlier.`,
      codeLines: [9],
      action: act(
        `pass ${pass} done → a[${end}]=${items[end].value} is final`,
        'ok',
      ),
    });
  }

  sortedFrom = 0;
  const result = `[${items.map((item) => item.value).join(', ')}]`;
  push({
    label: 'Sorted',
    narration: `Every value sits in its final position after ${pass} ${pass === 1 ? 'pass' : 'passes'}. Bubble sort used no extra memory, but its nested loops make it quadratic in the worst case.`,
    codeLines: [11],
    action: act(
      result.length <= 48 ? `return ${result}` : 'return a → sorted',
      'ok',
    ),
  });

  return {
    code: { language: 'javascript', lines: BUBBLE_SORT_CODE },
    complexity: { time: 'O(n²)', space: 'O(1)' },
    regions: [{ id: 'a', label: 'a', kind: 'array', tone: 'teal' }],
    steps,
  };
}

export const TWO_POINTERS_CODE = [
  'function pairWithSum(a, target) {',
  '  let L = 0;',
  '  let R = a.length - 1;',
  '  while (L < R) {',
  '    const sum = a[L] + a[R];',
  '    if (sum === target) return [L, R];',
  '    if (sum < target) L++;',
  '    else R--;',
  '  }',
  '  return null;',
  '}',
];

const POINTER_OPTIONS = [
  'L moves right (L++)',
  'R moves left (R--)',
  'Neither: the pair is found',
];

/** Pair with a target sum in a sorted array, closing in from both ends. */
export function twoPointersScene(
  values: number[],
  target: number,
): RuntimeScene {
  const items = toItems(values);
  const n = items.length;
  const steps: RuntimeSceneStep[] = [];
  let left = 0;
  let right = n - 1;

  const push = (
    input: StepInput,
    marks: Record<number, RuntimeSceneCellState> = {},
    sum?: number,
  ) =>
    steps.push({
      label: input.label,
      narration: input.narration,
      codeLines: input.codeLines,
      tokens: [
        { id: 'target', label: `target = ${target}`, regionId: 'vars' },
        ...(sum === undefined
          ? []
          : [
              {
                id: 'sum',
                label: `sum = ${sum}`,
                regionId: 'vars',
                ...(sum === target ? { tone: 'ok' as const } : {}),
              },
            ]),
      ],
      output: [],
      activeRegionIds: ['a'],
      ...(input.action ? { action: input.action } : {}),
      ...(input.challenge ? { challenge: input.challenge } : {}),
      arrays: [
        arrayView(
          items,
          (index) =>
            marks[index] ??
            (index < left || index > right ? 'visited' : 'default'),
          {
            pointers:
              n > 0
                ? [
                    { label: 'L', index: left },
                    { label: 'R', index: right },
                  ]
                : undefined,
            range:
              left <= right && n > 0
                ? { from: left, to: right, label: 'candidates' }
                : undefined,
          },
        ),
      ],
    });

  push({
    label: 'Start at both ends',
    narration: `The array is sorted, which is what makes this work. L starts on the smallest value and R on the largest, so every possible pair lies between the two pointers.`,
    codeLines: [1, 2],
    action: act(`L=${left}, R=${right}, target=${target}`, 'compare'),
  });

  let found = false;
  while (left < right) {
    const a = items[left].value;
    const b = items[right].value;
    const sum = a + b;
    const answer = sum === target ? 2 : sum < target ? 0 : 1;
    push(
      {
        label: `Add a[${left}] and a[${right}]`,
        narration: `The pointers pick ${a} and ${b}, which add up to ${sum}. Comparing that sum with the target ${target} decides the single move that can still lead to an answer.`,
        codeLines: [4],
        action: act(
          `a[${left}]=${a} + a[${right}]=${b} = ${sum} vs ${target}`,
          'compare',
        ),
        challenge: {
          prompt: `sum = ${sum} and target = ${target}. What happens next?`,
          options: POINTER_OPTIONS,
          answer,
          explanation:
            answer === 2
              ? `${sum} equals the target, so the function returns this pair.`
              : answer === 0
                ? `${sum} is too small. Only a larger left value can raise the sum, so L moves right.`
                : `${sum} is too large. Only a smaller right value can lower the sum, so R moves left.`,
        },
      },
      { [left]: 'compare', [right]: 'compare' },
      sum,
    );
    if (sum === target) {
      found = true;
      push(
        {
          label: 'Pair found',
          narration: `${a} + ${b} is exactly ${target}. Each pointer only ever moved inward, so the search took a single linear pass instead of testing every pair with nested loops.`,
          codeLines: [5],
          action: act(`sum=${sum} = target → return [${left}, ${right}]`, 'ok'),
        },
        { [left]: 'sorted', [right]: 'sorted' },
        sum,
      );
      break;
    }
    if (sum < target) {
      left += 1;
      push(
        {
          label: 'Too small: move L',
          narration: `${sum} is below the target. ${a} was paired with the largest value still available and fell short, so no pair can use it: it is discarded and L steps right.`,
          codeLines: [6],
          action: act(`sum=${sum} < target → L++`, 'swap'),
        },
        {},
        sum,
      );
    } else {
      right -= 1;
      push(
        {
          label: 'Too large: move R',
          narration: `${sum} is above the target. ${b} was paired with the smallest value still available and overshot, so no pair can use it: it is discarded and R steps left.`,
          codeLines: [7],
          action: act(`sum=${sum} > target → R--`, 'swap'),
        },
        {},
        sum,
      );
    }
  }
  if (!found)
    push({
      label: 'No pair',
      narration: `The pointers met without ever matching the target ${target}. Every value was discarded with a proof that it could not be part of an answer, so the function returns null.`,
      codeLines: [9],
      action: act('L meets R → return null', 'error'),
    });

  return {
    code: { language: 'javascript', lines: TWO_POINTERS_CODE },
    complexity: { time: 'O(n)', space: 'O(1)' },
    regions: [
      { id: 'a', label: 'a (sorted)', kind: 'array', tone: 'teal' },
      { id: 'vars', label: 'state', kind: 'box', tone: 'yellow' },
    ],
    steps,
  };
}

export const SLIDING_WINDOW_CODE = [
  'function maxWindowSum(a: number[], k: number): number {',
  '  let sum = 0;',
  '  for (let i = 0; i < k; i++) sum += a[i];',
  '  let best = sum;',
  '  for (let R = k; R < a.length; R++) {',
  '    sum += a[R] - a[R - k];',
  '    best = Math.max(best, sum);',
  '  }',
  '  return best;',
  '}',
];

/** Largest sum of any `size` consecutive values, updated incrementally. */
export function slidingWindowScene(
  values: number[],
  size: number,
): RuntimeScene {
  const items = toItems(values);
  const n = items.length;
  const k = Math.max(1, Math.min(size, n));
  const steps: RuntimeSceneStep[] = [];
  let sum = 0;
  let best = 0;
  let bestFrom = 0;

  const push = (
    input: StepInput,
    window: { from: number; to: number; label: string } | undefined,
    marks: Record<number, RuntimeSceneCellState> = {},
    vars: { sum?: boolean; best?: boolean; improved?: boolean } = {},
  ) =>
    steps.push({
      label: input.label,
      narration: input.narration,
      codeLines: input.codeLines,
      tokens: [
        { id: 'k', label: `k = ${k}`, regionId: 'vars', tone: 'muted' },
        ...(vars.sum
          ? [{ id: 'sum', label: `sum = ${sum}`, regionId: 'vars' }]
          : []),
        ...(vars.best
          ? [
              {
                id: 'best',
                label: `best = ${best}`,
                regionId: 'vars',
                ...(vars.improved ? { tone: 'ok' as const } : {}),
              },
            ]
          : []),
      ],
      output: [],
      activeRegionIds: ['a'],
      ...(input.action ? { action: input.action } : {}),
      ...(input.challenge ? { challenge: input.challenge } : {}),
      arrays: [
        arrayView(
          items,
          (index) =>
            marks[index] ??
            (window && index < window.from ? 'visited' : 'default'),
          {
            pointers: window
              ? [
                  { label: 'L', index: window.from },
                  { label: 'R', index: window.to },
                ]
              : undefined,
            range: window,
          },
        ),
      ],
    });

  push(
    {
      label: 'Fixed-size window',
      narration: `The goal is the largest sum of ${k} consecutive values. Recomputing every window from scratch would repeat work, so the window keeps a running sum instead.`,
      codeLines: [0],
      action: act(`n = ${n}, k = ${k}`, 'compare'),
    },
    undefined,
  );

  for (let i = 0; i < k; i++) sum += items[i].value;
  best = sum;
  const seed = items
    .slice(0, k)
    .map((item) => item.value)
    .join(' + ');
  push(
    {
      label: 'Seed the first window',
      narration: `The first ${k} values are added once to seed the window: ${seed} = ${sum}. With nothing to compare against yet, that sum is also the best so far.`,
      codeLines: [1, 2, 3],
      action: act(`sum = ${seed} = ${sum} → best = ${best}`, 'ok'),
    },
    { from: 0, to: k - 1, label: 'window' },
    {},
    { sum: true, best: true, improved: true },
  );

  for (let right = k; right < n; right++) {
    const leaving = items[right - k].value;
    const entering = items[right].value;
    const next = sum - leaving + entering;
    const options = Array.from(
      new Set([next, sum + entering, sum - leaving, next + 1, next - 1]),
    )
      .slice(0, 3)
      .sort((a, b) => a - b);
    push(
      {
        label: `Slide to a[${right}]`,
        narration: `The window is about to move one slot right. Only its two edges change: ${leaving} leaves on the left and ${entering} enters on the right, while the values in between stay counted.`,
        codeLines: [4],
        action: act(
          `slide: −a[${right - k}]=${leaving}, +a[${right}]=${entering}`,
          'compare',
        ),
        challenge: {
          prompt: `sum = ${sum}. The window drops ${leaving} and takes in ${entering}. What is the new sum?`,
          options: options.map(String),
          answer: options.indexOf(next),
          explanation: `Subtract the value that leaves and add the one that enters: ${sum} − ${leaving} + ${entering} = ${next}.`,
        },
      },
      { from: right - k, to: right - 1, label: 'window' },
      { [right - k]: 'swap', [right]: 'compare' },
      { sum: true, best: true },
    );
    const previousBest = best;
    sum = next;
    const improved = sum > best;
    if (improved) {
      best = sum;
      bestFrom = right - k + 1;
    }
    push(
      {
        label: improved ? `New best: ${best}` : `Sum ${sum}: best stays`,
        narration: improved
          ? `One subtraction and one addition update the sum to ${sum}, which beats the previous best ${previousBest}. The window never rescanned the values it kept.`
          : `One subtraction and one addition update the sum to ${sum}. That does not beat the best so far, ${best}, so the record stays and the window keeps sliding.`,
        codeLines: [5, 6],
        action: improved
          ? act(
              `sum = ${sum + leaving - entering} − ${leaving} + ${entering} = ${sum} > ${previousBest} → best`,
              'swap',
            )
          : act(
              `sum = ${sum + leaving - entering} − ${leaving} + ${entering} = ${sum} ≤ best ${best}`,
              'ok',
            ),
      },
      { from: right - k + 1, to: right, label: 'window' },
      {},
      { sum: true, best: true, improved },
    );
  }

  const bestTo = bestFrom + k - 1;
  push(
    {
      label: 'Best window',
      narration: `The window reached the end after visiting each value once. The best ${k} consecutive values sum to ${best}, found in linear time with two numbers of extra state.`,
      codeLines: [8],
      action: act(`return best = ${best}`, 'ok'),
    },
    { from: bestFrom, to: bestTo, label: 'best' },
    Object.fromEntries(
      range(0, n - 1).map((index) => [
        index,
        index >= bestFrom && index <= bestTo ? 'sorted' : 'visited',
      ]),
    ),
    { best: true, improved: true },
  );

  return {
    code: { language: 'typescript', lines: SLIDING_WINDOW_CODE },
    complexity: { time: 'O(n)', space: 'O(1)' },
    regions: [
      { id: 'a', label: 'a', kind: 'array', tone: 'teal' },
      { id: 'vars', label: 'state', kind: 'box', tone: 'yellow' },
    ],
    steps,
  };
}

export const BFS_CODE = [
  'func bfs(grid [][]int, start, goal Cell) int {',
  '  queue := []Cell{start}',
  '  dist := map[Cell]int{start: 0}',
  '  for len(queue) > 0 {',
  '    cur := queue[0]',
  '    queue = queue[1:]',
  '    if cur == goal {',
  '      return dist[cur]',
  '    }',
  '    for _, next := range neighbors(grid, cur) {',
  '      if _, seen := dist[next]; !seen {',
  '        dist[next] = dist[cur] + 1',
  '        queue = append(queue, next)',
  '      }',
  '    }',
  '  }',
  '  return -1',
  '}',
];

export const DFS_CODE = [
  'func dfs(grid [][]int, start, goal Cell) bool {',
  '  stack := []Cell{start}',
  '  seen := map[Cell]bool{start: true}',
  '  for len(stack) > 0 {',
  '    cur := stack[len(stack)-1]',
  '    stack = stack[:len(stack)-1]',
  '    if cur == goal {',
  '      return true',
  '    }',
  '    for _, next := range neighbors(grid, cur) {',
  '      if !seen[next] {',
  '        seen[next] = true',
  '        stack = append(stack, next)',
  '      }',
  '    }',
  '  }',
  '  return false',
  '}',
];

/** At most this many predict-first questions per traversal. */
const GRID_CHALLENGE_LIMIT = 6;

/** Unvisited, in-bounds, non-wall neighbours in up, right, down, left order. */
export function gridNeighbors(layout: RuntimeSceneGridLayout, index: number) {
  const row = Math.floor(index / layout.cols);
  const col = index % layout.cols;
  const walls = new Set(layout.walls);
  return [
    row > 0 ? index - layout.cols : -1,
    col < layout.cols - 1 ? index + 1 : -1,
    row < layout.rows - 1 ? index + layout.cols : -1,
    col > 0 ? index - 1 : -1,
  ].filter((candidate) => candidate >= 0 && !walls.has(candidate));
}

/**
 * Breadth-first (queue) or depth-first (stack) search from start to goal. A
 * cell is marked seen when it enters the frontier, and the search stops as
 * soon as the goal is taken out of it.
 */
export function gridTraversalScene(
  mode: 'bfs' | 'dfs',
  layout: RuntimeSceneGridLayout,
): RuntimeScene {
  const bfs = mode === 'bfs';
  const total = layout.rows * layout.cols;
  const name = (index: number) =>
    `(${Math.floor(index / layout.cols)},${index % layout.cols})`;
  const short = (index: number) =>
    `${Math.floor(index / layout.cols)},${index % layout.cols}`;
  const frontierName = bfs ? 'queue' : 'stack';
  const put = bfs ? 'enqueue' : 'push';
  const take = bfs ? 'dequeue' : 'pop';

  const steps: RuntimeSceneStep[] = [];
  const frontier: number[] = [layout.start];
  const parents = new Map<number, number>();
  const seen = new Set([layout.start]);
  const done = new Set<number>();
  let current: number | undefined;
  let path: number[] = [];
  // Steps after which a cell leaves the frontier: where a prediction fits.
  const predictable: number[] = [];

  const push = (input: StepInput, beforeTake = false) => {
    const onPath = new Set(path);
    if (beforeTake && frontier.length >= 2) predictable.push(steps.length);
    steps.push({
      label: input.label,
      narration: input.narration,
      codeLines: input.codeLines,
      tokens: [
        ...(current === undefined
          ? []
          : [
              {
                id: `c${current}`,
                label: short(current),
                regionId: 'grid',
                cell: { regionId: 'grid', index: current },
              },
            ]),
        ...frontier.map((index) => ({
          id: `c${index}`,
          label: short(index),
          regionId: 'frontier',
          cell: { regionId: 'grid', index },
          ...(path.length ? { tone: 'muted' as const } : {}),
        })),
      ],
      output: [],
      activeRegionIds: input.activeRegionIds ?? ['grid'],
      ...(input.action ? { action: input.action } : {}),
      grids: [
        {
          regionId: 'grid',
          cells: range(0, total - 1).map((index): RuntimeSceneCellState => {
            if (onPath.has(index)) return 'path';
            if (index === current) return 'current';
            if (done.has(index)) return 'visited';
            if (frontier.includes(index)) return 'frontier';
            return 'default';
          }),
          ...(path.length ? { path } : {}),
        },
      ],
    });
  };

  push(
    {
      label: `Start in the ${frontierName}`,
      narration: bfs
        ? `The search begins with only the start cell in the queue. A queue is first-in, first-out, so cells leave in the order they were discovered and the search spreads out in rings.`
        : `The search begins with only the start cell on the stack. A stack is last-in, first-out, so the newest discovery is explored first and the search dives down one branch.`,
      codeLines: [1, 2],
      action: act(`${put} start ${name(layout.start)}`, 'compare'),
      activeRegionIds: ['frontier'],
    },
    true,
  );

  let reached = false;
  while (frontier.length > 0) {
    if (current !== undefined) done.add(current);
    current = bfs ? frontier.shift()! : frontier.pop()!;
    if (current === layout.goal) {
      reached = true;
      break;
    }
    const fresh = gridNeighbors(layout, current).filter(
      (candidate) => !seen.has(candidate),
    );
    const cell = name(current);
    if (fresh.length === 0) {
      push(
        {
          label: `${bfs ? 'Dequeue' : 'Pop'} ${cell}: dead end`,
          narration: bfs
            ? `${cell} leaves the front of the queue. All of its open neighbours were already discovered by earlier cells, so it adds nothing and the search moves on to the next cell in line.`
            : `${cell} is popped from the top of the stack. All of its open neighbours were already discovered, so this branch is exhausted and the search backtracks to the cell below.`,
          codeLines: [4, 5],
          action: act(`${take} ${cell} → no unseen neighbours`, 'ok'),
        },
        true,
      );
      continue;
    }
    push({
      label: `${bfs ? 'Dequeue' : 'Pop'} ${cell}`,
      narration: bfs
        ? `${cell} has waited longest, so it leaves the front of the queue and becomes the cell being visited. It is not the goal, so its neighbours are examined next.`
        : `${cell} was pushed most recently, so it is popped from the top of the stack and becomes the cell being visited. It is not the goal, so its neighbours are examined next.`,
      codeLines: [4, 5],
      action: act(`${take} ${cell}`, 'swap'),
    });
    for (const candidate of fresh) {
      seen.add(candidate);
      parents.set(candidate, current);
      frontier.push(candidate);
    }
    const names = fresh.map(name).join(', ');
    push(
      {
        label: `${bfs ? 'Enqueue' : 'Push'} ${fresh.length === 1 ? 'one neighbour' : `${fresh.length} neighbours`}`,
        narration: bfs
          ? `Each open neighbour of ${cell} that has never been seen is marked and joins the back of the queue: ${names}. Marking on entry guarantees no cell is ever queued twice.`
          : `Each open neighbour of ${cell} that has never been seen is marked and pushed on top of the stack: ${names}. Marking on entry guarantees no cell is ever pushed twice.`,
        codeLines: [9, 10, 11, 12],
        action: act(`${put} ${names}`, 'compare'),
        activeRegionIds: ['frontier'],
      },
      true,
    );
  }

  if (reached && current !== undefined) {
    const goal = name(current);
    const route = [current];
    while (route[0] !== layout.start) route.unshift(parents.get(route[0])!);
    const moves = route.length - 1;
    push({
      label: `Goal ${goal} reached`,
      narration: bfs
        ? `${goal} leaves the queue and it is the goal. Because the queue released cells ring by ring, no shorter route can exist: the distance recorded for it is the minimum.`
        : `${goal} is popped and it is the goal. Depth-first search answers whether the goal is reachable; the route it happened to follow is not guaranteed to be the shortest.`,
      codeLines: [6, 7],
      action: act(
        bfs
          ? `${goal} is the goal → return dist = ${moves}`
          : `${goal} is the goal → return true`,
        'ok',
      ),
    });
    done.add(current);
    current = undefined;
    path = route;
    push({
      label: bfs
        ? `Shortest path: ${moves} moves`
        : `Path found: ${moves} moves`,
      narration: bfs
        ? `Following each cell back to the neighbour that discovered it traces the route. It takes ${moves} moves, the fewest possible, after ${done.size} cells left the queue.`
        : `Following each cell back to the neighbour that discovered it traces the route. It takes ${moves} moves after ${done.size} cells were popped; breadth-first search may find a shorter one.`,
      codeLines: [7],
      action: act(
        bfs ? `shortest path = ${moves} moves` : `path = ${moves} moves`,
        'ok',
      ),
    });
  } else {
    if (current !== undefined) done.add(current);
    current = undefined;
    push({
      label: 'Goal unreachable',
      narration: `The ${frontierName} emptied without ever producing the goal. Every cell reachable from the start was visited once, so walls must cut the goal off completely.`,
      codeLines: [16],
      action: act(
        `${frontierName} empty → return ${bfs ? '-1' : 'false'}`,
        'error',
      ),
    });
  }

  // Ask about an evenly spread sample of the moments a cell leaves the frontier.
  const every = Math.max(
    1,
    Math.ceil(predictable.length / GRID_CHALLENGE_LIMIT),
  );
  predictable
    .filter((_, position) => position % every === 0)
    .forEach((stepIndex) => {
      const waiting = steps[stepIndex].tokens
        .filter((token) => token.regionId === 'frontier')
        .map((token) => token.cell!.index);
      const answerCell = bfs ? waiting[0] : waiting[waiting.length - 1];
      const picked = [
        waiting[0],
        ...waiting.slice(1, -1).slice(0, 2),
        waiting[waiting.length - 1],
      ];
      // Rotate so the right option is not always in the same place.
      const shift = stepIndex % picked.length;
      const options = [...picked.slice(shift), ...picked.slice(0, shift)];
      steps[stepIndex].challenge = {
        prompt: bfs
          ? 'Which cell leaves the queue next?'
          : 'Which cell is popped from the stack next?',
        options: options.map(name),
        answer: options.indexOf(answerCell),
        explanation: bfs
          ? `A queue is first-in, first-out: ${name(answerCell)} has waited longest, so it leaves first.`
          : `A stack is last-in, first-out: ${name(answerCell)} was pushed most recently, so it is popped first.`,
      };
    });

  return {
    code: { language: 'go', lines: bfs ? BFS_CODE : DFS_CODE },
    complexity: { time: 'O(V+E)', space: 'O(V)' },
    regions: [
      { id: 'grid', label: 'grid', kind: 'grid', tone: 'teal', grid: layout },
      {
        id: 'frontier',
        label: frontierName,
        kind: bfs ? 'queue' : 'stack',
        tone: 'orange',
      },
    ],
    steps,
  };
}

/**
 * Shared by the BFS and DFS lessons so the two traversals can be compared: on
 * this layout BFS finds a 10-move route and DFS settles for a 14-move one.
 */
export const LESSON_GRID: RuntimeSceneGridLayout = {
  rows: 6,
  cols: 6,
  walls: [8, 11, 12, 21, 25, 29, 33],
  start: 0,
  goal: 35,
};

export const bubbleSortRuntimeScene = bubbleSortScene([5, 3, 8, 1, 6, 2]);
export const twoPointersRuntimeScene = twoPointersScene(
  [1, 3, 4, 6, 8, 11, 12, 15],
  14,
);
export const slidingWindowRuntimeScene = slidingWindowScene(
  [2, 3, 1, 5, 4, 3, 6, 2],
  3,
);
export const bfsRuntimeScene = gridTraversalScene('bfs', LESSON_GRID);
export const dfsRuntimeScene = gridTraversalScene('dfs', LESSON_GRID);
