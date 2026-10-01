'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useAdmin } from '@/components/admin/AdminProvider';
import { useMaler } from '@/components/admin/useMaler';
import { useInnstillinger } from '@/components/admin/useInnstillinger';
import { EpostModal, EpostVisning, type SendtEpost } from '@/components/admin/EpostSender';
import { Kort, Sidetopp, Tom, dato } from '@/components/admin/ui';
import { PLASSHOLDERE, STANDARD_MALER, lagEpost, verdierFor, type Mal } from '@/lib/maler';
import { EKSEMPEL_ORDRE } from '@/lib/eksempelordre';

export default function Epost() {
  const [fane, setFane] = useState<'sendt' | 'maler'>('sendt');
  return (
    <div>
      <Sidetopp
        tittel="E-post"
        tekst="Alt som er sendt til kunder, og malene du bruker. E-poster sendes fra bestillingen under fanen «E-post»."
        handling={
          <div className="flex gap-1.5">
            <button className="pill" data-on={fane === 'sendt'} onClick={() => setFane('sendt')}>Sendt</button>
            <button className="pill" data-on={fane === 'maler'} onClick={() => setFane('maler')}>Maler</button>
          </div>
        }
      />
      {fane === 'sendt' ? <Sendt /> : <Maler />}
    </div>
  );
}

function Sendt() {
  const { sb } = useAdmin();
  const [liste, setListe] = useState<(SendtEpost & { orders?: { bedrift_navn: string; ordrenr: string } | null })[]>([]);
  const [vis, setVis] = useState<SendtEpost | null>(null);
  const [sok, setSok] = useState('');
  const [bareFeil, setBareFeil] = useState(false);

  useEffect(() => {
    const hent = async () => {
      const { data } = await sb.from('sent_emails').select('*, orders(bedrift_navn, ordrenr)').order('created_at', { ascending: false }).limit(500);
      setListe((data as never) ?? []);
    };
    hent();
    const k = sb.channel('alle-epost').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'sent_emails' }, hent).subscribe();
    return () => {
      sb.removeChannel(k);
    };
  }, [sb]);

  const synlige = liste.filter((e) => (!bareFeil || !e.ok) && (!sok || `${e.til} ${e.emne} ${e.orders?.bedrift_navn ?? ''}`.toLowerCase().includes(sok.toLowerCase())));

  return (
    <Kort>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <input className="field max-w-xs" placeholder="Søk mottaker, emne, bedrift …" value={sok} onChange={(e) => setSok(e.target.value)} aria-label="Søk" />
        <button className="pill" data-on={bareFeil} onClick={() => setBareFeil((v) => !v)}>Bare feilet ({liste.filter((e) => !e.ok).length})</button>
        <span className="text-sm text-ink-500">{liste.length} e-poster</span>
      </div>
      {synlige.length === 0 ? (
        <Tom tekst="Ingen e-poster her ennå." />
      ) : (
        <ul className="divide-y divide-white/70">
          {synlige.map((e) => (
            <li key={e.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <button className="min-w-0 flex-1 text-left" onClick={() => setVis(e)}>
                <span className="flex items-center gap-2 font-semibold">
                  <span className={`h-2 w-2 shrink-0 rounded-full ${e.ok ? 'bg-gran-500' : 'bg-red-500'}`} />
                  <span className="truncate">{e.emne}</span>
                </span>
                <span className="block text-sm text-ink-500">
                  {e.til} · {dato(e.created_at, true)} · {e.sendt_av}
                  {!e.ok && <span className="text-red-600"> · {e.feil}</span>}
                </span>
              </button>
              {e.order_id && e.orders && (
                <Link href={`/admin/bestillinger/${e.order_id}`} className="shrink-0 rounded-full bg-white/60 px-3 py-1.5 text-xs font-semibold text-gran-700 hover:bg-white">
                  {e.orders.bedrift_navn} · {e.orders.ordrenr}
                </Link>
              )}
            </li>
          ))}
        </ul>
      )}
      <EpostModal e={vis} lukk={() => setVis(null)} />
    </Kort>
  );
}

function Maler() {
  const { sb, toast } = useAdmin();
  const { maler, endret, hentPaNytt } = useMaler();
  const { inn } = useInnstillinger();
  const [valgt, setValgt] = useState('bestilling_mottatt');
  const [utkast, setUtkast] = useState<Mal | null>(null);
  const [lagrer, setLagrer] = useState(false);

  const mal = maler.find((m) => m.key === valgt);
  useEffect(() => {
    if (mal) setUtkast({ ...mal });
  }, [mal?.key, mal?.emne, mal?.innhold, mal?.navn]); // eslint-disable-line react-hooks/exhaustive-deps

  const forhand = useMemo(() => {
    if (!utkast || !inn) return null;
    const v = verdierFor(EKSEMPEL_ORDRE, inn.bedrift, inn.priser, location.origin);
    return lagEpost(utkast, EKSEMPEL_ORDRE, v, inn.bedrift);
  }, [utkast, inn]);

  const erStandard = STANDARD_MALER.some((m) => m.key === valgt);
  const harEndring = utkast && mal && (utkast.emne !== mal.emne || utkast.innhold !== mal.innhold || utkast.navn !== mal.navn || utkast.beskrivelse !== mal.beskrivelse);

  const lagre = async () => {
    if (!utkast) return;
    setLagrer(true);
    const { error } = await sb.from('email_templates').upsert({ ...utkast, updated_at: new Date().toISOString() });
    setLagrer(false);
    if (error) return toast(error.message, 'feil');
    toast('Malen er lagret');
    hentPaNytt();
  };

  const tilbakestill = async () => {
    if (!confirm(erStandard ? 'Gå tilbake til standardteksten?' : 'Slette denne malen?')) return;
    await sb.from('email_templates').delete().eq('key', valgt);
    toast(erStandard ? 'Malen er tilbakestilt' : 'Malen er slettet');
    if (!erStandard) setValgt('fritt');
    hentPaNytt();
  };

  const ny = async () => {
    const navn = prompt('Hva skal malen hete?');
    if (!navn) return;
    const key = navn.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') || `mal_${Date.now()}`;
    const { error } = await sb.from('email_templates').insert({ key, navn, beskrivelse: '', emne: navn, innhold: 'Hei {fornavn}!\n\n\n\nHilsen {vart_navn}', automatisk: false, sort: 95 });
    if (error) return toast(error.message, 'feil');
    await hentPaNytt();
    setValgt(key);
  };

  return (
    <div className="grid gap-5 xl:grid-cols-[260px_1fr]">
      <Kort className="h-max">
        <ul className="space-y-1">
          {maler.map((m) => (
            <li key={m.key}>
              <button className={`w-full rounded-xl px-3 py-2.5 text-left text-sm transition ${valgt === m.key ? 'bg-ink-900 text-white' : 'hover:bg-white/60'}`} onClick={() => setValgt(m.key)}>
                <span className="block font-semibold">{m.navn}</span>
                <span className={`block text-xs ${valgt === m.key ? 'text-white/60' : 'text-ink-500'}`}>
                  {m.automatisk ? 'Sendes automatisk' : 'Sendes manuelt'}
                  {endret.has(m.key) && ' · endret'}
                </span>
              </button>
            </li>
          ))}
        </ul>
        <button className="btn-ghost btn-sm mt-3 w-full" onClick={ny}>+ Ny mal</button>
      </Kort>

      {utkast && (
        <div className="grid gap-5 2xl:grid-cols-2">
          <Kort
            tittel={utkast.navn}
            handling={
              <div className="flex gap-2">
                {endret.has(valgt) && <button className="btn-ghost btn-sm" onClick={tilbakestill}>{erStandard ? 'Tilbakestill' : 'Slett'}</button>}
                <button className="btn-primary btn-sm" onClick={lagre} disabled={!harEndring || lagrer}>{lagrer ? 'Lagrer …' : 'Lagre mal'}</button>
              </div>
            }
          >
            <div className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="label" htmlFor="mnavn">Navn</label>
                  <input id="mnavn" className="field" value={utkast.navn} onChange={(e) => setUtkast({ ...utkast, navn: e.target.value })} />
                </div>
                <div>
                  <label className="label" htmlFor="mbes">Når brukes den?</label>
                  <input id="mbes" className="field" value={utkast.beskrivelse} onChange={(e) => setUtkast({ ...utkast, beskrivelse: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="label" htmlFor="memne">Emne</label>
                <input id="memne" className="field" value={utkast.emne} onChange={(e) => setUtkast({ ...utkast, emne: e.target.value })} />
              </div>
              <div>
                <label className="label" htmlFor="minn">Innhold</label>
                <textarea id="minn" className="field min-h-[380px] font-mono text-[13px] leading-relaxed" value={utkast.innhold} onChange={(e) => setUtkast({ ...utkast, innhold: e.target.value })} />
              </div>
              <details className="rounded-2xl bg-white/50 p-4 text-sm">
                <summary className="cursor-pointer font-semibold">Felt du kan bruke og skrivemåte</summary>
                <p className="mt-3 text-ink-600">
                  <code>**fet**</code> · <code>- punkt</code> · <code>[knapp: Tekst | {'{lenke}'}]</code> · <code>[boks] … [/boks]</code> (uten tomme linjer inni) · tom linje = nytt avsnitt
                </p>
                <ul className="mt-3 grid gap-1 sm:grid-cols-2">
                  {PLASSHOLDERE.map((p) => (
                    <li key={p.navn}>
                      <code className="text-gran-700">{`{${p.navn}}`}</code> <span className="text-ink-500">{p.forklaring}</span>
                    </li>
                  ))}
                </ul>
              </details>
            </div>
          </Kort>
          <Kort tittel="Forhåndsvisning (med eksempelkunde)">
            {forhand && (
              <>
                <p className="mb-2 truncate rounded-xl bg-white/60 px-3 py-2 text-sm"><span className="text-ink-500">Emne:</span> <strong>{forhand.emne}</strong></p>
                <EpostVisning html={forhand.html} hoyde={700} />
              </>
            )}
          </Kort>
        </div>
      )}
    </div>
  );
}
