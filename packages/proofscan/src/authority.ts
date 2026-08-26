import type { SourceClass } from '@proofscan/contracts';

const weights: Record<SourceClass, number> = {
  primary: 0.95,
  regulatory: 0.95,
  academic: 0.9,
  reputable_secondary: 0.75,
  community: 0.45,
  unknown: 0.35,
};
export function classifySource(source: string | null): {
  sourceClass: SourceClass;
  authority: number;
} {
  if (!source) return { sourceClass: 'unknown', authority: weights.unknown! };
  let host = '';
  try {
    host = new URL(source).hostname.toLowerCase();
  } catch {
    return { sourceClass: 'unknown', authority: weights.unknown! };
  }
  let sourceClass: SourceClass = 'unknown';
  if (/\.(gov|gov\.uk|europa\.eu)$/.test(host) || host.endsWith('.sec.gov'))
    sourceClass = 'regulatory';
  else if (
    /\.(edu|ac\.uk)$/.test(host) ||
    ['arxiv.org', 'nature.com', 'science.org'].some((x) => host.endsWith(x))
  )
    sourceClass = 'academic';
  else if (['reuters.com', 'apnews.com', 'bbc.com', 'ft.com'].some((x) => host.endsWith(x)))
    sourceClass = 'reputable_secondary';
  else if (['reddit.com', 'medium.com', 'x.com'].some((x) => host.endsWith(x)))
    sourceClass = 'community';
  else if (host) sourceClass = 'primary';
  return { sourceClass, authority: weights[sourceClass]! };
}
