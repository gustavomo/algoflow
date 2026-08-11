import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';

function loadEnvFile(file) {
  if (!fs.existsSync(file)) return {};
  return Object.fromEntries(
    fs
      .readFileSync(file, 'utf8')
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#') && line.includes('='))
      .map((line) => {
        const separator = line.indexOf('=');
        return [line.slice(0, separator), line.slice(separator + 1)];
      }),
  );
}

const root = process.cwd();
const configuredEnv = {
  ...loadEnvFile(path.join(root, '.env')),
  ...loadEnvFile(path.join(root, '.env.local')),
  ...process.env,
};
const env = {
  ...configuredEnv,
  BACKEND_URL: configuredEnv.BACKEND_URL ?? 'http://127.0.0.1:4000',
  BACKEND_SHARED_SECRET:
    configuredEnv.BACKEND_SHARED_SECRET ?? 'local-development-backend-secret',
};

const children = [
  spawn('npm', ['run', 'dev:web'], { cwd: root, env, stdio: 'inherit' }),
  spawn('npm', ['run', 'dev:api'], { cwd: root, env, stdio: 'inherit' }),
];

let closing = false;
function stop(signal = 'SIGTERM') {
  if (closing) return;
  closing = true;
  for (const child of children) child.kill(signal);
}

for (const child of children) {
  child.on('exit', (code, signal) => {
    if (!closing) {
      stop();
      process.exitCode = signal ? 1 : code ?? 1;
    }
  });
}

process.on('SIGINT', () => stop('SIGINT'));
process.on('SIGTERM', () => stop('SIGTERM'));
