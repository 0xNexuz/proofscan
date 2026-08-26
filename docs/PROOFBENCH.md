# ProofBench

ProofBench has two deliberately separate forms.

The local harness observes complete responses and wall-clock latency. It reports macro F1, per-class precision/recall, ECE, Brier score, evidence accuracy, citation correctness, contradiction recall, abstention accuracy, perturbation robustness, failure rate, p50/p95 latency, and **False Trust Rate**.

The ranking composite is 40% macro F1, 20% inverse False Trust Rate, 10% calibration, 10% evidence, 5% citations, 5% abstention, 5% robustness, and 5% latency-SLO compliance. Run identity includes dataset version/hash, timestamp, and perturbation seed.

The Telegraph scorer is a deterministic Rust `no_std` WASM. Telegraph supplies only question, ground truth, and Miner answer text, so the scorer cannot call models, use files, or independently observe latency. Its score is 55% verdict, 15% calibration, 20% evidence/provenance, and 10% citation correctness. False support is capped at 0.05, fabricated evidence at 0.25, false contradiction at 0.20, and blank/invalid output at zero.

Seeded perturbations modify claims rather than replaying known examples. Telegraph's own hidden champion benchmark remains the authority for network promotion.
