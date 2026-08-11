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
  items: SortItem[];
  compared: [number, number] | null;
  swapped: boolean;
  pass: number;
  comparisonCount: number;
  swapCount: number;
  sortedFrom: number;
  narration: string;
}

function snapshot(
  items: SortItem[],
  values: Omit<BubbleSortSnapshot, 'items'>,
): BubbleSortSnapshot {
  return { ...values, items: items.map((item) => ({ ...item })) };
}

export function createBubbleSortSteps(values: number[]): BubbleSortSnapshot[] {
  const items = values.map((value, index) => ({ id: `item-${index}`, value }));
  const steps: BubbleSortSnapshot[] = [];
  let comparisonCount = 0;
  let swapCount = 0;

  steps.push(
    snapshot(items, {
      phase: 'ready',
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
