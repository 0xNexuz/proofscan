# ProofScan

ProofScan answers one narrow question: **does the supplied evidence actually justify the claim an autonomous agent is about to trust?** ProofBench asks whether the verifier itself deserves trust.

The repository targets Telegraph Hackathon Track 1 (Miner) and Track 2 (Script Author). Track 3 is intentionally not implemented.

## Current status

| Component                               | Status                                               |
| --------------------------------------- | ---------------------------------------------------- |
| Staged verification engine and REST API | Implemented                                          |
| Developer console                       | Implemented                                          |
| CLAIMBENCH-160                          | Implemented, frozen v0.1.0                           |
| Local ProofBench harness                | Implemented                                          |
| Telegraph no-import WASM scorer         | Implemented                                          |
| Telegraph Miner deployment              | Registration-ready                                   |
| Miner ID / registration ID              | **UNREGISTERED / none**                              |
| Public benchmark values                 | Generated only by `pnpm benchmark`; never hard-coded |
| Sentinel / Track 3                      | Planned documentation only                           |

## Run locally

```bash
pnpm install
cp .env.example .env
pnpm dev
```

Set `PROOFSCAN_API_KEY`, then open `http://localhost:5173`. The API listens at `http://localhost:3000`.

```bash
curl -X POST http://localhost:3000/v1/verify \
  -H "Content-Type: application/json" \
  -H "X-ProofScan-Key: change-me" \
  -d '{"claim":"Company X raised $14 million.","evidence":"Company X raised $14 million in its Series A."}'
```

See [Quickstart](docs/QUICKSTART.md), [architecture](docs/ARCHITECTURE.md), [integration guide](docs/INTEGRATION.md), [Telegraph registration](docs/TELEGRAPH.md), and the [hackathon submission runbook](docs/SUBMISSION.md).

## Verification

```bash
pnpm verify
pnpm benchmark
pnpm wasm:build
pnpm wasm:test
```

Infrastructure errors from the semantic provider return structured HTTP errors and never masquerade as factual verdicts. Source acquisition failures produce `SOURCE_UNAVAILABLE`; unsupported claims are allowed to remain `INSUFFICIENT_EVIDENCE`.
