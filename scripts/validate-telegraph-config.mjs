import { readFile } from 'node:fs/promises';

const [yamlPath = 'telegraph/miner.yaml', nodeUrl, internalSecret] = process.argv.slice(2);

if (!nodeUrl || !internalSecret) {
  throw new Error(
    'Usage: node scripts/validate-telegraph-config.mjs [yaml-path] <telegraph-node-url> <internal-secret>',
  );
}

const endpoint = new URL('/miner-dispatcher/validate', nodeUrl);
const yaml = await readFile(yamlPath, 'utf8');
const response = await fetch(endpoint, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Internal-Secret': internalSecret,
  },
  body: JSON.stringify({ yaml }),
  signal: AbortSignal.timeout(30_000),
});

const body = await response.text();
if (!response.ok) {
  throw new Error(`Telegraph validation failed (${response.status}): ${body}`);
}

console.log(body);
