import type { SupabaseClient } from '@supabase/supabase-js';
import type { Ordre } from './ordre';
import { sendMal, varsleEier } from './epost';
import { loggHendelse } from './hendelse';

/**
 * Markerer bestillingsgebyret som betalt og sender e-postene.
 * Trygg å kalle flere ganger (webhook + bekreftelsessiden): bare den
 * første som faktisk endrer raden sender e-post.
 */
export async function gebyrBetalt(service: SupabaseClient, orderId: string, sessionId = '') {
  const { data } = await service
    .from('orders')
    .update({
      gebyr_betalt: true,
      gebyr_betalt_at: new Date().toISOString(),
      gebyr_session_id: sessionId,
      status: 'ny',
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId)
    .eq('gebyr_betalt', false)
    .select('*')
    .maybeSingle();
  if (!data) return; // allerede behandlet
  const ordre = data as Ordre;
  await loggHendelse(service, ordre.id, 'Bestillingsgebyr betalt', sessionId);
  await sendBekreftelse(service, ordre);
}

export async function sendBekreftelse(service: SupabaseClient, ordre: Ordre) {
  const { data } = await service
    .from('orders')
    .update({ bekreftelse_sendt: true })
    .eq('id', ordre.id)
    .eq('bekreftelse_sendt', false)
    .select('id')
    .maybeSingle();
  if (!data) return;
  await sendMal(service, ordre, 'bestilling_mottatt');
  await varsleEier(service, ordre);
}

/** Kunden har godkjent og betalt resten. */
export async function restBetalt(service: SupabaseClient, orderId: string, detalj = '') {
  const iDag = new Date();
  const omEttAar = new Date(iDag);
  omEttAar.setFullYear(iDag.getFullYear() + 1);
  const { data } = await service
    .from('orders')
    .update({
      rest_betalt: true,
      rest_betalt_at: iDag.toISOString(),
      status: 'godkjent',
      hosting_fornyes: omEttAar.toISOString().slice(0, 10),
      updated_at: iDag.toISOString(),
    })
    .eq('id', orderId)
    .eq('rest_betalt', false)
    .select('*')
    .maybeSingle();
  if (!data) return;
  const ordre = data as Ordre;
  if (ordre.domene_valg === 'nytt' && ordre.domene) {
    const d = new Date(iDag);
    d.setFullYear(iDag.getFullYear() + (ordre.domene_aar || 1));
    await service.from('orders').update({ domene_fornyes: d.toISOString().slice(0, 10) }).eq('id', ordre.id);
  }
  await loggHendelse(service, ordre.id, 'Godkjent og betalt', detalj);
  await sendMal(service, ordre, 'betaling_mottatt');
}
