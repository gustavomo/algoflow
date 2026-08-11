import type { LearningRepository } from './types';
import { MemoryLearningRepository } from './memoryRepository';
import { PostgresLearningRepository } from './postgresRepository';
import type { ReadingRepository } from '../../features/reading/ports/readingRepository';
import { MemoryReadingRepository } from '../../features/reading/adapters/memoryReadingRepository';
import { PostgresReadingRepository } from '../../features/reading/adapters/postgresReadingRepository';
import type { SimulationRepository } from '../../features/simulations/ports/simulationRepository';
import { MemorySimulationRepository } from '../../features/simulations/adapters/memorySimulationRepository';
import { PostgresSimulationRepository } from '../../features/simulations/adapters/postgresSimulationRepository';

declare global {
  // eslint-disable-next-line no-var
  var __algoflowRepository: LearningRepository | undefined;
  // eslint-disable-next-line no-var
  var __algoflowReadingRepository: ReadingRepository | undefined;
  // eslint-disable-next-line no-var
  var __algoflowSimulationRepository: SimulationRepository | undefined;
}

export function getReadingRepository(): ReadingRepository {
  if (globalThis.__algoflowReadingRepository)
    return globalThis.__algoflowReadingRepository;
  globalThis.__algoflowReadingRepository = shouldUseMemoryPersistence()
    ? new MemoryReadingRepository()
    : new PostgresReadingRepository();
  return globalThis.__algoflowReadingRepository;
}

export function getSimulationRepository(): SimulationRepository {
  if (globalThis.__algoflowSimulationRepository)
    return globalThis.__algoflowSimulationRepository;
  globalThis.__algoflowSimulationRepository = shouldUseMemoryPersistence()
    ? new MemorySimulationRepository()
    : new PostgresSimulationRepository();
  return globalThis.__algoflowSimulationRepository;
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
