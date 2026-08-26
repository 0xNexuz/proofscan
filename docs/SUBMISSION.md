# Telegraph Hackathon Submission Runbook

ProofScan is technically ready but remains **UNREGISTERED**. Do not replace that status or invent a Miner ID until the on-chain registration succeeds.

## Deadline and eligibility

As checked on 25 August 2026, Telegraph lists Track 1 (Miners) and Track 2 (Script Authors) as running from 17–31 August 2026. Register before the 31 August cutoff, allow time for validation, and keep the miner and scorer artifacts reachable throughout Track 3 (31 August–7 September). Join the official Discord and post public build updates on X tagging `@Telegraphprotoc`; Telegraph scores Miner submissions as 75% normalized performance and 25% X engagement/transparency.

Registering through the [Telegraph developer console](https://integrate.telegraphprotocol.com/) automatically enters the project in the hackathon. ProofScan can be entered in both available flows:

- **Connect API** for Track 1, using the `FACT_CHECK` Miner configuration.
- **Submit WASM** for Track 2, using the deterministic ProofBench scorer.

## 1. Publish the miner

1. Push this repository to a public source host and deploy the root `Dockerfile` to an HTTPS service.
2. Set a strong deployment secret as `PROOFSCAN_API_KEY`. Configure the optional model endpoint/key/name only if nuanced model judgments should run; deterministic verification works without them.
3. Confirm the public endpoints:

   ```bash
   curl https://YOUR_HOST/health
   curl -X POST https://YOUR_HOST/v1/verify \
     -H "Content-Type: application/json" \
     -H "X-ProofScan-Key: YOUR_KEY" \
     -d '{"claim":"The release was version 2.0.","evidence":"The release was version 2.0."}'
   ```

4. Keep the host, health monitoring, logs, and API key active through 7 September 2026. Do not log raw evidence or credentials.

For the Render free deployment, `.github/workflows/keepalive.yml` probes only the public `/health` endpoint every ten minutes. Set the repository variable `PROOFSCAN_PUBLIC_URL` after deployment. This is an uptime probe, not benchmark or Telegraph traffic, and it must never call `/v1/verify` or be counted as usage.

## 2. Render and validate the Miner YAML

Choose an unused numeric ID in the registration flow and render the public base URL:

```bash
node scripts/render-telegraph-config.mjs 123 https://YOUR_HOST telegraph/miner.yaml
```

Review `telegraph/miner.yaml`; it must contain no secret. With access to a Telegraph node operator's validation endpoint and internal secret, run:

```bash
pnpm telegraph:validate -- telegraph/miner.yaml "$TELEGRAPH_NODE" "$TELEGRAPH_INTERNAL_SECRET"
```

The validator schema-tests the YAML and sandbox-tests the declared `/verify` endpoint. Resolve every failure before paying for registration.

## 3. Submit Track 1: Miner

1. Open [integrate.telegraphprotocol.com](https://integrate.telegraphprotocol.com/) and choose **Connect API**.
2. Connect the owner-controlled wallet requested by the console. The current official guide specifies a small amount of Base Sepolia ETH for gas, with no bond, stake, or registration fee. Use a dedicated wallet and verify the network, transaction target, and amount in the wallet before signing.
3. Upload or paste the validated `telegraph/miner.yaml`, provide the requested public metadata, and complete the on-chain registration.
4. After the registration is live, install the ProofScan API key against the slug `proofscan-claim-verification` using the same wallet. Current Telegraph nodes do not read `auth.env_var`; the console/node key-install flow securely binds the key to the wallet and slug.
5. Record the real Miner ID, registration transaction, registration ID, and public YAML/artifact URL. Wait for the integration to appear and invoke it through Telegraph's official miner-dispatcher flow.
6. Update `docs/FINAL_REPORT.md` and `docs/TELEGRAPH.md` from `UNREGISTERED` only after those facts are confirmed.

## 4. Submit Track 2: scorer

1. Rebuild and verify the exact bytes:

   ```bash
   pnpm wasm:build
   pnpm wasm:test
   ```

2. Host `packages/proofbench-wasm/target/wasm32-unknown-unknown/release/proofbench_wasm.wasm` at an immutable public HTTPS or IPFS URL. It must remain below 32 MB and retain the required import-free ABI.
3. In the developer console choose **Submit WASM**, select canonical intent `FACT_CHECK`, provide the artifact URL, and submit. The console computes the required hash and handles the registration transaction; do not substitute the package's release SHA-256 for Telegraph's on-chain WASM hash.
4. Record the returned registration ID and monitor its status (`pending`, `active`, `rejected`, `superseded`, or `deregistered`). A submission is not active merely because the transaction was sent.

## 5. Final acceptance check

- Miner registration is visible, its YAML resolves, and its API key is installed.
- A real Telegraph-dispatched `FACT_CHECK` request returns a valid ProofScan response.
- The WASM artifact URL returns the exact registered bytes and the scorer reaches `active` status.
- Public repository, API documentation, benchmark report, demo URL, and X/Discord participation are available to judges.
- The API and WASM stay live throughout Track 3; usage is organic, with no artificial metric inflation.
- Actual IDs, URLs, transaction hashes, and status replace placeholders in the final report.

Official references: [hackathon rules](https://hackathon.telegraphprotocol.com/rules), [developer console](https://integrate.telegraphprotocol.com/), [Miner YAML standard](https://github.com/telegraphprotocol/telegraph-docs/blob/main/miners/yaml-config.md), and [WASM scorer guide](https://github.com/telegraphprotocol/telegraph-docs/blob/main/scoring/build-a-scoring-module.md).
