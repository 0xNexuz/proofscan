import { readFile } from 'node:fs/promises';
import { z } from 'zod';
import { VerdictSchema, VerifyRequestSchema } from '@proofscan/contracts';

export const ClaimbenchCaseSchema = z.object({
  id: z.string(),
  version: z.literal('0.1.0'),
  domain: z.enum([
    'technology',
    'crypto',
    'finance',
    'companies',
    'science',
    'developer_documentation',
    'news',
    'public_data',
  ]),
  difficulty: z.enum(['easy', 'medium', 'hard', 'adversarial']),
  split: z.enum(['train', 'validation', 'test']),
  adversarialType: z.string().nullable(),
  request: VerifyRequestSchema,
  expected: z.object({
    verdict: VerdictSchema,
    evidenceSpans: z.array(z.string()),
    source: z.string().nullable(),
  }),
  provenance: z.object({ url: z.string(), title: z.string(), accessedAt: z.string() }),
  reviewerNotes: z.string(),
});
export type ClaimbenchCase = z.infer<typeof ClaimbenchCaseSchema>;
export async function loadClaimbench(
  path = new URL('../data/claimbench-0.1.0.jsonl', import.meta.url),
): Promise<ClaimbenchCase[]> {
  const text = await readFile(path, 'utf8');
  return text
    .trim()
    .split(/\r?\n/)
    .map((line) => ClaimbenchCaseSchema.parse(JSON.parse(line)));
}
