import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadClaimbench } from '@proofscan/claimbench';
import { runBaseline } from './baselines.js';
import { calculateMetrics } from './metrics.js';
import { perturb } from './perturb.js';

const seed = Number(process.env.PROOFBENCH_SEED ?? 20260822);
const cases = await loadClaimbench();
const dataUrl = new URL('../../claimbench/data/claimbench-0.1.0.jsonl', import.meta.url);
const datasetHash = createHash('sha256')
  .update(await readFile(dataUrl))
  .digest('hex');
const results: any = {
  schemaVersion: '1',
  claimbenchVersion: '0.1.0',
  datasetHash,
  seed,
  runAt: new Date().toISOString(),
  caseCount: cases.length,
  baselines: {},
  singleModelJudge:
    process.env.MODEL_API_KEY && process.env.MODEL_NAME
      ? 'CONFIGURED_NOT_RUN_IN_OFFLINE_SUITE'
      : 'NOT_RUN_MISSING_CREDENTIALS',
};
for (const name of ['keyword_overlap', 'tfidf_cosine', 'proofscan'] as const) {
  const rows = await runBaseline(name, cases);
  const changed = perturb(cases.slice(0, 32), seed);
  const changedRows = await runBaseline(name, changed);
  for (let i = 0; i < changedRows.length; i++)
    rows[i]!.robust = changedRows[i]!.response.verdict === changed[i]!.expected.verdict;
  results.baselines[name] = calculateMetrics(rows);
}
const out = new URL('../../../benchmarks/latest.json', import.meta.url);
await mkdir(dirname(fileURLToPath(out)), { recursive: true });
await writeFile(out, JSON.stringify(results, null, 2) + '\n');
console.log(JSON.stringify(results, null, 2));
