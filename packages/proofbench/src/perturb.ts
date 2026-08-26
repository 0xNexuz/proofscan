import type { ClaimbenchCase } from '@proofscan/claimbench';

function rng(seed: number) {
  return () => ((seed = Math.imul(48271, seed) % 2147483647) & 2147483647) / 2147483647;
}
export function perturb(cases: ClaimbenchCase[], seed: number): ClaimbenchCase[] {
  const random = rng(seed);
  return cases.map((item) => {
    const copy = structuredClone(item);
    if (copy.expected.verdict === 'SUPPORTED') {
      copy.request.claim = copy.request.claim.replace(/\b(\d+(?:\.\d+)?)\b/, (m) =>
        String(Number(m) + (random() > 0.5 ? 1 : 10)),
      );
      copy.expected.verdict = 'CONTRADICTED';
    } else
      copy.request.claim = `According to the evidence, ${copy.request.claim.charAt(0).toLowerCase() + copy.request.claim.slice(1)}`;
    return copy;
  });
}
