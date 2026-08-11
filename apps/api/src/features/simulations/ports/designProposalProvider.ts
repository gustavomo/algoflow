import type {
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
}
export interface ProposalOutput {
  rationale: string;
  operations: GraphPatchOperation[];
}
export interface DesignProposalProvider {
  readonly provider: 'mock' | 'openai';
  propose(input: ProposalInput): Promise<ProposalOutput>;
}
