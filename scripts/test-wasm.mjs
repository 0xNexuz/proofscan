import { readFile } from 'node:fs/promises';
const path = new URL(
  '../packages/proofbench-wasm/target/wasm32-unknown-unknown/release/proofbench_wasm.wasm',
  import.meta.url,
);
const bytes = await readFile(path);
const module = await WebAssembly.compile(bytes);
if (WebAssembly.Module.imports(module).length) throw new Error('WASM contains imports');
const instance = await WebAssembly.instantiate(module, {});
const { memory, alloc, dealloc, rank_answer } = instance.exports;
if (!memory || !alloc || !dealloc || !rank_answer) throw new Error('Missing required export');
const encoder = new TextEncoder();
function put(text) {
  const data = encoder.encode(text);
  const ptr = alloc(data.length);
  new Uint8Array(memory.buffer, ptr, data.length).set(data);
  return [ptr, data.length];
}
function score(q, gt, a) {
  const qp = put(q),
    gp = put(gt),
    ap = put(a);
  return rank_answer(...qp, ...gp, ...ap);
}
const q = JSON.stringify({ claim: 'Company X raised $14m', evidence: 'Company X raised $14m' });
const gt = JSON.stringify({
  verdict: 'SUPPORTED',
  evidenceSpans: ['Company X raised $14m'],
  source: 'official',
});
const good = JSON.stringify({
  verdict: 'SUPPORTED',
  confidence: 0.95,
  evidenceSpan: 'Company X raised $14m',
  source: 'official',
});
const bad = JSON.stringify({
  verdict: 'CONTRADICTED',
  confidence: 0.99,
  evidenceSpan: 'fabricated',
  source: 'wrong',
});
if (score(q, gt, '') !== 0) throw new Error('Blank must score 0');
if (score(q, gt, good) <= score(q, gt, bad)) throw new Error('Good answer must beat bad');
console.log(
  JSON.stringify({
    bytes: bytes.length,
    imports: 0,
    good: score(q, gt, good),
    bad: score(q, gt, bad),
  }),
);
