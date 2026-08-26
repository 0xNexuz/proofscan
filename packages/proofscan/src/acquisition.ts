import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';
import { ProofScanError, type VerifyRequest } from '@proofscan/contracts';
import { classifySource } from './authority.js';
import { includesNormalized, normalizeText } from './text.js';
import type { AcquiredEvidence } from './types.js';

export interface AcquisitionOptions {
  fetchImpl?: typeof fetch;
  resolve?: (hostname: string) => Promise<string[]>;
  timeoutMs?: number;
}

function blockedIp(ip: string): boolean {
  if (isIP(ip) === 4) {
    const [a = 0, b = 0] = ip.split('.').map(Number);
    return (
      a === 0 ||
      a === 10 ||
      a === 127 ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      a >= 224
    );
  }
  const v = ip.toLowerCase();
  return (
    v === '::1' ||
    v === '::' ||
    v.startsWith('fc') ||
    v.startsWith('fd') ||
    v.startsWith('fe8') ||
    v.startsWith('fe9') ||
    v.startsWith('fea') ||
    v.startsWith('feb')
  );
}

async function defaultResolve(hostname: string): Promise<string[]> {
  return (await lookup(hostname, { all: true, verbatim: true })).map((x) => x.address);
}
async function validateUrl(
  raw: string,
  resolve: (hostname: string) => Promise<string[]>,
): Promise<URL> {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new ProofScanError('INVALID_SOURCE_URL', 'Source is not a valid URL', 400);
  }
  if (url.protocol !== 'https:')
    throw new ProofScanError('UNSAFE_SOURCE_URL', 'Only HTTPS evidence sources are allowed', 400);
  const ips = await resolve(url.hostname);
  if (!ips.length || ips.some(blockedIp))
    throw new ProofScanError('UNSAFE_SOURCE_URL', 'Source resolves to a blocked network', 400);
  return url;
}
function htmlToText(html: string): string {
  return normalizeText(
    html
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'"),
  );
}

async function fetchSource(raw: string, options: AcquisitionOptions): Promise<string> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const resolve = options.resolve ?? defaultResolve;
  let url = await validateUrl(raw, resolve);
  for (let redirect = 0; redirect <= 3; redirect++) {
    let lastError: unknown;
    for (let attempt = 0; attempt < 3; attempt++) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), options.timeoutMs ?? 8_000);
      try {
        const response = await fetchImpl(url, {
          redirect: 'manual',
          signal: controller.signal,
          headers: { accept: 'text/plain,text/html,application/json' },
        });
        if ([301, 302, 303, 307, 308].includes(response.status)) {
          const location = response.headers.get('location');
          if (!location) throw new Error('Redirect without location');
          url = await validateUrl(new URL(location, url).toString(), resolve);
          break;
        }
        if ((response.status === 429 || response.status >= 500) && attempt < 2) {
          lastError = new Error(`HTTP ${response.status}`);
          continue;
        }
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const type = response.headers.get('content-type')?.split(';')[0] ?? '';
        if (!['text/plain', 'text/html', 'application/json'].includes(type))
          throw new Error(`Unsupported content type ${type || 'unknown'}`);
        const length = Number(response.headers.get('content-length') ?? 0);
        if (length > 1_000_000) throw new Error('Source exceeds 1 MB');
        const bytes = new Uint8Array(await response.arrayBuffer());
        if (bytes.length > 1_000_000) throw new Error('Source exceeds 1 MB');
        const body = new TextDecoder().decode(bytes);
        return type === 'text/html' ? htmlToText(body) : normalizeText(body);
      } catch (error) {
        lastError = error;
        if (attempt === 2) throw error;
      } finally {
        clearTimeout(timer);
      }
    }
    if (lastError && redirect === 3) throw lastError;
  }
  throw new Error('Too many redirects');
}

export async function acquireEvidence(
  request: VerifyRequest,
  options: AcquisitionOptions = {},
): Promise<{ evidence: AcquiredEvidence[]; provenanceMismatch: boolean; unavailable: boolean }> {
  const inputs =
    typeof request.evidence === 'string'
      ? [
          {
            text: request.evidence,
            url: request.source?.startsWith('https://') ? request.source : undefined,
          },
        ]
      : request.evidence?.length
        ? request.evidence
        : [{ url: request.source }];
  const result: AcquiredEvidence[] = [];
  let mismatch = false;
  let unavailable = false;
  for (const input of inputs) {
    let fetched: string | null = null;
    if (input.url) {
      try {
        fetched = await fetchSource(input.url, options);
      } catch (error) {
        if (error instanceof ProofScanError && error.statusCode === 400) throw error;
        unavailable = true;
        continue;
      }
      if (input.text && !includesNormalized(fetched, input.text)) mismatch = true;
    }
    const text = normalizeText(input.text ?? fetched ?? '');
    if (!text) continue;
    const source = input.url ?? request.source ?? null;
    const classified = classifySource(source);
    result.push({ text, source, publishedAt: input.publishedAt ?? null, ...classified });
  }
  return { evidence: result, provenanceMismatch: mismatch, unavailable };
}
