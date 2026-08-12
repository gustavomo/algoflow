import type { VisualStagePhase } from '@algoflow/contracts';

export interface GridTraversalSnapshot {
  id: string;
  phase: VisualStagePhase;
  mode: 'bfs' | 'dfs';
  size: number;
  walls: number[];
  start: number;
  goal: number;
  current?: number;
  visited: number[];
  frontier: number[];
  path: number[];
  narration: string;
}

const SIZE = 5;
const START = 0;
const GOAL = 24;
const WALLS = new Set([6, 8, 13, 16, 18]);

function neighbors(index: number) {
  const row = Math.floor(index / SIZE);
  const column = index % SIZE;
  return [
    row > 0 ? index - SIZE : -1,
    column < SIZE - 1 ? index + 1 : -1,
    row < SIZE - 1 ? index + SIZE : -1,
    column > 0 ? index - 1 : -1,
  ].filter((candidate) => candidate >= 0 && !WALLS.has(candidate));
}

function pathToGoal(parents: Map<number, number>, reached: boolean) {
  if (!reached) return [];
  const path = [GOAL];
  while (path[0] !== START) path.unshift(parents.get(path[0])!);
  return path;
}

export function createGridTraversalSteps(mode: 'bfs' | 'dfs') {
  const steps: GridTraversalSnapshot[] = [
    {
      id: `${mode}-initial`,
      phase: 'initial',
      mode,
      size: SIZE,
      walls: [...WALLS],
      start: START,
      goal: GOAL,
      visited: [],
      frontier: [START],
      path: [],
      narration: `${mode.toUpperCase()} starts with cell 0 in the ${mode === 'bfs' ? 'FIFO queue' : 'LIFO stack'}.`,
    },
  ];
  const frontier = [START];
  const discovered = new Set([START]);
  const visited: number[] = [];
  const parents = new Map<number, number>();
  let reachedGoal = false;

  while (frontier.length) {
    const current = mode === 'bfs' ? frontier.shift()! : frontier.pop()!;
    visited.push(current);
    if (current === GOAL) reachedGoal = true;
    const candidates = neighbors(current);
    const ordered = mode === 'dfs' ? [...candidates].reverse() : candidates;
    for (const candidate of ordered) {
      if (discovered.has(candidate)) continue;
      discovered.add(candidate);
      parents.set(candidate, current);
      frontier.push(candidate);
    }
    steps.push({
      id: `${mode}-visit-${current}`,
      phase: 'transition',
      mode,
      size: SIZE,
      walls: [...WALLS],
      start: START,
      goal: GOAL,
      current,
      visited: [...visited],
      frontier: [...frontier],
      path: reachedGoal ? pathToGoal(parents, true) : [],
      narration: `${mode.toUpperCase()} visits cell ${current}; ${frontier.length} ${frontier.length === 1 ? 'cell remains' : 'cells remain'} in the ${mode === 'bfs' ? 'queue' : 'stack'}.`,
    });
  }

  steps.push({
    id: `${mode}-terminal`,
    phase: 'terminal',
    mode,
    size: SIZE,
    walls: [...WALLS],
    start: START,
    goal: GOAL,
    visited,
    frontier: [],
    path: pathToGoal(parents, reachedGoal),
    narration: `${mode.toUpperCase()} complete: every reachable cell was processed, the frontier is empty, and the discovered path to cell ${GOAL} is visible.`,
  });
  return steps;
}
