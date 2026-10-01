import type { Fil } from './ordre';
import type { Valg } from './pricing';

/** Alt kunden fyller ut i bestillingen. Sendes til /api/bestilling. */
export type Skjema = {
  utkastId: string;
  // bedriften
  bedriftNavn: string;
  orgnr: string;
  bransje: string;
  beskrivelse: string;
  mal: string[];
  malgruppe: string;
  eksisterendeSide: string;
  inspirasjon: string;
  // utseende
  temaId: string;
  egenFarge: string;
  stil: string;
  // innhold
  sider: string[];
  egneSider: string;
  funksjoner: string[];
  onsker: string;
  tillegg: Record<string, number>;
  // admin
  admin: boolean;
  adminOnsker: string;
  // domene
  domene: Valg['domene'];
  // filer
  filer: Fil[];
  // kontakt
  navn: string;
  epost: string;
  telefon: string;
  kommentar: string;
  vilkar: boolean;
  /** honeypot – skal være tom */
  nettsted?: string;
};

export const TOMT_SKJEMA: Skjema = {
  utkastId: '',
  bedriftNavn: '',
  orgnr: '',
  bransje: '',
  beskrivelse: '',
  mal: [],
  malgruppe: '',
  eksisterendeSide: '',
  inspirasjon: '',
  temaId: 'fjord',
  egenFarge: '',
  stil: 'minimal',
  sider: ['Forside', 'Om oss', 'Tjenester', 'Kontakt'],
  egneSider: '',
  funksjoner: ['Kontaktskjema', 'Ring-knapp på mobil'],
  onsker: '',
  tillegg: {},
  admin: false,
  adminOnsker: '',
  domene: { valg: 'nytt', navn: '', aar: 1 },
  filer: [],
  navn: '',
  epost: '',
  telefon: '',
  kommentar: '',
  vilkar: false,
};

export function tilValg(s: Skjema): Valg {
  const egne = s.egneSider.split(',').map((x) => x.trim()).filter(Boolean);
  return { sider: [...s.sider, ...egne], admin: s.admin, tillegg: s.tillegg, domene: s.domene };
}

export const gyldigEpost = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e.trim());
