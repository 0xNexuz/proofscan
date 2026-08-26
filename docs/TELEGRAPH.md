# Telegraph Integration

Status: **UNREGISTERED**. Miner ID, registration ID, endpoint, and public artifact URLs are intentionally unset until owner-controlled hosting and wallet credentials exist.

ProofScan declares the canonical `FACT_CHECK` intent using the official Miner YAML v1 format and `protocol: generic`. The upstream endpoint is `POST /v1/verify`, authenticated by `X-ProofScan-Key`. Initial minimum price is 0.01 USDC.

Render a deployable configuration after choosing an unused numeric ID and deploying the API at a public HTTPS URL:

```bash
node scripts/render-telegraph-config.mjs 123 https://proofscan.example telegraph/miner.yaml
```

Validate against a node operator's endpoint. The validation API expects JSON containing the YAML text, so use the provided wrapper to avoid shell-quoting errors:

```bash
pnpm telegraph:validate -- telegraph/miner.yaml "$TELEGRAPH_NODE" "$TELEGRAPH_INTERNAL_SECRET"
```

The `auth.env_var` entry is accepted for backward compatibility but is not read by current nodes. Never put the ProofScan key in the public YAML. Register the miner first, then install the key for `proofscan-claim-verification` through the Telegraph registration flow using the same wallet; the node injects it as `X-ProofScan-Key`.

Build and test ProofBench with `pnpm wasm:build && pnpm wasm:test`. Host the exact `.wasm` bytes at an HTTPS or IPFS URL, compute their keccak256 hash, and register through the Telegraph console or `registerWasm(wasmHash, wasmUrl, "FACT_CHECK")`. Record returned IDs and status only after the network confirms them.

Official sources: [Miner YAML](https://github.com/telegraphprotocol/telegraph-docs/blob/main/miners/yaml-config.md), [scoring ABI](https://github.com/telegraphprotocol/telegraph-docs/blob/main/scoring/build-a-scoring-module.md), [intent catalog](https://hackathon.telegraphprotocol.com/supported-intents), and [rules](https://hackathon.telegraphprotocol.com/rules).

The end-to-end owner handoff is in [SUBMISSION.md](./SUBMISSION.md).
