import { NextResponse } from 'next/server';
import { krevAdmin } from '@/lib/auth';
import { getStripe } from '@/lib/stripe';
import { sideUrl } from '@/lib/settings';
import { loggHendelse } from '@/lib/hendelse';
import type { Ordre } from '@/lib/ordre';

export const dynamic = 'force-dynamic';

/**
 * Lager en Stripe-betalingslenke. Lenken utløper ikke, og kan bare betales én gang.
 * type 'rest' = godkjenn og betal resten (lagres på bestillingen)
 * type 'fornyelse' / 'annet' = valgfritt beløp, f.eks. hosting neste år
 */
export async function POST(request: Request) {
  const a = await krevAdmin(request);
  if (a.feil) return a.feil;
  const stripe = getStripe();
  if (!stripe) return NextResponse.json({ error: 'STRIPE_SECRET_KEY mangler i Vercel.' }, { status: 503 });

  const b = (await request.json().catch(() => ({}))) as {
    orderId?: string;
    type?: 'rest' | 'fornyelse' | 'annet';
    belop?: number;
    beskrivelse?: string;
  };
  const { data } = await a.service.from('orders').select('*').eq('id', b.orderId ?? '').maybeSingle();
  if (!data) return NextResponse.json({ error: 'Fant ikke bestillingen.' }, { status: 404 });
  const o = data as Ordre;
  const type = b.type ?? 'rest';
  const belop = Math.round(Number(type === 'rest' ? o.rest : b.belop) || 0);
  if (belop < 3) return NextResponse.json({ error: 'Beløpet må være minst 3 kr.' }, { status: 400 });

  const navn =
    type === 'rest'
      ? `Nettside til ${o.bedrift_navn} – godkjenning og restbetaling`
      : b.beskrivelse || `Nettside til ${o.bedrift_navn}`;

  try {
    const pris = await stripe.prices.create({
      currency: 'nok',
      unit_amount: belop * 100,
      product_data: { name: navn.slice(0, 240) },
    });
    const lenke = await stripe.paymentLinks.create({
      line_items: [{ price: pris.id, quantity: 1 }],
      metadata: { order_id: o.id, type },
      payment_intent_data: { metadata: { order_id: o.id, type }, description: `${o.ordrenr} ${type}` },
      restrictions: { completed_sessions: { limit: 1 } },
      after_completion: { type: 'redirect', redirect: { url: `${sideUrl()}/takk?ordre=${o.id}` } },
    });
    if (type === 'rest') {
      await a.service.from('orders').update({ rest_lenke: lenke.url, rest_lenke_id: lenke.id }).eq('id', o.id);
    }
    await loggHendelse(a.service, o.id, 'Betalingslenke laget', `${type}: ${belop} kr`);
    return NextResponse.json({ url: lenke.url, id: lenke.id });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Stripe-feil' }, { status: 502 });
  }
}
