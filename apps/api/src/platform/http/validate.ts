import type { NextApiRequest } from 'next';
import {
  AI_EFFORTS,
  AI_PROVIDER_IDS,
  CURRICULUM_DOMAINS,
  type AIEffort,
  type AIProviderId,
  type AIProviderSelection,
  type CurriculumDomain,
  type Tech,
} from '@algoflow/contracts';
import { ApiError } from './errors';

export const SUPPORTED_TECHS: Tech[] = [
  'js',
  'ts',
  'go',
  'sql',
  'python',
  'general',
  'en',
];
export type SupportedTech = Tech;

export function requireMethod(
  req: NextApiRequest,
  method: 'GET' | 'POST' | 'DELETE',
) {
  if (req.method !== method) {
    throw new ApiError(
      405,
      'method_not_allowed',
      `Use ${method} for this endpoint.`,
    );
  }
}

export function requireString(
  value: unknown,
  field: string,
  maxLength = 2_000,
) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new ApiError(400, 'invalid_request', `${field} is required.`);
  }
  const normalized = value.trim();
  if (normalized.length > maxLength) {
    throw new ApiError(400, 'invalid_request', `${field} is too long.`);
  }
  return normalized;
}

export function optionalTech(value: unknown): SupportedTech | undefined {
  if (value == null || value === '') return undefined;
  if (
    typeof value !== 'string' ||
    !SUPPORTED_TECHS.includes(value as SupportedTech)
  ) {
    throw new ApiError(400, 'invalid_tech', 'tech is not supported.');
  }
  return value as SupportedTech;
}

export function optionalDomain(value: unknown): CurriculumDomain | undefined {
  if (value == null || value === '') return undefined;
  if (
    typeof value !== 'string' ||
    !CURRICULUM_DOMAINS.includes(value as CurriculumDomain)
  ) {
    throw new ApiError(400, 'invalid_domain', 'domain is not supported.');
  }
  return value as CurriculumDomain;
}

export function optionalAIProviderSelection(
  body: Record<string, unknown> | undefined,
): AIProviderSelection | undefined {
  const provider = body?.provider;
  const model = body?.model;
  const effort = body?.effort;
  if (provider == null && model == null && effort == null) return undefined;
  if (
    typeof provider !== 'string' ||
    !AI_PROVIDER_IDS.includes(provider as AIProviderId)
  ) {
    throw new ApiError(
      400,
      'invalid_ai_provider',
      'Select a supported AI provider before choosing a model or effort.',
    );
  }
  if (
    model != null &&
    (typeof model !== 'string' || !model.trim() || model.length > 80)
  ) {
    throw new ApiError(
      400,
      'invalid_ai_provider',
      'The selected AI model is invalid.',
    );
  }
  if (
    effort != null &&
    (typeof effort !== 'string' || !AI_EFFORTS.includes(effort as AIEffort))
  ) {
    throw new ApiError(
      400,
      'invalid_ai_provider',
      'The selected AI effort is invalid.',
    );
  }
  return {
    provider: provider as AIProviderId,
    model: typeof model === 'string' ? model.trim() : undefined,
    effort: effort as AIEffort | undefined,
  };
}

export function clampedInteger(
  value: unknown,
  fallback: number,
  min: number,
  max: number,
) {
  if (value == null || value === '') return fallback;
  const parsed = Number(value);
  if (!Number.isInteger(parsed)) {
    throw new ApiError(400, 'invalid_number', 'Expected an integer value.');
  }
  return Math.min(max, Math.max(min, parsed));
}

export function assertSameOrigin(req: NextApiRequest) {
  const origin = req.headers.origin;
  if (!origin) return;
  const host = req.headers['x-forwarded-host'] ?? req.headers.host;
  const expectedProtocol =
    req.headers['x-forwarded-proto'] ??
    (process.env.NODE_ENV === 'production' ? 'https' : 'http');
  if (!host || origin !== `${expectedProtocol}://${host}`) {
    throw new ApiError(403, 'invalid_origin', 'Request origin is not allowed.');
  }
}
