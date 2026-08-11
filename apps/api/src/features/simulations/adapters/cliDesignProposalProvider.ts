import type { AIProviderConfiguration } from '@algoflow/contracts';
import { runLocalAI } from '../../../platform/ai/localCli';
import type { CliProcessRunner } from '../../../platform/process/cliProcessRunner';
import type { DesignProposalProvider } from '../ports/designProposalProvider';
import {
  designProposalCliPrompt,
  parseDesignProposalOutput,
} from './designProposalPrompt';

export function createCliDesignProposalProvider(
  configuration: AIProviderConfiguration,
  executable: string,
  runner?: CliProcessRunner,
): DesignProposalProvider {
  if (
    configuration.provider !== 'codex-cli' &&
    configuration.provider !== 'claude-cli'
  ) {
    throw new Error('A local CLI configuration is required.');
  }
  return {
    ...configuration,
    async propose(input) {
      const content = await runLocalAI(
        designProposalCliPrompt(input),
        configuration,
        executable,
        runner,
        undefined,
        input.signal,
      );
      return parseDesignProposalOutput(content);
    },
  };
}
