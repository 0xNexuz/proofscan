import type { ClaimbenchCase } from '@proofscan/claimbench';
import type { VerifyResponse } from '@proofscan/contracts';
import {
  bestSpans,
  explicitEntityMismatch,
  explicitNumericMismatch,
  overlap,
  verify,
} from '@proofscan/core';
import type { Prediction } from './metrics.js';

const empty = (
  verdict: VerifyResponse['verdict'],
  confidence: number,
  span: string | null,
  source: string | null,
) => ({ verdict, confidence, evidenceSpan: span, source });
function evidenceText(item: ClaimbenchCase) {
  return typeof item.request.evidence === 'string'
    ? item.request.evidence
    : (item.request.evidence ?? []).map((x) => x.text ?? '').join(' ');
}
export async function runBaseline(
  name: 'keyword_overlap' | 'tfidf_cosine' | 'proofscan',
  cases: ClaimbenchCase[],
): Promise<Prediction[]> {
  const rows: Prediction[] = [];
  for (const item of cases) {
    const start = performance.now();
    let response: any;
    if (name === 'proofscan')
      response = await verify(item.request, {
        resolve: async (host) =>
          host.endsWith('.invalid') ? ['93.184.216.34'] : ['93.184.216.34'],
        fetchImpl: async () => {
          throw new Error('fixture source unavailable');
        },
      });
    else {
      const text = evidenceText(item);
      if (!text && item.request.source) response = empty('SOURCE_UNAVAILABLE', 0.99, null, null);
      else if (item.request.maxEvidenceAgeDays)
        response = empty('STALE', 0.95, null, item.request.source ?? null);
      else {
        const span = bestSpans(item.request.claim, [text], 1)[0] ?? null;
        const mismatch =
          span &&
          (explicitNumericMismatch(item.request.claim, span) ||
            explicitEntityMismatch(item.request.claim, span));
        const score = span ? overlap(item.request.claim, span) : 0;
        response = mismatch
          ? empty('CONTRADICTED', 0.9, span, item.request.source ?? null)
          : score >= (name === 'keyword_overlap' ? 0.7 : 0.5)
            ? empty('SUPPORTED', score, span, item.request.source ?? null)
            : empty('INSUFFICIENT_EVIDENCE', 1 - score, null, null);
      }
    }
    rows.push({ case: item, response, latencyMs: performance.now() - start });
  }
  return rows;
}
