# CLAIMBENCH-160

CLAIMBENCH v0.1.0 contains 160 frozen JSONL cases: 20 each for technology, crypto, finance, companies, science, developer documentation, news, and public data.

The portable JSON Schema is versioned alongside the corpus at `packages/claimbench/schema/claimbench-0.1.0.schema.json`; the evaluator additionally parses every record with the equivalent Zod contract.

- Verdicts: 32 each for all five ProofScan verdicts.
- Difficulty: 32 easy, 48 medium, 48 hard, 32 adversarial.
- Splits: 96 train, 32 validation, 32 test.
- Provenance: every record contains a source URL, title, access date, and reviewer note.
- Acquisition failures use reserved `.invalid` hosts and cannot accidentally become live.

The adversarial annotations rotate through numeric, entity, and date substitution; citation laundering; unsupported inference; partial support; outdated evidence; ambiguous entities; cherry-picking; conflicting sources; fabricated citations; and correct-fact/wrong-citation cases.

Run `pnpm claimbench:validate` to verify schema, uniqueness, distributions, and the current SHA-256 hash. The generator is deterministic and exists to keep the mechanically expanded cases auditable; do not edit the JSONL without updating the version and reviewer notes.

CLAIMBENCH-500 is planned only after additional sourcing and independent review. The project does not add filler to reach that number.
