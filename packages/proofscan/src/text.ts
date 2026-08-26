const STOP = new Set([
  'a',
  'an',
  'and',
  'are',
  'as',
  'at',
  'be',
  'by',
  'for',
  'from',
  'has',
  'in',
  'is',
  'it',
  'of',
  'on',
  'or',
  'that',
  'the',
  'to',
  'was',
  'were',
  'with',
]);

export function normalizeText(value: string): string {
  return value
    .normalize('NFKC')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}
export function tokens(value: string): string[] {
  return (
    normalizeText(value)
      .toLowerCase()
      .match(/[\p{L}\p{N}%$€£.-]+/gu)
      ?.map((token) => token.replace(/^[.-]+|[.-]+$/g, ''))
      .filter((token) => token && !STOP.has(token)) ?? []
  );
}
export function sentences(value: string): string[] {
  return normalizeText(value)
    .split(/(?<=[.!?])\s+(?=[\p{Lu}\d"'])/u)
    .map((x) => x.trim())
    .filter(Boolean);
}
export function overlap(a: string, b: string): number {
  const aa = new Set(tokens(a));
  const bb = new Set(tokens(b));
  if (!aa.size || !bb.size) return 0;
  let hit = 0;
  for (const token of aa) if (bb.has(token)) hit++;
  return (2 * hit) / (aa.size + bb.size);
}
export function bestSpans(claim: string, documents: string[], limit = 5): string[] {
  return documents
    .flatMap(sentences)
    .map((text) => ({ text, score: overlap(claim, text) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.text);
}
export function includesNormalized(haystack: string, needle: string): boolean {
  return normalizeText(haystack).toLowerCase().includes(normalizeText(needle).toLowerCase());
}
