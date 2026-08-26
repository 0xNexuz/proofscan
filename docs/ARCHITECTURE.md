# ProofScan Architecture

## Implemented pipeline

1. Zod contract validation and Unicode/whitespace normalization.
2. Evidence acquisition with HTTPS-only SSRF protection, DNS checks, redirect revalidation, response limits, retries, and deadlines.
3. Sentence extraction ranked by claim-token overlap.
4. Deterministic numeric, scale, percentage, currency, ISO-date, polarity, and common entity-swap checks.
5. Source classification and authority scoring.
6. Optional OpenAI-compatible structured semantic judgment for cases left unresolved by deterministic logic.
7. Explicit freshness policy and cross-source consistency signal.
8. Hard-gated verdict aggregation, exact quote validation, and versioned confidence calibration metadata.

Deterministic contradictions take precedence. Authority can adjust confidence but cannot reverse evidence. A decisive verdict cannot contain a fabricated or non-verbatim span.

## Packages

- `packages/contracts`: public request, response, error, and verdict contracts.
- `packages/proofscan`: verification stages and provider abstraction.
- `packages/sdk`: minimal TypeScript client.
- `packages/claimbench`: dataset schema, generator, frozen JSONL, and validator.
- `packages/proofbench`: baselines, perturbations, metrics, ranking, and CLI.
- `packages/proofbench-wasm`: sandboxed Telegraph scorer.
- `apps/api` and `apps/console`: production HTTP surface and developer UI.

## Failure boundaries

Malformed input is HTTP 400, authentication failure is 401, model infrastructure failure is 503, and unexpected infrastructure failure is 500. Source fetch failure is the explicit `SOURCE_UNAVAILABLE` domain verdict. Raw claims, evidence, prompts, secrets, and model responses are excluded from logs.

## Experimental limitations

The built-in deterministic entailment method is deliberately conservative. It handles explicit lexical facts well but depends on a configured semantic judge for nuanced paraphrases. The v0.1 support threshold is frozen in `calibration.json` from the validation split with False Trust Rate as its primary objective; broader probability calibration remains experimental until more independently reviewed data is available.
