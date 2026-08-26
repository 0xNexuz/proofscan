import type { VerifyResponse } from '@proofscan/contracts';
export const auditRecord = (result: VerifyResponse) => ({
  requestId: result.requestId,
  verdict: result.verdict,
  confidence: result.confidence,
  evidence: result.evidenceSpan,
  source: result.source,
  checks: result.checks,
});
