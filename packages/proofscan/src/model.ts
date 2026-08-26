import { ProofScanError, VerdictSchema } from '@proofscan/contracts';
import type { ModelJudge, SemanticResult } from './types.js';

export class OpenAICompatibleJudge implements ModelJudge {
  readonly name: string;
  private failures = 0;
  private openUntil = 0;
  constructor(
    private baseUrl: string,
    private apiKey: string,
    private model: string,
    private timeoutMs = 12_000,
  ) {
    this.name = model;
  }
  async judge(claim: string, evidence: string[]): Promise<SemanticResult> {
    if (Date.now() < this.openUntil)
      throw new ProofScanError(
        'MODEL_CIRCUIT_OPEN',
        'Semantic provider circuit is temporarily open',
        503,
        true,
      );
    let lastError: unknown;
    for (let attempt = 0; attempt < 3; attempt++) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), this.timeoutMs);
      try {
        const response = await fetch(`${this.baseUrl.replace(/\/$/, '')}/chat/completions`, {
          method: 'POST',
          signal: controller.signal,
          headers: { authorization: `Bearer ${this.apiKey}`, 'content-type': 'application/json' },
          body: JSON.stringify({
            model: this.model,
            temperature: 0,
            response_format: { type: 'json_object' },
            messages: [
              {
                role: 'system',
                content:
                  'Judge only whether the supplied evidence entails or contradicts the claim. Return JSON: verdict, entailment, contradiction, evidenceSpan, reason. evidenceSpan must be an exact quote. Abstain when uncertain.',
              },
              { role: 'user', content: JSON.stringify({ claim, evidence }) },
            ],
          }),
        });
        if (!response.ok) {
          const retryable = response.status === 429 || response.status >= 500;
          lastError = new ProofScanError(
            'MODEL_UPSTREAM',
            `Model returned ${response.status}`,
            503,
            retryable,
          );
          if (retryable && attempt < 2) continue;
          throw lastError;
        }
        const body = (await response.json()) as any;
        const parsed = JSON.parse(body.choices?.[0]?.message?.content ?? '{}');
        const verdict = VerdictSchema.parse(parsed.verdict);
        if (!['SUPPORTED', 'CONTRADICTED', 'INSUFFICIENT_EVIDENCE'].includes(verdict))
          throw new Error('Unsupported semantic verdict');
        this.failures = 0;
        return {
          verdict: verdict as SemanticResult['verdict'],
          entailment: Number(parsed.entailment ?? 0),
          contradiction: Number(parsed.contradiction ?? 0),
          evidenceSpan: typeof parsed.evidenceSpan === 'string' ? parsed.evidenceSpan : null,
          reason: String(parsed.reason ?? 'Model judgment'),
        };
      } catch (error) {
        lastError = error;
        if (error instanceof ProofScanError && !error.retryable) throw error;
        if (attempt === 2) break;
      } finally {
        clearTimeout(timer);
      }
    }
    this.failures++;
    if (this.failures >= 5) {
      this.openUntil = Date.now() + 30_000;
      this.failures = 0;
    }
    if (lastError instanceof ProofScanError) throw lastError;
    throw new ProofScanError(
      'MODEL_UNAVAILABLE',
      lastError instanceof Error ? lastError.message : 'Model unavailable',
      503,
      true,
    );
  }
}
