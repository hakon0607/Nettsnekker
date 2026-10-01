import type { PrisLinje } from './pricing';

export type Fil = { path: string; navn: string; type: string; storrelse: number; kategori: 'logo' | 'bilder' | 'dokumenter' };

export type Ordre = {
  id: string;
  ordrenr: string;
  created_at: string;
  updated_at: string;
  status: Status;
  kunde_navn: string;
  kunde_epost: string;
  kunde_telefon: string;
  kommentar: string;
  bedrift_navn: string;
  orgnr: string;
  bransje: string;
  beskrivelse: string;
  mal: string[];
  malgruppe: string;
  eksisterende_side: string;
  inspirasjon: string;
  tema: { id?: string; navn?: string; farger?: Record<string, string>; egenFarge?: string; stil?: string; mork?: boolean };
  sider: string[];
  egne_sider: string;
  funksjoner: string[];
  tillegg: Record<string, number>;
  onsker: string;
  admin_valgt: boolean;
  admin_onsker: string;
  domene_valg: 'nytt' | 'eget' | 'ingen';
  domene: string;
  domene_aar: number;
  domene_pris_nok: number;
  domene_fornyelse_nok: number;
  filer: Fil[];
  pris_linjer: PrisLinje[];
  gebyr: number;
  rest: number;
  total: number;
  rabatt: number;
  gebyr_betalt: boolean;
  gebyr_betalt_at: string | null;
  rest_betalt: boolean;
  rest_betalt_at: string | null;
  rest_lenke: string;
  rest_lenke_id: string;
  utkast_url: string;
  live_url: string;
  github_repo: string;
  endringsrunder_brukt: number;
  ai_brief: string;
  claude_prompt: string;
  notater: string;
  hosting_fornyes: string | null;
  domene_fornyes: string | null;
  vilkar_godtatt_at: string | null;
  bekreftelse_sendt: boolean;
};

export type Status =
  | 'venter_gebyr'
  | 'ny'
  | 'under_arbeid'
  | 'utkast_sendt'
  | 'endringer'
  | 'godkjent'
  | 'live'
  | 'levert'
  | 'avbrutt';

/** Rekkefølgen en bestilling går gjennom. */
export const STATUSER: { id: Status; navn: string; farge: string; forklaring: string }[] = [
  { id: 'venter_gebyr', navn: 'Venter på Vipps', farge: '#AAB7B3', forklaring: 'Kunden skal vippse bestillingsgebyret. Marker det som mottatt når du ser det i Vipps.' },
  { id: 'ny', navn: 'Ny', farge: '#F2B33D', forklaring: 'Gebyret er mottatt. Les bestillingen og lag prompten.' },
  { id: 'under_arbeid', navn: 'Snekres', farge: '#5FB2D9', forklaring: 'Du lager nettsiden.' },
  { id: 'utkast_sendt', navn: 'Utkast sendt', farge: '#9B7BFF', forklaring: 'Kunden ser på utkastet. Marker resten som mottatt når du ser den i Vipps.' },
  { id: 'endringer', navn: 'Endringer', farge: '#E26D9B', forklaring: 'Kunden vil ha endringer.' },
  { id: 'godkjent', navn: 'Betalt', farge: '#43A284', forklaring: 'Kunden har godkjent og vippset resten. Koble på domenet.' },
  { id: 'live', navn: 'Live', farge: '#1F6F5C', forklaring: 'Nettsiden er publisert på domenet.' },
  { id: 'levert', navn: 'Levert', farge: '#16473C', forklaring: 'Alt er sendt og ferdig.' },
  { id: 'avbrutt', navn: 'Avbrutt', farge: '#C2453D', forklaring: 'Bestillingen er stoppet.' },
];

export function statusInfo(s: string) {
  return STATUSER.find((x) => x.id === s) ?? STATUSER[0];
}
