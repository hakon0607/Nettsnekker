import { NextResponse } from 'next/server';
import { krevAdmin } from '@/lib/auth';
import { sendMal } from '@/lib/epost';
import { loggHendelse } from '@/lib/hendelse';
import type { Ordre } from '@/lib/ordre';

export const dynamic = 'force-dynamic';

/** Sender en e-postmal til kunden (eller en annen adresse) og logger den. */
export async function POST(request: Request) {
  const a = await krevAdmin(request);
  if (a.feil) return a.feil;

  const b = (await request.json().catch(() => ({}))) as {
    orderId?: string;
    mal?: string;
    til?: string;
    emne?: string;
    innhold?: string;
    ekstra?: Record<string, string>;
  };
  if (!b.orderId || !b.mal) return NextResponse.json({ error: 'Mangler bestilling eller mal.' }, { status: 400 });

  const { data } = await a.service.from('orders').select('*').eq('id', b.orderId).maybeSingle();
  if (!data) return NextResponse.json({ error: 'Fant ikke bestillingen.' }, { status: 404 });

  const res = await sendMal(a.service, data as Ordre, b.mal, {
    til: b.til,
    emne: b.emne,
    innhold: b.innhold,
    ekstra: b.ekstra,
    sendtAv: a.epost,
  });
  if (res.ok) await loggHendelse(a.service, b.orderId, 'E-post sendt', b.emne ?? b.mal);
  return NextResponse.json(res, { status: res.ok ? 200 : 502 });
}
