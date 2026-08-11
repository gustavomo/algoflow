import type {
  GraphPatchOperation,
  SystemDesignGraph,
  SystemDesignScenario,
} from '@algoflow/contracts';

export interface ProposalInput {
  scenario: SystemDesignScenario;
  graph: SystemDesignGraph;
  question?: string;
}
export interface ProposalOutput {
  rationale: string;
  operations: GraphPatchOperation[];
}
export interface DesignProposalProvider {
  readonly provider: 'mock' | 'openai';
  propose(input: ProposalInput): Promise<ProposalOutput>;
}
