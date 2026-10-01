# Oppsett av Nettsnekker

Denne guiden tar deg fra zip-fil til en nettside som tar imot ekte bestillinger.
Regn med ca. én time første gang. Gjør stegene i rekkefølge.

---

## 1. Last opp koden til GitHub

1. Pakk ut zip-filen.
2. Lag et nytt repo på GitHub, f.eks. `nettsnekker` (privat er fint).
3. Last opp alle filene (dra mappen inn på GitHub, eller bruk `git push`).

## 2. Supabase – databasen til Nettsnekker

1. Gå til [supabase.com](https://supabase.com) → **New project**. Kall det `nettsnekker`. Velg region **Stockholm** eller **Frankfurt**.
2. Åpne **SQL Editor** → **New query**, lim inn hele `supabase/schema.sql` og trykk **Run**.
3. Kjør denne linjen også, med din e-post:
   ```sql
   insert into public.admins (email, navn) values ('din@epost.no', 'Håkon');
   ```
4. Gå til **Authentication → URL Configuration** og sett **Site URL** til adressen siden skal ligge på (f.eks. `https://nettsnekker.vercel.app`). Legg også til `https://nettsnekker.vercel.app/admin/**` under **Redirect URLs**.
5. Hent nøklene fra **Project Settings → API**:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` → `SUPABASE_SERVICE_ROLE_KEY` (hemmelig! aldri i koden)

## 3. Resend – e-post

1. Lag konto på [resend.com](https://resend.com).
2. **Domains → Add domain** og legg inn domenet du vil sende fra (f.eks. `nettsnekker.no`). Legg inn DNS-postene Resend viser, der du kjøpte domenet. Vent til det står **Verified**.
3. **API Keys → Create** → `RESEND_API_KEY`.
4. `EPOST_AVSENDER` = `Nettsnekker <post@nettsnekker.no>` (må være på domenet du verifiserte).

> Uten eget domene kan du bare teste: Resend sender da bare til din egen e-post.

## 4. Vipps – betaling

Kundene betaler med vanlig Vipps til nummeret ditt, og skriver bestillingsnummeret (f.eks. `NS-1001`) i meldingen. Du kobler betalingen til bestillingen selv i admin.

1. Etter at siden er oppe: gå til `/admin/innstillinger` og fyll inn **Vipps-nummer** og **Navn i Vipps**.
2. Kunden får Vipps-informasjonen på skjermen når bestillingen er sendt, og i e-posten.
3. Når du ser betalingen i Vipps: åpne bestillingen og trykk **Gebyret er mottatt på Vipps**. Kunden får automatisk e-post om at arbeidet starter.
4. Når kunden har vippset resten etter utkastet: trykk **Resten er mottatt på Vipps**. Kunden får kvittering.

> Tips: Får du mange betalinger, kan du senere bytte til et bedrifts-Vipps-nummer (Vipps Bedrift / «Vippsnummer»). Da endrer du bare nummeret i Innstillinger.

## 5. OpenAI – analyse av bestillinger (valgfritt)

1. [platform.openai.com](https://platform.openai.com) → **API keys** → `OPENAI_API_KEY`.
2. Modellen velges i `/admin/innstillinger`. Standard er en billig modell; én analyse koster noen øre.

## 6. Vercel – publisering

1. [vercel.com](https://vercel.com) → **Add New → Project** → importer GitHub-repoet.
2. Under **Environment Variables**, legg inn alt fra `.env.example`:

   | Variabel | Hvor du finner den |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | Supabase |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase |
   | `SUPABASE_SERVICE_ROLE_KEY` | Supabase |
   | `NEXT_PUBLIC_SITE_URL` | Adressen til siden, uten / til slutt |
   | `ADMIN_EMAILS` | Din e-post (blir admin automatisk første gang du logger inn) |
   | `RESEND_API_KEY` | Resend |
   | `EPOST_AVSENDER` | f.eks. `Nettsnekker <post@nettsnekker.no>` |
   | `OPENAI_API_KEY` | OpenAI (valgfri) |
   | `VERCEL_TOKEN` | Valgfri. Vercel → Account Settings → Tokens. Gir høyere grense på domenesøk |

3. Trykk **Deploy**.
4. Gå til `https://DIN-ADRESSE/admin`, trykk **Første gang?** og lag passord med e-posten du la inn som admin.
5. Sjekk **Innstillinger → Oppsett i Vercel**. Alt skal ha grønn hake.

Når du endrer en miljøvariabel må du deploye på nytt (**Deployments → … → Redeploy**).

## 7. Database for kundenes nettsider

Alle nettsidene du lager deler én database, så du slipper å lage et nytt Supabase-prosjekt per kunde.

1. Lag et **nytt** Supabase-prosjekt, f.eks. `nettsnekker-kunder` (gratisplanen gir to prosjekter).
2. Kjør `supabase/kundesider.sql` i SQL Editor der.
3. Prompten Claude får forteller hvilke tabeller siden skal bruke. Hver kundeside får sin egen `NEXT_PUBLIC_SITE_ID`.
4. For hver ny kunde: kjør `seed.sql` som Claude lager, eller linjene nederst i `kundesider.sql`.
5. Har kunden kjøpt `/admin`: **Authentication → Users → Invite user** med kundens e-post, og legg e-posten i `site_admins`.

---

## Slik jobber du med en bestilling

1. **Kunden bestiller** og får Vipps-informasjon på skjermen og på e-post. Du får varsel, og bestillingen står som «Venter på Vipps». Når gebyret har kommet, trykker du **Gebyret er mottatt på Vipps**. Status blir «Ny».
2. **Lag prompten:** åpne bestillingen → **Prompt til Claude** → **Analyser med AI og lag prompt**.
3. **Bygg:** kopier prompten og lim den inn i Claude Code. Claude bygger siden, pusher til GitHub og deployer til Vercel, og gir deg en `.vercel.app`-lenke.
4. **Send utkastet:** under **Fremdrift**, lim inn lenken → **Send utkastet til kunden**. E-posten forteller kunden at de godkjenner ved å vippse resten med bestillingsnummeret. Status blir «Utkast sendt».
5. **Endringer?** Trykk **Kunden vil ha endringer**, fiks det, og send **Nytt utkast**.
6. **Kunden vippser resten.** Trykk **Resten er mottatt på Vipps**. Status blir «Betalt», og kunden får kvittering.
7. **Koble domenet** i Vercel (Domains → Buy / Add), legg inn live-adressen og send **«Nettsiden er live»**.
8. **Marker som levert.** Oversikten minner deg på når hosting må fornyes.

Alle e-poster som sendes, både automatiske og manuelle, ligger under **E-post → Sendt** og under hver bestilling.

---

## Kostnader å regne med

- **Vercel:** Gratisplanen (Hobby) er bare for ikke-kommersiell bruk. Når du tar betalt for nettsider, trenger du **Pro** (ca. 20 $ per måned), som dekker alle kundesidene.
- **Supabase:** Gratis til du har mange kunder. Pro koster ca. 25 $ per måned.
- **Resend:** Gratis opptil 3 000 e-poster per måned.
- **Vipps:** privat Vipps er gratis for mottaker opp til Vipps sine grenser. Tar du imot betaling jevnlig som næring, bør du bruke et bedriftsnummer.
- **Domener:** Det Vercel tar, pluss påslaget du setter i `/admin/priser`.
- **OpenAI:** Noen øre per analyse.

Bruk dette når du setter **Hosting per år** i `/admin/priser`.

## Før du tar imot ekte kunder

- **Foretak:** Selger du tjenester jevnlig, er det næringsvirksomhet. Et enkeltpersonforetak registreres gratis i Brønnøysundregistrene. Legg inn org.nr. i `/admin/innstillinger` når du har det.
- **Merverdiavgift:** Du må registrere deg i Merverdiavgiftsregisteret når du har solgt for mer enn 50 000 kr på 12 måneder. Sjekk gjeldende regler hos Skatteetaten. Da må du også endre teksten om mva under Priser.
- **Vilkår:** Vilkårene i `/admin/vilkar` er et utgangspunkt, ikke juridisk rådgivning. Få gjerne en voksen eller en rådgiver til å lese dem.
- **Regnskap:** Hver bestilling viser når gebyret og resten ble mottatt. Ta vare på Vipps-historikken til regnskapet.

## Feilsøking

| Problem | Løsning |
|---|---|
| «Denne brukeren er ikke admin» | Legg e-posten i tabellen `admins`, eller i `ADMIN_EMAILS` i Vercel |
| Ingen e-post kommer | Sjekk at domenet er verifisert i Resend og at `EPOST_AVSENDER` bruker det. Se feilmeldingen under **E-post → Sendt** |
| Kunden har vippset uten bestillingsnummer | Søk på kundens navn under Bestillinger og sjekk at beløpet stemmer før du markerer det som mottatt |
| Domenesøket feiler | Vercel kan ha begrenset antall søk. Legg inn `VERCEL_TOKEN` |
| Opplasting feiler | Sjekk at `schema.sql` er kjørt (den lager bøtta `bestillinger`) |
