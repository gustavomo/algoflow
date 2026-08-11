import type {
  AIEffort,
  AIProviderId,
  GraphPatchOperation,
  SystemDesignGraph,
  SystemDesignScenario,
  SystemScenarioPhase,
} from '@algoflow/contracts';

export interface ProposalInput {
  scenario: SystemDesignScenario;
  graph: SystemDesignGraph;
  question?: string;
  phase?: SystemScenarioPhase;
  signal?: AbortSignal;
}
export interface ProposalOutput {
  rationale: string;
  operations: GraphPatchOperation[];
}
export interface DesignProposalProvider {
  readonly provider: AIProviderId;
  readonly model: string;
  readonly effort?: AIEffort;
  propose(input: ProposalInput): Promise<ProposalOutput>;
}
