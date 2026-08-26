import type { Check, SourceClass, Verdict } from '@proofscan/contracts';

export interface AcquiredEvidence {
  text: string;
  source: string | null;
  publishedAt: string | null;
  sourceClass: SourceClass;
  authority: number;
}
export interface SemanticResult {
  verdict: Extract<Verdict, 'SUPPORTED' | 'CONTRADICTED' | 'INSUFFICIENT_EVIDENCE'>;
  entailment: number;
  contradiction: number;
  evidenceSpan: string | null;
  reason: string;
}
export interface ModelJudge {
  name: string;
  judge(claim: string, evidence: string[]): Promise<SemanticResult>;
}
export interface PipelineState {
  checks: Check[];
  evidence: AcquiredEvidence[];
}
