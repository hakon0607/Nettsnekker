import type { SupabaseClient } from '@supabase/supabase-js';

export async function loggHendelse(service: SupabaseClient, orderId: string, hva: string, detalj = '') {
  await service.from('order_events').insert({ order_id: orderId, hva, detalj });
}
