import type { LearningRepository } from './types';
import { MemoryLearningRepository } from './memoryRepository';
import { PostgresLearningRepository } from './postgresRepository';

declare global {
  // eslint-disable-next-line no-var
  var __algoflowRepository: LearningRepository | undefined;
}

interface PersistenceEnvironment {
  NODE_ENV?: string;
  MOCK_PERSISTENCE?: string;
  DATABASE_URL?: string;
}

export function shouldUseMemoryPersistence(
  env: PersistenceEnvironment = process.env,
) {
  return (
    env.NODE_ENV !== 'production' &&
    (env.MOCK_PERSISTENCE === '1' || !env.DATABASE_URL)
  );
}

export function getLearningRepository(): LearningRepository {
  if (globalThis.__algoflowRepository) return globalThis.__algoflowRepository;
  const useMock = shouldUseMemoryPersistence();
  if (!useMock && !process.env.DATABASE_URL) {
    throw new Error(
      'DATABASE_URL is required when mock persistence is disabled.',
    );
  }
  globalThis.__algoflowRepository = useMock
    ? new MemoryLearningRepository()
    : new PostgresLearningRepository();
  return globalThis.__algoflowRepository;
}
