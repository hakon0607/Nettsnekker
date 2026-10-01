/** Alt kunden kan velge mellom i bestillingen. */

export type Tema = {
  id: string;
  navn: string;
  stemning: string;
  /** bakgrunn, flate, tekst, hovedfarge, aksent */
  farger: { bg: string; flate: string; tekst: string; hoved: string; aksent: string };
  mork?: boolean;
};

export const TEMAER: Tema[] = [
  { id: 'fjord', navn: 'Fjord', stemning: 'Rolig og tillitsvekkende', farger: { bg: '#F3F7FA', flate: '#FFFFFF', tekst: '#14212B', hoved: '#1E5A86', aksent: '#5FB2D9' } },
  { id: 'gran', navn: 'Granskog', stemning: 'Naturlig og jordnær', farger: { bg: '#F2F5F1', flate: '#FFFFFF', tekst: '#16231D', hoved: '#2F6B4F', aksent: '#C9A227' } },
  { id: 'nordlys', navn: 'Nordlys', stemning: 'Moderne og mørk', mork: true, farger: { bg: '#0E1420', flate: '#172133', tekst: '#E8EEF8', hoved: '#4BE3B0', aksent: '#9B7BFF' } },
  { id: 'kobber', navn: 'Kobber', stemning: 'Varm og håndverksmessig', farger: { bg: '#FAF5F0', flate: '#FFFFFF', tekst: '#2A1E17', hoved: '#A4532A', aksent: '#2F5D62' } },
  { id: 'rosa', navn: 'Moltekrem', stemning: 'Myk og vennlig', farger: { bg: '#FFF6F4', flate: '#FFFFFF', tekst: '#2B1C1F', hoved: '#D2557A', aksent: '#F2A541' } },
  { id: 'kontor', navn: 'Kontor', stemning: 'Profesjonell og nøktern', farger: { bg: '#F5F6F8', flate: '#FFFFFF', tekst: '#1A1D24', hoved: '#2B3A55', aksent: '#E4572E' } },
  { id: 'sitrus', navn: 'Sitrus', stemning: 'Energisk og frisk', farger: { bg: '#FBFCF2', flate: '#FFFFFF', tekst: '#1E2210', hoved: '#5C8A00', aksent: '#FF7A1A' } },
  { id: 'kull', navn: 'Kull', stemning: 'Eksklusiv og stram', mork: true, farger: { bg: '#121212', flate: '#1D1D1D', tekst: '#F2EFEA', hoved: '#D8B26E', aksent: '#F2EFEA' } },
  { id: 'lavendel', navn: 'Lyng', stemning: 'Kreativ og personlig', farger: { bg: '#F7F5FC', flate: '#FFFFFF', tekst: '#221D33', hoved: '#6A4FC9', aksent: '#E26D9B' } },
  { id: 'hav', navn: 'Havgap', stemning: 'Sporty og tydelig', farger: { bg: '#F1F8F8', flate: '#FFFFFF', tekst: '#0F2626', hoved: '#007C80', aksent: '#FFB000' } },
];

export const STILER = [
  { id: 'minimal', navn: 'Minimalistisk', tekst: 'Mye luft, få elementer' },
  { id: 'leken', navn: 'Leken', tekst: 'Runde former og litt bevegelse' },
  { id: 'eksklusiv', navn: 'Eksklusiv', tekst: 'Store bilder og elegant typografi' },
  { id: 'robust', navn: 'Robust', tekst: 'Tydelig, kraftig og praktisk' },
  { id: 'naturlig', navn: 'Naturlig', tekst: 'Varme farger og organiske former' },
  { id: 'teknisk', navn: 'Teknisk', tekst: 'Presis, moderne og strukturert' },
];

export const BRANSJER = [
  'Frisør og skjønnhet', 'Håndverker', 'Restaurant og kafé', 'Butikk', 'Trening og helse', 'Konsulent',
  'Kunst og foto', 'Bilverksted', 'Rengjøring', 'Forening og lag', 'Arrangement', 'Annet',
];

export const MAL = [
  'Få flere henvendelser', 'Ta imot timebestillinger', 'Vise frem arbeidet vårt', 'Selge produkter',
  'Informere kundene', 'Se mer profesjonell ut', 'Rekruttere folk',
];

export const SIDER = [
  'Forside', 'Om oss', 'Tjenester', 'Priser', 'Galleri', 'Kontakt', 'Team', 'Anmeldelser', 'Spørsmål og svar', 'Meny', 'Kampanjer',
];

export const FUNKSJONER = [
  'Kontaktskjema', 'Kart og veibeskrivelse', 'Åpningstider', 'Lenker til sosiale medier', 'Kundeomtaler',
  'Bildegalleri', 'Ring-knapp på mobil', 'Nyhetsbrev-påmelding', 'Video', 'Instagram-feed',
];

/** Tips til hva kunden kan be om å kunne redigere i /admin */
export const ADMIN_TIPS = [
  { tekst: 'Endre priser', eksempel: 'Jeg vil kunne endre prislisten selv, med navn, pris og beskrivelse.' },
  { tekst: 'Legge til produkter', eksempel: 'Legge til, endre og skjule produkter med bilde, pris og lagerstatus.' },
  { tekst: 'Se bestillinger', eksempel: 'Se bestillinger fra nettsiden og merke dem som ferdig.' },
  { tekst: 'Endre åpningstider', eksempel: 'Endre åpningstider, også spesielle dager som jul og påske.' },
  { tekst: 'Laste opp bilder', eksempel: 'Laste opp og slette bilder i galleriet.' },
  { tekst: 'Endre tekster', eksempel: 'Endre tekstene på forsiden og «om oss».' },
  { tekst: 'Meldinger fra kontaktskjema', eksempel: 'Lese meldinger fra kontaktskjemaet og se hvem jeg har svart.' },
  { tekst: 'Styre timebestillinger', eksempel: 'Se, flytte og avlyse timebestillinger, og stenge dager jeg er borte.' },
  { tekst: 'Skrive nyheter', eksempel: 'Skrive nyheter med bilde som vises på forsiden.' },
  { tekst: 'Kampanjer og tilbud', eksempel: 'Legge ut et tilbud med sluttdato som vises øverst på siden.' },
  { tekst: 'Ansatte og team', eksempel: 'Legge til og fjerne ansatte med bilde og rolle.' },
  { tekst: 'Flere brukere', eksempel: 'Gi en ansatt egen innlogging til /admin.' },
];
