import { NextResponse } from 'next/server';
import { krevAdmin } from '@/lib/auth';
import { hentInnstillinger } from '@/lib/settings';
import { lagClaudePrompt, type FilLenke } from '@/lib/prompt';
import { loggHendelse } from '@/lib/hendelse';
import type { Ordre } from '@/lib/ordre';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

const SYV_DAGER = 60 * 60 * 24 * 7;

/** Henter tekst fra kundens eksisterende nettside (grovt, uten HTML). */
async function hentSidetekst(url: string): Promise<string> {
  try {
    const u = new URL(url.startsWith('http') ? url : `https://${url}`);
    const r = await fetch(u, { headers: { 'User-Agent': 'NettsnekkerBot/1.0' }, signal: AbortSignal.timeout(8000) });
    if (!r.ok) return '';
    const html = await r.text();
    return html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 8000);
  } catch {
    return '';
  }
}

/**
 * Lager prompten til Claude. Med medAi=true analyserer OpenAI først
 * beskrivelsen, bildene, dokumentene og den gamle nettsiden.
 */
export async function POST(request: Request) {
  const a = await krevAdmin(request);
  if (a.feil) return a.feil;
  const b = (await request.json().catch(() => ({}))) as { orderId?: string; medAi?: boolean };
  const { data } = await a.service.from('orders').select('*').eq('id', b.orderId ?? '').maybeSingle();
  if (!data) return NextResponse.json({ error: 'Fant ikke bestillingen.' }, { status: 404 });
  const o = data as Ordre;
  const inn = await hentInnstillinger();

  // Signerte lenker til filene, så Claude kan laste dem ned
  const filer: FilLenke[] = [];
  for (const f of o.filer ?? []) {
    const { data: s } = await a.service.storage.from('bestillinger').createSignedUrl(f.path, SYV_DAGER);
    if (s?.signedUrl) filer.push({ navn: f.navn, kategori: f.kategori, type: f.type, url: s.signedUrl });
  }

  let brief = o.ai_brief || '';
  let advarsel = '';

  if (b.medAi) {
    const key = process.env.OPENAI_API_KEY;
    if (!key) {
      advarsel = 'OPENAI_API_KEY mangler i Vercel, så prompten ble laget uten AI-analyse.';
    } else {
      const sidetekst = o.eksisterende_side ? await hentSidetekst(o.eksisterende_side) : '';

      // Tekstdokumenter leses direkte
      const dokumenter: string[] = [];
      for (const f of filer.filter((x) => x.type.startsWith('text/')).slice(0, 5)) {
        try {
          const t = await (await fetch(f.url)).text();
          dokumenter.push(`### ${f.navn}\n${t.slice(0, 6000)}`);
        } catch {
          /* hopp over */
        }
      }
      const bilder = filer.filter((x) => x.type.startsWith('image/') && !x.type.includes('svg')).slice(0, 8);
      const andreFiler = filer.filter((x) => !x.type.startsWith('image/') && !x.type.startsWith('text/'));

      const bestilling = {
        bedrift: o.bedrift_navn,
        bransje: o.bransje,
        beskrivelse: o.beskrivelse,
        mal: o.mal,
        malgruppe: o.malgruppe,
        tema: o.tema,
        sider: [...o.sider, o.egne_sider].filter(Boolean),
        funksjoner: o.funksjoner,
        tillegg: o.tillegg,
        onsker: o.onsker,
        admin: o.admin_valgt ? o.admin_onsker || 'ja' : 'nei',
        inspirasjon: o.inspirasjon,
        kommentar: o.kommentar,
      };

      const instruks = `Du er en senior webdesigner og tekstforfatter i et norsk webbyrå. Du får en bestilling på en nettside, kundens materiell og eventuelt teksten fra den gamle nettsiden. Skriv en konkret innholds- og designplan på norsk bokmål som en utvikler (Claude) skal bygge etter.

Svar i Markdown med disse overskriftene:
### Forståelse av bedriften
3–5 setninger: hva de gjør, for hvem, og hva som gjør dem spesielle.
### Budskap og tone
Hovedbudskap, tone, og 3 forslag til overskrift på forsiden.
### Innhold per side
For hver side: formål, seksjoner i rekkefølge, og ferdige tekstforslag (overskrifter, ingress, knappetekster, tjenestebeskrivelser). Bruk fakta fra materiellet. Finn ikke opp priser, adresser, sertifiseringer eller kundeomtaler – skriv [FYLL INN] der fakta mangler.
### Bilder og visuelt
Hvilke av kundens bilder som bør brukes hvor (bruk filnavnene), hva logoen tilsier om farger og stil, og hva slags bilder som mangler.
### /admin
Hvis kunden har kjøpt admin: nøyaktig hvilke felter og lister som skal kunne redigeres.
### Det som mangler
Punktliste over informasjon vi bør be kunden om.

${inn.ai.ekstraInstruks ? `Ekstra instruks: ${inn.ai.ekstraInstruks}` : ''}`;

      const innhold: unknown[] = [
        {
          type: 'text',
          text: `BESTILLING:\n${JSON.stringify(bestilling, null, 2)}\n\n${
            dokumenter.length ? `DOKUMENTER FRA KUNDEN:\n${dokumenter.join('\n\n')}\n\n` : ''
          }${andreFiler.length ? `ANDRE FILER (ikke lest): ${andreFiler.map((f) => f.navn).join(', ')}\n\n` : ''}${
            sidetekst ? `TEKST FRA DEN GAMLE NETTSIDEN (${o.eksisterende_side}):\n${sidetekst}\n\n` : ''
          }${bilder.length ? `BILDER (i rekkefølge): ${bilder.map((x) => `${x.navn} [${x.kategori}]`).join(', ')}` : ''}`,
        },
        ...bilder.map((x) => ({ type: 'image_url', image_url: { url: x.url, detail: 'low' } })),
      ];

      try {
        const r = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: inn.ai.modell || 'gpt-5.4-mini',
            messages: [
              { role: 'system', content: instruks },
              { role: 'user', content: innhold },
            ],
          }),
          signal: AbortSignal.timeout(110000),
        });
        const j = (await r.json()) as { choices?: { message?: { content?: string } }[]; error?: { message?: string } };
        if (!r.ok) throw new Error(j.error?.message || `OpenAI svarte ${r.status}`);
        brief = j.choices?.[0]?.message?.content?.trim() || '';
        if (!brief) advarsel = 'OpenAI ga et tomt svar. Prompten ble laget uten analyse.';
      } catch (e) {
        advarsel = `AI-analysen feilet: ${e instanceof Error ? e.message : 'ukjent feil'}. Prompten ble laget uten analyse.`;
      }
    }
  }

  const prompt = lagClaudePrompt(o, inn.priser, inn.bedrift, filer, brief, inn.ai.ekstraInstruks);
  await a.service.from('orders').update({ ai_brief: brief, claude_prompt: prompt, updated_at: new Date().toISOString() }).eq('id', o.id);
  await loggHendelse(a.service, o.id, b.medAi ? 'Prompt laget med AI-analyse' : 'Prompt laget');
  return NextResponse.json({ prompt, brief, advarsel });
}
