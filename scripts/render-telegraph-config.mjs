import { readFile, writeFile } from 'node:fs/promises';
const [id, baseUrl, out = 'telegraph/miner.yaml'] = process.argv.slice(2);
if (!/^\d+$/.test(id ?? ''))
  throw new Error(
    'Usage: node scripts/render-telegraph-config.mjs <numeric-miner-id> <https-base-url> [output]',
  );
const url = new URL(baseUrl);
if (url.protocol !== 'https:') throw new Error('Base URL must use HTTPS');
const template = await readFile(
  new URL('../telegraph/miner.template.yaml', import.meta.url),
  'utf8',
);
await writeFile(
  out,
  template.replace('__MINER_ID__', id).replace('__BASE_URL__', url.toString().replace(/\/$/, '')),
);
console.log(`wrote ${out}`);
