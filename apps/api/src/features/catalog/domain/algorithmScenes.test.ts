import { describe, expect, it } from 'vitest';
import {
  RUNTIME_SCENE_MAX_GENERATED_STEPS,
  type RuntimeScene,
  type RuntimeSceneGridLayout,
} from '@algoflow/contracts';
import {
  LESSON_GRID,
  bfsRuntimeScene,
  bubbleSortRuntimeScene,
  bubbleSortScene,
  dfsRuntimeScene,
  gridNeighbors,
  gridTraversalScene,
  slidingWindowRuntimeScene,
  slidingWindowScene,
  twoPointersRuntimeScene,
  twoPointersScene,
} from './algorithmScenes';
import { lessons, validateRuntimeScene } from './catalog';

const labels = (scene: RuntimeScene, stepIndex = -1) =>
  scene.steps.at(stepIndex)!.arrays![0].cells.map((cell) => Number(cell.label));

/** Reference shortest distance, independent of the scene generator. */
function shortestDistance(layout: RuntimeSceneGridLayout) {
  const distance = new Map([[layout.start, 0]]);
  const queue = [layout.start];
  while (queue.length) {
    const cell = queue.shift()!;
    if (cell === layout.goal) return distance.get(cell)!;
    for (const next of gridNeighbors(layout, cell))
      if (!distance.has(next)) {
        distance.set(next, distance.get(cell)! + 1);
        queue.push(next);
      }
  }
  return -1;
}

const lessonScenes: Array<[string, RuntimeScene, string]> = [
  ['bubble-sort-js', bubbleSortRuntimeScene, 'javascript'],
  ['two-pointers-js', twoPointersRuntimeScene, 'javascript'],
  ['sliding-window-ts', slidingWindowRuntimeScene, 'typescript'],
  ['bfs-grid-go', bfsRuntimeScene, 'go'],
  ['dfs-grid-go', dfsRuntimeScene, 'go'],
];

describe('generated algorithm scenes', () => {
  it.each(lessonScenes)(
    'ships a valid, captioned, predictable scene for %s',
    (slug, scene, language) => {
      const lesson = lessons.find((item) => item.slug === slug)!;
      expect(lesson.runtimeScene).toBe(scene);
      expect(scene.code.language).toBe(language);
      expect(validateRuntimeScene(slug, scene)).toEqual([]);
      expect(scene.steps.length).toBeGreaterThanOrEqual(8);
      expect(scene.steps.length).toBeLessThanOrEqual(
        RUNTIME_SCENE_MAX_GENERATED_STEPS,
      );
      expect(scene.complexity).toBeTruthy();
      expect(scene.steps.every((step) => step.action?.tone)).toBe(true);
      expect(
        scene.steps.filter((step) => step.challenge).length,
      ).toBeGreaterThanOrEqual(3);
      for (const step of scene.steps) {
        expect(step.narration.length).toBeGreaterThan(60);
        // The highlight band spans min..max, so lines must be contiguous.
        const sorted = [...step.codeLines].sort((a, b) => a - b);
        expect(sorted.at(-1)! - sorted[0] + 1).toBe(sorted.length);
      }
    },
  );

  it('is deterministic: the same input yields the same scene', () => {
    expect(bubbleSortScene([5, 3, 8, 1, 6, 2])).toEqual(bubbleSortRuntimeScene);
    expect(twoPointersScene([1, 3, 4, 6, 8, 11, 12, 15], 14)).toEqual(
      twoPointersRuntimeScene,
    );
    expect(slidingWindowScene([2, 3, 1, 5, 4, 3, 6, 2], 3)).toEqual(
      slidingWindowRuntimeScene,
    );
    expect(gridTraversalScene('bfs', LESSON_GRID)).toEqual(bfsRuntimeScene);
    expect(gridTraversalScene('dfs', LESSON_GRID)).toEqual(dfsRuntimeScene);
  });

  it('declares each algorithm cost as complexity chips', () => {
    expect(bubbleSortRuntimeScene.complexity).toEqual({
      time: 'O(n²)',
      space: 'O(1)',
    });
    expect(twoPointersRuntimeScene.complexity).toEqual({
      time: 'O(n)',
      space: 'O(1)',
    });
    expect(slidingWindowRuntimeScene.complexity).toEqual({
      time: 'O(n)',
      space: 'O(1)',
    });
    for (const scene of [bfsRuntimeScene, dfsRuntimeScene])
      expect(scene.complexity).toEqual({ time: 'O(V+E)', space: 'O(V)' });
  });
});

describe('bubbleSortScene', () => {
  it.each([
    [[5, 3, 8, 1, 6, 2]],
    [[4, 4, 1, 9, 0, 7, 3, 2]],
    [[1, 2, 3, 4]],
    [[9, 7, 5, 3, 1]],
    [[42]],
  ])('ends sorted with every cell final for %j', (values) => {
    const scene = bubbleSortScene(values);
    expect(validateRuntimeScene('demo', scene)).toEqual([]);
    expect(labels(scene)).toEqual([...values].sort((a, b) => a - b));
    expect(
      scene.steps
        .at(-1)!
        .arrays![0].cells.every((cell) => cell.state === 'sorted'),
    ).toBe(true);
  });

  it('keeps cell ids stable so a swap moves two tokens', () => {
    const scene = bubbleSortRuntimeScene;
    const lift = scene.steps[1].arrays![0];
    const swap = scene.steps[2].arrays![0];
    expect(scene.steps[1].action?.text).toBe('a[0]=5 ? a[1]=3');
    expect(scene.steps[2].action).toEqual({
      text: 'a[0]=5 > a[1]=3 → swap',
      tone: 'swap',
    });
    expect(lift.cells.slice(0, 2).map((cell) => cell.state)).toEqual([
      'compare',
      'compare',
    ]);
    expect(lift.cells.slice(0, 2).map((cell) => cell.id)).toEqual(['v0', 'v1']);
    expect(swap.cells.slice(0, 2).map((cell) => cell.id)).toEqual(['v1', 'v0']);
    expect(swap.cells.slice(0, 2).map((cell) => cell.state)).toEqual([
      'swap',
      'swap',
    ]);
    expect(lift.pointers).toEqual([
      { label: 'i', index: 0 },
      { label: 'i+1', index: 1 },
    ]);
  });

  it('grows the sorted suffix one pass at a time and exits early', () => {
    const scene = bubbleSortRuntimeScene;
    const suffix = scene.steps.map(
      (step) =>
        step.arrays![0].cells.filter((cell) => cell.state === 'sorted').length,
    );
    for (let index = 1; index < suffix.length; index++)
      expect(suffix[index]).toBeGreaterThanOrEqual(suffix[index - 1]);
    expect(suffix[0]).toBe(0);
    expect(
      scene.steps.find((step) => step.arrays![0].range)?.arrays![0].range,
    ).toEqual({ from: 5, to: 5, label: 'sorted' });
    const sorted = bubbleSortScene([1, 2, 3, 4]);
    expect(sorted.steps.at(-2)?.action?.text).toBe(
      'pass 1: swapped = false → break',
    );
    expect(sorted.steps.filter((step) => step.challenge)).toHaveLength(3);
  });

  it('asks swap or keep before every comparison is resolved', () => {
    const scene = bubbleSortRuntimeScene;
    scene.steps.forEach((step, index) => {
      if (!step.challenge) return;
      const swapped = scene.steps[index + 1].action?.tone === 'swap';
      expect(step.challenge.options[step.challenge.answer]).toBe(
        swapped ? 'Swap them' : 'Keep the order',
      );
      // The question step must not give its own answer away.
      expect(step.action?.text).not.toMatch(/swap|keep|>|≤/);
    });
  });
});

describe('twoPointersScene', () => {
  it('finds the pair and only ever moves the pointers inward', () => {
    const scene = twoPointersRuntimeScene;
    const final = scene.steps.at(-1)!;
    expect(final.action).toEqual({
      text: 'sum=14 = target → return [1, 5]',
      tone: 'ok',
    });
    const view = final.arrays![0];
    expect(
      view.cells.flatMap((cell) => (cell.state === 'sorted' ? cell.label : [])),
    ).toEqual(['3', '11']);
    let [left, right] = [0, view.cells.length - 1];
    for (const step of scene.steps) {
      const [l, r] = step.arrays![0].pointers!.map((pointer) => pointer.index);
      expect(l).toBeGreaterThanOrEqual(left);
      expect(r).toBeLessThanOrEqual(right);
      [left, right] = [l, r];
    }
    expect(scene.steps[2].action?.text).toBe('sum=16 > target → R--');
  });

  it('predicts which pointer moves from the sum', () => {
    const scene = twoPointersRuntimeScene;
    const answers = scene.steps.flatMap((step) =>
      step.challenge ? step.challenge.options[step.challenge.answer] : [],
    );
    expect(answers).toEqual([
      'R moves left (R--)',
      'L moves right (L++)',
      'R moves left (R--)',
      'Neither: the pair is found',
    ]);
  });

  it('reports a missing pair once the pointers meet', () => {
    const scene = twoPointersScene([1, 2, 4, 9], 100);
    expect(validateRuntimeScene('demo', scene)).toEqual([]);
    expect(scene.steps.at(-1)?.action).toEqual({
      text: 'L meets R → return null',
      tone: 'error',
    });
  });
});

describe('slidingWindowScene', () => {
  it.each([
    [[2, 3, 1, 5, 4, 3, 6, 2], 3],
    [[9, 1, 1, 1, 8, 8], 2],
    [[4, 2], 2],
  ])('returns the best window sum for %j with k=%i', (values, k) => {
    const scene = slidingWindowScene(values, k);
    expect(validateRuntimeScene('demo', scene)).toEqual([]);
    const sums = values
      .slice(0, values.length - k + 1)
      .map((_, from) =>
        values.slice(from, from + k).reduce((sum, value) => sum + value, 0),
      );
    const best = Math.max(...sums);
    const final = scene.steps.at(-1)!;
    expect(final.action?.text).toBe(`return best = ${best}`);
    const range = final.arrays![0].range!;
    expect(range.to - range.from + 1).toBe(k);
    expect(sums[range.from]).toBe(best);
  });

  it('slides one slot per update and predicts the incremental sum', () => {
    const scene = slidingWindowRuntimeScene;
    expect(scene.steps[3].action?.text).toBe('sum = 6 − 2 + 5 = 9 > 6 → best');
    const question = scene.steps[2].challenge!;
    expect(question.options[question.answer]).toBe('9');
    expect(scene.steps[2].arrays![0].range).toMatchObject({ from: 0, to: 2 });
    expect(scene.steps[3].arrays![0].range).toMatchObject({ from: 1, to: 3 });
  });
});

describe('gridTraversalScene', () => {
  it('finds the shortest path with BFS', () => {
    const path = bfsRuntimeScene.steps.at(-1)!.grids![0].path!;
    expect(path[0]).toBe(LESSON_GRID.start);
    expect(path.at(-1)).toBe(LESSON_GRID.goal);
    expect(path.length - 1).toBe(shortestDistance(LESSON_GRID));
    expect(path.length - 1).toBe(10);
    expect(bfsRuntimeScene.steps.at(-1)?.action?.text).toBe(
      'shortest path = 10 moves',
    );
  });

  it('finds a valid but longer path with DFS on the same grid', () => {
    const path = dfsRuntimeScene.steps.at(-1)!.grids![0].path!;
    expect(path[0]).toBe(LESSON_GRID.start);
    expect(path.at(-1)).toBe(LESSON_GRID.goal);
    expect(path.length - 1).toBeGreaterThan(shortestDistance(LESSON_GRID));
    expect(new Set(path).size).toBe(path.length);
  });

  it('releases the frontier FIFO for BFS and LIFO for DFS', () => {
    for (const [scene, pick] of [
      [bfsRuntimeScene, (cells: string[]) => cells[0]],
      [dfsRuntimeScene, (cells: string[]) => cells.at(-1)],
    ] as const) {
      scene.steps.forEach((step, index) => {
        if (!step.challenge) return;
        const waiting = step.tokens
          .filter((token) => token.regionId === 'frontier')
          .map((token) => `(${token.label})`);
        expect(step.challenge.options[step.challenge.answer]).toBe(
          pick(waiting),
        );
        // The next step really takes that cell out and visits it on the grid.
        const taken = scene.steps[index + 1].tokens.find(
          (token) => token.regionId === 'grid',
        );
        expect(`(${taken?.label})`).toBe(pick(waiting));
      });
    }
  });

  it('moves each cell token grid → frontier → visited, never twice', () => {
    for (const scene of [bfsRuntimeScene, dfsRuntimeScene]) {
      const entered = new Set<string>();
      const visited = new Set<string>();
      for (const step of scene.steps) {
        const view = step.grids![0];
        for (const token of step.tokens) {
          expect(token.cell?.regionId).toBe('grid');
          if (token.regionId === 'frontier') {
            expect(visited.has(token.id)).toBe(false);
            entered.add(token.id);
            if (!view.path)
              expect(view.cells[token.cell!.index]).toBe('frontier');
          } else {
            expect(entered.has(token.id)).toBe(true);
            visited.add(token.id);
            expect(view.cells[token.cell!.index]).toBe('current');
          }
        }
        expect(
          step.tokens.filter((token) => token.regionId === 'grid').length,
        ).toBeLessThanOrEqual(1);
      }
    }
  });

  it('reports an unreachable goal instead of a path', () => {
    const walled: RuntimeSceneGridLayout = {
      rows: 3,
      cols: 3,
      walls: [5, 7],
      start: 0,
      goal: 8,
    };
    for (const mode of ['bfs', 'dfs'] as const) {
      const scene = gridTraversalScene(mode, walled);
      expect(validateRuntimeScene('demo', scene)).toEqual([]);
      const final = scene.steps.at(-1)!;
      expect(final.action?.tone).toBe('error');
      expect(final.grids![0].path).toBeUndefined();
      expect(final.tokens).toEqual([]);
    }
  });
});
