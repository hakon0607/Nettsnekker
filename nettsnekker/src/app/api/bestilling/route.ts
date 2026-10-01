import { NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabase/server';
import { hentInnstillinger, sideUrl } from '@/lib/settings';
import { regnUt } from '@/lib/pricing';
import { TEMAER, STILER } from '@/lib/valg';
import { gyldigEpost, tilValg, type Skjema } from '@/lib/skjema';
import { getStripe } from '@/lib/stripe';
import { sokDomener } from '@/lib/domene';
import { sendBekreftelse } from '@/lib/betaling';
import { loggHendelse } from '@/lib/hendelse';
import type { Ordre } from '@/lib/ordre';

export const dynamic = 'force-dynamic';

const kort = (s: unknown, maks = 4000) => String(s ?? '').trim().slice(0, maks);

export async function POST(request: Request) {
  const service = getServiceClient();
  if (!service) {
    return NextResponse.json({ error: 'Bestilling er ikke satt opp ennå (Supabase mangler).' }, { status: 503 });
  }

  let s: Skjema;
  try {
    s = (await request.json()) as Skjema;
  } catch {
    return NextResponse.json({ error: 'Ugyldig bestilling.' }, { status: 400 });
  }

  // Robotfelle
  if (s.nettsted) return NextResponse.json({ ok: true, url: '/bestilt' });

  const feil: string[] = [];
  if (!kort(s.bedriftNavn)) feil.push('navnet på bedriften');
  if (kort(s.beskrivelse).length < 10) feil.push('en beskrivelse av bedriften');
  if (!kort(s.navn)) feil.push('navnet ditt');
  if (!gyldigEpost(String(s.epost ?? ''))) feil.push('en gyldig e-post');
  if (!s.vilkar) feil.push('at du godtar vilkårene');
  if (feil.length) return NextResponse.json({ error: `Mangler ${feil.join(', ')}.` }, { status: 400 });

  const inn = await hentInnstillinger();
  const p = inn.priser;

  // Domenepris sjekkes på nytt her, så ingen kan sende inn en lavere pris.
  const valg = tilValg(s);
  let domeneNotat = '';
  if (valg.domene.valg === 'nytt' && valg.domene.navn) {
    valg.domene.navn = valg.domene.navn.toLowerCase().trim();
    try {
      const [treff] = await sokDomener([valg.domene.navn], p);
      if (treff?.ledig && treff.prisNok) {
        valg.domene.prisNok = treff.prisNok;
        valg.domene.fornyelseNok = treff.fornyelseNok ?? treff.prisNok;
      } else {
        domeneNotat = 'Domenet var ikke ledig da bestillingen ble sendt – avtal nytt domene med kunden.';
        valg.domene.prisNok = undefined;
      }
    } catch {
      domeneNotat = 'Domenesøket virket ikke da bestillingen ble sendt – sjekk pris og ledighet manuelt.';
      valg.domene.prisNok = undefined;
    }
  }

  const pris = regnUt(valg, p);
  const tema = TEMAER.find((t) => t.id === s.temaId) ?? TEMAER[0];
  const stil = STILER.find((x) => x.id === s.stil)?.navn ?? '';
  const utkastId = kort(s.utkastId, 64).replace(/[^a-zA-Z0-9-]/g, '');
  const filer = (Array.isArray(s.filer) ? s.filer : [])
    .filter((f) => typeof f?.path === 'string' && f.path.startsWith(`utkast/${utkastId}/`))
    .slice(0, 40);

  const { data, error } = await service
    .from('orders')
    .insert({
      status: 'venter_gebyr',
      kunde_navn: kort(s.navn, 200),
      kunde_epost: kort(s.epost, 200).toLowerCase(),
      kunde_telefon: kort(s.telefon, 50),
      kommentar: kort(s.kommentar),
      bedrift_navn: kort(s.bedriftNavn, 200),
      orgnr: kort(s.orgnr, 20),
      bransje: kort(s.bransje, 100),
      beskrivelse: kort(s.beskrivelse, 6000),
      mal: (s.mal ?? []).map((x) => kort(x, 100)).slice(0, 20),
      malgruppe: kort(s.malgruppe, 1000),
      eksisterende_side: kort(s.eksisterendeSide, 500),
      inspirasjon: kort(s.inspirasjon, 2000),
      tema: { id: tema.id, navn: tema.navn, farger: tema.farger, mork: !!tema.mork, egenFarge: kort(s.egenFarge, 9), stil },
      sider: (s.sider ?? []).map((x) => kort(x, 80)).slice(0, 40),
      egne_sider: kort(s.egneSider, 500),
      funksjoner: (s.funksjoner ?? []).map((x) => kort(x, 80)).slice(0, 40),
      tillegg: s.tillegg ?? {},
      onsker: kort(s.onsker, 6000),
      admin_valgt: pris.linjer.some((l) => l.navn.startsWith('Adminside')),
      admin_onsker: kort(s.adminOnsker, 6000),
      domene_valg: valg.domene.valg,
      domene: kort(valg.domene.navn, 253),
      domene_aar: valg.domene.valg === 'nytt' ? Math.max(1, Math.min(p.domene.maksAar, valg.domene.aar || 1)) : 0,
      domene_pris_nok: valg.domene.prisNok ?? 0,
      domene_fornyelse_nok: valg.domene.fornyelseNok ?? 0,
      filer,
      pris_linjer: pris.linjer,
      gebyr: pris.gebyr,
      rest: pris.rest,
      total: pris.total,
      notater: domeneNotat,
      vilkar_godtatt_at: new Date().toISOString(),
    })
    .select('*')
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'Kunne ikke lagre bestillingen. Prøv igjen om litt.' }, { status: 500 });
  }
  const ordre = data as Ordre;
  await loggHendelse(service, ordre.id, 'Bestilling sendt', `${ordre.kunde_navn} · ${ordre.bedrift_navn}`);

  const stripe = getStripe();
  const base = sideUrl();

  if (stripe && pris.gebyr > 0) {
    try {
      const okt = await stripe.checkout.sessions.create({
        mode: 'payment',
        customer_email: ordre.kunde_epost,
        locale: 'nb',
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: 'nok',
              unit_amount: Math.round(pris.gebyr * 100),
              product_data: {
                name: `Bestillingsgebyr – nettside til ${ordre.bedrift_navn}`,
                description: `Bestilling ${ordre.ordrenr}. Resten (${pris.rest} kr) betales når du har godkjent utkastet.`,
              },
            },
          },
        ],
        metadata: { order_id: ordre.id, type: 'gebyr' },
        payment_intent_data: { metadata: { order_id: ordre.id, type: 'gebyr' }, description: `${ordre.ordrenr} gebyr` },
        success_url: `${base}/bestilt?ordre=${ordre.id}&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${base}/bestill?avbrutt=1`,
      });
      await service.from('orders').update({ gebyr_session_id: okt.id }).eq('id', ordre.id);
      return NextResponse.json({ ok: true, url: okt.url });
    } catch (e) {
      return NextResponse.json(
        { error: `Kunne ikke starte betalingen: ${e instanceof Error ? e.message : 'ukjent feil'}` },
        { status: 502 }
      );
    }
  }

  // Uten Stripe (eller gebyr 0): bestillingen regnes som mottatt med en gang.
  await service
    .from('orders')
    .update({ status: 'ny', gebyr_betalt: pris.gebyr === 0 })
    .eq('id', ordre.id);
  await sendBekreftelse(service, { ...ordre, status: 'ny' });
  return NextResponse.json({ ok: true, url: `/bestilt?ordre=${ordre.id}` });
}
