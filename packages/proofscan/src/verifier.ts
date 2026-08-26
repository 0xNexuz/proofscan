import { randomUUID } from 'node:crypto';
import {
  ProofScanError,
  VerifyRequestSchema,
  type Check,
  type VerifyRequest,
  type VerifyResponse,
} from '@proofscan/contracts';
import { acquireEvidence, type AcquisitionOptions } from './acquisition.js';
import { explicitEntityMismatch, explicitNumericMismatch } from './facts.js';
import { bestSpans, includesNormalized, overlap, tokens } from './text.js';
import type { ModelJudge, SemanticResult } from './types.js';
import calibration from './calibration.json' with { type: 'json' };

export interface VerifyOptions extends AcquisitionOptions {
  modelJudge?: ModelJudge;
  now?: () => Date;
  requestId?: () => string;
}
const round = (n: number) => Math.max(0, Math.min(1, Math.round(n * 10_000) / 10_000));

function check(
  stage: string,
  started: number,
  status: Check['status'],
  code: string,
  detail: string,
): Check {
  return { stage, status, code, detail, durationMs: performance.now() - started };
}
function heuristicJudge(claim: string, spans: string[]): SemanticResult {
  const span = spans[0] ?? null;
  if (!span)
    return {
      verdict: 'INSUFFICIENT_EVIDENCE',
      entailment: 0,
      contradiction: 0,
      evidenceSpan: null,
      reason: 'No relevant evidence span found.',
    };
  const numeric = explicitNumericMismatch(claim, span);
  const entity = explicitEntityMismatch(claim, span);
  if (numeric || entity)
    return {
      verdict: 'CONTRADICTED',
      entailment: 0.05,
      contradiction: 0.98,
      evidenceSpan: span,
      reason: numeric ?? entity ?? 'Explicit factual mismatch.',
    };
  const claimTokens = tokens(claim);
  const spanTokenSet = new Set(tokens(span));
  if (
    includesNormalized(span, claim) ||
    (claimTokens.length > 1 && claimTokens.every((token) => spanTokenSet.has(token)))
  )
    return {
      verdict: 'SUPPORTED',
      entailment: 0.98,
      contradiction: 0.01,
      evidenceSpan: span,
      reason: 'The evidence contains the normalized claim directly.',
    };
  const score = overlap(claim, span);
  const claimNeg = /\b(no|not|never|without|didn't|doesn't|isn't|wasn't)\b/i.test(claim);
  const spanNeg = /\b(no|not|never|without|didn't|doesn't|isn't|wasn't)\b/i.test(span);
  if (score >= 0.72 && claimNeg !== spanNeg)
    return {
      verdict: 'CONTRADICTED',
      entailment: 0.1,
      contradiction: round(0.65 + score * 0.3),
      evidenceSpan: span,
      reason: 'Evidence reverses the claim polarity.',
    };
  if (score >= calibration.supportThreshold)
    return {
      verdict: 'SUPPORTED',
      entailment: round(0.55 + score * 0.4),
      contradiction: 0.03,
      evidenceSpan: span,
      reason: 'The evidence directly overlaps the claim facts.',
    };
  return {
    verdict: 'INSUFFICIENT_EVIDENCE',
    entailment: round(score * 0.6),
    contradiction: 0.1,
    evidenceSpan: null,
    reason: 'Evidence does not directly establish or refute the claim.',
  };
}

export async function verify(input: unknown, options: VerifyOptions = {}): Promise<VerifyResponse> {
  const overall = performance.now();
  const requestId = options.requestId?.() ?? randomUUID();
  const request = VerifyRequestSchema.parse(input);
  const checks: Check[] = [];
  let started = performance.now();
  checks.push(
    check('normalization', started, 'pass', 'INPUT_VALID', 'Input schema and size limits passed.'),
  );
  started = performance.now();
  const acquisition = await acquireEvidence(request, options);
  if (acquisition.unavailable) {
    checks.push(
      check(
        'acquisition',
        started,
        'fail',
        'SOURCE_UNAVAILABLE',
        'At least one required source could not be acquired.',
      ),
    );
    return response(
      requestId,
      'SOURCE_UNAVAILABLE',
      0.99,
      'A required evidence source could not be acquired safely.',
      null,
      null,
      request,
      acquisition.evidence,
      checks,
      overall,
      options,
      { entailment: 0, contradiction: 0, freshness: null, consistency: null },
    );
  }
  if (acquisition.provenanceMismatch) {
    checks.push(
      check(
        'acquisition',
        started,
        'fail',
        'PROVENANCE_MISMATCH',
        'Inline evidence was not found in its cited source.',
      ),
    );
    return response(
      requestId,
      'INSUFFICIENT_EVIDENCE',
      0.98,
      'The supplied evidence could not be verified against its cited source.',
      null,
      null,
      request,
      acquisition.evidence,
      checks,
      overall,
      options,
      { entailment: 0, contradiction: 0, freshness: null, consistency: null },
    );
  }
  checks.push(
    check(
      'acquisition',
      started,
      'pass',
      'EVIDENCE_ACQUIRED',
      `${acquisition.evidence.length} evidence item(s) acquired.`,
    ),
  );
  if (!acquisition.evidence.length)
    return response(
      requestId,
      'INSUFFICIENT_EVIDENCE',
      0.95,
      'No usable evidence was supplied.',
      null,
      null,
      request,
      [],
      checks,
      overall,
      options,
      { entailment: 0, contradiction: 0, freshness: null, consistency: null },
    );

  const asOf = new Date(request.asOf ?? (options.now?.() ?? new Date()).toISOString());
  let freshness: number | null = null;
  if (request.maxEvidenceAgeDays) {
    const dated = acquisition.evidence.filter((e) => e.publishedAt);
    if (dated.length) {
      const newest = Math.max(...dated.map((e) => Date.parse(e.publishedAt!)));
      const ageDays = (asOf.getTime() - newest) / 86_400_000;
      freshness = round(Math.exp(-Math.max(0, ageDays) / request.maxEvidenceAgeDays));
      if (ageDays > request.maxEvidenceAgeDays) {
        checks.push(
          check(
            'freshness',
            performance.now(),
            'fail',
            'EVIDENCE_STALE',
            `Newest evidence is ${Math.floor(ageDays)} days old.`,
          ),
        );
        return response(
          requestId,
          'STALE',
          0.98,
          'Evidence predates the caller’s explicit freshness window.',
          null,
          acquisition.evidence[0]?.source ?? null,
          request,
          acquisition.evidence,
          checks,
          overall,
          options,
          { entailment: 0, contradiction: 0, freshness, consistency: null },
        );
      }
    }
  }
  checks.push(
    check(
      'freshness',
      performance.now(),
      freshness === null ? 'skip' : 'pass',
      freshness === null ? 'NO_FRESHNESS_POLICY' : 'FRESH',
      freshness === null
        ? 'No explicit age policy and no temporal conflict.'
        : 'Evidence is within the requested freshness window.',
    ),
  );

  started = performance.now();
  const spans = bestSpans(
    request.claim,
    acquisition.evidence.map((e) => e.text),
  );
  checks.push(
    check(
      'extraction',
      started,
      spans.length ? 'pass' : 'warn',
      'CANDIDATE_SPANS',
      `${spans.length} candidate span(s) selected.`,
    ),
  );
  let semantic = heuristicJudge(request.claim, spans);
  const hardMismatch = semantic.verdict === 'CONTRADICTED' && semantic.contradiction >= 0.95;
  if (!hardMismatch && semantic.verdict === 'INSUFFICIENT_EVIDENCE' && options.modelJudge) {
    try {
      semantic = await options.modelJudge.judge(request.claim, spans);
    } catch (error) {
      if (error instanceof ProofScanError) throw error;
      throw new ProofScanError(
        'MODEL_UNAVAILABLE',
        error instanceof Error ? error.message : 'Semantic provider unavailable',
        503,
        true,
      );
    }
  }
  if (
    semantic.evidenceSpan &&
    !acquisition.evidence.some((e) => includesNormalized(e.text, semantic.evidenceSpan!))
  ) {
    semantic = {
      verdict: 'INSUFFICIENT_EVIDENCE',
      entailment: 0,
      contradiction: 0,
      evidenceSpan: null,
      reason: 'The proposed evidence span was not present in acquired evidence.',
    };
    checks.push(
      check(
        'evidence_validation',
        performance.now(),
        'fail',
        'FABRICATED_SPAN_REJECTED',
        'A non-verbatim evidence span was rejected.',
      ),
    );
  } else
    checks.push(
      check(
        'evidence_validation',
        performance.now(),
        'pass',
        'SPAN_VALID',
        semantic.evidenceSpan ? 'Evidence span exists verbatim.' : 'No decisive span claimed.',
      ),
    );

  const consistency =
    acquisition.evidence.length > 1
      ? round(
          1 -
            Math.min(
              1,
              Math.max(
                ...acquisition.evidence.map((e) =>
                  explicitNumericMismatch(request.claim, e.text) ? 1 : 0,
                ),
              ),
            ),
        )
      : null;
  const authority = Math.max(...acquisition.evidence.map((e) => e.authority));
  const base =
    semantic.verdict === 'SUPPORTED'
      ? semantic.entailment
      : semantic.verdict === 'CONTRADICTED'
        ? semantic.contradiction
        : 1 - Math.max(semantic.entailment, semantic.contradiction);
  const confidence = round(base * 0.85 + authority * 0.1 + (freshness ?? 0.5) * 0.05);
  checks.push(
    check(
      'aggregation',
      performance.now(),
      'pass',
      'VERDICT_AGGREGATED',
      'Deterministic gates take precedence; authority only adjusts confidence.',
    ),
  );
  const source = semantic.evidenceSpan
    ? (acquisition.evidence.find((e) => includesNormalized(e.text, semantic.evidenceSpan!))
        ?.source ?? null)
    : null;
  return response(
    requestId,
    semantic.verdict,
    confidence,
    semantic.reason,
    semantic.evidenceSpan,
    source,
    request,
    acquisition.evidence,
    checks,
    overall,
    options,
    {
      entailment: semantic.entailment,
      contradiction: semantic.contradiction,
      freshness,
      consistency,
    },
  );
}

function response(
  requestId: string,
  verdict: VerifyResponse['verdict'],
  confidence: number,
  reason: string,
  evidenceSpan: string | null,
  source: string | null,
  request: VerifyRequest,
  evidence: Awaited<ReturnType<typeof acquireEvidence>>['evidence'],
  checks: Check[],
  overall: number,
  options: VerifyOptions,
  signals: {
    entailment: number;
    contradiction: number;
    freshness: number | null;
    consistency: number | null;
  },
): VerifyResponse {
  return {
    requestId,
    verdict,
    confidence: round(confidence),
    reason,
    evidenceSpan,
    source,
    signals: {
      entailment: round(signals.entailment),
      contradiction: round(signals.contradiction),
      sourceAuthority: round(evidence.length ? Math.max(...evidence.map((e) => e.authority)) : 0),
      freshness: signals.freshness,
      crossSourceConsistency: signals.consistency,
    },
    checks,
    meta: {
      asOf: request.asOf ?? (options.now?.() ?? new Date()).toISOString(),
      model: options.modelJudge?.name ?? null,
      totalLatencyMs: performance.now() - overall,
      evidenceCount: evidence.length,
      calibrationVersion: calibration.version,
    },
  };
}
