import { normalizeText } from './text.js';

export interface NumericFact {
  raw: string;
  value: number;
  kind: 'currency' | 'percentage' | 'number' | 'date';
  unit: string | null;
}
const multipliers: Record<string, number> = {
  k: 1e3,
  thousand: 1e3,
  m: 1e6,
  million: 1e6,
  b: 1e9,
  billion: 1e9,
};

export function numericFacts(text: string): NumericFact[] {
  const found: NumericFact[] = [];
  const re =
    /([$€£])?\b(\d+(?:\.\d+)?)\s*(%|percent|k|m|b|thousand|million|billion)?(?![\p{L}\d])/giu;
  for (const match of normalizeText(text).matchAll(re)) {
    const suffix = match[3]?.toLowerCase();
    const prefix = match[1];
    let value = Number(match[2]);
    if (suffix && multipliers[suffix]) value *= multipliers[suffix];
    found.push({
      raw: match[0],
      value,
      kind: prefix ? 'currency' : suffix === '%' || suffix === 'percent' ? 'percentage' : 'number',
      unit: prefix ?? suffix ?? null,
    });
  }
  const dateRe = /\b(19|20)\d{2}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])\b/g;
  for (const match of normalizeText(text).matchAll(dateRe))
    found.push({ raw: match[0], value: Date.parse(match[0]), kind: 'date', unit: null });
  return found;
}

export function explicitNumericMismatch(claim: string, span: string): string | null {
  const cf = numericFacts(claim);
  const ef = numericFacts(span);
  for (const c of cf) {
    const comparable = ef.filter((e) => e.kind === c.kind);
    if (
      comparable.length &&
      !comparable.some(
        (e) => Math.abs(e.value - c.value) <= Math.max(1e-9, Math.abs(c.value) * 1e-9),
      )
    )
      return `Claim value ${c.raw} conflicts with evidence value ${comparable[0]?.raw}.`;
  }
  return null;
}

export function likelyEntities(text: string): string[] {
  return [...new Set(normalizeText(text).match(/\b[A-Z][\p{L}\d&-]*\b/gu) ?? [])].filter(
    (x) =>
      ![
        'The',
        'A',
        'An',
        'In',
        'On',
        'As',
        'August',
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'September',
        'October',
        'November',
        'December',
      ].includes(x),
  );
}
export function explicitEntityMismatch(claim: string, span: string): string | null {
  const c = likelyEntities(claim);
  const e = likelyEntities(span);
  if (c.length >= 2 && e.length >= 2 && c.at(-1) === e.at(-1) && c[0] !== e[0])
    return `Claim entity ${c[0]} conflicts with evidence entity ${e[0]}.`;
  return null;
}
