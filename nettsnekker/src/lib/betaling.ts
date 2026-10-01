import type { SupabaseClient } from '@supabase/supabase-js';
import type { Ordre } from './ordre';
import { sendMal, varsleEier } from './epost';
import { loggHendelse } from './hendelse';

/**
 * Sender bekreftelse til kunden (med Vipps-info) og varsel til deg.
 * Trygg å kalle flere ganger: e-posten sendes bare én gang.
 */
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

/** Du har sett gebyret i Vipps og markerer det som betalt. */
export async function gebyrBetalt(service: SupabaseClient, orderId: string, detalj = '') {
  const { data } = await service
    .from('orders')
    .update({
      gebyr_betalt: true,
      gebyr_betalt_at: new Date().toISOString(),
      status: 'ny',
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId)
    .eq('gebyr_betalt', false)
    .select('*')
    .maybeSingle();
  if (!data) return; // allerede markert
  const ordre = data as Ordre;
  await loggHendelse(service, ordre.id, 'Bestillingsgebyr mottatt (Vipps)', detalj);
  await sendMal(service, ordre, 'gebyr_mottatt');
}

/** Kunden har godkjent og vippset resten. */
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
  await loggHendelse(service, ordre.id, 'Godkjent og betalt (Vipps)', detalj);
  await sendMal(service, ordre, 'betaling_mottatt');
}
