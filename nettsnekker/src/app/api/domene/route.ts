import { NextResponse } from 'next/server';
import { hentInnstillinger } from '@/lib/settings';
import { sokDomener, tilSlug } from '@/lib/domene';

export const dynamic = 'force-dynamic';

/** Søker etter ledige domener. Skriver kunden «klippkroll», sjekkes alle endelsene. */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { sok?: string };
  const sok = String(body.sok ?? '').trim().toLowerCase();
  if (sok.length < 2) return NextResponse.json({ error: 'Skriv minst to tegn.' }, { status: 400 });

  const { priser } = await hentInnstillinger();
  if (!priser.domene.aktiv) return NextResponse.json({ error: 'Domenesøk er slått av.' }, { status: 400 });

  const endelser = priser.domene.endelser.map((e) => e.replace(/^\./, '').toLowerCase()).filter(Boolean);
  let kandidater: string[];
  const harPunktum = sok.includes('.');
  if (harPunktum) {
    const [navn, ...rest] = sok.split('.');
    const slug = tilSlug(navn);
    const endelse = rest.join('.');
    kandidater = [`${slug}.${endelse}`, ...endelser.filter((e) => e !== endelse).map((e) => `${slug}.${e}`)];
  } else {
    const slug = tilSlug(sok);
    const uten = slug.replace(/-/g, '');
    kandidater = endelser.map((e) => `${slug}.${e}`);
    if (uten !== slug) kandidater.push(...endelser.slice(0, 3).map((e) => `${uten}.${e}`));
  }
  if (!kandidater[0] || kandidater[0].startsWith('.')) {
    return NextResponse.json({ error: 'Bruk bare bokstaver, tall og bindestrek.' }, { status: 400 });
  }

  try {
    const treff = await sokDomener(Array.from(new Set(kandidater)), priser);
    const ikkeStottet = harPunktum && !endelser.includes(sok.split('.').slice(1).join('.'));
    return NextResponse.json({ treff, merknad: ikkeStottet ? 'Denne endelsen kan vi ikke registrere. Her er alternativer.' : '' });
  } catch {
    return NextResponse.json(
      { error: 'Domenesøket svarer ikke akkurat nå. Skriv domenet du ønsker, så sjekker vi det for deg.' },
      { status: 502 }
    );
  }
}
