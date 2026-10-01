'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAdmin } from './AdminProvider';
import { useMaler } from './useMaler';
import { Kort, Tom, dato } from './ui';
import { PLASSHOLDERE, lagEpost, verdierFor } from '@/lib/maler';
import type { Innstillinger } from '@/lib/innstillinger-felles';
import type { Ordre } from '@/lib/ordre';

export type SendtEpost = { id: string; order_id: string | null; mal: string; til: string; emne: string; html: string; ok: boolean; feil: string; sendt_av: string; created_at: string };

/** Viser en e-post i en iframe (så stilen ikke blander seg med adminpanelet). */
export function EpostVisning({ html, hoyde = 560 }: { html: string; hoyde?: number }) {
  return <iframe title="Forhåndsvisning av e-post" srcDoc={html} className="w-full rounded-2xl bg-white" style={{ height: hoyde }} sandbox="" />;
}

export function EpostModal({ e, lukk }: { e: SendtEpost | null; lukk: () => void }) {
  return (
    <AnimatePresence>
      {e && (
        <motion.div className="fixed inset-0 z-[90] grid place-items-center bg-ink-900/40 p-3 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={lukk}>
          <motion.div className="glass w-full max-w-2xl rounded-[26px] p-4" initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} onClick={(ev) => ev.stopPropagation()}>
            <div className="mb-3 flex items-start justify-between gap-3 px-1">
              <div>
                <p className="font-semibold">{e.emne}</p>
                <p className="text-sm text-ink-500">
                  Til {e.til} · {dato(e.created_at, true)} · {e.sendt_av}
                </p>
                {!e.ok && <p className="mt-1 text-sm text-red-600">Feilet: {e.feil}</p>}
              </div>
              <button className="btn-ghost btn-sm" onClick={lukk}>
                Lukk
              </button>
            </div>
            <EpostVisning html={e.html} hoyde={Math.min(640, typeof window !== 'undefined' ? window.innerHeight - 180 : 560)} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function EpostHistorikk({ ordreId }: { ordreId: string }) {
  const { sb } = useAdmin();
  const [liste, setListe] = useState<SendtEpost[]>([]);
  const [vis, setVis] = useState<SendtEpost | null>(null);
  useEffect(() => {
    const hent = async () => {
      const { data } = await sb.from('sent_emails').select('*').eq('order_id', ordreId).order('created_at', { ascending: false });
      setListe((data as SendtEpost[]) ?? []);
    };
    hent();
    const k = sb.channel(`epost-${ordreId}`).on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'sent_emails', filter: `order_id=eq.${ordreId}` }, hent).subscribe();
    return () => {
      sb.removeChannel(k);
    };
  }, [sb, ordreId]);

  return (
    <Kort tittel={`Sendte e-poster (${liste.length})`}>
      {liste.length === 0 ? (
        <Tom tekst="Ingen e-poster sendt til denne kunden ennå." />
      ) : (
        <ul className="space-y-2">
          {liste.map((e) => (
            <li key={e.id}>
              <button onClick={() => setVis(e)} className="flex w-full items-center justify-between gap-3 rounded-2xl bg-white/55 px-4 py-3 text-left text-sm transition hover:bg-white/90">
                <span className="min-w-0">
                  <span className="flex items-center gap-2 font-semibold">
                    <span className={`h-2 w-2 shrink-0 rounded-full ${e.ok ? 'bg-gran-500' : 'bg-red-500'}`} />
                    <span className="truncate">{e.emne}</span>
                  </span>
                  <span className="block text-ink-500">
                    {e.til} · {dato(e.created_at, true)}
                    {!e.ok && <span className="text-red-600"> · feilet</span>}
                  </span>
                </span>
                <span className="shrink-0 text-xs font-semibold text-gran-700">Vis</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      <EpostModal e={vis} lukk={() => setVis(null)} />
    </Kort>
  );
}

export function EpostSender({ ordre, inn, startMal, onSendt }: { ordre: Ordre; inn: Innstillinger; startMal?: string; onSendt?: (mal: string) => void }) {
  const { api, toast } = useAdmin();
  const { maler } = useMaler();
  const [malKey, setMalKey] = useState(startMal ?? 'utkast_klart');
  const [til, setTil] = useState(ordre.kunde_epost);
  const [emne, setEmne] = useState('');
  const [innhold, setInnhold] = useState('');
  const [sender, setSender] = useState(false);
  const tekstRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (startMal) setMalKey(startMal);
  }, [startMal]);

  const mal = maler.find((m) => m.key === malKey);
  useEffect(() => {
    if (mal) {
      setEmne(mal.emne);
      setInnhold(mal.innhold);
    }
  }, [mal?.key, mal?.emne, mal?.innhold]); // eslint-disable-line react-hooks/exhaustive-deps

  const verdier = useMemo(() => verdierFor(ordre, inn.bedrift, inn.priser, typeof window !== 'undefined' ? location.origin : ''), [ordre, inn]);
  const e = useMemo(() => lagEpost({ emne, innhold }, ordre, verdier, inn.bedrift), [emne, innhold, ordre, verdier, inn.bedrift]);

  const advarsler: string[] = [];
  if (/\{utkast_url\}/.test(innhold) && !ordre.utkast_url) advarsler.push('Utkast-lenken mangler. Legg den inn under «Fremdrift».');
  if (/\{vipps\}/.test(innhold) && !inn.bedrift.vippsNummer) advarsler.push('Vipps-nummeret mangler. Legg det inn under Innstillinger.');
  if (/\{live_url\}/.test(innhold) && !ordre.live_url && !ordre.domene) advarsler.push('Live-adressen mangler.');

  const settInn = (navn: string) => {
    const el = tekstRef.current;
    const t = `{${navn}}`;
    if (!el) return setInnhold((x) => x + t);
    const a = el.selectionStart;
    const b = el.selectionEnd;
    setInnhold((x) => x.slice(0, a) + t + x.slice(b));
    requestAnimationFrame(() => {
      el.focus();
      el.selectionStart = el.selectionEnd = a + t.length;
    });
  };

  const send = async () => {
    if (advarsler.length && !confirm(`${advarsler.join('\n')}\n\nSende likevel?`)) return;
    setSender(true);
    try {
      await api('/api/admin/epost', { orderId: ordre.id, mal: malKey, til, emne, innhold });
      toast(`E-posten «${e.emne}» er sendt til ${til}`);
      onSendt?.(malKey);
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Kunne ikke sende', 'feil');
    } finally {
      setSender(false);
    }
  };

  return (
    <Kort tittel="Send e-post">
      <div className="no-scrollbar -mx-1 mb-4 flex gap-1.5 overflow-x-auto px-1 pb-1">
        {maler
          .filter((m) => m.key !== 'ny_bestilling_eier')
          .map((m) => (
            <button key={m.key} className="pill shrink-0" data-on={malKey === m.key} onClick={() => setMalKey(m.key)} title={m.beskrivelse}>
              {m.navn}
            </button>
          ))}
      </div>
      {mal && <p className="-mt-2 mb-4 text-sm text-ink-500">{mal.beskrivelse}</p>}

      <div className="grid gap-5 xl:grid-cols-2">
        <div className="space-y-3">
          <div>
            <label className="label" htmlFor="til">
              Til
            </label>
            <input id="til" className="field" value={til} onChange={(x) => setTil(x.target.value)} />
          </div>
          <div>
            <label className="label" htmlFor="emne">
              Emne
            </label>
            <input id="emne" className="field" value={emne} onChange={(x) => setEmne(x.target.value)} />
          </div>
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="label mb-0" htmlFor="innhold">
                Innhold
              </label>
              <select className="rounded-full bg-white/70 px-3 py-1 text-xs font-semibold text-gran-700" value="" onChange={(x) => x.target.value && settInn(x.target.value)} aria-label="Sett inn felt">
                <option value="">+ Sett inn felt</option>
                {PLASSHOLDERE.map((p) => (
                  <option key={p.navn} value={p.navn}>
                    {p.forklaring}
                  </option>
                ))}
              </select>
            </div>
            <textarea id="innhold" ref={tekstRef} className="field min-h-[300px] font-mono text-[13px] leading-relaxed" value={innhold} onChange={(x) => setInnhold(x.target.value)} />
            <p className="hint">
              <code>**fet**</code> · <code>- punkt</code> · <code>[knapp: Tekst | {'{utkast_url}'}]</code> · <code>[boks] … [/boks]</code>. Endringer her gjelder bare denne e-posten.
            </p>
          </div>
          {advarsler.map((a) => (
            <p key={a} className="rounded-xl bg-harpiks-100 px-3 py-2 text-sm text-ink-800">
              {a}
            </p>
          ))}
          <button className="btn-primary w-full" onClick={send} disabled={sender || !til}>
            {sender ? 'Sender …' : `Send til ${til || '…'}`}
          </button>
        </div>
        <div>
          <p className="label">Slik ser den ut</p>
          <p className="mb-2 truncate rounded-xl bg-white/60 px-3 py-2 text-sm">
            <span className="text-ink-500">Emne:</span> <strong>{e.emne}</strong>
          </p>
          <EpostVisning html={e.html} />
        </div>
      </div>
    </Kort>
  );
}
