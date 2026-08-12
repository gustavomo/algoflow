export interface SortItem {
  id: string;
  value: number;
}

export type BubbleSortPhase =
  | 'ready'
  | 'compare'
  | 'swap'
  | 'settle'
  | 'complete';

export interface BubbleSortSnapshot {
  phase: BubbleSortPhase;
  stage: 'initial' | 'transition' | 'terminal';
  items: SortItem[];
  compared: [number, number] | null;
  swapped: boolean;
  pass: number;
  comparisonCount: number;
  swapCount: number;
  sortedFrom: number;
  narration: string;
}

export interface BubbleSortChallengeDefinition {
  id: string;
  version: 1;
  title: string;
  objective: string;
  values: number[];
}

export interface BubbleSortDecision {
  index: number;
  compareStepIndex: number;
  resultStepIndex: number;
  pairIndices: [number, number];
  pairItemIds: [string, string];
  pairValues: [number, number];
  shouldSwap: boolean;
  compareSnapshot: BubbleSortSnapshot;
  resultSnapshot: BubbleSortSnapshot;
}

export interface BubbleSortChallenge {
  definition: BubbleSortChallengeDefinition;
  steps: BubbleSortSnapshot[];
  decisions: BubbleSortDecision[];
  initialSnapshot: BubbleSortSnapshot;
  completeSnapshot: BubbleSortSnapshot;
}

export interface BubbleSortPredictionResult {
  correct: boolean;
  pairCorrect: boolean;
  swapCorrect: boolean;
  feedback: string;
}

function cloneItems(items: SortItem[]) {
  return items.map((item) => ({ ...item }));
}

function snapshot(
  items: SortItem[],
  values: Omit<BubbleSortSnapshot, 'items'>,
): BubbleSortSnapshot {
  return { ...values, items: cloneItems(items) };
}

export function createBubbleSortSteps(values: number[]): BubbleSortSnapshot[] {
  const items = values.map((value, index) => ({ id: `item-${index}`, value }));
  const steps: BubbleSortSnapshot[] = [];
  let comparisonCount = 0;
  let swapCount = 0;

  steps.push(
    snapshot(items, {
      phase: 'ready',
      stage: 'initial',
      compared: null,
      swapped: false,
      pass: 0,
      comparisonCount,
      swapCount,
      sortedFrom: items.length,
      narration:
        'Ready. Each pass moves the largest remaining value to the sorted boundary.',
    }),
  );

  for (let pass = 0; pass < items.length - 1; pass += 1) {
    let swappedInPass = false;
    for (let index = 0; index < items.length - 1 - pass; index += 1) {
      comparisonCount += 1;
      const left = items[index].value;
      const right = items[index + 1].value;
      steps.push(
        snapshot(items, {
          phase: 'compare',
          stage: 'transition',
          compared: [index, index + 1],
          swapped: false,
          pass: pass + 1,
          comparisonCount,
          swapCount,
          sortedFrom: items.length - pass,
          narration: `Compare ${left} and ${right}. ${left > right ? `${left} is larger, so they must swap.` : 'They are already in order.'}`,
        }),
      );
      if (left > right) {
        [items[index], items[index + 1]] = [items[index + 1], items[index]];
        swapCount += 1;
        swappedInPass = true;
        steps.push(
          snapshot(items, {
            phase: 'swap',
            stage: 'transition',
            compared: [index, index + 1],
            swapped: true,
            pass: pass + 1,
            comparisonCount,
            swapCount,
            sortedFrom: items.length - pass,
            narration: `Swap complete. ${right} now comes before ${left}.`,
          }),
        );
      }
      steps.push(
        snapshot(items, {
          phase: 'settle',
          stage: 'transition',
          compared: [index, index + 1],
          swapped: left > right,
          pass: pass + 1,
          comparisonCount,
          swapCount,
          sortedFrom: items.length - pass,
          narration: 'The pair is stable. Advance the comparison window.',
        }),
      );
    }
    const sortedFrom = items.length - pass - 1;
    steps.push(
      snapshot(items, {
        phase: 'settle',
        stage: 'transition',
        compared: null,
        swapped: swappedInPass,
        pass: pass + 1,
        comparisonCount,
        swapCount,
        sortedFrom,
        narration: `${items[sortedFrom].value} is locked in its final position.`,
      }),
    );
    if (!swappedInPass) break;
  }

  steps.push(
    snapshot(items, {
      phase: 'complete',
      stage: 'terminal',
      compared: null,
      swapped: false,
      pass: Math.max(1, items.length - 1),
      comparisonCount,
      swapCount,
      sortedFrom: 0,
      narration: `Sorted. ${comparisonCount} comparisons and ${swapCount} swaps completed the run.`,
    }),
  );
  return steps;
}

export function validateBubbleSortChallengeDefinition(
  value: BubbleSortChallengeDefinition,
): string[] {
  const errors: string[] = [];
  if (!/^[a-z0-9][a-z0-9-]{1,79}$/.test(value.id))
    errors.push('Challenge ID must be a stable kebab-case identifier.');
  if (value.version !== 1) errors.push('Challenge version must be 1.');
  if (!value.title.trim() || value.title.length > 120)
    errors.push('Challenge title must contain 1 to 120 characters.');
  if (!value.objective.trim() || value.objective.length > 240)
    errors.push('Challenge objective must contain 1 to 240 characters.');
  if (value.values.length < 3 || value.values.length > 8)
    errors.push('Bubble Sort challenges require 3 to 8 values.');
  if (
    value.values.some(
      (item) => !Number.isInteger(item) || item < 1 || item > 99,
    )
  )
    errors.push('Bubble Sort values must be integers from 1 to 99.');
  return errors;
}

export function createBubbleSortChallenge(
  definition: BubbleSortChallengeDefinition,
): BubbleSortChallenge {
  const errors = validateBubbleSortChallengeDefinition(definition);
  if (errors.length) throw new Error(errors.join(' '));

  const steps = createBubbleSortSteps(definition.values);
  const decisions: BubbleSortDecision[] = [];
  for (const [stepIndex, step] of steps.entries()) {
    if (step.phase !== 'compare' || !step.compared) continue;
    const [leftIndex, rightIndex] = step.compared;
    const shouldSwap =
      step.items[leftIndex].value > step.items[rightIndex].value;
    const resultStepIndex = Math.min(steps.length - 1, stepIndex + 1);
    decisions.push({
      index: decisions.length,
      compareStepIndex: stepIndex,
      resultStepIndex,
      pairIndices: [leftIndex, rightIndex],
      pairItemIds: [step.items[leftIndex].id, step.items[rightIndex].id],
      pairValues: [step.items[leftIndex].value, step.items[rightIndex].value],
      shouldSwap,
      compareSnapshot: step,
      resultSnapshot: steps[resultStepIndex],
    });
  }
  const completeSnapshot = steps[steps.length - 1];
  return {
    definition: { ...definition, values: [...definition.values] },
    steps,
    decisions,
    initialSnapshot: steps[0],
    completeSnapshot,
  };
}

export function evaluateBubbleSortPrediction(
  decision: BubbleSortDecision,
  selectedItemIds: string[],
  predictedSwap: boolean,
): BubbleSortPredictionResult {
  const selected = new Set(selectedItemIds);
  const pairCorrect =
    selected.size === 2 &&
    decision.pairItemIds.every((itemId) => selected.has(itemId));
  const swapCorrect = predictedSwap === decision.shouldSwap;
  if (!pairCorrect)
    return {
      correct: false,
      pairCorrect,
      swapCorrect,
      feedback:
        'Follow the unsorted boundary from left to right and choose the next adjacent pair.',
    };
  if (!swapCorrect)
    return {
      correct: false,
      pairCorrect,
      swapCorrect,
      feedback: decision.shouldSwap
        ? `${decision.pairValues[0]} is greater than ${decision.pairValues[1]}, so the pair must swap.`
        : `${decision.pairValues[0]} is not greater than ${decision.pairValues[1]}, so the pair stays in place.`,
    };
  return {
    correct: true,
    pairCorrect,
    swapCorrect,
    feedback: decision.shouldSwap
      ? 'Correct. The larger left value moves one position toward the sorted boundary.'
      : 'Correct. The pair is already ordered, so the scan advances without a swap.',
  };
}
