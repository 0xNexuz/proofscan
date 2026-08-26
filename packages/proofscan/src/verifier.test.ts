import { describe, expect, it } from 'vitest';
import { explicitEntityMismatch, explicitNumericMismatch } from './facts.js';
import { verify } from './verifier.js';

describe('deterministic facts', () => {
  it('normalizes numeric scales and finds mismatches', () => {
    expect(
      explicitNumericMismatch('Company X raised $14m.', 'Company X raised $10 million.'),
    ).toContain('$14m');
    expect(
      explicitNumericMismatch('The total is 14 million.', 'The total is 14000000.'),
    ).toBeNull();
    expect(explicitNumericMismatch('The rate is 5%.', 'The rate is 0.5%.')).toContain('5%');
  });
  it('detects common entity swaps', () =>
    expect(explicitEntityMismatch('Microsoft acquired X.', 'Google acquired X.')).toContain(
      'Microsoft',
    ));
});

describe('verify', () => {
  it('supports direct evidence with a verbatim span', async () => {
    const result = await verify(
      {
        claim: 'Company X raised $14 million.',
        evidence: 'Company X raised $14 million in its Series A.',
      },
      { requestId: () => 'test' },
    );
    expect(result.verdict).toBe('SUPPORTED');
    expect(result.evidenceSpan).toContain('$14 million');
    expect(result.requestId).toBe('test');
  });
  it('contradicts numeric substitutions', async () => {
    const result = await verify({
      claim: 'Company X raised $14 million.',
      evidence: 'Company X raised $10 million.',
    });
    expect(result.verdict).toBe('CONTRADICTED');
    expect(result.signals.contradiction).toBeGreaterThan(0.9);
  });
  it('abstains on unrelated evidence', async () => {
    const result = await verify({
      claim: 'Mars has liquid oceans.',
      evidence: 'Mars is the fourth planet from the Sun.',
    });
    expect(result.verdict).toBe('INSUFFICIENT_EVIDENCE');
    expect(result.evidenceSpan).toBeNull();
  });
  it('marks evidence stale only under an explicit age policy', async () => {
    const result = await verify({
      claim: 'The service is online.',
      evidence: [{ text: 'The service is online.', publishedAt: '2020-01-01T00:00:00Z' }],
      asOf: '2020-02-15T00:00:00Z',
      maxEvidenceAgeDays: 30,
    });
    expect(result.verdict).toBe('STALE');
  });
  it('fails closed when a required source cannot be fetched', async () => {
    const result = await verify(
      { claim: 'A', source: 'https://example.com' },
      {
        resolve: async () => ['93.184.216.34'],
        fetchImpl: async () => {
          throw new Error('down');
        },
      },
    );
    expect(result.verdict).toBe('SOURCE_UNAVAILABLE');
  });
  it('rejects sources resolving to private networks', async () => {
    await expect(
      verify(
        { claim: 'A fact', source: 'https://metadata.example' },
        { resolve: async () => ['169.254.169.254'] },
      ),
    ).rejects.toMatchObject({ code: 'UNSAFE_SOURCE_URL', statusCode: 400 });
  });
  it('rejects inline evidence not present at its cited URL', async () => {
    const fetchImpl = async () =>
      new Response('A different statement.', {
        status: 200,
        headers: { 'content-type': 'text/plain' },
      });
    const result = await verify(
      {
        claim: 'Claimed fact.',
        evidence: [{ text: 'Claimed fact.', url: 'https://example.com/source' }],
      },
      { resolve: async () => ['93.184.216.34'], fetchImpl },
    );
    expect(result.verdict).toBe('INSUFFICIENT_EVIDENCE');
    expect(result.checks.some((x) => x.code === 'PROVENANCE_MISMATCH')).toBe(true);
  });
  it('propagates model infrastructure failures without a verdict', async () => {
    await expect(
      verify(
        { claim: 'A nuanced claim', evidence: 'Unrelated context.' },
        {
          modelJudge: {
            name: 'fake',
            judge: async () => {
              throw new Error('provider down');
            },
          },
        },
      ),
    ).rejects.toMatchObject({ code: 'MODEL_UNAVAILABLE', statusCode: 503 });
  });
});
