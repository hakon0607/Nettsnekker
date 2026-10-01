'use client';

import { useEffect, useState } from 'react';
import { Reorder } from 'framer-motion';
import { useAdmin } from '@/components/admin/AdminProvider';
import { useInnstillinger } from '@/components/admin/useInnstillinger';
import { Kort, LagreLinje, Sidetopp } from '@/components/admin/ui';
import { PrisPanel } from '@/components/PrisPanel';
import { domenePrisNok, regnUt, type Priser, type Tillegg } from '@/lib/pricing';

function Tall({ label, verdi, onChange, hint, etter = 'kr' }: { label: string; verdi: number; onChange: (v: number) => void; hint?: string; etter?: string }) {
  return (
    <div>
      <label className="label">{label}</label>
      <div className="relative">
        <input className="field pr-12" type="number" value={verdi} onChange={(e) => onChange(Number(e.target.value))} />
        <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-ink-400">{etter}</span>
      </div>
      {hint && <p className="hint">{hint}</p>}
    </div>
  );
}

export default function PriserSide() {
  const { lagreInnstilling, toast } = useAdmin();
  const { inn, hentPaNytt } = useInnstillinger();
  const [p, setP] = useState<Priser | null>(null);
  const [lagrer, setLagrer] = useState(false);

  useEffect(() => {
    if (inn) setP(structuredClone(inn.priser));
  }, [inn]);
  if (!p || !inn) return <p className="text-ink-500">Laster …</p>;

  const endret = JSON.stringify(p) !== JSON.stringify(inn.priser);
  const sett = (x: Partial<Priser>) => setP({ ...p, ...x });
  const settTillegg = (i: number, x: Partial<Tillegg>) => sett({ tillegg: p.tillegg.map((t, k) => (k === i ? { ...t, ...x } : t)) });

  const lagre = async () => {
    setLagrer(true);
    try {
      await lagreInnstilling('priser', p);
      toast('Prisene er lagret. Nettsiden oppdateres innen ett minutt.');
      await hentPaNytt();
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Feil', 'feil');
    } finally {
      setLagrer(false);
    }
  };

  const eksempel = regnUt(
    { sider: ['a', 'b', 'c', 'd', 'e', 'f'], admin: true, tillegg: { [p.tillegg[0]?.id ?? 'x']: 1 }, domene: { valg: 'nytt', navn: 'eksempel.com', aar: 2, prisNok: domenePrisNok(11.25, p), fornyelseNok: domenePrisNok(11.25, p) } },
    p
  );

  return (
    <div className="pb-24">
      <Sidetopp tittel="Priser" tekst="Alt her vises i kalkulatoren og bestillingen. Prisen kunden får regnes alltid ut på nytt på serveren." />
      <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
        <div className="space-y-5">
          <Kort tittel="Grunnpakken">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Tall label="Bestillingsgebyr" verdi={p.gebyr} onChange={(v) => sett({ gebyr: v })} hint="Betales når kunden bestiller" />
              <Tall label="Grunnpakke" verdi={p.grunnpakke} onChange={(v) => sett({ grunnpakke: v })} hint="Betales ved godkjenning" />
              <Tall label="Adminside" verdi={p.admin} onChange={(v) => sett({ admin: v })} />
              <Tall label="Sider inkludert" verdi={p.inkluderteSider} onChange={(v) => sett({ inkluderteSider: v })} etter="stk" />
              <Tall label="Pris per ekstra side" verdi={p.ekstraSide} onChange={(v) => sett({ ekstraSide: v })} />
              <Tall label="Endringsrunder inkludert" verdi={p.inkluderteEndringsrunder} onChange={(v) => sett({ inkluderteEndringsrunder: v })} etter="stk" />
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label">Vanlig leveringstid</label>
                <input className="field" value={p.leveringstid} onChange={(e) => sett({ leveringstid: e.target.value })} />
              </div>
              <Tall label="Hosting per år (fra år 2)" verdi={p.hostingPerAar} onChange={(v) => sett({ hostingPerAar: v })} hint="Regn med Vercel Pro + Supabase delt på antall kunder, pluss litt for arbeid." />
            </div>
            <div className="mt-4 grid gap-4">
              <div>
                <label className="label">Tekst om hosting</label>
                <input className="field" value={p.hostingTekst} onChange={(e) => sett({ hostingTekst: e.target.value })} />
                <p className="hint">{'{hosting}'} byttes ut med prisen over.</p>
              </div>
              <div>
                <label className="label">Tekst om merverdiavgift</label>
                <input className="field" value={p.mvaTekst} onChange={(e) => sett({ mvaTekst: e.target.value })} />
              </div>
            </div>
          </Kort>

          <Kort
            tittel="Tillegg"
            handling={
              <button className="btn-ghost btn-sm" onClick={() => sett({ tillegg: [...p.tillegg, { id: `tillegg_${Date.now().toString(36)}`, navn: 'Nytt tillegg', beskrivelse: '', pris: 0, type: 'fast', aktiv: true }] })}>
                + Nytt tillegg
              </button>
            }
          >
            <p className="mb-3 text-sm text-ink-500">Dra for å endre rekkefølgen.</p>
            <Reorder.Group axis="y" values={p.tillegg} onReorder={(t) => sett({ tillegg: t })} className="space-y-3">
              {p.tillegg.map((t, i) => (
                <Reorder.Item key={t.id} value={t} className={`cursor-grab rounded-2xl p-4 active:cursor-grabbing ${t.aktiv ? 'bg-white/70' : 'bg-white/35 opacity-70'}`}>
                  <div className="grid gap-3 sm:grid-cols-[1fr_120px_130px]">
                    <input className="field" value={t.navn} onChange={(e) => settTillegg(i, { navn: e.target.value })} aria-label="Navn" />
                    <input className="field" type="number" value={t.pris} onChange={(e) => settTillegg(i, { pris: Number(e.target.value) })} aria-label="Pris" />
                    <select className="field" value={t.type} onChange={(e) => settTillegg(i, { type: e.target.value as Tillegg['type'] })} aria-label="Type">
                      <option value="fast">Av/på</option>
                      <option value="antall">Per stk</option>
                    </select>
                  </div>
                  <textarea className="field mt-2 min-h-[60px]" value={t.beskrivelse} onChange={(e) => settTillegg(i, { beskrivelse: e.target.value })} aria-label="Beskrivelse" />
                  <div className="mt-2 flex flex-wrap items-center gap-4 text-sm">
                    <label className="flex items-center gap-2"><input type="checkbox" className="h-4 w-4 accent-gran-600" checked={t.aktiv} onChange={(e) => settTillegg(i, { aktiv: e.target.checked })} /> Vises</label>
                    <label className="flex items-center gap-2"><input type="checkbox" className="h-4 w-4 accent-gran-600" checked={!!t.kreverAdmin} onChange={(e) => settTillegg(i, { kreverAdmin: e.target.checked })} /> Krever adminside</label>
                    {t.type === 'antall' && (
                      <label className="flex items-center gap-2">Maks <input type="number" className="field w-20 py-1.5" value={t.maks ?? 5} onChange={(e) => settTillegg(i, { maks: Number(e.target.value) })} /></label>
                    )}
                    <span className="text-xs text-ink-400">id: {t.id}</span>
                    <button className="ml-auto text-xs font-semibold text-red-600" onClick={() => confirm(`Slette «${t.navn}»?`) && sett({ tillegg: p.tillegg.filter((_, k) => k !== i) })}>Slett</button>
                  </div>
                </Reorder.Item>
              ))}
            </Reorder.Group>
          </Kort>

          <Kort tittel="Domener">
            <label className="mb-4 flex items-center gap-2 text-sm"><input type="checkbox" className="h-4 w-4 accent-gran-600" checked={p.domene.aktiv} onChange={(e) => sett({ domene: { ...p.domene, aktiv: e.target.checked } })} /> Kunder kan kjøpe domene i bestillingen</label>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Tall label="Valutakurs" verdi={p.domene.kurs} onChange={(v) => sett({ domene: { ...p.domene, kurs: v } })} etter="kr/$" hint="Vercel oppgir priser i dollar" />
              <Tall label="Påslag" verdi={p.domene.paslagProsent} onChange={(v) => sett({ domene: { ...p.domene, paslagProsent: v } })} etter="%" />
              <Tall label="Fast påslag" verdi={p.domene.fastPaslag} onChange={(v) => sett({ domene: { ...p.domene, fastPaslag: v } })} />
              <Tall label="Maks år" verdi={p.domene.maksAar} onChange={(v) => sett({ domene: { ...p.domene, maksAar: v } })} etter="år" />
            </div>
            <div className="mt-4">
              <label className="label">Endelser som søkes</label>
              <input className="field" value={p.domene.endelser.join(', ')} onChange={(e) => sett({ domene: { ...p.domene, endelser: e.target.value.split(',').map((x) => x.trim().replace(/^\./, '')).filter(Boolean) } })} />
              <p className="hint">Et .com til 11,25 $ blir {domenePrisNok(11.25, p)} kr per år for kunden. .no støttes ikke av Vercel.</p>
            </div>
          </Kort>
        </div>

        <div>
          <Kort tittel="Eksempel" className="xl:sticky xl:top-6">
            <p className="mb-3 text-sm text-ink-500">6 sider, adminside, {p.tillegg[0]?.navn ?? 'ett tillegg'} og .com i 2 år:</p>
            <PrisPanel r={eksempel} p={p} kompakt />
          </Kort>
        </div>
      </div>
      <LagreLinje endret={endret} lagrer={lagrer} onLagre={lagre} onAngre={() => setP(structuredClone(inn.priser))} />
    </div>
  );
}
