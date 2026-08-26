import { z } from 'zod';

export const verdicts = [
  'SUPPORTED',
  'CONTRADICTED',
  'INSUFFICIENT_EVIDENCE',
  'STALE',
  'SOURCE_UNAVAILABLE',
] as const;
export const VerdictSchema = z.enum(verdicts);
export type Verdict = z.infer<typeof VerdictSchema>;

export const EvidenceInputSchema = z
  .object({
    text: z.string().max(100_000).optional(),
    url: z.string().max(2_048).optional(),
    publishedAt: z.string().datetime().optional(),
  })
  .refine((item) => Boolean(item.text || item.url), 'Evidence requires text or url');

export const VerifyRequestSchema = z
  .object({
    claim: z.string().trim().min(1).max(4_000),
    evidence: z.union([z.string().max(100_000), z.array(EvidenceInputSchema).max(5)]).optional(),
    source: z.string().max(2_048).optional(),
    asOf: z.string().datetime().optional(),
    maxEvidenceAgeDays: z.number().int().positive().max(36_500).optional(),
  })
  .superRefine((value, ctx) => {
    const total =
      typeof value.evidence === 'string'
        ? value.evidence.length
        : (value.evidence ?? []).reduce((sum, item) => sum + (item.text?.length ?? 0), 0);
    if (total > 100_000) ctx.addIssue({ code: 'custom', message: 'Evidence exceeds 100 KB' });
    if (!value.evidence && !value.source)
      ctx.addIssue({ code: 'custom', message: 'Evidence or source is required' });
  });
export type VerifyRequest = z.infer<typeof VerifyRequestSchema>;

export const SourceClassSchema = z.enum([
  'primary',
  'regulatory',
  'academic',
  'reputable_secondary',
  'community',
  'unknown',
]);
export type SourceClass = z.infer<typeof SourceClassSchema>;

export const CheckSchema = z.object({
  stage: z.string(),
  status: z.enum(['pass', 'fail', 'warn', 'skip']),
  code: z.string(),
  detail: z.string(),
  durationMs: z.number().nonnegative(),
});
export type Check = z.infer<typeof CheckSchema>;

export const VerifyResponseSchema = z.object({
  requestId: z.string(),
  verdict: VerdictSchema,
  confidence: z.number().min(0).max(1),
  reason: z.string(),
  evidenceSpan: z.string().nullable(),
  source: z.string().nullable(),
  signals: z.object({
    entailment: z.number().min(0).max(1),
    contradiction: z.number().min(0).max(1),
    sourceAuthority: z.number().min(0).max(1),
    freshness: z.number().min(0).max(1).nullable(),
    crossSourceConsistency: z.number().min(0).max(1).nullable(),
  }),
  checks: z.array(CheckSchema),
  meta: z.object({
    asOf: z.string(),
    model: z.string().nullable(),
    totalLatencyMs: z.number().nonnegative(),
    evidenceCount: z.number().int().nonnegative(),
    calibrationVersion: z.string(),
  }),
});
export type VerifyResponse = z.infer<typeof VerifyResponseSchema>;

export class ProofScanError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number,
    public retryable = false,
  ) {
    super(message);
  }
}
