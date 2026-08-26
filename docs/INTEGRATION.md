# Integration

## TypeScript

```ts
import { createProofScan } from '@proofscan/sdk';
const proofscan = createProofScan({
  baseUrl: 'https://proofscan.example',
  apiKey: process.env.PROOFSCAN_API_KEY!,
});
const result = await proofscan.verify({ claim, evidence, source });
if (result.verdict === 'SUPPORTED' && result.confidence >= 0.9) await takeAction();
```

## Python

```python
import os, requests
result = requests.post(
    "https://proofscan.example/v1/verify",
    headers={"X-ProofScan-Key": os.environ["PROOFSCAN_API_KEY"]},
    json={"claim": claim, "evidence": evidence, "source": source},
    timeout=20,
).json()
```

Do not collapse abstentions into `false`. Handle all five verdicts explicitly. Treat HTTP 5xx as infrastructure failure and never as a factual result. For URL provenance, supply an evidence item with both `text` and `url`; ProofScan fails closed if the quote is absent or the URL cannot be acquired.

See [EXAMPLES.md](EXAMPLES.md) for agent-specific policy patterns.
