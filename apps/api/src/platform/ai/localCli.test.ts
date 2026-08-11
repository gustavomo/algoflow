import { describe, expect, it, vi } from 'vitest';
import type {
  CliProcessInput,
  CliProcessRunner,
} from '../process/cliProcessRunner';
import { CliProcessError } from '../process/cliProcessRunner';
import {
  LocalAIProviderError,
  buildClaudeArgs,
  buildCodexArgs,
  runLocalAI,
} from './localCli';

const environment = {
  NODE_ENV: 'development',
  ENABLE_LOCAL_AI_CLI: '1',
  PATH: '/tools',
  HOME: '/person',
  DATABASE_URL: 'must-not-reach-cli',
  BACKEND_SHARED_SECRET: 'must-not-reach-cli',
} as NodeJS.ProcessEnv;

function recordingRunner(output = 'Grounded answer') {
  let invocation: CliProcessInput | undefined;
  const runner: CliProcessRunner = {
    run: vi.fn(async (input) => {
      invocation = input;
      return { stdout: output, stderr: 'private diagnostic' };
    }),
  };
  return { runner, invocation: () => invocation! };
}

describe('local AI invocation', () => {
  it('keeps hostile learner text in stdin and filters unrelated secrets', async () => {
    const recorded = recordingRunner();
    const prompt = 'Explain `$(touch /tmp/no)`; --model stolen\nnext line';
    const answer = await runLocalAI(
      prompt,
      { provider: 'codex-cli', model: 'gpt-5.5', effort: 'high' },
      '/tools/codex',
      recorded.runner,
      environment,
    );

    expect(answer).toBe('Grounded answer');
    expect(recorded.invocation().stdin).toBe(prompt);
    expect(recorded.invocation().args).not.toContain(prompt);
    expect(recorded.invocation().args).toEqual(
      buildCodexArgs('gpt-5.5', 'high'),
    );
    expect(recorded.invocation().environment.DATABASE_URL).toBeUndefined();
    expect(
      recorded.invocation().environment.BACKEND_SHARED_SECRET,
    ).toBeUndefined();
  });

  it('uses tool-free ephemeral Claude arguments', async () => {
    expect(buildClaudeArgs('sonnet', 'max')).toEqual([
      '--print',
      '--output-format',
      'text',
      '--safe-mode',
      '--tools',
      '',
      '--permission-mode',
      'dontAsk',
      '--no-session-persistence',
      '--model',
      'sonnet',
      '--effort',
      'max',
    ]);
  });

  it('maps process timeouts without exposing process diagnostics', async () => {
    const runner: CliProcessRunner = {
      run: vi.fn(async () => {
        throw new CliProcessError('timeout');
      }),
    };
    await expect(
      runLocalAI(
        'prompt',
        { provider: 'claude-cli', model: 'sonnet', effort: 'medium' },
        '/tools/claude',
        runner,
        environment,
      ),
    ).rejects.toEqual(new LocalAIProviderError('timeout'));
  });
});
