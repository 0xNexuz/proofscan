# Evaluation

Run `pnpm benchmark`. ProofBench first regenerates and validates the frozen dataset, then measures keyword overlap, TF-IDF-style cosine overlap, and ProofScan. A single-model baseline is marked `NOT_RUN_MISSING_CREDENTIALS` when credentials are absent; no number is invented.

Results are written atomically to `benchmarks/latest.json` and become visible through `GET /v1/benchmarks/latest`. The console shows “Not run” when the file is absent.

False Trust Rate is:

```text
non-SUPPORTED ground truth predicted SUPPORTED
------------------------------------------------
all non-SUPPORTED ground-truth cases
```

After the first owner-accepted run, CI should compare against a committed acceptance snapshot and reject a macro-F1 drop above two points or a False Trust Rate increase above one point. A snapshot is not included before an accepted measurement exists.
