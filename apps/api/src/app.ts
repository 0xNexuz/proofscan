import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import Fastify from 'fastify';
import { ProofScanError } from '@proofscan/contracts';
import { OpenAICompatibleJudge, verify, type ModelJudge } from '@proofscan/core';

export interface AppOptions {
  apiKey?: string;
  modelJudge?: ModelJudge;
  benchmarkPath?: string;
}
export async function buildApp(options: AppOptions = {}) {
  const app = Fastify({
    logger: {
      level: process.env.PROOFSCAN_LOG_LEVEL ?? 'info',
      redact: ['req.headers.x-proofscan-key', 'req.headers.authorization', 'body'],
    },
    requestIdHeader: 'x-request-id',
    genReqId: () => randomUUID(),
  });
  await app.register(cors, { origin: false });
  await app.register(rateLimit, { max: 60, timeWindow: '1 minute' });
  const apiKey = options.apiKey ?? process.env.PROOFSCAN_API_KEY;
  const configuredJudge =
    options.modelJudge ??
    (process.env.MODEL_API_KEY && process.env.MODEL_NAME
      ? new OpenAICompatibleJudge(
          process.env.MODEL_BASE_URL ?? 'https://api.openai.com/v1',
          process.env.MODEL_API_KEY,
          process.env.MODEL_NAME,
        )
      : undefined);
  const auth = async (request: any, reply: any) => {
    if (!apiKey || request.headers['x-proofscan-key'] !== apiKey)
      return reply.code(401).send({
        error: {
          code: 'UNAUTHORIZED',
          message: 'A valid X-ProofScan-Key header is required.',
          requestId: request.id,
          retryable: false,
        },
      });
  };
  app.get('/health', async () => ({ status: 'ok', minerStatus: 'UNREGISTERED', version: '0.1.0' }));
  app.get('/v1/benchmarks/latest', async (_request, reply) => {
    try {
      return JSON.parse(
        await readFile(
          options.benchmarkPath ?? join(process.cwd(), 'benchmarks', 'latest.json'),
          'utf8',
        ),
      );
    } catch {
      return reply
        .code(404)
        .send({ status: 'NOT_RUN', message: 'No measured benchmark has been published.' });
    }
  });
  app.post('/v1/verify', { preHandler: auth }, async (request, reply) => {
    let deadline: ReturnType<typeof setTimeout> | undefined;
    try {
      const verification = verify(
        request.body,
        configuredJudge
          ? { modelJudge: configuredJudge, requestId: () => request.id }
          : { requestId: () => request.id },
      );
      const timeout = new Promise<never>((_, reject) => {
        deadline = setTimeout(
          () =>
            reject(
              new ProofScanError(
                'REQUEST_DEADLINE',
                'Verification exceeded the 20 second deadline.',
                503,
                true,
              ),
            ),
          20_000,
        );
      });
      const result = await Promise.race([verification, timeout]);
      request.log.info(
        {
          verdict: result.verdict,
          confidence: result.confidence,
          evidenceCount: result.meta.evidenceCount,
          totalLatencyMs: result.meta.totalLatencyMs,
        },
        'verification complete',
      );
      return result;
    } catch (error) {
      if (error instanceof ProofScanError)
        return reply.code(error.statusCode).send({
          error: {
            code: error.code,
            message: error.message,
            requestId: request.id,
            retryable: error.retryable,
          },
        });
      if (error && typeof error === 'object' && 'issues' in error)
        return reply.code(400).send({
          error: {
            code: 'INVALID_INPUT',
            message: 'Request validation failed.',
            requestId: request.id,
            retryable: false,
            issues: (error as any).issues,
          },
        });
      request.log.error({ err: error }, 'verification failed');
      return reply.code(500).send({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Verification failed without producing a verdict.',
          requestId: request.id,
          retryable: true,
        },
      });
    } finally {
      if (deadline) clearTimeout(deadline);
    }
  });
  app.post(
    '/v1/benchmarks/run',
    { preHandler: auth, config: { rateLimit: { max: 2, timeWindow: '1 hour' } } },
    async (_request, reply) =>
      reply.code(202).send({
        status: 'ACCEPTED',
        message:
          'Run the reproducible benchmark with `pnpm benchmark`; results publish atomically when complete.',
      }),
  );
  return app;
}
