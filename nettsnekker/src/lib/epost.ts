import type { SupabaseClient } from '@supabase/supabase-js';
import type { Ordre } from './ordre';
import { STANDARD_MALER, lagEpost, verdierFor, type Mal } from './maler';
import { hentInnstillinger, sideUrl } from './settings';

export function epostKlar(): boolean {
  return !!process.env.RESEND_API_KEY;
}

export function avsender(navn: string): string {
  return process.env.EPOST_AVSENDER || `${navn} <onboarding@resend.dev>`;
}

/** Sender én e-post med Resend. Returnerer feilmelding hvis noe gikk galt. */
export async function sendViaResend(opts: {
  fra: string;
  til: string;
  emne: string;
  html: string;
  tekst: string;
  svarTil?: string;
}): Promise<{ ok: boolean; feil?: string }> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return { ok: false, feil: 'RESEND_API_KEY mangler i Vercel.' };
  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: opts.fra,
        to: [opts.til],
        subject: opts.emne,
        html: opts.html,
        text: opts.tekst,
        ...(opts.svarTil ? { reply_to: opts.svarTil } : {}),
      }),
    });
    if (!r.ok) {
      const j = (await r.json().catch(() => ({}))) as { message?: string };
      return { ok: false, feil: j.message || `Resend svarte ${r.status}` };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, feil: e instanceof Error ? e.message : 'Ukjent feil' };
  }
}

/** Henter alle maler: standard fra koden, overstyrt av det som er lagret i Supabase. */
export async function hentMaler(service: SupabaseClient | null): Promise<Mal[]> {
  const lagret: Record<string, Partial<Mal>> = {};
  if (service) {
    const { data } = await service.from('email_templates').select('*');
    for (const m of (data as Mal[] | null) ?? []) lagret[m.key] = m;
  }
  const alle = STANDARD_MALER.map((m) => ({ ...m, ...(lagret[m.key] ?? {}) }));
  for (const [key, m] of Object.entries(lagret)) {
    if (!alle.find((x) => x.key === key)) alle.push({ ...(m as Mal) });
  }
  return alle.sort((a, b) => a.sort - b.sort);
}

/**
 * Sender en mal for en bestilling og logger den i sent_emails.
 * emne/innhold kan overstyres (når du redigerer før sending i admin).
 */
export async function sendMal(
  service: SupabaseClient,
  ordre: Ordre,
  malKey: string,
  opts: { til?: string; emne?: string; innhold?: string; sendtAv?: string; ekstra?: Record<string, string> } = {}
): Promise<{ ok: boolean; feil?: string }> {
  const inn = await hentInnstillinger();
  const maler = await hentMaler(service);
  const mal = maler.find((m) => m.key === malKey);
  if (!mal) return { ok: false, feil: `Fant ikke malen «${malKey}».` };

  const verdier = { ...verdierFor(ordre, inn.bedrift, inn.priser, sideUrl()), ...(opts.ekstra ?? {}) };
  const e = lagEpost({ emne: opts.emne ?? mal.emne, innhold: opts.innhold ?? mal.innhold }, ordre, verdier, inn.bedrift);
  const til = (opts.til || ordre.kunde_epost).trim();

  const res = await sendViaResend({
    fra: avsender(inn.bedrift.navn),
    til,
    emne: e.emne,
    html: e.html,
    tekst: e.tekst,
    svarTil: inn.bedrift.epost || undefined,
  });

  await service.from('sent_emails').insert({
    order_id: ordre.id,
    mal: malKey,
    til,
    emne: e.emne,
    html: e.html,
    ok: res.ok,
    feil: res.feil ?? '',
    sendt_av: opts.sendtAv ?? 'automatisk',
  });
  return res;
}

/** Varsel til eier(e) om ny bestilling. */
export async function varsleEier(service: SupabaseClient, ordre: Ordre) {
  const inn = await hentInnstillinger();
  const mottakere = new Set<string>();
  for (const e of (inn.bedrift.varselEpost || '').split(',')) if (e.trim()) mottakere.add(e.trim());
  for (const e of (process.env.ADMIN_EMAILS || '').split(',')) if (e.trim()) mottakere.add(e.trim());
  if (!mottakere.size) {
    const { data } = await service.from('admins').select('email');
    for (const a of (data as { email: string }[] | null) ?? []) mottakere.add(a.email);
  }
  for (const til of mottakere) await sendMal(service, ordre, 'ny_bestilling_eier', { til });
}
