# ProofBench Telegraph WASM

Deterministic `no_std` scorer for Telegraph's six-parameter ABI. It has no network, filesystem, environment, WASI, or imported functions. Inputs are UTF-8 JSON strings for the question, expected result, and Miner answer.

Build with `pnpm wasm:build`. The accepted artifact is `packages/proofbench-wasm/target/wasm32-unknown-unknown/release/proofbench_wasm.wasm`; never upload a WASI build.
