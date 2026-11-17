import type {
  ConceptFlowNarrative,
  ConceptFlowStep,
  VisualSceneKind,
  VisualStagePhase,
} from '@algoflow/contracts';

interface FlowStep {
  phase: VisualStagePhase;
  label: string;
  narration: string;
  /** Index of the node the idea is at. */
  at: number;
  /** What the idea has become at this step, carried by the travelling token. */
  token: string;
}

/**
 * Builds a concept flow whose every step is written for its lesson. Nodes the
 * idea has already passed stay completed, a failure marks its node as failed,
 * and the terminal step completes every node and connection.
 */
function flow(input: {
  scene: VisualSceneKind;
  metric: string;
  nodes: Array<[label: string, detail: string]>;
  /** Label of a connection from the last node back to the first, if any. */
  loop?: string;
  steps: FlowStep[];
  terminalSummary: string;
}): ConceptFlowNarrative {
  const ids = input.nodes.map((_, index) => `node-${index + 1}`);
  let reached = 0;
  const steps = input.steps.map((item, index): ConceptFlowStep => {
    reached = Math.max(reached, item.at);
    const terminal = item.phase === 'terminal';
    const failed = item.phase === 'failure';
    return {
      id: `${item.phase}-${index + 1}`,
      phase: item.phase,
      label: item.label,
      narration: item.narration,
      metric: input.metric,
      activeNodeIds: terminal || failed ? [] : [ids[item.at]],
      completedNodeIds: terminal
        ? ids
        : ids.filter((_, node) => node <= reached && node !== item.at),
      ...(failed ? { failedNodeIds: [ids[item.at]] } : {}),
      activeConnectionIndexes: terminal
        ? [...ids.keys()].slice(0, ids.length - (input.loop ? 0 : 1))
        : item.at > 0
          ? [item.at - 1]
          : [],
      token: {
        label: item.token,
        nodeId: ids[item.at],
        ...(failed
          ? { tone: 'error' as const }
          : terminal || item.phase === 'recovery'
            ? { tone: 'ok' as const }
            : {}),
      },
    };
  });
  return {
    version: 1,
    scene: input.scene,
    nodes: input.nodes.map(([label, detail], index) => ({
      id: ids[index],
      label,
      detail,
    })),
    connections: [
      ...ids.slice(1).map((id, index) => ({ from: ids[index], to: id })),
      ...(input.loop
        ? [{ from: ids[ids.length - 1], to: ids[0], label: input.loop }]
        : []),
    ],
    steps,
    terminalSummary: input.terminalSummary,
  };
}

export const systemsMapFlow = flow({
  scene: 'system-boundaries',
  metric: 'One request, four responsibilities',
  nodes: [
    ['User interface', 'Turns a tap into a request'],
    ['Application service', 'Decides what the request means'],
    ['Data store', 'Makes the decision durable'],
    ['Observability', 'Tells the team what happened'],
  ],
  loop: 'evidence shapes the next change',
  steps: [
    {
      phase: 'initial',
      label: 'A shopper taps Pay',
      narration:
        'The interface has one job here: turn the tap into a well-formed request and show what is happening. It knows nothing about stock or prices, and it is not trusted to decide whether the order is valid.',
      at: 0,
      token: 'tap “Pay”',
    },
    {
      phase: 'transition',
      label: 'The service applies the rules',
      narration:
        'The tap crosses the first boundary as POST /orders. The service is the only place that checks the cart is in stock and the total is right. Keeping the rules in one place is what lets a second client, like a mobile app, behave the same way.',
      at: 1,
      token: 'POST /orders',
    },
    {
      phase: 'transition',
      label: 'The decision becomes a row',
      narration:
        'Until the data store confirms the write, the order does not exist, whatever the screen says. This is the boundary that survives a crash or a deploy, so it decides what is true when the other parts disagree.',
      at: 2,
      token: 'INSERT order 8841',
    },
    {
      phase: 'transition',
      label: 'Every boundary leaves evidence',
      narration:
        'On the way, each part emitted a log line and a timing under one trace id. Observability is the fourth responsibility: without it the other three still run, but nobody can say how, or where the time went.',
      at: 3,
      token: 'trace 4f2a · 212 ms',
    },
    {
      phase: 'failure',
      label: 'Failure: a symptom without a location',
      narration:
        'A later write times out. The shopper sees a spinner and then a generic error. With no trace across the boundaries, the team knows only that “checkout is slow”: three teams inspect their own part and each finds nothing wrong.',
      at: 2,
      token: '500 after 30 s',
    },
    {
      phase: 'recovery',
      label: 'The trace names the boundary',
      narration:
        'The trace id that travelled with the request shows 29.8 of the 30 seconds inside one INSERT, waiting for a lock. Evidence points at one boundary, so one team fixes one query instead of three teams guessing.',
      at: 3,
      token: 'trace 4f2a → lock wait',
    },
    {
      phase: 'terminal',
      label: 'The loop closes at the user',
      narration:
        'The retry returns 201 in 180 ms. A tap became a request, a decision, a durable fact and a piece of evidence, and the evidence changed the system the next shopper uses.',
      at: 0,
      token: '201 in 180 ms',
    },
  ],
  terminalSummary:
    'The system is complete when the user action, the service contract, the durable state and the operational feedback form one loop you can inspect end to end.',
});

export const activeReadingFlow = flow({
  scene: 'active-reading',
  metric: 'Reading produces evidence',
  nodes: [
    ['Preview', 'Skim to see the shape'],
    ['Question', 'Write what you expect to learn'],
    ['Read', 'Hunt for the answers'],
    ['Recall', 'Close the page and rebuild it'],
    ['Apply', 'Use it on a new problem'],
  ],
  steps: [
    {
      phase: 'initial',
      label: 'Two minutes on the shape of the chapter',
      narration:
        'Before reading a chapter on B-tree indexes, look only at headings, figures and the summary: three sections, one drawing of a tree, one table of costs. You are building a skeleton, because details need somewhere to attach.',
      at: 0,
      token: '12 pages on B-trees',
    },
    {
      phase: 'transition',
      label: 'Turn headings into questions',
      narration:
        'Write down what you cannot answer yet. A question gives the reading a target, and it exposes what you already believe, which is exactly what the text will have to confirm or correct.',
      at: 1,
      token: 'why is a lookup O(log n)?',
    },
    {
      phase: 'transition',
      label: 'Read to answer, not to highlight',
      narration:
        'Now read, hunting for the answer. You find it: each node holds about a hundred keys, so three levels reach a million rows. Write that in your own words. Copying the sentence only proves you can copy.',
      at: 2,
      token: 'fan-out ≈ 100 per node',
    },
    {
      phase: 'transition',
      label: 'Close the book and rebuild the model',
      narration:
        'Write the idea from memory on an empty page. This is the step that produces learning: pulling an idea out of memory strengthens it far more than seeing it one more time.',
      at: 3,
      token: 'empty page',
    },
    {
      phase: 'failure',
      label: 'Failure: rereading feels like knowing',
      narration:
        'The tempting shortcut is to read the chapter again. The text now looks familiar, and familiarity is mistaken for understanding. Asked a day later why every extra index slows down inserts, there is nothing to retrieve.',
      at: 3,
      token: 'reread ×3 · recalled 0',
    },
    {
      phase: 'recovery',
      label: 'An honest recall shows the gap',
      narration:
        'Trying to explain it without the page exposes one hole: you cannot say what happens when a node is full. Go back for that single paragraph. The gap told you precisely what to reread, and why.',
      at: 3,
      token: 'gap: node splits',
    },
    {
      phase: 'transition',
      label: 'Use it where the chapter never went',
      narration:
        'Pick the index for a slow query of your own and predict the plan before running it. If the prediction is wrong, you have a new question and the cycle starts again from evidence.',
      at: 4,
      token: 'index for my slow query',
    },
    {
      phase: 'terminal',
      label: 'The chapter became something you can use',
      narration:
        'Twelve pages turned into three questions you can answer, one model you can redraw and one decision you made with it. That is the evidence that the reading worked.',
      at: 4,
      token: '3 answers · 1 model · 1 use',
    },
  ],
  terminalSummary:
    'The reading cycle is complete when a chapter has become questions you can retrieve, a model you can reconstruct and an application of your own.',
});

export const staffImpactFlow = flow({
  scene: 'impact-ripple',
  metric: 'Scope grows through leverage',
  nodes: [
    ['Business context', 'What the company needs this year'],
    ['Problem selection', 'The constraint worth your time'],
    ['Technical leverage', 'A change others build on'],
    ['Durable impact', 'Still true after you move on'],
  ],
  steps: [
    {
      phase: 'initial',
      label: 'Start from what the business needs',
      narration:
        'The company wants to release daily instead of weekly, because competitors already do. Staff work starts here and not in the backlog: a title grants no impact, the link between technical work and this goal does.',
      at: 0,
      token: 'goal: weekly → daily',
    },
    {
      phase: 'transition',
      label: 'Find the constraint that sets the pace',
      narration:
        'Many things are slow, but one of them limits everyone: all fourteen teams wait three hours for a shared test suite. Choosing it means declining six projects that are more interesting and matter less.',
      at: 1,
      token: 'constraint: 3 h test suite',
    },
    {
      phase: 'transition',
      label: 'Shape the fix so that others inherit it',
      narration:
        'Making your own team’s tests faster helps one team. Building change-based test selection into the shared pipeline shortens the wait for all fourteen. The leverage is in where the fix lives, not in how hard it was.',
      at: 2,
      token: 'test selection for 14 teams',
    },
    {
      phase: 'failure',
      label: 'Failure: the visible project',
      narration:
        'The common mistake is to pick the impressive option: rewriting a service that was never the bottleneck. It ships, it is praised, and release frequency does not move. Activity grew while the constraint stayed where it was.',
      at: 1,
      token: 'rewrite · 0 teams faster',
    },
    {
      phase: 'recovery',
      label: 'Go back to the goal and measure',
      narration:
        'Recover by asking what, measured, blocks a daily release. The data points at the test suite again. Scope is not the difficulty of the work: it is how much of the organisation’s constraint the work removes.',
      at: 0,
      token: 'what blocks daily?',
    },
    {
      phase: 'transition',
      label: 'Make it hold without you',
      narration:
        'The suite now takes 22 minutes, and the pipeline has an owning team, a runbook and a dashboard. Impact is durable when it survives your attention moving elsewhere. If it needs you every week, it is heroics.',
      at: 3,
      token: '22 min · owned by platform',
    },
    {
      phase: 'terminal',
      label: 'Judgement moved a real constraint',
      narration:
        'Fourteen teams release daily. The technical change was modest; the choice of problem and of where to put the fix did the work, and both will keep paying after the engineer is on something else.',
      at: 3,
      token: 'daily releases · 14 teams',
    },
  ],
  terminalSummary:
    'Staff impact is complete when judgement changes a constraint that matters and the improvement stays useful without permanent heroics.',
});

export const technicalStrategyFlow = flow({
  scene: 'strategy-map',
  metric: 'Direction before projects',
  nodes: [
    ['Diagnosis', 'What is actually going on'],
    ['Guiding policy', 'The approach, and what it rules out'],
    ['Coherent actions', 'Steps that reinforce each other'],
    ['Success signals', 'Evidence that could prove it wrong'],
  ],
  steps: [
    {
      phase: 'initial',
      label: 'Diagnose from evidence',
      narration:
        'A year of incident reviews shows that seven in ten outages start in the one database forty services share. That sentence is a diagnosis: it explains the pain, it can be checked, and it is not yet a plan.',
      at: 0,
      token: '70% of incidents: shared DB',
    },
    {
      phase: 'transition',
      label: 'Choose a policy that says no',
      narration:
        'Every table gets exactly one owning service. A guiding policy is useful because of what it forbids: no new cross-service joins, even when one would be convenient this sprint. That is how it makes later decisions easy.',
      at: 1,
      token: 'one owner per table',
    },
    {
      phase: 'transition',
      label: 'Order actions so each makes the next cheaper',
      narration:
        'Mapping owners comes first because the APIs depend on it. The APIs come before removing joins because teams need somewhere to go. Actions are coherent when the order is forced by the policy and not by who shouted loudest.',
      at: 2,
      token: 'map owners → APIs → cut joins',
    },
    {
      phase: 'failure',
      label: 'Failure: a roadmap dressed as strategy',
      narration:
        'The usual result is twelve reasonable projects, each with an owner and none connected. Two of them pull in opposite directions, and nothing in the document says which one wins when they collide.',
      at: 2,
      token: '12 projects · no diagnosis',
    },
    {
      phase: 'recovery',
      label: 'Test every project against the diagnosis',
      narration:
        'Five projects reduce dependence on the shared database and stay. Seven do not. They may be good work, but they are not this strategy, and saying so openly frees the people assigned to them.',
      at: 0,
      token: 'which cause does it remove?',
    },
    {
      phase: 'transition',
      label: 'Name the number that would prove you wrong',
      narration:
        'Decide before starting: if incidents that begin in the shared database have not fallen within two quarters, the diagnosis was mistaken and the policy must change. A strategy nobody can falsify is only a preference.',
      at: 3,
      token: 'shared-DB incidents ↓ in 2 quarters',
    },
    {
      phase: 'terminal',
      label: 'One direction, visible to everyone',
      narration:
        'Any engineer can now answer “should we build this?” without asking: does it follow the policy, and does it move the signal? That is what a strategy is for.',
      at: 3,
      token: 'diagnosis → policy → actions → signal',
    },
  ],
  terminalSummary:
    'Technical strategy is complete when the diagnosis, the policy, the actions and the success signals all reinforce one directional choice.',
});

export const crossTeamChangeFlow = flow({
  scene: 'migration-timeline',
  metric: 'Change is a sociotechnical system',
  nodes: [
    ['Shared problem', 'Why every team should care'],
    ['Incremental plan', 'Small steps, each with an owner'],
    ['Validation gates', 'Proof before the next step'],
    ['Cutover', 'Move the traffic, reversibly'],
    ['Learning', 'What the next migration inherits'],
  ],
  steps: [
    {
      phase: 'initial',
      label: 'Make the problem everybody’s',
      narration:
        'The old queue drops one message in ten thousand. Each of the six teams has already paid for that in a refund bug or a support ticket. Their own incident is the argument: nobody migrates for someone else’s architecture diagram.',
      at: 0,
      token: 'queue loses 1 in 10,000',
    },
    {
      phase: 'transition',
      label: 'Plan steps that can each stop safely',
      narration:
        'One team writes to both the old queue and the new bus first. The plan is a sequence of small bets with named owners, so a surprise costs one step and not the whole programme.',
      at: 1,
      token: 'team 1 of 6 · dual-write',
    },
    {
      phase: 'transition',
      label: 'Agree the proof before you need it',
      narration:
        'A gate is a measurement decided in advance: compare what both systems delivered for two weeks. Zero differences in two million messages earns the next step. Without a gate, progress is an opinion.',
      at: 2,
      token: 'diff: 0 in 2M messages',
    },
    {
      phase: 'transition',
      label: 'Move real traffic in stages',
      narration:
        'Traffic shifts behind a flag from 5% to 50% to 100% while the old path keeps running. What matters is that every stage can be undone in minutes by whoever is on call, not only by you.',
      at: 3,
      token: 'traffic 5% → 50% → 100%',
    },
    {
      phase: 'failure',
      label: 'Failure: a skipped gate and no owner',
      narration:
        'Under deadline pressure the fourth team is cut over without its comparison, and nobody on that team owns the flag. Duplicated events charge customers twice, and the one person who can roll back is asleep.',
      at: 3,
      token: 'gate skipped · no owner',
    },
    {
      phase: 'recovery',
      label: 'Roll back first, explain afterwards',
      narration:
        'Traffic returns to the old queue in four minutes because that path was kept alive. Then the gate is run for team four, finds the duplicate, and the cutover resumes from a state that has been verified.',
      at: 2,
      token: 'rollback in 4 min → rerun gate',
    },
    {
      phase: 'transition',
      label: 'Leave the tools behind',
      narration:
        'The comparison tool, the rollback runbook and the rule that no gate is skipped are written down. The migration ends when the next team that has to do this starts from them instead of from zero.',
      at: 4,
      token: 'runbook + gate template',
    },
    {
      phase: 'terminal',
      label: 'Six teams moved, and the method remains',
      narration:
        'The old queue is switched off. What made it work was not the new technology but the order: a shared reason, small owned steps, proof at each one and a way back.',
      at: 4,
      token: '6 of 6 teams · old queue off',
    },
  ],
  terminalSummary:
    'The migration is complete when staged ownership, validation, a reversible cutover and recorded learning close the change loop.',
});
