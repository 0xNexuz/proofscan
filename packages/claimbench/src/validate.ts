import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { loadClaimbench } from './index.js';

const cases = await loadClaimbench();
const count = (key: string) =>
  Object.fromEntries(
    [...new Set(cases.map((x: any) => x[key]))].map((v) => [
      v,
      cases.filter((x: any) => x[key] === v).length,
    ]),
  );
if (cases.length !== 160) throw new Error(`Expected 160 cases, got ${cases.length}`);
if (new Set(cases.map((x) => x.id)).size !== 160) throw new Error('Case IDs are not unique');
const expected = {
  SUPPORTED: 32,
  CONTRADICTED: 32,
  INSUFFICIENT_EVIDENCE: 32,
  STALE: 32,
  SOURCE_UNAVAILABLE: 32,
};
if (JSON.stringify(count('expected').verdict) === JSON.stringify(expected)) void 0;
for (const value of Object.values(count('domain')))
  if (value !== 20) throw new Error('Each domain must contain 20 cases');
const verdictCounts = Object.fromEntries(
  [...new Set(cases.map((x) => x.expected.verdict))].map((v) => [
    v,
    cases.filter((x) => x.expected.verdict === v).length,
  ]),
);
for (const [k, v] of Object.entries(expected))
  if (verdictCounts[k] !== v) throw new Error(`${k} count ${verdictCounts[k]} != ${v}`);
const difficultyCounts = Object.fromEntries(
  [...new Set(cases.map((x) => x.difficulty))].map((v) => [
    v,
    cases.filter((x) => x.difficulty === v).length,
  ]),
);
for (const [k, v] of Object.entries({ easy: 32, medium: 48, hard: 48, adversarial: 32 }))
  if (difficultyCounts[k] !== v) throw new Error(`${k} count ${difficultyCounts[k]} != ${v}`);
const splitCounts = Object.fromEntries(
  [...new Set(cases.map((x) => x.split))].map((v) => [
    v,
    cases.filter((x) => x.split === v).length,
  ]),
);
for (const [k, v] of Object.entries({ train: 96, validation: 32, test: 32 }))
  if (splitCounts[k] !== v) throw new Error(`${k} count ${splitCounts[k]} != ${v}`);
const bytes = await readFile(new URL('../data/claimbench-0.1.0.jsonl', import.meta.url));
console.log(
  JSON.stringify(
    {
      cases: 160,
      verdicts: verdictCounts,
      difficulties: difficultyCounts,
      splits: splitCounts,
      sha256: createHash('sha256').update(bytes).digest('hex'),
    },
    null,
    2,
  ),
);
