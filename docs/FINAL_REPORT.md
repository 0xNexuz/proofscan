# ProofScan v0.1.0 Final Report

## What was built

ProofScan is a staged, fail-closed claim verifier with a typed SDK, authenticated REST API, compact developer console, safe URL acquisition, deterministic fact checks, optional OpenAI-compatible semantic judgment, exact evidence-span enforcement, observability, and structured failures. ProofBench includes CLAIMBENCH-160, three runnable baselines, seeded perturbations, complete evaluation metrics, and a deterministic Telegraph WASM scorer.

## ProofScan architecture

Requests pass through schema validation, normalization, evidence acquisition, source classification, candidate extraction, deterministic numeric/date/entity/polarity checks, optional semantic judgment, temporal and cross-source checks, exact quote validation, and calibrated aggregation. Deterministic contradictions override model similarity; source authority only affects confidence.

## Telegraph integration

- Intent: `FACT_CHECK`
- Miner format: official YAML v1, `protocol: generic`
- Endpoint: deployment-time HTTPS URL forwarding `/verify` to `POST /v1/verify`
- Authentication: `X-ProofScan-Key`
- Initial price floor: 0.01 USDC
- Miner ID: not assigned
- Miner status: **UNREGISTERED**
- ProofBench registration status: **UNREGISTERED**

The rendered Miner YAML cannot be validated or registered until the owner supplies an assigned numeric Miner ID, public HTTPS deployment, Telegraph node access, and wallet credentials.

## CLAIMBENCH statistics

- Version: 0.1.0
- Cases: 160, with 20 in each of eight domains
- Verdicts: 32 per class
- Difficulty: 32 easy, 48 medium, 48 hard, 32 adversarial
- Splits: 96 train, 32 validation, 32 test
- SHA-256: `b135f5aff608f913b37bf11073c6fe20405e5494543d270e6f0d6d9715c9d311`

## ProofBench methodology and adversarial evaluation

The local harness measures macro/per-class classification, calibration, evidence, citations, abstention, false trust, robustness, failures, and latency. Seed `20260822` produces reproducible numeric or paraphrase perturbations. The Telegraph scorer independently enforces verdict, calibration, evidence/provenance, and citation scoring with severe false-support and fabricated-evidence caps.

The WASM artifact is 2,156 bytes, exports the required ABI, has zero imports, gives the host smoke-test correct answer `0.999625`, bad answer `0.002985`, and blank answer `0`.

## Actual benchmark results

Measured locally on August 24, 2026 using all 160 frozen cases, without external model credentials:

| System                  | Macro F1 | False Trust Rate | Abstention | Evidence | P95 latency | Composite |
| ----------------------- | -------: | ---------------: | ---------: | -------: | ----------: | --------: |
| Keyword overlap         |   80.00% |            3.13% |     81.25% |   83.75% |     0.36 ms |    85.20% |
| TF-IDF/cosine           |   82.15% |            7.03% |     81.25% |   89.38% |     0.16 ms |    86.35% |
| ProofScan deterministic |   80.00% |        **3.13%** |     81.25% |   83.75% |     1.13 ms |    85.06% |

Latency is in-process benchmark latency, not deployed network latency. The single-model judge baseline is `NOT_RUN_MISSING_CREDENTIALS`; no metric was fabricated.

## Tests and production verification

- ESLint: passed
- Prettier check: passed
- TypeScript typechecks: passed across seven workspaces
- Unit/integration tests: 13 passed
- CLAIMBENCH schema/distribution/hash validation: passed
- API and console production builds: passed
- Compiled API smoke test: passed (`health=ok`, `minerStatus=UNREGISTERED`, decisive evidence returned)
- WASM release build/import/ABI/behavior checks: passed
- Docker build: not run because Docker is unavailable locally; CI contains the build job
- Live Telegraph validation: pending owner deployment and credentials

## Developer integration

The repository contains REST, TypeScript SDK, Python, and Telegraph examples, plus research, news, trading, due-diligence, and hackathon-research policy examples. Quickstart and integration guides keep the five verdicts explicit and distinguish domain verdicts from HTTP infrastructure errors.

## Known weaknesses

- ProofScan does not yet beat the TF-IDF baseline on macro F1 or composite score, although its False Trust Rate is less than half of TF-IDF's.
- Contradiction recall is 53.13%; entity/date substitutions with complex syntax remain the largest deterministic weakness.
- Full probability calibration needs a larger independently reviewed dataset.
- Semantic/model and deployed network latency baselines were not run without credentials and hosting.
- Source extraction is intentionally lightweight and will need document-specific parsers for complex PDFs, script-rendered pages, and tables.
- CLAIMBENCH uses traceable, frozen cases but still needs independent human review beyond the current reviewer notes.

## Track 3 readiness

Only the Sentinel concept is documented. No Track 3 agent, UI, or runtime was implemented.

## Highest-priority improvements

1. Add independent review and expand hard contradiction cases, then improve entity/date relation extraction against those failures.
2. Run and calibrate the configured semantic judge and single-model baseline on the frozen test split without leaking labels.
3. Deploy the API, measure end-to-end p50/p95 latency, validate the Miner YAML, and register both artifacts.
4. Add PDF and structured-document evidence extractors while preserving exact provenance offsets.
5. Expand CLAIMBENCH toward 500 only with new sourced and reviewed cases.
