import { NextResponse } from 'next/server';
import { krevAdmin } from '@/lib/auth';
import { gebyrBetalt, restBetalt, sendBekreftelse } from '@/lib/betaling';
import type { Ordre } from '@/lib/ordre';

export const dynamic = 'force-dynamic';

/** Handlinger som sender e-post eller må gjøres på serveren. */
export async function POST(request: Request) {
  const a = await krevAdmin(request);
  if (a.feil) return a.feil;
  const b = (await request.json().catch(() => ({}))) as { orderId?: string; handling?: string };
  const { data } = await a.service.from('orders').select('*').eq('id', b.orderId ?? '').maybeSingle();
  if (!data) return NextResponse.json({ error: 'Fant ikke bestillingen.' }, { status: 404 });
  const o = data as Ordre;

  switch (b.handling) {
    case 'gebyr_betalt':
      await gebyrBetalt(a.service, o.id, `markert av ${a.epost}`);
      break;
    case 'rest_betalt':
      await restBetalt(a.service, o.id, `markert av ${a.epost}`);
      break;
    case 'send_bekreftelse_pa_nytt':
      await a.service.from('orders').update({ bekreftelse_sendt: false }).eq('id', o.id);
      await sendBekreftelse(a.service, { ...o, bekreftelse_sendt: false });
      break;
    default:
      return NextResponse.json({ error: 'Ukjent handling.' }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
