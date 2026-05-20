import { z } from 'zod';
import { FEATURE_CATEGORY, ISSUE_TYPE, ERROR_LEVEL } from '@ffr/shared';

const issueFiltersSchema = z.object({
  category: z.enum([FEATURE_CATEGORY.VOTE, FEATURE_CATEGORY.ADS, FEATURE_CATEGORY.PAYMENT, FEATURE_CATEGORY.LIVE_VIDEO, FEATURE_CATEGORY.OTHER]).optional(),
  issueType: z.enum([ISSUE_TYPE.ERROR, ISSUE_TYPE.NOT_AN_ISSUE, ISSUE_TYPE.FEATURE_REQUEST, ISSUE_TYPE.SPEC_MISUNDERSTANDING]).optional(),
  errorLevel: z.coerce.number().refine((v) => [1, 2, 3].includes(v)).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

const clusterIdSchema = z.string().regex(/^[a-f0-9]{12}$/);

export function validateIssueFilters(params: Record<string, string | undefined>) {
  const result = issueFiltersSchema.safeParse(params);
  if (!result.success) {
    throw new ValidationError(result.error.message);
  }
  return result.data;
}

export function validateClusterId(id: string) {
  const result = clusterIdSchema.safeParse(id);
  if (!result.success) {
    throw new ValidationError('Invalid clusterId format');
  }
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}
