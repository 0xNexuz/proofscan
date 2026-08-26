import { createProofScan } from '@proofscan/sdk';
const proofscan = createProofScan({
  baseUrl: process.env.PROOFSCAN_URL ?? 'http://localhost:3000',
  apiKey: process.env.PROOFSCAN_API_KEY!,
});
const result = await proofscan.verify({
  claim: 'HTTP/3 is defined by RFC 9114.',
  evidence: 'RFC 9114 defines HTTP/3, a mapping of HTTP semantics over QUIC.',
});
if (result.verdict === 'SUPPORTED' && result.confidence >= 0.9)
  console.log('Safe to use:', result.evidenceSpan);
else console.log('Do not act:', result.verdict, result.reason);
