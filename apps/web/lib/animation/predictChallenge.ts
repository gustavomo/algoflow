import type { RuntimeSceneStep } from '@algoflow/contracts';

/**
 * State of a predict-first run over a scene's generated steps. Steps without
 * a question play on their own; a step that asks one waits for the right pick.
 */
export interface PredictState {
  stepIndex: number;
  /** Wrong options already tried on the current question. */
  wrongPicks: number[];
  /** The current question was answered, so its outcome may be revealed. */
  solved: boolean;
  asked: number;
  firstTry: number;
}

export type PredictEvent =
  | { type: 'PICK'; option: number }
  | { type: 'ADVANCE' }
  | { type: 'SKIP' }
  | { type: 'RESET' };

export const initialPredictState: PredictState = {
  stepIndex: 0,
  wrongPicks: [],
  solved: false,
  asked: 0,
  firstTry: 0,
};

export const isWaiting = (steps: RuntimeSceneStep[], state: PredictState) =>
  Boolean(steps[state.stepIndex]?.challenge) && !state.solved;

export const isComplete = (steps: RuntimeSceneStep[], state: PredictState) =>
  state.stepIndex >= steps.length - 1;

export function countChallenges(steps: RuntimeSceneStep[]) {
  return steps.filter((step) => step.challenge).length;
}

export function predictReducer(
  steps: RuntimeSceneStep[],
  state: PredictState,
  event: PredictEvent,
): PredictState {
  if (event.type === 'RESET') return initialPredictState;
  const challenge = steps[state.stepIndex]?.challenge;
  if (event.type === 'PICK') {
    if (!challenge || state.solved) return state;
    if (
      !Number.isInteger(event.option) ||
      event.option < 0 ||
      event.option >= challenge.options.length ||
      state.wrongPicks.includes(event.option)
    )
      return state;
    if (event.option !== challenge.answer)
      return { ...state, wrongPicks: [...state.wrongPicks, event.option] };
    return {
      ...state,
      solved: true,
      asked: state.asked + 1,
      firstTry: state.firstTry + (state.wrongPicks.length === 0 ? 1 : 0),
    };
  }
  if (event.type === 'SKIP') {
    // Jump over the steps that ask nothing, straight to the next question.
    let next = state;
    while (!isWaiting(steps, next) && !isComplete(steps, next))
      next = predictReducer(steps, next, { type: 'ADVANCE' });
    return next;
  }
  // ADVANCE never skips an unanswered question and never passes the end.
  if (isWaiting(steps, state) || isComplete(steps, state)) return state;
  return {
    ...state,
    stepIndex: state.stepIndex + 1,
    wrongPicks: [],
    solved: false,
  };
}
