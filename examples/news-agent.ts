export const newsVerification = (claim: string, evidence: string, source: string) => ({
  claim,
  evidence: [{ text: evidence }],
  source,
  asOf: new Date().toISOString(),
  maxEvidenceAgeDays: 2,
});
