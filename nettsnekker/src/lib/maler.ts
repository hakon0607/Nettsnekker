import type { Ordre } from './ordre';
import type { Bedrift } from './innhold';
import { kr, type Priser } from './pricing';

/**
 * E-postmaler. Disse er standardene. Endrer du en mal i /admin/epost,
 * lagres den i Supabase og brukes i stedet.
 *
 * Skrivemåte i innholdet:
 *   Vanlig tekst blir avsnitt. Tom linje = nytt avsnitt.
 *   [knapp: Se utkastet | {utkast_url}]   → stor knapp
 *   [boks] ... [/boks]                       → farget boks
 *   **fet tekst**
 *   - punkt                                  → punktliste
 */

export type Mal = {
  key: string;
  navn: string;
  beskrivelse: string;
  emne: string;
  innhold: string;
  automatisk: boolean;
  sort: number;
};

export const STANDARD_MALER: Mal[] = [
  {
    key: 'bestilling_mottatt',
    navn: 'Bestilling mottatt',
    beskrivelse: 'Sendes automatisk til kunden med en gang bestillingen er sendt. Inneholder hvordan gebyret betales med Vipps.',
    automatisk: true,
    sort: 10,
    emne: 'Vi har fått bestillingen din ({ordrenr})',
    innhold: `Hei {fornavn}!

Takk for bestillingen. Vi har fått alt vi trenger for å begynne på nettsiden til **{bedrift_navn}**.

[boks]
**Betal bestillingsgebyret med Vipps**
- Beløp: **{gebyr}**
- Til: **{vipps}** ({vipps_navn})
- Skriv **{ordrenr}** i meldingen
[/boks]

Vi starter så snart gebyret er kommet inn.

[boks]
**Slik går det videre**
- Vi går gjennom bestillingen og begynner å snekre.
- Du får en e-post med lenke til utkastet når det er klart, vanligvis innen {leveringstid}.
- Er du fornøyd, vippser du resten med bestillingsnummeret i meldingen.
- Vi kobler på domenet og sender deg alt du trenger.
[/boks]

**Bestillingsnummer:** {ordrenr}
**Betales nå:** {gebyr}
**Betales ved godkjenning:** {rest}

{prisliste}

Har du flere bilder eller tekster du vil sende? Svar på denne e-posten, så legger vi dem til.

Hilsen {vart_navn}`,
  },
  {
    key: 'ny_bestilling_eier',
    navn: 'Varsel til deg: ny bestilling',
    beskrivelse: 'Sendes automatisk til deg når en ny bestilling kommer inn.',
    automatisk: true,
    sort: 15,
    emne: 'Ny bestilling: {bedrift_navn} ({ordrenr}) – {total}',
    innhold: `Ny bestilling fra **{kunde}** ({epost}, {telefon}).

Kunden skal vippse **{gebyr}** med meldingen **{ordrenr}**. Marker gebyret som betalt i admin når det har kommet.

**Bedrift:** {bedrift_navn}
**Bransje:** {bransje}
**Tema:** {tema}
**Admin:** {admin}
**Domene:** {domene}

{prisliste}

[knapp: Åpne bestillingen | {admin_ordre_url}]`,
  },
  {
    key: 'gebyr_mottatt',
    navn: 'Gebyr mottatt',
    beskrivelse: 'Sendes automatisk når du markerer bestillingsgebyret som betalt.',
    automatisk: true,
    sort: 18,
    emne: 'Betalingen er mottatt – nå starter vi ({ordrenr})',
    innhold: `Hei {fornavn}!

Vi har mottatt {gebyr} for bestilling {ordrenr}. Takk!

Nå begynner vi på nettsiden til **{bedrift_navn}**. Du får en e-post med lenke til utkastet når det er klart, vanligvis innen {leveringstid}.

Hilsen {vart_navn}`,
  },
  {
    key: 'arbeid_startet',
    navn: 'Vi har startet',
    beskrivelse: 'Si fra at du har begynt på nettsiden.',
    automatisk: false,
    sort: 20,
    emne: 'Nå snekrer vi nettsiden til {bedrift_navn}',
    innhold: `Hei {fornavn}!

Bare en kort beskjed om at vi har begynt på nettsiden til {bedrift_navn}. Du hører fra oss igjen når utkastet er klart.

Hvis du kommer på noe mer du vil ha med, er det bare å svare på denne e-posten.

Hilsen {vart_navn}`,
  },
  {
    key: 'trenger_info',
    navn: 'Vi trenger mer informasjon',
    beskrivelse: 'Når du mangler bilder, tekster eller svar fra kunden.',
    automatisk: false,
    sort: 25,
    emne: 'Vi trenger litt mer fra deg ({ordrenr})',
    innhold: `Hei {fornavn}!

For å gjøre nettsiden til {bedrift_navn} så god som mulig trenger vi litt mer fra deg:

- Skriv hva som mangler her

Svar på denne e-posten med det du har, så fortsetter vi med en gang.

Hilsen {vart_navn}`,
  },
  {
    key: 'utkast_klart',
    navn: 'Utkastet er klart',
    beskrivelse: 'Lenke til utkastet, og hvordan kunden godkjenner ved å vippse resten.',
    automatisk: false,
    sort: 30,
    emne: 'Utkastet til nettsiden din er klart',
    innhold: `Hei {fornavn}!

Nå er første utkast av nettsiden til **{bedrift_navn}** klart. Ta en titt, gjerne både på mobil og PC.

[knapp: Se utkastet | {utkast_url}]

Utkastet ligger foreløpig på en midlertidig adresse.

[boks]
**Er du fornøyd? Godkjenn med Vipps**
- Beløp: **{rest}**
- Til: **{vipps}** ({vipps_navn})
- Skriv **{ordrenr}** i meldingen
[/boks]

Betalingen er godkjenningen din. Når den har kommet inn, kobler vi på {domene_tekst}.

**Vil du endre noe?** Svar på denne e-posten med alt du vil endre samlet. Du har {endringsrunder_igjen} av {endringsrunder} endringsrunder igjen.

Hilsen {vart_navn}`,
  },
  {
    key: 'nytt_utkast',
    navn: 'Nytt utkast etter endringer',
    beskrivelse: 'Når du har gjort endringene kunden ba om.',
    automatisk: false,
    sort: 35,
    emne: 'Endringene er gjort – se det nye utkastet',
    innhold: `Hei {fornavn}!

Vi har gjort endringene du ba om. Ta en ny titt:

[knapp: Se det nye utkastet | {utkast_url}]

Er alt som det skal, godkjenner du ved å vippse **{rest}** til **{vipps}** med meldingen **{ordrenr}**.

Du har {endringsrunder_igjen} endringsrunder igjen.

Hilsen {vart_navn}`,
  },
  {
    key: 'betalingspaminnelse',
    navn: 'Påminnelse om godkjenning',
    beskrivelse: 'Hvis kunden ikke har svart på utkastet eller ikke har vippset.',
    automatisk: false,
    sort: 40,
    emne: 'Har du fått sett på utkastet?',
    innhold: `Hei {fornavn}!

Vi ville bare høre om du har fått sett på utkastet til nettsiden til {bedrift_navn}.

[knapp: Se utkastet | {utkast_url}]

Er du fornøyd, godkjenner du ved å vippse **{rest}** til **{vipps}** med meldingen **{ordrenr}**.

Vil du endre noe, er det bare å svare på denne e-posten.

Hilsen {vart_navn}`,
  },
  {
    key: 'betaling_mottatt',
    navn: 'Betaling mottatt',
    beskrivelse: 'Sendes automatisk når du markerer resten som betalt.',
    automatisk: true,
    sort: 50,
    emne: 'Takk! Nettsiden er godkjent ({ordrenr})',
    innhold: `Hei {fornavn}!

Takk for betalingen på {rest}. Nettsiden til {bedrift_navn} er nå godkjent.

Vi kobler på {domene_tekst} og gjør de siste justeringene. Du får en e-post når alt er live. Det tar vanligvis 1–2 dager, fordi nye domener kan bruke litt tid på å bli synlige overalt.

**Totalt betalt:** {total}

Hilsen {vart_navn}`,
  },
  {
    key: 'nettside_live',
    navn: 'Nettsiden er live',
    beskrivelse: 'Når domenet er koblet til. Inneholder innlogging til /admin hvis kunden har kjøpt det.',
    automatisk: false,
    sort: 60,
    emne: '{bedrift_navn} er på nett!',
    innhold: `Hei {fornavn}!

Nå er nettsiden til **{bedrift_navn}** på nett:

[knapp: Åpne {live_url} | {live_url}]

{admin_tekst}

[boks]
**Godt å vite**
- Hosting er inkludert til {hosting_dato}. Vi sier fra i god tid før det må fornyes.
- Finner du feil de neste 30 dagene, retter vi dem gratis.
- Del gjerne nettsiden på sosiale medier og legg den inn i Google-profilen din.
[/boks]

Takk for at du valgte oss!

Hilsen {vart_navn}`,
  },
  {
    key: 'fornyelse',
    navn: 'Fornyelse av hosting/domene',
    beskrivelse: 'Varsel før hosting eller domene må fornyes.',
    automatisk: false,
    sort: 70,
    emne: 'Snart tid for å fornye nettsiden til {bedrift_navn}',
    innhold: `Hei {fornavn}!

Hostingen for {live_url} er betalt til {hosting_dato}. For å holde nettsiden på nett videre koster det {hosting_pris} for neste år.

[boks]
**Betal med Vipps**
- Beløp: **{hosting_pris}**
- Til: **{vipps}** ({vipps_navn})
- Skriv **{ordrenr} fornyelse** i meldingen
[/boks]

Har du spørsmål, er det bare å svare på denne e-posten.

Hilsen {vart_navn}`,
  },
  {
    key: 'fritt',
    navn: 'Egen melding',
    beskrivelse: 'Tom mal du skriver selv.',
    automatisk: false,
    sort: 90,
    emne: 'Angående nettsiden til {bedrift_navn}',
    innhold: `Hei {fornavn}!



Hilsen {vart_navn}`,
  },
];

/** Alle plassholdere som kan brukes i malene, med forklaring. */
export const PLASSHOLDERE: { navn: string; forklaring: string }[] = [
  { navn: 'kunde', forklaring: 'Fullt navn på kunden' },
  { navn: 'fornavn', forklaring: 'Fornavnet til kunden' },
  { navn: 'epost', forklaring: 'E-posten til kunden' },
  { navn: 'telefon', forklaring: 'Telefonen til kunden' },
  { navn: 'bedrift_navn', forklaring: 'Navnet på kundens bedrift' },
  { navn: 'bransje', forklaring: 'Bransjen' },
  { navn: 'ordrenr', forklaring: 'Bestillingsnummer, f.eks. NS-1001' },
  { navn: 'gebyr', forklaring: 'Bestillingsgebyret' },
  { navn: 'rest', forklaring: 'Det som betales ved godkjenning' },
  { navn: 'total', forklaring: 'Totalpris' },
  { navn: 'prisliste', forklaring: 'Hele prisoversikten' },
  { navn: 'utkast_url', forklaring: 'Lenke til utkastet (.vercel.app)' },
  { navn: 'vipps', forklaring: 'Vipps-nummeret kundene betaler til' },
  { navn: 'vipps_navn', forklaring: 'Navnet som vises i Vipps' },
  { navn: 'live_url', forklaring: 'Adressen der siden er live' },
  { navn: 'domene', forklaring: 'Domenet' },
  { navn: 'domene_tekst', forklaring: '«domenet ditt eksempel.no» eller tilsvarende' },
  { navn: 'admin', forklaring: '«Ja» eller «Nei»' },
  { navn: 'admin_tekst', forklaring: 'Avsnitt om innlogging til /admin (tomt hvis ikke kjøpt)' },
  { navn: 'endringsrunder', forklaring: 'Antall endringsrunder totalt' },
  { navn: 'endringsrunder_igjen', forklaring: 'Antall endringsrunder igjen' },
  { navn: 'hosting_dato', forklaring: 'Dato hostingen er betalt til' },
  { navn: 'hosting_pris', forklaring: 'Årspris for hosting' },
  { navn: 'leveringstid', forklaring: 'Vanlig leveringstid' },
  { navn: 'tema', forklaring: 'Fargetemaet kunden valgte' },
  { navn: 'vart_navn', forklaring: 'Navnet på Nettsnekker' },
  { navn: 'admin_ordre_url', forklaring: 'Lenke til bestillingen i ditt adminpanel' },
];

const esc = (s: string) =>
  String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function datoNo(d: string | null | undefined): string {
  if (!d) return 'ett år etter levering';
  return new Date(d).toLocaleDateString('nb-NO', { day: 'numeric', month: 'long', year: 'numeric' });
}

/** Regner ut verdiene som byttes inn i malene. */
export function verdierFor(o: Ordre, b: Bedrift, p: Priser, siteUrl: string): Record<string, string> {
  const tilleggRunder = Number(o.tillegg?.endringsrunde ?? 0);
  const runder = p.inkluderteEndringsrunder + tilleggRunder;
  const domeneTekst =
    o.domene_valg !== 'ingen' && o.domene ? `domenet ditt ${o.domene}` : 'en fast adresse';
  const adminUrl = (o.live_url || o.utkast_url || '').replace(/\/$/, '') + '/admin';
  return {
    kunde: o.kunde_navn,
    fornavn: (o.kunde_navn || '').split(' ')[0] || o.kunde_navn,
    epost: o.kunde_epost,
    telefon: o.kunde_telefon || '–',
    bedrift_navn: o.bedrift_navn,
    bransje: o.bransje || '–',
    ordrenr: o.ordrenr,
    gebyr: kr(o.gebyr),
    rest: kr(o.rest),
    total: kr(o.total),
    prisliste: '__PRISLISTE__',
    utkast_url: o.utkast_url || '(utkast-lenke mangler)',
    vipps: b.vippsNummer || '(Vipps-nummer mangler)',
    vipps_navn: b.vippsNavn || b.eier,
    live_url: o.live_url || (o.domene ? `https://${o.domene}` : '(live-adresse mangler)'),
    domene: o.domene || 'ikke valgt',
    domene_tekst: domeneTekst,
    admin: o.admin_valgt ? 'Ja' : 'Nei',
    admin_tekst: o.admin_valgt
      ? `**Din adminside:** ${adminUrl}\nDu får en egen e-post fra innloggingssystemet der du lager passordet ditt. Der kan du endre det vi avtalte.`
      : '',
    endringsrunder: String(runder),
    endringsrunder_igjen: String(Math.max(0, runder - (o.endringsrunder_brukt || 0))),
    hosting_dato: datoNo(o.hosting_fornyes),
    hosting_pris: kr(p.hostingPerAar),
    leveringstid: p.leveringstid,
    tema: o.tema?.navn ? `${o.tema.navn}${o.tema.egenFarge ? ` (egen farge ${o.tema.egenFarge})` : ''}` : '–',
    vart_navn: b.navn,
    admin_ordre_url: `${siteUrl}/admin/bestillinger/${o.id}`,
  };
}

export function fyllMal(tekst: string, v: Record<string, string>): string {
  return tekst.replace(/\{([a-z_]+)\}/g, (m, k) => (k in v ? v[k] : m));
}

/** Gjør maltekst om til HTML-innhold (uten ramme). */
function innholdTilHtml(tekst: string, o: Ordre | null, farge: string): string {
  const blokker = tekst.replace(/\r/g, '').split(/\n{2,}/);
  const inline = (s: string) =>
    esc(s)
      .replace(/\*\*(.+?)\*\*/g, '<strong style="color:#10201C;">$1</strong>')
      .replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" style="color:' + farge + ';font-weight:600;">$1</a>')
      .replace(/\n/g, '<br/>');

  const prisliste = () => {
    if (!o) return '';
    const rader = (o.pris_linjer ?? [])
      .map(
        (l) =>
          `<tr><td style="padding:9px 0;border-bottom:1px solid #E7ECEA;color:#36433F;">${esc(l.navn)}${
            l.detalj ? `<div style="font-size:12px;color:#7F8E89;">${esc(l.detalj)}</div>` : ''
          }</td><td align="right" style="padding:9px 0;border-bottom:1px solid #E7ECEA;font-weight:600;white-space:nowrap;color:#10201C;">${esc(kr(l.belop))}</td></tr>`
      )
      .join('');
    return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:6px 0 18px;font-size:14px;">
      ${rader}
      ${o.rabatt ? `<tr><td style="padding:9px 0;color:#1F6F5C;">Rabatt</td><td align="right" style="padding:9px 0;color:#1F6F5C;font-weight:600;">−${esc(kr(o.rabatt))}</td></tr>` : ''}
      <tr><td style="padding:9px 0;color:#36433F;">Bestillingsgebyr</td><td align="right" style="padding:9px 0;font-weight:600;">${esc(kr(o.gebyr))}</td></tr>
      <tr><td style="padding:12px 0 0;font-weight:800;color:#10201C;">Totalt</td><td align="right" style="padding:12px 0 0;font-weight:800;font-size:18px;color:${farge};">${esc(kr(o.total))}</td></tr>
    </table>`;
  };

  return blokker
    .map((b) => {
      const t = b.trim();
      if (!t) return '';
      if (t === '__PRISLISTE__') return prisliste();
      const knapp = t.match(/^\[knapp:\s*(.+?)\s*\|\s*(.+?)\s*\]$/);
      if (knapp) {
        const url = knapp[2];
        const gyldig = /^https?:\/\//.test(url);
        return `<p style="margin:22px 0;"><a href="${esc(gyldig ? url : '#')}" style="display:inline-block;background:${farge};color:#ffffff;text-decoration:none;font-weight:700;font-size:15px;padding:14px 26px;border-radius:999px;">${esc(knapp[1])}</a>${
          gyldig ? '' : '<br/><span style="color:#C2453D;font-size:12px;">Lenken mangler – legg den inn før du sender.</span>'
        }</p>`;
      }
      if (t.startsWith('[boks]')) {
        const indre = t.replace(/^\[boks\]\s*/, '').replace(/\s*\[\/boks\]$/, '');
        return `<div style="background:#EDF7F3;border-radius:16px;padding:16px 18px;margin:18px 0;">${innholdTilHtml(indre, o, farge)}</div>`;
      }
      const linjer = t.split('\n');
      if (linjer.every((l) => l.trim().startsWith('- '))) {
        return `<ul style="margin:0 0 14px;padding-left:20px;color:#36433F;">${linjer
          .map((l) => `<li style="margin:0 0 6px;">${inline(l.trim().slice(2))}</li>`)
          .join('')}</ul>`;
      }
      // Første linje kan være overskrift (fet) etterfulgt av punktliste
      if (linjer.length > 1 && linjer.slice(1).every((l) => l.trim().startsWith('- '))) {
        return `<p style="margin:0 0 8px;color:#36433F;">${inline(linjer[0])}</p><ul style="margin:0 0 14px;padding-left:20px;color:#36433F;">${linjer
          .slice(1)
          .map((l) => `<li style="margin:0 0 6px;">${inline(l.trim().slice(2))}</li>`)
          .join('')}</ul>`;
      }
      return `<p style="margin:0 0 14px;font-size:15px;line-height:1.65;color:#36433F;">${inline(t)}</p>`;
    })
    .join('\n');
}

/** Lager hele e-posten (emne + HTML + ren tekst) fra en mal og en bestilling. */
export function lagEpost(
  mal: { emne: string; innhold: string },
  o: Ordre | null,
  verdier: Record<string, string>,
  b: Bedrift
): { emne: string; html: string; tekst: string } {
  const farge = '#1F6F5C';
  const emne = fyllMal(mal.emne, verdier).replace(/__PRISLISTE__/g, '');
  const fylt = fyllMal(mal.innhold, verdier);
  const kropp = innholdTilHtml(fylt, o, farge);
  const html = `<!doctype html>
<html lang="nb"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>${esc(emne)}</title></head>
<body style="margin:0;padding:0;background:#EEF2F0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#10201C;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#EEF2F0;padding:28px 12px;"><tr><td align="center">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:580px;">
    <tr><td style="padding:0 6px 14px;">
      <table role="presentation" cellpadding="0" cellspacing="0"><tr>
        <td style="width:34px;height:34px;border-radius:10px;background:${farge};color:#fff;font-weight:800;font-size:16px;text-align:center;">N</td>
        <td style="padding-left:10px;font-weight:800;font-size:16px;color:#10201C;">${esc(b.navn)}</td>
      </tr></table>
    </td></tr>
    <tr><td style="background:#FFFFFF;border-radius:24px;padding:32px 30px;box-shadow:0 20px 50px -30px rgba(16,32,28,.45);">
      <div style="height:3px;width:64px;border-radius:3px;background:#F2B33D;margin:0 0 22px;"></div>
      ${kropp}
    </td></tr>
    <tr><td style="padding:18px 8px;text-align:center;font-size:12px;line-height:1.6;color:#7F8E89;">
      ${esc(b.navn)} · ${esc(b.eier)}${b.sted ? ` · ${esc(b.sted)}` : ''}<br/>Svar på denne e-posten hvis du lurer på noe.
    </td></tr>
  </table>
</td></tr></table></body></html>`;

  const tekst = fylt
    .replace(/__PRISLISTE__/g, o ? (o.pris_linjer ?? []).map((l) => `- ${l.navn}: ${kr(l.belop)}`).join('\n') + `\nTotalt: ${kr(o.total)}` : '')
    .replace(/\[knapp:\s*(.+?)\s*\|\s*(.+?)\s*\]/g, '$1: $2')
    .replace(/\[\/?boks\]/g, '')
    .replace(/\*\*/g, '');

  return { emne, html, tekst };
}
