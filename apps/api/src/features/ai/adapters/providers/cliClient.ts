import type { AIProviderConfiguration } from '@algoflow/contracts';
import { runLocalAI } from '../../../../platform/ai/localCli';
import type { CliProcessRunner } from '../../../../platform/process/cliProcessRunner';
import type { AIClient } from '../../ports/aiClient';
import { tutorCliPrompt } from './prompt';

export function createCliClient(
  configuration: AIProviderConfiguration,
  executable: string,
  runner?: CliProcessRunner,
): AIClient {
  if (
    configuration.provider !== 'codex-cli' &&
    configuration.provider !== 'claude-cli'
  ) {
    throw new Error('A local CLI configuration is required.');
  }
  return {
    ...configuration,
    ask(request) {
      return runLocalAI(
        tutorCliPrompt(request),
        configuration,
        executable,
        runner,
        undefined,
        request.signal,
      );
    },
  };
}
