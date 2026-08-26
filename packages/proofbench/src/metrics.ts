import type { Verdict, VerifyResponse } from '@proofscan/contracts';
import type { ClaimbenchCase } from '@proofscan/claimbench';
import { tokens } from '@proofscan/core';

export interface Prediction {
  case: ClaimbenchCase;
  response: Pick<VerifyResponse, 'verdict' | 'confidence' | 'evidenceSpan' | 'source'>;
  latencyMs: number;
  failed?: boolean;
  robust?: boolean;
}
const labels: Verdict[] = [
  'SUPPORTED',
  'CONTRADICTED',
  'INSUFFICIENT_EVIDENCE',
  'STALE',
  'SOURCE_UNAVAILABLE',
];
const mean = (v: number[]) => (v.length ? v.reduce((a, b) => a + b, 0) / v.length : 0);
const percentile = (v: number[], p: number) => {
  const s = [...v].sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.floor(s.length * p))] ?? 0;
};
function f1(expected: string, predicted: string) {
  const a = tokens(expected),
    b = tokens(predicted);
  if (!a.length && !b.length) return 1;
  if (!a.length || !b.length) return 0;
  const counts = new Map<string, number>();
  for (const t of a) counts.set(t, (counts.get(t) ?? 0) + 1);
  let hit = 0;
  for (const t of b) {
    const n = counts.get(t) ?? 0;
    if (n) {
      hit++;
      counts.set(t, n - 1);
    }
  }
  const precision = hit / b.length,
    recall = hit / a.length;
  return precision + recall ? (2 * precision * recall) / (precision + recall) : 0;
}
export function calculateMetrics(rows: Prediction[]) {
  const perClass: any = {};
  for (const label of labels) {
    const tp = rows.filter(
      (x) => x.case.expected.verdict === label && x.response.verdict === label,
    ).length;
    const fp = rows.filter(
      (x) => x.case.expected.verdict !== label && x.response.verdict === label,
    ).length;
    const fn = rows.filter(
      (x) => x.case.expected.verdict === label && x.response.verdict !== label,
    ).length;
    const precision = tp / (tp + fp) || 0,
      recall = tp / (tp + fn) || 0;
    perClass[label] = {
      precision,
      recall,
      f1: precision + recall ? (2 * precision * recall) / (precision + recall) : 0,
    };
  }
  const macroF1 = mean(labels.map((x) => perClass[x].f1));
  const incorrectSupport = rows.filter(
    (x) => x.case.expected.verdict !== 'SUPPORTED' && x.response.verdict === 'SUPPORTED',
  ).length;
  const unsupported = rows.filter((x) => x.case.expected.verdict !== 'SUPPORTED').length;
  const brier = mean(
    rows.map((x) => {
      const y = x.response.verdict === x.case.expected.verdict ? 1 : 0;
      return (x.response.confidence - y) ** 2;
    }),
  );
  const bins = Array.from({ length: 10 }, () => [] as Prediction[]);
  for (const row of rows) bins[Math.min(9, Math.floor(row.response.confidence * 10))]!.push(row);
  const ece = bins.reduce(
    (sum, bin) =>
      sum +
      (bin.length / rows.length) *
        Math.abs(
          mean(bin.map((x) => x.response.confidence)) -
            mean(bin.map((x) => (x.response.verdict === x.case.expected.verdict ? 1 : 0))),
        ),
    0,
  );
  const evidence = mean(
    rows.map((x) =>
      x.case.expected.evidenceSpans.length
        ? Math.max(
            ...x.case.expected.evidenceSpans.map((s) => f1(s, x.response.evidenceSpan ?? '')),
          )
        : x.response.evidenceSpan
          ? 0
          : 1,
    ),
  );
  const citations = mean(
    rows
      .filter((x) => x.case.expected.source)
      .map((x) => (x.response.source === x.case.expected.source ? 1 : 0)),
  );
  const abstention = mean(
    rows
      .filter((x) => x.case.expected.verdict === 'INSUFFICIENT_EVIDENCE')
      .map((x) => (x.response.verdict === 'INSUFFICIENT_EVIDENCE' ? 1 : 0)),
  );
  const robustness = mean(
    rows.filter((x) => x.robust !== undefined).map((x) => (x.robust ? 1 : 0)),
  );
  const latencyCompliance = mean(rows.map((x) => (x.latencyMs <= 5000 ? 1 : 0)));
  const composite =
    0.4 * macroF1 +
    0.2 * (1 - (incorrectSupport / unsupported || 0)) +
    0.1 * (1 - ece) +
    0.1 * evidence +
    0.05 * citations +
    0.05 * abstention +
    0.05 * robustness +
    0.05 * latencyCompliance;
  return {
    macroF1,
    perClass,
    expectedCalibrationError: ece,
    brierScore: brier,
    evidenceAccuracy: evidence,
    citationCorrectness: citations,
    contradictionRecall: perClass.CONTRADICTED.recall,
    abstentionAccuracy: abstention,
    falseTrustRate: incorrectSupport / unsupported || 0,
    robustness,
    p50LatencyMs: percentile(
      rows.map((x) => x.latencyMs),
      0.5,
    ),
    p95LatencyMs: percentile(
      rows.map((x) => x.latencyMs),
      0.95,
    ),
    latencyCompliance,
    failureRate: mean(rows.map((x) => (x.failed ? 1 : 0))),
    compositeScore: composite,
  };
}
