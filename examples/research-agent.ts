import type { VerifyResponse } from '@proofscan/contracts';
export function acceptedCitation(result: VerifyResponse) {
  if (result.verdict !== 'SUPPORTED' || !result.evidenceSpan)
    throw new Error(`Research claim rejected: ${result.verdict}`);
  return { claimEvidence: result.evidenceSpan, source: result.source, requestId: result.requestId };
}
