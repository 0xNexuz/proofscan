import type { VerifyResponse } from '@proofscan/contracts';
export function mayTrade(result: VerifyResponse) {
  return (
    result.verdict === 'SUPPORTED' &&
    result.confidence >= 0.95 &&
    result.evidenceSpan !== null &&
    (result.signals.crossSourceConsistency ?? 0) >= 0.8
  );
}
