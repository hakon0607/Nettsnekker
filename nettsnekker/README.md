# Nettsnekker

Nettside der bedrifter bestiller sin egen nettside. Kunden beskriver bedriften, velger farger, sider, tillegg, adminside og domene, ser prisen live, og vippser et bestillingsgebyr med bestillingsnummeret i meldingen. Resten vippses når kunden har sett og godkjent utkastet.

👉 **Første gang? Les [OPPSETT.md](OPPSETT.md).**

## Sider

| Side | Innhold |
|---|---|
| `/` | Forside med nettside som snekres live, prosessen, grunnpakken, priskalkulator, adminside, eksempler og spørsmål |
| `/bestill` | Bestilling i sju steg med live forhåndsvisning og pris |
| `/bestilt` | Bekreftelse med Vipps-informasjon (beløp, nummer, bestillingsnummer) |
| `/vilkar`, `/personvern` | Redigeres i `/admin/vilkar` |
| `/admin` | Oversikt: nye bestillinger, ting som trenger deg, innbetalt, sist sendte e-poster |
| `/admin/bestillinger` | Alle bestillinger med søk og filter |
| `/admin/bestillinger/[id]` | Fremdrift, hele bestillingen, prompt til Claude, e-post, pris og betaling, notater og logg |
| `/admin/epost` | Alle sendte e-poster, og redigering av e-postmalene med forhåndsvisning |
| `/admin/priser` | Gebyr, grunnpakke, tillegg, domenepåslag og hosting |
| `/admin/innhold` | Tekster på forsiden, spørsmål og svar, eksempler |
| `/admin/vilkar` | Vilkår og personvern |
| `/admin/innstillinger` | Om deg, AI-modell, admins og status på oppsettet |

## Flyten

```
Kunden bestiller ─► «Bestilling mottatt» med Vipps-info + varsel til deg ─► kunden vippser gebyret
        │
        ▼
Du ser betalingen i Vipps ─► «Gebyret er mottatt» ─► kunden får «Nå starter vi»
        │
        ▼
Du lager prompt (OpenAI analyserer materiellet) ─► limer inn i Claude Code ─► .vercel.app-utkast
        │
        ▼
«Utkastet er klart»-e-post med lenke + «vipps resten med bestillingsnummeret»
        │
        ├─► kunden vil ha endringer ─► nytt utkast
        ▼
Kunden vippser ─► du trykker «Resten er mottatt» ─► «Betaling mottatt» ─► du kobler domenet ─► «Nettsiden er live»
```

## Teknikk

- Next.js 14 (App Router), TypeScript, Tailwind CSS, Framer Motion
- Supabase: database, innlogging til admin og fillagring
- Vipps til eget nummer, med bestillingsnummeret i meldingen. Betalinger markeres som mottatt i admin
- Resend for e-post (alle e-poster logges i `sent_emails`)
- Vercels Domains Registrar API for ledige domener og priser
- OpenAI for analyse av bestillingen før prompten lages

Prisen regnes alltid ut på nytt på serveren, også domeneprisen, så ingen kan endre prisen i nettleseren.

## Kjøre lokalt

```bash
npm install
cp .env.example .env.local   # fyll inn nøklene
npm run dev
```

## Filer

- `supabase/schema.sql` – databasen til Nettsnekker
- `supabase/kundesider.sql` – felles database for alle kundenettsidene
- `src/lib/pricing.ts` – kalkulatoren
- `src/lib/maler.ts` – standard e-postmaler
- `src/lib/prompt.ts` – prompten til Claude
- `src/lib/innhold.ts` – standardtekster, FAQ og vilkår
