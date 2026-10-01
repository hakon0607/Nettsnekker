import type { Ordre } from './ordre';
import type { Priser } from './pricing';
import type { Bedrift } from './innhold';
import { tilSlug } from './domene';

export type FilLenke = { navn: string; kategori: string; type: string; url: string };

/**
 * Lager den ferdige prompten du limer inn i Claude (Claude Code).
 * Den inneholder alt Claude trenger for å bygge, teste og publisere siden.
 * Har OpenAI analysert bestillingen, legges analysen inn som egen del.
 */
export function lagClaudePrompt(o: Ordre, p: Priser, b: Bedrift, filer: FilLenke[], aiBrief = '', ekstra = ''): string {
  const slug = tilSlug(o.bedrift_navn) || 'kundeside';
  const tilleggNavn = p.tillegg
    .filter((t) => (o.tillegg?.[t.id] ?? 0) > 0)
    .map((t) => (t.type === 'antall' ? `${t.navn} × ${o.tillegg[t.id]}` : t.navn));
  const har = (id: string) => (o.tillegg?.[id] ?? 0) > 0;
  const f = o.tema?.farger ?? {};
  const alleSider = [...(o.sider ?? []), ...String(o.egne_sider || '').split(',').map((s) => s.trim()).filter(Boolean)];
  const trengerAdmin = o.admin_valgt || p.tillegg.some((t) => t.kreverAdmin && har(t.id));
  const sprak = Number(o.tillegg?.sprak ?? 0);

  const liste = (xs: string[]) => (xs.length ? xs.map((x) => `- ${x}`).join('\n') : '- (ikke oppgitt)');

  const deler: string[] = [];

  deler.push(`# Oppdrag: bygg nettsiden til «${o.bedrift_navn}»

Du er en erfaren frontend-utvikler og designer. Bygg en komplett, produksjonsklar nettside etter bestillingen under, test den, og gjør den klar for publisering på Vercel via GitHub. Jobb selvstendig helt til siden er ferdig. Ikke still spørsmål underveis; ta gode valg og noter dem i README.md.

Bestilling: ${o.ordrenr} · Levert av ${b.navn}
Prosjektnavn / repo: \`${slug}\``);

  deler.push(`## Kunden og bedriften
- **Bedrift:** ${o.bedrift_navn}${o.orgnr ? ` (org.nr. ${o.orgnr})` : ''}
- **Bransje:** ${o.bransje || 'ikke oppgitt'}
- **Hva bedriften gjør (kundens egne ord):**
${o.beskrivelse ? o.beskrivelse.split('\n').map((l) => `  > ${l}`).join('\n') : '  > (ikke oppgitt)'}
- **Målet med nettsiden:** ${(o.mal ?? []).join(', ') || 'ikke oppgitt'}
- **Målgruppe:** ${o.malgruppe || 'ikke oppgitt'}
- **Kontaktinfo som skal vises:** ${o.kunde_telefon ? `telefon ${o.kunde_telefon}, ` : ''}e-post ${o.kunde_epost} (bruk dette som utgangspunkt, kunden kan endre det)
${o.eksisterende_side ? `- **Eksisterende nettside (hent tekster, bilder og fakta herfra):** ${o.eksisterende_side}` : ''}
${o.inspirasjon ? `- **Inspirasjon kunden liker:** ${o.inspirasjon}` : ''}`);

  deler.push(`## Design
- **Fargetema:** ${o.tema?.navn ?? 'valgfritt'}${o.tema?.mork ? ' (mørkt tema)' : ' (lyst tema)'}
${f.bg ? `  - Bakgrunn \`${f.bg}\`, flate \`${f.flate}\`, tekst \`${f.tekst}\`, hovedfarge \`${o.tema?.egenFarge || f.hoved}\`, aksent \`${f.aksent}\`` : ''}
${o.tema?.egenFarge ? `  - Kunden har valgt **egen merkefarge ${o.tema.egenFarge}**. Bruk den som hovedfarge og juster de andre så kontrasten holder WCAG AA.` : ''}
- **Stil:** ${o.tema?.stil || 'ikke oppgitt'}
- Lag et designsystem med fargene som CSS-variabler/Tailwind-tema. Velg to skrifttyper fra Google Fonts som passer stilen og bransjen; unngå Inter/Arial som standardvalg.
- Siden skal føles laget for akkurat denne bedriften, ikke som en mal. Bruk bransjens eget språk og bilder.
- Bevegelse: én tydelig, rolig animasjon i toppen og diskrete overganger ellers. Respekter \`prefers-reduced-motion\`.
- Mobil først. Test 375 px, 768 px og 1280 px bredde.`);

  deler.push(`## Sider (${alleSider.length})
${liste(alleSider)}

## Funksjoner som skal være med
${(o.funksjoner ?? []).map((x) => `- ${x}`).join('\n')}
- Kontaktskjema (alltid med) som lagrer i databasen og sender e-post til bedriften (se teknisk del)
- Grunnleggende SEO (se teknisk del)

${tilleggNavn.length ? `## Tillegg kunden har kjøpt\n${liste(tilleggNavn)}` : ''}

${o.onsker ? `## Andre ønsker fra kunden\n${o.onsker}` : ''}`);

  if (har('booking'))
    deler.push(`### Timebestilling
- Besøkende velger tjeneste, dato og ledig tid og fyller inn navn, telefon og e-post.
- Lagres i \`site_innsendt\` med \`type = 'booking'\` og data \`{ tjeneste, start, slutt, navn, telefon, epost, melding }\`.
- Åpningstider, tjenester (navn, varighet, pris) og stengte dager redigeres i /admin og lagres i \`site_innhold\`/\`site_elementer\`.
- Ledige tider regnes ut fra åpningstider minus eksisterende bookinger. Bekreftelse sendes på e-post til kunden og bedriften.`);

  if (har('nettbutikk'))
    deler.push(`### Nettbutikk (uten betaling på nettsiden)
- Produkter (\`site_elementer\`, \`type = 'produkt'\`, data \`{ navn, pris, beskrivelse, bilder[], kategori, lager }\`) med kategorier, filter og produktside.
- Handlekurv lagret i nettleseren. «Send bestilling» lagrer i \`site_innsendt\` med \`type = 'bestilling'\` og sender e-post. **Ingen kortbetaling** – teksten skal si at betaling skjer ved henting/levering.
- I /admin: se bestillinger, endre status (ny → behandlet → ferdig), og administrere produkter og lager.`);

  if (har('blogg'))
    deler.push(`### Nyheter / blogg
- Innlegg i \`site_elementer\` (\`type = 'nyhet'\`, data \`{ tittel, ingress, innhold, bilde, publisert }\`). Liste + egen side per innlegg med god SEO. Skrives i /admin.`);

  if (sprak > 0)
    deler.push(`### Flere språk
- Siden skal finnes på norsk + ${sprak} språk til (bruk engelsk hvis ikke annet er avtalt). Bruk \`/en\`-ruter, språkvelger i menyen og \`hreflang\`.`);

  if (trengerAdmin)
    deler.push(`## /admin – kundens egen adminside
- Innlogging med Supabase Auth (e-post + passord, «glemt passord»). Bare e-poster i \`site_admins\` for denne siden slipper inn.
- Ryddig, mobilvennlig panel med meny til venstre (bunnmeny på mobil). Endringer lagres med én tydelig «Lagre»-knapp og en bekreftelse.
- Kunden ønsker å kunne:
${o.admin_onsker ? o.admin_onsker.split('\n').map((l) => `  - ${l.replace(/^[-•]\s*/, '')}`).join('\n') : '  - Endre tekster, bilder og kontaktinfo'}
${har('booking') ? '  - Se og styre timebestillinger, åpningstider og tjenester' : ''}
${har('nettbutikk') ? '  - Se bestillinger og administrere produkter' : ''}
${har('blogg') ? '  - Skrive og publisere nyheter' : ''}
  - Lese meldinger fra kontaktskjemaet
- Alt som kan redigeres skal ha fornuftige standardverdier, så siden ser ferdig ut før kunden har endret noe.
- Bildeopplasting til Supabase Storage-bøtta \`kundesider\` i mappen \`<SITE_ID>/\`.`);

  deler.push(`## Materiell fra kunden
${
  filer.length
    ? filer.map((x) => `- [${x.kategori}] ${x.navn} (${x.type}): ${x.url}`).join('\n') +
      '\n\nLast ned filene (lenkene varer i 7 dager) og legg dem i `public/`. Optimaliser bildene (WebP, riktige størrelser). Bruk logoen i menyen og som favicon.'
    : '- Ingen filer. Bruk gode, lisensfrie bilder (f.eks. Unsplash) som passer bransjen, og noter i README hvilke kunden bør bytte ut.'
}`);

  if (aiBrief.trim())
    deler.push(`## Analyse av bestillingen (laget av AI på forhånd)
${aiBrief.trim()}`);

  deler.push(`## Teknisk
- **Stack:** Next.js 14 (App Router) + TypeScript + Tailwind CSS. Ingen unødvendige avhengigheter.
- **Database:** felles Supabase-prosjekt for alle kundesider (skjemaet finnes allerede). Bruk disse tabellene og filtrer ALLTID på \`site_id\`:
  - \`sites\` (id, slug, navn) – denne siden har slug \`${slug}\`
  - \`site_admins\` (site_id, email, rolle) – hvem som kan logge inn på /admin
  - \`site_innhold\` (site_id, nokkel, verdi jsonb) – redigerbare tekster/innstillinger
  - \`site_elementer\` (id, site_id, type, data jsonb, synlig, sort) – lister som produkter, tjenester, ansatte, bilder
  - \`site_innsendt\` (id, site_id, type, data jsonb, status) – meldinger, bestillinger, bookinger
  - Lagring: offentlig bøtte \`kundesider\`, mappe \`<SITE_ID>/\`
  - RLS er satt opp: alle kan lese innhold, besøkende kan bare sette inn i \`site_innsendt\`, site-admins kan endre sitt eget.
- **Miljøvariabler** (lag \`.env.example\`):
  - \`NEXT_PUBLIC_SUPABASE_URL\`, \`NEXT_PUBLIC_SUPABASE_ANON_KEY\`, \`NEXT_PUBLIC_SITE_ID\`
  - \`RESEND_API_KEY\`, \`EPOST_AVSENDER\`, \`EPOST_TIL\` (bedriftens e-post for varsler)
  - \`NEXT_PUBLIC_SITE_URL\`
- Siden skal **fungere og se ferdig ut selv om databasen er tom** (standardinnhold i koden, databasen overstyrer).
- Kontaktskjema: route handler som validerer, har honeypot mot spam, lagrer i \`site_innsendt\` og sender e-post med Resend (fetch mot https://api.resend.com/emails).
- **SEO:** \`metadata\` per side, Open Graph-bilde, \`sitemap.ts\`, \`robots.ts\`, JSON-LD (\`LocalBusiness\` eller riktig type for bransjen), semantisk HTML, \`lang="nb"\`.
- **Kvalitet:** Lighthouse 90+ på alle kategorier, tilgjengelig med tastatur, synlig fokus, alt-tekster, kontrast AA.
- Ingen hemmeligheter i koden.

## Slik leverer du
1. Bygg prosjektet og kjør \`npm run build\` til det er helt uten feil.
2. Kjør siden lokalt og sjekk hver side på mobil og PC. Rett feil du finner.
3. Lag README.md med: hva som er laget, hvordan man legger inn \`site_id\`, miljøvariabler, og valg du tok.
4. Lag \`seed.sql\` som legger inn denne siden i \`sites\`, kunden (${o.kunde_epost}) i \`site_admins\`${trengerAdmin ? '' : ' (selv om /admin ikke er kjøpt, for senere bruk)'}, og standardinnholdet.
5. Opprett GitHub-repo \`${slug}\`, commit og push.
6. Importer repoet i Vercel, legg inn miljøvariablene og deploy. Gi meg til slutt **.vercel.app-lenken** til utkastet.
${o.domene ? `7. Domenet \`${o.domene}\` kobles på først når kunden har godkjent og betalt – ikke gjør det nå.` : ''}`);

  if (ekstra.trim()) deler.push(`## Faste instrukser fra ${b.navn}\n${ekstra.trim()}`);

  return (
    deler
      .join('\n\n')
      // tomme linjer midt i punktlister (fra valgfrie punkter) fjernes
      .replace(/\n(?:[ \t]*\n)+(?=[ \t]+- )/g, '\n')
      .replace(/(\n- [^\n]*)\n(?:[ \t]*\n)+(?=- )/g, '$1\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim() + '\n'
  );
}
