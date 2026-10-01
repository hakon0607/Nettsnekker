/**
 * Standardinnhold for nettsiden. Alt kan endres i /admin. Det som ligger i
 * Supabase-tabellen `settings` vinner over det som står her.
 */

export type Bedrift = {
  navn: string;
  eier: string;
  epost: string;
  telefon: string;
  sted: string;
  /** E-poster som får varsel om nye bestillinger (kommaseparert) */
  varselEpost: string;
  orgnr: string;
  /** Vipps-nummer eller mobilnummer kundene vippser til */
  vippsNummer: string;
  /** Navnet som vises i Vipps når kunden betaler */
  vippsNavn: string;
};

export type Tekster = {
  heroTittel: string;
  heroTekst: string;
  heroKnapp: string;
  prosessTittel: string;
  adminTittel: string;
  adminTekst: string;
  ctaTittel: string;
  ctaTekst: string;
  bestiltTekst: string;
};

export type Faq = { sporsmal: string; svar: string }[];

export type Eksempel = { navn: string; bransje: string; url: string; bilde: string; tema: string };

export type AiOppsett = {
  modell: string;
  ekstraInstruks: string;
};

export const STANDARD_BEDRIFT: Bedrift = {
  navn: 'Nettsnekker',
  eier: 'Håkon Solvik',
  epost: 'post@nettsnekker.no',
  telefon: '',
  sted: 'Bergen',
  varselEpost: '',
  orgnr: '',
  vippsNummer: '',
  vippsNavn: 'Håkon Solvik',
};

export const STANDARD_TEKSTER: Tekster = {
  heroTittel: 'Vi snekrer nettsiden din. Du betaler når du er fornøyd.',
  heroTekst:
    'Beskriv bedriften din, velg farger og hva siden skal kunne. Du får et ferdig utkast å se på før du betaler noe mer enn bestillingsgebyret.',
  heroKnapp: 'Bestill nettside',
  prosessTittel: 'Fra bestilling til ferdig nettside',
  adminTittel: 'Vil du endre ting selv?',
  adminTekst:
    'Med /admin får du en egen innlogging der du endrer priser, produkter, åpningstider og tekster uten å ringe oss. Du bestemmer selv hva den skal kunne.',
  ctaTittel: 'Klar for en nettside som faktisk er ferdig?',
  ctaTekst: 'Det tar fem minutter å bestille. Du ser utkastet før du betaler resten.',
  bestiltTekst:
    'Vi har fått bestillingen din og begynner å snekre. Du får en e-post med lenke til utkastet når det er klart.',
};

export const STANDARD_FAQ: Faq = [
  {
    sporsmal: 'Hva er bestillingsgebyret?',
    svar: 'Gebyret dekker gjennomgangen av bestillingen og arbeidet med å planlegge siden. Du vippser det når du har bestilt, med bestillingsnummeret i meldingen. Det kommer i tillegg til prisen for nettsiden.',
  },
  {
    sporsmal: 'Når betaler jeg resten?',
    svar: 'Når utkastet er klart får du en lenke på e-post. Er du fornøyd, vippser du resten med bestillingsnummeret i meldingen. Det er godkjenningen din, og da kobler vi på domenet ditt.',
  },
  {
    sporsmal: 'Hva om jeg ikke liker utkastet?',
    svar: 'Svar på e-posten med hva du vil endre. Endringsrundene som er inkludert i pakken brukes til dette. Trenger du flere, kan du kjøpe ekstra runder.',
  },
  {
    sporsmal: 'Hvor ligger nettsiden?',
    svar: 'Nettsiden ligger hos Vercel, som er rask og sikker drift brukt av store selskaper. Mens du ser på utkastet ligger den på en .vercel.app-adresse.',
  },
  {
    sporsmal: 'Kan jeg bruke domenet jeg allerede har?',
    svar: 'Ja. Velg «Jeg har allerede et domene» i bestillingen, så kobler vi det til når siden er klar.',
  },
  {
    sporsmal: 'Hva er /admin?',
    svar: 'En innlogget side bare for deg, der du kan endre det du har bedt om, for eksempel priser, produkter eller åpningstider. Du kan legge den til når du bestiller.',
  },
];

export const STANDARD_EKSEMPLER: Eksempel[] = [
  { navn: 'Klipp & Krøll', bransje: 'Frisør', url: '', bilde: '', tema: 'rosa' },
  { navn: 'Bygg & Bolig Vest', bransje: 'Håndverker', url: '', bilde: '', tema: 'kobber' },
  { navn: 'Kafé Bryggen', bransje: 'Kafé', url: '', bilde: '', tema: 'gran' },
];

export const STANDARD_AI: AiOppsett = {
  modell: 'gpt-5.4-mini',
  ekstraInstruks: '',
};

export const STANDARD_VILKAR = `## 1. Hvem vi er
Nettsnekker drives av {eier}, privatperson, {sted}. E-post: {epost}. Selger er ikke registrert i Enhetsregisteret og har derfor ikke organisasjonsnummer. Alle priser er oppgitt uten merverdiavgift fordi selger ikke er registrert i Merverdiavgiftsregisteret.

## 2. Hva du kjøper
Du bestiller utvikling av en nettside etter beskrivelsen du gir i bestillingsskjemaet. Grunnpakken inneholder det som står på bestillingssiden når du bestiller, blant annet antall sider, antall endringsrunder, kontaktskjema, grunnleggende søkemotoroptimalisering og drift (hosting) det første året. Tillegg du velger, som adminside, timebestilling og domene, står spesifisert i ordrebekreftelsen.

## 3. Slik foregår kjøpet
- **Bestilling:** Du sender bestillingen og vippser bestillingsgebyret. Bestillingen er bindende når gebyret er betalt.
- **Utkast:** Vi lager et utkast som du får lenke til på e-post. Utkastet ligger på en midlertidig adresse.
- **Endringer:** Du kan be om endringer innenfor antall endringsrunder i pakken. En endringsrunde er én samlet liste med endringer.
- **Godkjenning og betaling:** Når du er fornøyd, godkjenner du ved å vippse resten av prisen med bestillingsnummeret i meldingen. Betalingen regnes som godkjenning av nettsiden.
- **Levering:** Etter betaling kobler vi til domenet og sender deg innloggingen til /admin hvis du har kjøpt det.

## 4. Priser og betaling
Bestillingsgebyret kommer i tillegg til prisen for nettsiden og betales med Vipps når du har bestilt. Resten betales med Vipps når du har godkjent utkastet. Skriv alltid bestillingsnummeret i Vipps-meldingen, så vi kan koble betalingen til bestillingen. Vi starter arbeidet når gebyret er mottatt.

## 5. Bestillingsgebyr og avbestilling
Bestillingsgebyret dekker gjennomgang og planlegging og refunderes ikke etter at vi har begynt på arbeidet. Ønsker du ikke å gå videre etter å ha sett utkastet, betaler du ikke resten, og bestillingen avsluttes. Vi fjerner da utkastet, og du får ikke rett til å bruke det.

## 6. Angrerett
Tjenesten er laget for næringsdrivende. Er du forbruker, har du som hovedregel 14 dagers angrerett etter angrerettloven. Når du bestiller, ber du oss om å starte arbeidet med en gang. Bruker du angreretten etter at vi har startet, må du betale for den delen av arbeidet som er utført, og angreretten faller bort når tjenesten er levert i sin helhet.

## 7. Ditt innhold
Du er ansvarlig for at tekster, bilder, logoer og annet materiell du sender oss er ditt eget eller noe du har lov til å bruke. Vi kan bruke verktøy med kunstig intelligens til å analysere materiellet og foreslå tekster og struktur.

## 8. Rettigheter til nettsiden
Når hele prisen er betalt, får du rett til å bruke nettsiden og innholdet på den. Kildekoden og malene vi bruker i mange nettsider eies fortsatt av oss. Vi kan vise nettsiden som eksempel på vårt arbeid, med mindre du sier fra om noe annet.

## 9. Drift, domene og fornyelse
Drift er inkludert det første året. Deretter fornyes driften årlig til prisen som står på nettsiden da. Domenet registreres for antall år du har valgt. Vi varsler deg på e-post før driften eller domenet må fornyes. Fornyer du ikke, kan nettsiden bli tatt ned.

## 10. Feil og mangler
Finner du feil i nettsiden etter levering, retter vi dem uten kostnad hvis du sier fra innen 30 dager. Nye ønsker etter levering regnes som ny bestilling.

## 11. Ansvar
Vi gjør vårt beste for at nettsiden alltid er tilgjengelig, men driften skjer hos en tredjepart (Vercel), og vi kan ikke garantere at den aldri er nede. Vi er ikke ansvarlige for indirekte tap, som tapt omsetning. Vårt ansvar er uansett begrenset til det du har betalt.

## 12. Personvern
Vi behandler opplysningene dine for å levere tjenesten. Les mer i personvernerklæringen.

## 13. Endringer og tvister
Vi kan endre vilkårene. Det som gjaldt da du bestilte, gjelder for din bestilling. Uenighet løses først i minnelighet. Forbrukere kan klage til Forbrukertilsynet. Norsk rett gjelder.`;

export const STANDARD_PERSONVERN = `## Hvem som er ansvarlig
{eier}, {sted}, er behandlingsansvarlig for opplysningene som samles inn på denne nettsiden. Kontakt: {epost}.

## Hva vi samler inn
Når du bestiller lagrer vi navn, e-post, telefonnummer, informasjon om bedriften din, beskrivelsen av nettsiden og filene du laster opp. Vi lagrer også hvilke e-poster vi har sendt deg.

## Hvorfor
Opplysningene brukes til å lage og levere nettsiden, sende deg utkast og kvitteringer og ta imot betaling. Grunnlaget er avtalen med deg.

## Hvem vi deler med
- **Supabase** lagrer bestillingene og filene.
- **Vipps** behandler betalingen. Vi ser navnet ditt, beløpet og meldingen du skriver.
- **Resend** sender e-postene.
- **OpenAI** kan analysere beskrivelsen og materiellet ditt for å foreslå innhold og struktur.
- **Vercel** drifter nettsidene.

## Hvor lenge
Vi lagrer bestillingen så lenge vi drifter nettsiden din, og regnskapsopplysninger så lenge bokføringsloven krever. Ubetalte bestillinger slettes etter 6 måneder.

## Dine rettigheter
Du kan be om innsyn, retting og sletting, og klage til Datatilsynet. Send en e-post til {epost}.`;

/** Fyller inn {eier}, {epost} osv. i vilkår og personvern. */
export function fyllInn(tekst: string, b: Bedrift): string {
  return tekst
    .replace(/\{eier\}/g, b.eier)
    .replace(/\{epost\}/g, b.epost)
    .replace(/\{sted\}/g, b.sted)
    .replace(/\{navn\}/g, b.navn)
    .replace(/\{telefon\}/g, b.telefon);
}
