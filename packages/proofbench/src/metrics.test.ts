import { describe, expect, it } from 'vitest';
import { calculateMetrics } from './metrics.js';
describe('metrics', () =>
  it('makes false trust a headline metric', () => {
    const base: any = {
      id: 'x',
      expected: { verdict: 'CONTRADICTED', evidenceSpans: [], source: null },
    };
    const m = calculateMetrics([
      {
        case: base,
        response: { verdict: 'SUPPORTED', confidence: 0.99, evidenceSpan: null, source: null },
        latencyMs: 10,
      },
    ]);
    expect(m.falseTrustRate).toBe(1);
    expect(m.compositeScore).toBeLessThan(0.5);
  }));
