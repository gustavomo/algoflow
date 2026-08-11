import type { CatalogResponse } from '@algoflow/contracts';
import {
  assessments,
  learningPaths,
  lessons,
  topics,
  tracks,
} from '../domain/catalog';

export function getCatalog(): CatalogResponse {
  return { tracks, topics, lessons, learningPaths, assessments };
}
