import {
  VerifyResponseSchema,
  type VerifyRequest,
  type VerifyResponse,
} from '@proofscan/contracts';
export interface ProofScanClientOptions {
  baseUrl: string;
  apiKey: string;
  fetchImpl?: typeof fetch;
}
export class ProofScanClient {
  constructor(private options: ProofScanClientOptions) {}
  async verify(request: VerifyRequest): Promise<VerifyResponse> {
    const response = await (this.options.fetchImpl ?? fetch)(
      `${this.options.baseUrl.replace(/\/$/, '')}/v1/verify`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-proofscan-key': this.options.apiKey },
        body: JSON.stringify(request),
      },
    );
    const body = await response.json();
    if (!response.ok)
      throw new Error((body as any).error?.message ?? `ProofScan returned ${response.status}`);
    return VerifyResponseSchema.parse(body);
  }
}
export const createProofScan = (options: ProofScanClientOptions) => new ProofScanClient(options);
export type { VerifyRequest, VerifyResponse, Verdict } from '@proofscan/contracts';
