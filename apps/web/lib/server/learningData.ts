import 'server-only';
import type {
  CatalogResponse,
  DashboardResponse,
  LearningSnapshot,
  ReadingBook,
  ReadingBookDetail,
  ReviewState,
  SystemChallengeDefinition,
  SystemDesignAttempt,
  SystemDesignDraft,
  SystemDesignScenario,
} from '@algoflow/contracts';
import { backendRequest } from './backendClient';

export const getCatalog = () =>
  backendRequest<CatalogResponse>('/api/v1/catalog');

export const getLearningSnapshot = () =>
  backendRequest<LearningSnapshot>('/api/v1/progress');

export const getDashboard = () =>
  backendRequest<DashboardResponse>('/api/v1/dashboard');

export async function getDueReviews() {
  const response = await backendRequest<{ reviews: ReviewState[] }>(
    '/api/v1/reviews',
  );
  return response.reviews;
}

export async function getReadingBooks() {
  const response = await backendRequest<{ books: ReadingBook[] }>(
    '/api/v1/reading',
  );
  return response.books;
}

export const getReadingBook = (bookId: string) =>
  backendRequest<ReadingBookDetail>(
    `/api/v1/reading?bookId=${encodeURIComponent(bookId)}`,
  );

export interface SimulationCatalogItem {
  scenario: SystemDesignScenario;
  draft?: SystemDesignDraft;
  latestAttempt?: SystemDesignAttempt;
}

export async function getSimulations() {
  const response = await backendRequest<{ items: SimulationCatalogItem[] }>(
    '/api/v1/simulations',
  );
  return response.items;
}

export const getSimulation = (slug: string) =>
  backendRequest<{
    scenario: SystemDesignScenario;
    challenge?: SystemChallengeDefinition;
    draft?: SystemDesignDraft;
    attempts: SystemDesignAttempt[];
  }>(`/api/v1/simulations?slug=${encodeURIComponent(slug)}`);
