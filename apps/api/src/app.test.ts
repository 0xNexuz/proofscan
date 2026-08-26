import { describe, expect, it } from 'vitest';
import { buildApp } from './app.js';

describe('api', () => {
  it('keeps health public and verification protected', async () => {
    const app = await buildApp({ apiKey: 'secret' });
    expect((await app.inject({ method: 'GET', url: '/health' })).statusCode).toBe(200);
    expect(
      (
        await app.inject({
          method: 'POST',
          url: '/v1/verify',
          payload: { claim: 'A', evidence: 'A' },
        })
      ).statusCode,
    ).toBe(401);
    expect(
      (
        await app.inject({
          method: 'POST',
          url: '/v1/verify',
          headers: { 'x-proofscan-key': 'secret' },
          payload: { claim: 'A', evidence: 'A' },
        })
      ).statusCode,
    ).toBe(200);
    await app.close();
  });
  it('returns structured validation errors', async () => {
    const app = await buildApp({ apiKey: 'secret' });
    const response = await app.inject({
      method: 'POST',
      url: '/v1/verify',
      headers: { 'x-proofscan-key': 'secret' },
      payload: { claim: '' },
    });
    expect(response.statusCode).toBe(400);
    expect(response.json().error.code).toBe('INVALID_INPUT');
    await app.close();
  });
});
