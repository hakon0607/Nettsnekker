import { domenePrisNok, type Priser } from './pricing';

export type DomeneTreff = {
  domene: string;
  ledig: boolean;
  prisNok?: number;
  fornyelseNok?: number;
  premium?: boolean;
};

const tall = (v: unknown): number | undefined => {
  const n = typeof v === 'string' ? parseFloat(v) : typeof v === 'number' ? v : NaN;
  return Number.isFinite(n) ? n : undefined;
};

/** Lager et gyldig domenenavn av fritekst: «Klipp & Krøll» → «klipp-kroll» */
export function tilSlug(s: string): string {
  return s
    .toLowerCase()
    .replace(/æ/g, 'ae')
    .replace(/ø/g, 'o')
    .replace(/å/g, 'a')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/&/g, '-og-')
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50);
}

/**
 * Sjekker ledighet og pris hos Vercel. Ett kall for alle domenene.
 * https://vercel.com/docs/rest-api/domains-registrar/get-domain-availability-and-pricing
 */
export async function sokDomener(domener: string[], p: Priser): Promise<DomeneTreff[]> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (process.env.VERCEL_TOKEN) headers.Authorization = `Bearer ${process.env.VERCEL_TOKEN}`;
  const r = await fetch('https://api.vercel.com/v1/registrar/domains/search', {
    method: 'POST',
    headers,
    body: JSON.stringify({ domains: domener.slice(0, 50) }),
    cache: 'no-store',
    signal: AbortSignal.timeout(9000),
  });
  if (!r.ok) throw new Error(`Domenesøket svarte ${r.status}`);
  const j = (await r.json()) as { results?: Record<string, unknown>[] };
  return (j.results ?? []).map((x) => {
    const ledig = x.available === true || x.available === 'true';
    const pris = tall(x.price);
    const fornyelse = tall(x.renewalPrice) ?? pris;
    const aar = tall(x.years) ?? 1;
    return {
      domene: String(x.domain),
      ledig: ledig && pris !== undefined,
      // Prisen gjelder «years» år – vi regner om til pris for første år
      prisNok: pris !== undefined ? domenePrisNok(pris / Math.max(1, aar), p) : undefined,
      fornyelseNok: fornyelse !== undefined ? domenePrisNok(fornyelse, p) : undefined,
      premium: x.premium === true || x.premium === 'true',
    };
  });
}
