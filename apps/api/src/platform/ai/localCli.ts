import type { AIEffort, AIProviderConfiguration } from '@algoflow/contracts';
import {
  CliProcessError,
  nodeCliProcessRunner,
  type CliProcessRunner,
} from '../process/cliProcessRunner';
import { assertLocalCliInvocationAllowed } from './providerRegistry';

export class LocalAIProviderError extends Error {
  constructor(
    public readonly kind: 'unavailable' | 'timeout' | 'overflow' | 'failed',
  ) {
    super(`Local AI provider failed: ${kind}.`);
  }
}

function boundedNumber(
  value: string | undefined,
  fallback: number,
  minimum: number,
  maximum: number,
) {
  const parsed = Number(value);
  return Number.isFinite(parsed)
    ? Math.min(maximum, Math.max(minimum, Math.floor(parsed)))
    : fallback;
}

function environmentFor(
  provider: 'codex-cli' | 'claude-cli',
  source: NodeJS.ProcessEnv,
): NodeJS.ProcessEnv {
  const common = [
    'PATH',
    'HOME',
    'TMPDIR',
    'LANG',
    'LC_ALL',
    'TERM',
    'USER',
    'LOGNAME',
    'SHELL',
    'SECURITYSESSIONID',
    '__CFBundleIdentifier',
    '__CF_USER_TEXT_ENCODING',
    'SSL_CERT_FILE',
    'NODE_EXTRA_CA_CERTS',
    'HTTP_PROXY',
    'HTTPS_PROXY',
    'NO_PROXY',
  ];
  const providerKeys =
    provider === 'codex-cli'
      ? ['CODEX_HOME', 'CODEX_API_KEY', 'OPENAI_API_KEY', 'OPENAI_BASE_URL']
      : ['ANTHROPIC_API_KEY', 'ANTHROPIC_BASE_URL', 'CLAUDE_CODE_OAUTH_TOKEN'];
  const environment = {
    NODE_ENV: source.NODE_ENV ?? 'development',
  } as NodeJS.ProcessEnv;
  for (const key of [...common, ...providerKeys]) {
    const value = source[key];
    if (value != null) environment[key] = value;
  }
  return environment;
}

export function buildCodexArgs(model: string, effort: AIEffort) {
  return [
    'exec',
    '--ephemeral',
    '--ignore-user-config',
    '--ignore-rules',
    '--strict-config',
    '--disable',
    'shell_tool',
    '--disable',
    'unified_exec',
    '--disable',
    'code_mode',
    '--disable',
    'apps',
    '--disable',
    'browser_use',
    '--disable',
    'in_app_browser',
    '--disable',
    'computer_use',
    '--disable',
    'image_generation',
    '--disable',
    'multi_agent',
    '--disable',
    'multi_agent_v2',
    '--disable',
    'goals',
    '--skip-git-repo-check',
    '--sandbox',
    'read-only',
    '--color',
    'never',
    '--model',
    model,
    '--config',
    `model_reasoning_effort="${effort}"`,
    '-',
  ];
}

export function buildClaudeArgs(model: string, effort: AIEffort) {
  return [
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
    model,
    '--effort',
    effort,
  ];
}

export async function runLocalAI(
  prompt: string,
  configuration: AIProviderConfiguration,
  executable: string,
  runner: CliProcessRunner = nodeCliProcessRunner,
  environment: NodeJS.ProcessEnv = process.env,
  signal?: AbortSignal,
) {
  assertLocalCliInvocationAllowed(environment);
  if (
    configuration.provider !== 'codex-cli' &&
    configuration.provider !== 'claude-cli'
  ) {
    throw new LocalAIProviderError('unavailable');
  }
  const effort = configuration.effort ?? 'medium';
  const args =
    configuration.provider === 'codex-cli'
      ? buildCodexArgs(configuration.model, effort)
      : buildClaudeArgs(configuration.model, effort);
  try {
    const output = await runner.run({
      executable,
      args,
      stdin: prompt,
      environment: environmentFor(configuration.provider, environment),
      timeoutMs: boundedNumber(
        environment.AI_CLI_TIMEOUT_MS,
        45_000,
        5_000,
        120_000,
      ),
      maxOutputBytes: boundedNumber(
        environment.AI_CLI_MAX_OUTPUT_BYTES,
        65_536,
        4_096,
        262_144,
      ),
      signal,
    });
    const answer = output.stdout.trim();
    if (!answer) throw new LocalAIProviderError('failed');
    return answer;
  } catch (error) {
    if (error instanceof LocalAIProviderError) throw error;
    if (error instanceof CliProcessError) {
      if (error.kind === 'timeout') throw new LocalAIProviderError('timeout');
      if (error.kind === 'overflow') throw new LocalAIProviderError('overflow');
    }
    throw new LocalAIProviderError('failed');
  }
}
