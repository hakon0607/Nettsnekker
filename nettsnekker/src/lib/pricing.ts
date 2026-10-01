/**
 * Priser og kalkulator. Brukes både i nettleseren (live pris) og på serveren
 * (der prisen alltid regnes ut på nytt, så ingen kan jukse med prisen).
 * Alle tall kan endres i /admin/priser.
 */

export type Tillegg = {
  id: string;
  navn: string;
  beskrivelse: string;
  pris: number;
  /** 'fast' = av/på, 'antall' = per stk (f.eks. språk) */
  type: 'fast' | 'antall';
  maks?: number;
  /** Krever at /admin er valgt (f.eks. nettbutikk) */
  kreverAdmin?: boolean;
  aktiv: boolean;
};

export type Priser = {
  gebyr: number;
  grunnpakke: number;
  inkluderteSider: number;
  ekstraSide: number;
  inkluderteEndringsrunder: number;
  admin: number;
  tillegg: Tillegg[];
  domene: {
    aktiv: boolean;
    /** NOK per USD */
    kurs: number;
    paslagProsent: number;
    fastPaslag: number;
    maksAar: number;
    endelser: string[];
  };
  hostingPerAar: number;
  hostingTekst: string;
  mvaTekst: string;
  leveringstid: string;
};

export const STANDARD_PRISER: Priser = {
  gebyr: 99,
  grunnpakke: 1999,
  inkluderteSider: 5,
  ekstraSide: 149,
  inkluderteEndringsrunder: 2,
  admin: 999,
  tillegg: [
    {
      id: 'booking',
      navn: 'Timebestilling',
      beskrivelse: 'Kundene bestiller time direkte på siden. Du ser og styrer avtalene i /admin.',
      pris: 799,
      type: 'fast',
      kreverAdmin: true,
      aktiv: true,
    },
    {
      id: 'nettbutikk',
      navn: 'Nettbutikk (betaling ved henting)',
      beskrivelse:
        'Produkter med bilder og priser. Kundene legger inn bestilling, og du får den i /admin. Betaling skjer ved henting eller levering, ikke på nettsiden.',
      pris: 1299,
      type: 'fast',
      kreverAdmin: true,
      aktiv: true,
    },
    {
      id: 'sprak',
      navn: 'Ekstra språk',
      beskrivelse: 'Hele nettsiden på et språk til, for eksempel engelsk. Pris per språk.',
      pris: 499,
      type: 'antall',
      maks: 5,
      aktiv: true,
    },
    {
      id: 'blogg',
      navn: 'Nyheter / blogg',
      beskrivelse: 'Egen side med innlegg du skriver selv i /admin.',
      pris: 399,
      type: 'fast',
      kreverAdmin: true,
      aktiv: true,
    },
    {
      id: 'endringsrunde',
      navn: 'Ekstra endringsrunde',
      beskrivelse: 'Flere runder med endringer etter at du har sett utkastet.',
      pris: 299,
      type: 'antall',
      maks: 5,
      aktiv: true,
    },
    {
      id: 'ekspress',
      navn: 'Ekspress',
      beskrivelse: 'Første utkast innen 48 timer.',
      pris: 699,
      type: 'fast',
      aktiv: true,
    },
  ],
  domene: {
    aktiv: true,
    kurs: 11,
    paslagProsent: 25,
    fastPaslag: 0,
    maksAar: 10,
    endelser: ['com', 'net', 'org', 'site', 'online', 'shop', 'store', 'app', 'dev', 'io'],
  },
  hostingPerAar: 490,
  hostingTekst: 'Hosting er inkludert det første året. Deretter {hosting} kr per år, som dekker drift, sikkerhet og oppdateringer.',
  mvaTekst: 'Alle priser er oppgitt uten merverdiavgift, fordi selger ikke er registrert i Merverdiavgiftsregisteret.',
  leveringstid: '5–10 virkedager',
};

/** Slår sammen lagrede priser med standardverdier, så nye felt alltid finnes. */
export function medStandard(p?: Partial<Priser> | null): Priser {
  if (!p) return STANDARD_PRISER;
  return {
    ...STANDARD_PRISER,
    ...p,
    domene: { ...STANDARD_PRISER.domene, ...(p.domene ?? {}) },
    tillegg: Array.isArray(p.tillegg) ? p.tillegg : STANDARD_PRISER.tillegg,
  };
}

export type Valg = {
  sider: string[];
  admin: boolean;
  /** id -> antall (1 for fast) */
  tillegg: Record<string, number>;
  domene: {
    valg: 'nytt' | 'eget' | 'ingen';
    navn: string;
    aar: number;
    /** Pris i NOK for første år og fornyelse, slik serveren regnet den ut ved søk */
    prisNok?: number;
    fornyelseNok?: number;
  };
};

export type PrisLinje = { navn: string; belop: number; detalj?: string };

export type Prisresultat = {
  linjer: PrisLinje[];
  gebyr: number;
  rest: number;
  total: number;
  ekstraSider: number;
  adminTvunget: boolean;
};

/** Pris på et nytt domene i NOK, med påslag, avrundet opp til nærmeste 10 kr. */
export function domenePrisNok(usd: number, p: Priser): number {
  const nok = usd * p.domene.kurs * (1 + p.domene.paslagProsent / 100) + p.domene.fastPaslag;
  return Math.ceil(nok / 10) * 10;
}

export function domeneTotal(prisNok: number, fornyelseNok: number, aar: number): number {
  return prisNok + fornyelseNok * Math.max(0, aar - 1);
}

export function regnUt(valg: Valg, p: Priser): Prisresultat {
  const linjer: PrisLinje[] = [];
  linjer.push({
    navn: 'Nettside – grunnpakke',
    belop: p.grunnpakke,
    detalj: `Inntil ${p.inkluderteSider} sider, ${p.inkluderteEndringsrunder} endringsrunder, kontaktskjema, SEO og hosting første år`,
  });

  const ekstraSider = Math.max(0, valg.sider.length - p.inkluderteSider);
  if (ekstraSider > 0) {
    linjer.push({ navn: `${ekstraSider} ekstra ${ekstraSider === 1 ? 'side' : 'sider'}`, belop: ekstraSider * p.ekstraSide });
  }

  let adminTvunget = false;
  for (const t of p.tillegg) {
    if (!t.aktiv) continue;
    const antall = Math.max(0, Math.min(t.maks ?? 1, Math.floor(valg.tillegg[t.id] ?? 0)));
    if (!antall) continue;
    if (t.kreverAdmin) adminTvunget = true;
    linjer.push({
      navn: t.type === 'antall' && antall > 1 ? `${t.navn} × ${antall}` : t.navn,
      belop: t.pris * (t.type === 'antall' ? antall : 1),
    });
  }

  if (valg.admin || adminTvunget) {
    linjer.push({ navn: 'Adminside (/admin)', belop: p.admin, detalj: 'Rediger innholdet selv' });
  }

  if (p.domene.aktiv && valg.domene.valg === 'nytt' && valg.domene.navn && valg.domene.prisNok) {
    const aar = Math.max(1, Math.min(p.domene.maksAar, Math.floor(valg.domene.aar || 1)));
    linjer.push({
      navn: `Domene ${valg.domene.navn}`,
      belop: domeneTotal(valg.domene.prisNok, valg.domene.fornyelseNok ?? valg.domene.prisNok, aar),
      detalj: `${aar} år`,
    });
  }

  const rest = linjer.reduce((s, l) => s + l.belop, 0);
  return { linjer, gebyr: p.gebyr, rest, total: rest + p.gebyr, ekstraSider, adminTvunget };
}

export function kr(n: number): string {
  return `${Math.round(n).toLocaleString('nb-NO')} kr`;
}
