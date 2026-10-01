import { NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { getStripe } from '@/lib/stripe';
import { getServiceClient } from '@/lib/supabase/server';
import { gebyrBetalt, restBetalt } from '@/lib/betaling';
import { loggHendelse } from '@/lib/hendelse';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Stripe kaller denne når en betaling er fullført.
 * Legg inn https://DIN-SIDE/api/stripe/webhook i Stripe → Developers → Webhooks,
 * med hendelsen checkout.session.completed.
 */
export async function POST(request: Request) {
  const stripe = getStripe();
  const service = getServiceClient();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !service || !secret) return NextResponse.json({ error: 'Ikke satt opp' }, { status: 503 });

  const signatur = request.headers.get('stripe-signature') ?? '';
  const raw = await request.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(raw, signatur, secret);
  } catch {
    return NextResponse.json({ error: 'Ugyldig signatur' }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded') {
    const s = event.data.object as Stripe.Checkout.Session;
    if (s.payment_status !== 'paid') return NextResponse.json({ ok: true });

    let orderId = s.metadata?.order_id ?? '';
    let type = s.metadata?.type ?? '';

    // Betalingslenker: finn bestillingen via lenken
    if (!orderId && s.payment_link) {
      const lenkeId = typeof s.payment_link === 'string' ? s.payment_link : s.payment_link.id;
      const { data } = await service.from('orders').select('id').eq('rest_lenke_id', lenkeId).maybeSingle();
      if (data) {
        orderId = data.id;
        type = 'rest';
      } else {
        const lenke = await stripe.paymentLinks.retrieve(lenkeId);
        orderId = lenke.metadata?.order_id ?? '';
        type = lenke.metadata?.type ?? '';
      }
    }
    if (!orderId) return NextResponse.json({ ok: true });

    const belop = `${((s.amount_total ?? 0) / 100).toLocaleString('nb-NO')} kr`;
    if (type === 'gebyr') await gebyrBetalt(service, orderId, s.id);
    else if (type === 'rest') await restBetalt(service, orderId, `${belop} via Stripe`);
    else await loggHendelse(service, orderId, `Betaling mottatt (${type || 'annet'})`, belop);
  }

  return NextResponse.json({ ok: true });
}
