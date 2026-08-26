# Five-minute Quickstart

```bash
pnpm install
cp .env.example .env
# Set PROOFSCAN_API_KEY in .env
pnpm dev
```

Verify a claim:

```bash
curl -s http://localhost:3000/v1/verify \
  -X POST -H "Content-Type: application/json" \
  -H "X-ProofScan-Key: change-me" \
  -d '{"claim":"Mars is the fourth planet from the Sun.","evidence":"Mars is the fourth planet from the Sun."}'
```

If `MODEL_API_KEY` and `MODEL_NAME` are unset, the verifier remains usable in conservative deterministic mode. Configure any OpenAI-compatible `/chat/completions` endpoint for nuanced semantic cases.
