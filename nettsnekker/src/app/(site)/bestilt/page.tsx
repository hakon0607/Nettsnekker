import type { Metadata } from 'next';
import Link from 'next/link';
import { getServiceClient } from '@/lib/supabase/server';
import { getStripe } from '@/lib/stripe';
import { gebyrBetalt } from '@/lib/betaling';
import { hentInnstillinger } from '@/lib/settings';
import { kr } from '@/lib/pricing';
import type { Ordre } from '@/lib/ordre';
import { TomUtkast } from '@/components/TomUtkast';
import { Feiring } from '@/components/Feiring';

export const metadata: Metadata = { title: 'Takk for bestillingen', robots: { index: false } };
export const dynamic = 'force-dynamic';

export default async function Bestilt({ searchParams }: { searchParams: { ordre?: string; session_id?: string } }) {
  const inn = await hentInnstillinger();
  const service = getServiceClient();
  let ordre: Ordre | null = null;

  if (service && searchParams.ordre && /^[0-9a-f-]{36}$/i.test(searchParams.ordre)) {
    // Bekreft betalingen direkte hos Stripe, i tilfelle webhooken er treg
    const stripe = getStripe();
    if (stripe && searchParams.session_id) {
      try {
        const okt = await stripe.checkout.sessions.retrieve(searchParams.session_id);
        if (okt.payment_status === 'paid' && okt.metadata?.order_id === searchParams.ordre) {
          await gebyrBetalt(service, searchParams.ordre, okt.id);
        }
      } catch {
        /* webhooken tar det */
      }
    }
    const { data } = await service.from('orders').select('*').eq('id', searchParams.ordre).maybeSingle();
    ordre = (data as Ordre) ?? null;
  }

  return (
    <section className="wrap max-w-3xl pb-10 pt-32 sm:pt-40">
      <TomUtkast />
      <Feiring />
      <div className="glass rounded-[32px] p-6 sm:p-10">
        <div className="grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-b from-gran-500 to-gran-700 text-3xl text-white shadow-lift">✓</div>
        <h1 className="mt-6 text-balance text-4xl sm:text-5xl">Takk{ordre ? `, ${ordre.kunde_navn.split(' ')[0]}` : ''}!</h1>
        <p className="mt-4 max-w-xl text-lg leading-relaxed text-ink-600">{inn.tekster.bestiltTekst}</p>

        {ordre && (
          <div className="mt-8 rounded-2xl bg-white/60 p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="font-semibold">Bestilling {ordre.ordrenr}</p>
              <p className="text-sm text-ink-500">Kvittering er sendt til {ordre.kunde_epost}</p>
            </div>
            <ul className="mt-3 divide-y divide-ink-100 text-sm">
              {ordre.pris_linjer.map((l) => (
                <li key={l.navn} className="flex justify-between gap-3 py-2">
                  <span className="text-ink-700">{l.navn}</span>
                  <span className="price font-semibold">{kr(l.belop)}</span>
                </li>
              ))}
              <li className="flex justify-between gap-3 py-2">
                <span className="text-ink-700">Bestillingsgebyr {ordre.gebyr_betalt ? '(betalt)' : ''}</span>
                <span className="price font-semibold">{kr(ordre.gebyr)}</span>
              </li>
              <li className="flex justify-between gap-3 pt-3">
                <span className="font-semibold">Betales når du godkjenner</span>
                <span className="price font-display text-2xl font-bold text-gran-700">{kr(ordre.rest)}</span>
              </li>
            </ul>
          </div>
        )}

        <ol className="mt-8 space-y-3 text-ink-700">
          <li><strong className="text-ink-900">1.</strong> Vi går gjennom bestillingen og begynner å snekre.</li>
          <li><strong className="text-ink-900">2.</strong> Du får lenke til utkastet på e-post, vanligvis innen {inn.priser.leveringstid}.</li>
          <li><strong className="text-ink-900">3.</strong> Er du fornøyd, godkjenner og betaler du i samme e-post.</li>
        </ol>
        <Link href="/" className="btn-ghost mt-8">Til forsiden</Link>
      </div>
    </section>
  );
}
