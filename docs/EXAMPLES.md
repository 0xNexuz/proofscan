# Integration Examples

- Research agent: require `SUPPORTED`, confidence ≥ 0.85, and a non-null evidence span before adding a claim to a report.
- News agent: set `asOf` and `maxEvidenceAgeDays`; route `STALE` to a fresh-source search.
- Trading agent: require two evidence items, confidence ≥ 0.95, and never trade on `INSUFFICIENT_EVIDENCE` or infrastructure errors.
- Due-diligence agent: retain request ID, cited source, checks, and exact span in the audit record.
- Hackathon research agent: use ProofScan after retrieval and before synthesis so unsupported retrieval output cannot become a downstream premise.

Runnable TypeScript and Python examples live in the repository `examples` directory.
