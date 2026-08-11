import { access } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';
import { CliProcessError, nodeCliProcessRunner } from './cliProcessRunner';

const environment = {
  NODE_ENV: 'test',
  PATH: process.env.PATH,
} as NodeJS.ProcessEnv;

describe('CLI process runner', () => {
  it('pipes stdin without a shell and removes the isolated workspace', async () => {
    const learnerText = '`$(touch /tmp/never)`; --flag\nsecond line';
    const output = await nodeCliProcessRunner.run({
      executable: process.execPath,
      args: [
        '-e',
        "let value='';process.stdin.on('data',chunk=>value+=chunk);process.stdin.on('end',()=>process.stdout.write(process.cwd()+'\\n'+value))",
      ],
      stdin: learnerText,
      environment,
      timeoutMs: 5_000,
      maxOutputBytes: 8_192,
    });
    const [workingDirectory, ...response] = output.stdout.split('\n');

    expect(response.join('\n')).toBe(learnerText);
    await expect(access(workingDirectory)).rejects.toThrow();
  });

  it('terminates oversized output', async () => {
    await expect(
      nodeCliProcessRunner.run({
        executable: process.execPath,
        args: ['-e', "process.stdout.write('x'.repeat(10000))"],
        stdin: '',
        environment,
        timeoutMs: 5_000,
        maxOutputBytes: 4_096,
      }),
    ).rejects.toEqual(new CliProcessError('overflow'));
  });

  it('terminates a process that exceeds its deadline', async () => {
    await expect(
      nodeCliProcessRunner.run({
        executable: process.execPath,
        args: ['-e', 'setInterval(()=>undefined,1000)'],
        stdin: '',
        environment,
        timeoutMs: 50,
        maxOutputBytes: 4_096,
      }),
    ).rejects.toEqual(new CliProcessError('timeout'));
  });

  it('terminates work when the caller aborts', async () => {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), 25);
    await expect(
      nodeCliProcessRunner.run({
        executable: process.execPath,
        args: ['-e', 'setInterval(()=>undefined,1000)'],
        stdin: '',
        environment,
        timeoutMs: 5_000,
        maxOutputBytes: 4_096,
        signal: controller.signal,
      }),
    ).rejects.toEqual(new CliProcessError('aborted'));
  });

  it('reports an unavailable executable without hanging', async () => {
    await expect(
      nodeCliProcessRunner.run({
        executable: '/definitely/missing/algoflow-cli',
        args: [],
        stdin: '',
        environment,
        timeoutMs: 5_000,
        maxOutputBytes: 4_096,
      }),
    ).rejects.toEqual(new CliProcessError('spawn'));
  });
});
