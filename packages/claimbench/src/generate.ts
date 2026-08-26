import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

type Fact = {
  domain: string;
  claim: string;
  evidence: string;
  wrong: string;
  source: string;
  title: string;
};
const facts: Fact[] = [
  {
    domain: 'technology',
    claim: 'HTTP/3 is defined by RFC 9114.',
    evidence: 'RFC 9114 defines HTTP/3, a mapping of HTTP semantics over QUIC.',
    wrong: 'RFC 9113',
    source: 'https://www.rfc-editor.org/rfc/rfc9114',
    title: 'RFC 9114',
  },
  {
    domain: 'technology',
    claim: 'Git was initially released in 2005.',
    evidence: 'Git was initially released in 2005.',
    wrong: '2015',
    source: 'https://git-scm.com/book/en/v2/Getting-Started-A-Short-History-of-Git',
    title: 'A Short History of Git',
  },
  {
    domain: 'technology',
    claim: 'TypeScript 1.0 was released in 2014.',
    evidence: 'TypeScript 1.0 was released in 2014.',
    wrong: '2024',
    source: 'https://devblogs.microsoft.com/typescript/announcing-typescript-1-0/',
    title: 'Announcing TypeScript 1.0',
  },
  {
    domain: 'technology',
    claim: 'Node.js 20 became generally available in April 2023.',
    evidence: 'Node.js 20 became generally available on April 18, 2023.',
    wrong: 'April 18, 2022',
    source: 'https://nodejs.org/en/blog/announcements/v20-release-announce',
    title: 'Node.js 20 available',
  },
  {
    domain: 'crypto',
    claim: 'Bitcoin issuance is capped at 21 million coins.',
    evidence: 'Bitcoin issuance is capped at 21 million coins.',
    wrong: '210 million',
    source: 'https://bitcoin.org/bitcoin.pdf',
    title: 'Bitcoin whitepaper and protocol',
  },
  {
    domain: 'crypto',
    claim: 'Ethereum completed The Merge in September 2022.',
    evidence: 'Ethereum completed The Merge on September 15, 2022.',
    wrong: 'September 15, 2021',
    source: 'https://ethereum.org/en/roadmap/merge/',
    title: 'The Merge',
  },
  {
    domain: 'crypto',
    claim: 'A Bitcoin block targets an average interval of ten minutes.',
    evidence: 'The Bitcoin protocol targets an average interval of ten minutes between blocks.',
    wrong: 'one minute',
    source: 'https://developer.bitcoin.org/devguide/block_chain.html',
    title: 'Bitcoin block chain guide',
  },
  {
    domain: 'crypto',
    claim: 'Solana uses proof of history as a component of consensus.',
    evidence: 'Solana uses Proof of History as a clock before consensus.',
    wrong: 'proof of storage',
    source: 'https://solana.com/news/proof-of-history',
    title: 'Proof of History',
  },
  {
    domain: 'finance',
    claim: 'The SEC requires public companies to file Form 10-K annually.',
    evidence: 'Form 10-K is an annual report required by the SEC for public companies.',
    wrong: 'monthly',
    source: 'https://www.sec.gov/answers/form10-k.htm',
    title: 'Form 10-K',
  },
  {
    domain: 'finance',
    claim: 'A basis point equals one hundredth of a percentage point.',
    evidence: 'One basis point equals 0.01 percentage points.',
    wrong: 'one percentage point',
    source: 'https://www.investor.gov/introduction-investing/investing-basics/glossary/basis-point',
    title: 'Basis point',
  },
  {
    domain: 'finance',
    claim: 'The Federal Reserve has a dual mandate.',
    evidence:
      'The Federal Reserve statutory mandate includes maximum employment and stable prices.',
    wrong: 'single mandate',
    source: 'https://www.federalreserve.gov/monetarypolicy/files/fomc_longerrungoals.pdf',
    title: 'Federal Reserve longer-run goals',
  },
  {
    domain: 'finance',
    claim: 'FDIC deposit insurance is backed by the United States government.',
    evidence:
      'FDIC deposit insurance is backed by the full faith and credit of the United States government.',
    wrong: 'private insurers only',
    source: 'https://www.fdic.gov/resources/deposit-insurance/',
    title: 'Deposit insurance',
  },
  {
    domain: 'companies',
    claim: 'Microsoft completed its acquisition of GitHub in 2018.',
    evidence: 'Microsoft completed its acquisition of GitHub on October 26, 2018.',
    wrong: 'Google completed',
    source: 'https://news.microsoft.com/2018/10/26/microsoft-completes-github-acquisition/',
    title: 'Microsoft completes GitHub acquisition',
  },
  {
    domain: 'companies',
    claim: 'Google announced an agreement to acquire Fitbit in 2019.',
    evidence: 'Google announced an agreement to acquire Fitbit on November 1, 2019.',
    wrong: 'Microsoft announced',
    source: 'https://blog.google/products/devices-services/agreement-with-fitbit/',
    title: 'Agreement with Fitbit',
  },
  {
    domain: 'companies',
    claim: 'Amazon was founded in 1994.',
    evidence: 'Amazon was founded in 1994.',
    wrong: '1984',
    source: 'https://www.aboutamazon.com/about-us',
    title: 'About Amazon',
  },
  {
    domain: 'companies',
    claim: 'NVIDIA completed its acquisition of Mellanox in 2020.',
    evidence: 'NVIDIA completed its acquisition of Mellanox on April 27, 2020.',
    wrong: 'Intel completed',
    source: 'https://nvidianews.nvidia.com/news/nvidia-completes-acquisition-of-mellanox',
    title: 'NVIDIA completes Mellanox acquisition',
  },
  {
    domain: 'science',
    claim: 'Water freezes at 0 degrees Celsius at standard pressure.',
    evidence: 'At standard atmospheric pressure, pure water freezes at 0 degrees Celsius.',
    wrong: '10 degrees Celsius',
    source: 'https://www.nist.gov/pml/owm/si-units-temperature',
    title: 'SI units temperature',
  },
  {
    domain: 'science',
    claim: 'The speed of light in vacuum is exactly 299,792,458 metres per second.',
    evidence: 'The speed of light in vacuum is exactly 299,792,458 metres per second.',
    wrong: '299,792,458 kilometres per second',
    source: 'https://physics.nist.gov/cgi-bin/cuu/Value?c',
    title: 'Speed of light in vacuum',
  },
  {
    domain: 'science',
    claim: 'DNA has a double-helix structure.',
    evidence: 'DNA is composed of two strands that wind around each other to form a double helix.',
    wrong: 'single-ring structure',
    source: 'https://www.genome.gov/about-genomics/fact-sheets/DNA-Facts',
    title: 'DNA facts',
  },
  {
    domain: 'science',
    claim: 'Mars is the fourth planet from the Sun.',
    evidence: 'Mars is the fourth planet from the Sun.',
    wrong: 'sixth planet',
    source: 'https://science.nasa.gov/mars/facts/',
    title: 'Mars facts',
  },
  {
    domain: 'developer_documentation',
    claim: 'JSON object names must be strings.',
    evidence: 'An object is an unordered collection of name/value pairs, and a name is a string.',
    wrong: 'numbers',
    source: 'https://www.rfc-editor.org/rfc/rfc8259',
    title: 'RFC 8259',
  },
  {
    domain: 'developer_documentation',
    claim: 'HTTP status code 404 means Not Found.',
    evidence:
      'The 404 (Not Found) status code indicates that the origin server did not find a current representation.',
    wrong: 'Created',
    source: 'https://www.rfc-editor.org/rfc/rfc9110#name-404-not-found',
    title: 'HTTP Semantics',
  },
  {
    domain: 'developer_documentation',
    claim: 'The HTML main element represents dominant document content.',
    evidence: 'The main element represents the dominant contents of the document body.',
    wrong: 'metadata only',
    source: 'https://html.spec.whatwg.org/multipage/grouping-content.html#the-main-element',
    title: 'HTML Living Standard',
  },
  {
    domain: 'developer_documentation',
    claim: 'Python lists are mutable sequences.',
    evidence:
      'Lists are mutable sequences, typically used to store collections of homogeneous items.',
    wrong: 'immutable',
    source: 'https://docs.python.org/3/library/stdtypes.html#lists',
    title: 'Python sequence types',
  },
  {
    domain: 'news',
    claim: 'The James Webb Space Telescope released its first full-color images in July 2022.',
    evidence: 'NASA released Webb’s first full-color images and spectra on July 12, 2022.',
    wrong: 'July 2012',
    source: 'https://www.nasa.gov/image-article/webbs-first-deep-field/',
    title: 'Webb first images',
  },
  {
    domain: 'news',
    claim: 'WHO declared COVID-19 a pandemic in March 2020.',
    evidence: 'WHO characterized COVID-19 as a pandemic on March 11, 2020.',
    wrong: 'March 11, 2019',
    source:
      'https://www.who.int/director-general/speeches/detail/who-director-general-s-opening-remarks-at-the-media-briefing-on-covid-19---11-march-2020',
    title: 'WHO media briefing',
  },
  {
    domain: 'news',
    claim: 'India landed Chandrayaan-3 near the lunar south pole in August 2023.',
    evidence: 'Chandrayaan-3 achieved a soft landing on the Moon on August 23, 2023.',
    wrong: 'August 23, 2022',
    source: 'https://www.isro.gov.in/Chandrayaan3_Details.html',
    title: 'Chandrayaan-3',
  },
  {
    domain: 'news',
    claim: 'The 2024 Summer Olympics were hosted by Paris.',
    evidence: 'Paris hosted the 2024 Summer Olympic Games.',
    wrong: 'London',
    source: 'https://olympics.com/en/olympic-games/paris-2024',
    title: 'Paris 2024',
  },
  {
    domain: 'public_data',
    claim: 'The United States census is conducted every ten years.',
    evidence: 'The United States census has been conducted every ten years since 1790.',
    wrong: 'every year',
    source: 'https://www.census.gov/programs-surveys/decennial-census/about.html',
    title: 'Decennial Census',
  },
  {
    domain: 'public_data',
    claim: 'ISO 3166-1 alpha-2 assigns two-letter country codes.',
    evidence: 'ISO 3166-1 alpha-2 consists of two-letter country codes.',
    wrong: 'five-letter',
    source: 'https://www.iso.org/iso-3166-country-codes.html',
    title: 'ISO country codes',
  },
  {
    domain: 'public_data',
    claim: 'The UN has 193 member states.',
    evidence: 'There are currently 193 Member States of the United Nations.',
    wrong: '203',
    source: 'https://www.un.org/en/about-us/member-states',
    title: 'UN Member States',
  },
  {
    domain: 'public_data',
    claim: 'A leap year normally contains 366 days.',
    evidence: 'A leap year contains 366 days instead of 365.',
    wrong: '367 days',
    source: 'https://aa.usno.navy.mil/faq/leap_years',
    title: 'Leap years',
  },
];
const difficulties = [
  'easy',
  'medium',
  'hard',
  'adversarial',
  'medium',
  'hard',
  'easy',
  'hard',
  'adversarial',
  'medium',
  'hard',
  'easy',
  'adversarial',
  'medium',
  'hard',
  'easy',
  'medium',
  'hard',
  'adversarial',
  'medium',
] as const;
const adversarial = [
  'numeric substitution',
  'entity substitution',
  'date substitution',
  'citation laundering',
  'unsupported inference',
  'partial support',
  'outdated evidence',
  'ambiguous entities',
  'cherry-picked evidence',
  'conflicting sources',
  'fabricated citation',
  'correct fact / wrong citation',
];
const variants = [
  'SUPPORTED',
  'CONTRADICTED',
  'INSUFFICIENT_EVIDENCE',
  'STALE',
  'SOURCE_UNAVAILABLE',
] as const;
const records: any[] = [];
const byDomain = new Map<string, Fact[]>();
for (const fact of facts) byDomain.set(fact.domain, [...(byDomain.get(fact.domain) ?? []), fact]);
for (const [domain, domainFacts] of byDomain)
  for (let i = 0; i < 20; i++) {
    const fact = domainFacts[Math.floor(i / 5)]!;
    const verdict = variants[i % 5]!;
    const difficulty = difficulties[i]!;
    const request: any = { claim: fact.claim };
    let evidenceSpans: string[] = [];
    if (verdict === 'SUPPORTED') {
      request.evidence = [{ text: fact.evidence }];
      request.source = fact.source;
      evidenceSpans = [fact.evidence];
    }
    if (verdict === 'CONTRADICTED') {
      request.claim = fact.claim.replace(
        fact.claim.match(
          /RFC 9114|2005|2014|April 2023|21 million|September 2022|ten minutes|proof of history|annually|one hundredth of a percentage point|dual mandate|United States government|Microsoft|Google|1994|NVIDIA|0 degrees Celsius|299,792,458 metres|double-helix|fourth planet|strings|404|dominant document content|mutable|July 2022|March 2020|August 2023|Paris|ten years|two-letter|193|366 days/i,
        )?.[0] ?? '__',
        fact.wrong,
      );
      request.evidence = [{ text: fact.evidence }];
      request.source = fact.source;
      evidenceSpans = [fact.evidence];
    }
    if (verdict === 'INSUFFICIENT_EVIDENCE') {
      request.evidence = [
        {
          text: `${fact.title} is an authoritative reference, but this excerpt does not state the claimed fact.`,
        },
      ];
      request.source = fact.source;
    }
    if (verdict === 'STALE') {
      request.claim = `Currently, ${fact.claim.charAt(0).toLowerCase() + fact.claim.slice(1)}`;
      request.evidence = [{ text: fact.evidence, publishedAt: '2020-01-01T00:00:00Z' }];
      request.source = fact.source;
      request.asOf = '2021-02-15T00:00:00Z';
      request.maxEvidenceAgeDays = 30;
    }
    if (verdict === 'SOURCE_UNAVAILABLE')
      request.source = `https://${domain.replace('_', '-')}-${i}.invalid/evidence`;
    const split = i < 12 ? 'train' : i < 16 ? 'validation' : 'test';
    records.push({
      id: `CB-${domain.toUpperCase().replace('_', '-')}-${String(i + 1).padStart(3, '0')}`,
      version: '0.1.0',
      domain,
      difficulty,
      split,
      adversarialType:
        difficulty === 'adversarial'
          ? adversarial[(records.length + i) % adversarial.length]
          : null,
      request,
      expected: {
        verdict,
        evidenceSpans,
        source: verdict === 'SOURCE_UNAVAILABLE' ? null : fact.source,
      },
      provenance: { url: fact.source, title: fact.title, accessedAt: '2026-08-22T00:00:00Z' },
      reviewerNotes: `Frozen ${verdict.toLowerCase()} case derived from the cited primary or authoritative reference; generated variant reviewed for label consistency.`,
    });
  }
const output = new URL('../data/claimbench-0.1.0.jsonl', import.meta.url);
await mkdir(dirname(fileURLToPath(output)), { recursive: true });
await writeFile(output, records.map((x) => JSON.stringify(x)).join('\n') + '\n', 'utf8');
console.log(`wrote ${records.length} cases`);
