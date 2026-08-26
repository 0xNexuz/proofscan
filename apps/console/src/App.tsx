import { useEffect, useState } from 'react';
import type { VerifyResponse } from '@proofscan/contracts';
const api = import.meta.env.VITE_API_URL ?? '/api';
type Benchmark = {
  status?: string;
  runAt?: string;
  claimbenchVersion?: string;
  caseCount?: number;
  baselines?: Record<string, Record<string, number>>;
};
const pct = (n: number | undefined) => (n === undefined ? '—' : `${(n * 100).toFixed(1)}%`);
const ms = (n: number | undefined) => (n === undefined ? '—' : `${Math.round(n)} ms`);
export default function App() {
  const [view, setView] = useState<'verify' | 'benchmark'>('verify');
  const [key, setKey] = useState('');
  const [claim, setClaim] = useState('Company X raised $14 million.');
  const [evidence, setEvidence] = useState('Company X raised $14 million in its Series A.');
  const [source, setSource] = useState('');
  const [result, setResult] = useState<VerifyResponse | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [bench, setBench] = useState<Benchmark>({ status: 'NOT_RUN' });
  const [online, setOnline] = useState(false);
  useEffect(() => {
    fetch(`${api}/health`)
      .then((r) => r.ok && setOnline(true))
      .catch(() => {});
    fetch(`${api}/v1/benchmarks/latest`)
      .then((r) => r.json())
      .then(setBench)
      .catch(() => {});
  }, []);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    setResult(null);
    try {
      const response = await fetch(`${api}/v1/verify`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-proofscan-key': key },
        body: JSON.stringify({
          claim,
          evidence: [{ text: evidence }],
          ...(source ? { source } : {}),
        }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error?.message ?? 'Verification failed');
      setResult(body);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Verification failed');
    } finally {
      setBusy(false);
    }
  }
  const measured = bench.baselines?.proofscan;
  return (
    <>
      <header>
        <a className="brand" href="#">
          <span className="mark">P</span>
          <span>PROOFSCAN</span>
          <small>Evidence before action</small>
        </a>
        <nav>
          <button className={view === 'verify' ? 'active' : ''} onClick={() => setView('verify')}>
            Verify
          </button>
          <button
            className={view === 'benchmark' ? 'active' : ''}
            onClick={() => setView('benchmark')}
          >
            Benchmark
          </button>
        </nav>
        <div className={`status ${online ? 'online' : ''}`}>
          <i />
          {online ? 'API online' : 'API offline'}
        </div>
      </header>
      <main>
        {view === 'verify' ? (
          <div className="verify-grid">
            <section className="panel input-panel">
              <div className="eyebrow">CLAIM VERIFICATION</div>
              <h1>
                Does the evidence
                <br />
                justify the claim?
              </h1>
              <p className="lede">
                A fail-closed verification pipeline for agents that need more than a confident
                guess.
              </p>
              <form onSubmit={submit}>
                <label>
                  API KEY
                  <input
                    type="password"
                    value={key}
                    onChange={(e) => setKey(e.target.value)}
                    placeholder="X-ProofScan-Key"
                    required
                  />
                </label>
                <label>
                  CLAIM
                  <textarea
                    value={claim}
                    onChange={(e) => setClaim(e.target.value)}
                    rows={3}
                    required
                    maxLength={4000}
                  />
                </label>
                <label>
                  EVIDENCE
                  <textarea
                    value={evidence}
                    onChange={(e) => setEvidence(e.target.value)}
                    rows={7}
                    required
                    maxLength={100000}
                  />
                </label>
                <label>
                  SOURCE <span>OPTIONAL LABEL OR URL</span>
                  <input
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                    placeholder="https://official.example/report"
                  />
                </label>
                <button className="verify" disabled={busy}>
                  {busy ? 'VERIFYING…' : 'VERIFY CLAIM'}
                  <span>→</span>
                </button>
              </form>
            </section>
            <section className="panel result-panel">
              {result ? (
                <Result result={result} />
              ) : (
                <div className="empty">
                  <div className="radar">
                    <span />
                    <span />
                    <span />
                  </div>
                  <h2>Awaiting evidence</h2>
                  <p>
                    Submit a claim to see the verdict, exact supporting span, deterministic checks,
                    and calibrated signals.
                  </p>
                </div>
              )}
              {error && <div className="error">{error}</div>}
            </section>
          </div>
        ) : (
          <Benchmark data={bench} measured={measured} />
        )}
      </main>
      <footer>
        <span>ProofScan v0.1.0</span>
        <span>
          Miner status: <b>UNREGISTERED</b>
        </span>
        <span>CLAIMBENCH-160</span>
      </footer>
    </>
  );
}
function Result({ result }: { result: VerifyResponse }) {
  return (
    <div className="result">
      <div className="eyebrow">VERIFICATION RESULT</div>
      <div className={`verdict ${result.verdict.toLowerCase()}`}>
        {result.verdict.replaceAll('_', ' ')}
      </div>
      <div className="confidence">
        <strong>{Math.round(result.confidence * 100)}%</strong>
        <span>calibrated confidence</span>
      </div>
      <p className="reason">{result.reason}</p>
      <div className="quote">
        <span>EVIDENCE</span>
        {result.evidenceSpan ? `“${result.evidenceSpan}”` : 'No decisive evidence span claimed.'}
      </div>
      <div className="signals">
        <Signal name="Entailment" value={result.signals.entailment} />
        <Signal name="Contradiction" value={result.signals.contradiction} />
        <Signal name="Authority" value={result.signals.sourceAuthority} />
        <Signal name="Freshness" value={result.signals.freshness} />
      </div>
      <details>
        <summary>{result.checks.length} pipeline checks</summary>
        {result.checks.map((c, i) => (
          <div className="check" key={i}>
            <b className={c.status}>{c.status}</b>
            <span>
              {c.stage} · {c.code}
            </span>
            <small>{c.durationMs.toFixed(1)} ms</small>
          </div>
        ))}
      </details>
      <div className="meta">
        Request {result.requestId} · {result.meta.totalLatencyMs.toFixed(0)} ms
      </div>
    </div>
  );
}
function Signal({ name, value }: { name: string; value: number | null }) {
  return (
    <div>
      <div>
        <span>{name}</span>
        <b>{value === null ? 'N/A' : Math.round(value * 100)}</b>
      </div>
      <i>
        <em style={{ width: `${(value ?? 0) * 100}%` }} />
      </i>
    </div>
  );
}
function Benchmark({ data, measured }: { data: Benchmark; measured?: Record<string, number> }) {
  return (
    <section className="benchmark">
      <div className="eyebrow">MEASURED, NOT MARKETED</div>
      <h1>ProofBench results</h1>
      <p>
        Every number on this page comes from a reproducible CLAIMBENCH run. Missing runs stay
        missing.
      </p>
      {!measured ? (
        <div className="not-run">
          <b>NOT RUN</b>
          <span>
            No measured benchmark has been published. Run <code>pnpm benchmark</code>.
          </span>
        </div>
      ) : (
        <>
          <div className="metric-grid">
            <Metric label="Macro F1" value={pct(measured.macroF1)} />
            <Metric label="False Trust Rate" value={pct(measured.falseTrustRate)} danger />
            <Metric label="Abstention accuracy" value={pct(measured.abstentionAccuracy)} />
            <Metric label="P95 latency" value={ms(measured.p95LatencyMs)} />
          </div>
          <div className="bench-meta">
            CLAIMBENCH {data.claimbenchVersion} · {data.caseCount} cases ·{' '}
            {data.runAt ? new Date(data.runAt).toLocaleString() : '—'}
          </div>
        </>
      )}
    </section>
  );
}
function Metric({
  label,
  value,
  danger = false,
}: {
  label: string;
  value: string;
  danger?: boolean;
}) {
  return (
    <article className={danger ? 'danger' : ''}>
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}
