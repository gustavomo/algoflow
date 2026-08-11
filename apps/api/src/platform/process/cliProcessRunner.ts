import { spawn, type ChildProcess } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

export type CliProcessFailureKind =
  | 'spawn'
  | 'exit'
  | 'timeout'
  | 'overflow'
  | 'aborted';

export class CliProcessError extends Error {
  constructor(public readonly kind: CliProcessFailureKind) {
    super(`Local AI process failed: ${kind}.`);
  }
}

export interface CliProcessInput {
  executable: string;
  args: string[];
  stdin: string;
  environment: NodeJS.ProcessEnv;
  timeoutMs: number;
  maxOutputBytes: number;
  signal?: AbortSignal;
}

export interface CliProcessOutput {
  stdout: string;
  stderr: string;
}

export interface CliProcessRunner {
  run(input: CliProcessInput): Promise<CliProcessOutput>;
}

function terminate(child: ChildProcess, signal: NodeJS.Signals) {
  if (!child.pid) return;
  try {
    if (process.platform !== 'win32') process.kill(-child.pid, signal);
    else child.kill(signal);
  } catch {
    // The process may have exited between the check and signal.
  }
}

async function runInWorkspace(
  input: CliProcessInput,
  workingDirectory: string,
): Promise<CliProcessOutput> {
  return new Promise((resolve, reject) => {
    const child = spawn(input.executable, input.args, {
      cwd: workingDirectory,
      env: input.environment,
      detached: process.platform !== 'win32',
      shell: false,
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    const stdout: Buffer[] = [];
    const stderr: Buffer[] = [];
    let outputBytes = 0;
    let pendingFailure: CliProcessError | undefined;
    let forceTimer: NodeJS.Timeout | undefined;

    const stop = (failure: CliProcessError) => {
      if (pendingFailure) return;
      pendingFailure = failure;
      terminate(child, 'SIGTERM');
      forceTimer = setTimeout(() => terminate(child, 'SIGKILL'), 750);
      forceTimer.unref();
    };

    const timeout = setTimeout(
      () => stop(new CliProcessError('timeout')),
      input.timeoutMs,
    );
    timeout.unref();

    const onAbort = () => stop(new CliProcessError('aborted'));
    input.signal?.addEventListener('abort', onAbort, { once: true });

    const capture = (target: Buffer[]) => (chunk: Buffer) => {
      outputBytes += chunk.length;
      if (outputBytes > input.maxOutputBytes) {
        stop(new CliProcessError('overflow'));
        return;
      }
      target.push(chunk);
    };
    child.stdout?.on('data', capture(stdout));
    child.stderr?.on('data', capture(stderr));
    child.on('error', () => stop(new CliProcessError('spawn')));
    child.on('close', (code) => {
      clearTimeout(timeout);
      if (forceTimer) clearTimeout(forceTimer);
      input.signal?.removeEventListener('abort', onAbort);
      if (pendingFailure) {
        reject(pendingFailure);
        return;
      }
      if (code !== 0) {
        reject(new CliProcessError('exit'));
        return;
      }
      resolve({
        stdout: Buffer.concat(stdout).toString('utf8'),
        stderr: Buffer.concat(stderr).toString('utf8'),
      });
    });
    child.stdin?.on('error', () => undefined);
    child.stdin?.end(input.stdin);
  });
}

export const nodeCliProcessRunner: CliProcessRunner = {
  async run(input) {
    const workingDirectory = await mkdtemp(
      path.join(os.tmpdir(), 'algoflow-ai-'),
    );
    try {
      return await runInWorkspace(input, workingDirectory);
    } finally {
      await rm(workingDirectory, { recursive: true, force: true });
    }
  },
};
