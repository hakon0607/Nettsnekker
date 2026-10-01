'use client';

import { useEffect, useState } from 'react';
import { Reorder } from 'framer-motion';
import { useAdmin } from '@/components/admin/AdminProvider';
import { useInnstillinger } from '@/components/admin/useInnstillinger';
import { Kort, LagreLinje, Sidetopp } from '@/components/admin/ui';
import { TEMAER } from '@/lib/valg';
import type { Eksempel, Faq, Tekster } from '@/lib/innhold';

const TEKSTFELT: { k: keyof Tekster; navn: string; lang?: boolean }[] = [
  { k: 'heroTittel', navn: 'Stor overskrift øverst' },
  { k: 'heroTekst', navn: 'Tekst under overskriften', lang: true },
  { k: 'heroKnapp', navn: 'Tekst på bestillingsknappen' },
  { k: 'prosessTittel', navn: 'Overskrift: slik foregår det' },
  { k: 'adminTittel', navn: 'Overskrift: adminside' },
  { k: 'adminTekst', navn: 'Tekst om adminside', lang: true },
  { k: 'ctaTittel', navn: 'Overskrift nederst' },
  { k: 'ctaTekst', navn: 'Tekst nederst', lang: true },
  { k: 'bestiltTekst', navn: 'Tekst når kunden har bestilt', lang: true },
];

type Data = { tekster: Tekster; faq: Faq; eksempler: Eksempel[] };

export default function Innhold() {
  const { lagreInnstilling, toast, sb } = useAdmin();
  const { inn, hentPaNytt } = useInnstillinger();
  const [d, setD] = useState<Data | null>(null);
  const [lagrer, setLagrer] = useState(false);

  useEffect(() => {
    if (inn) setD(structuredClone({ tekster: inn.tekster, faq: inn.faq, eksempler: inn.eksempler }));
  }, [inn]);
  if (!d || !inn) return <p className="text-ink-500">Laster …</p>;

  const original = { tekster: inn.tekster, faq: inn.faq, eksempler: inn.eksempler };
  const endret = JSON.stringify(d) !== JSON.stringify(original);

  const lagre = async () => {
    setLagrer(true);
    try {
      await lagreInnstilling('tekster', d.tekster);
      await lagreInnstilling('faq', d.faq);
      await lagreInnstilling('eksempler', d.eksempler);
      toast('Innholdet er lagret. Nettsiden oppdateres innen ett minutt.');
      await hentPaNytt();
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Feil', 'feil');
    } finally {
      setLagrer(false);
    }
  };

  const lastOppBilde = async (i: number, fil: File) => {
    const sti = `eksempler/${Date.now().toString(36)}-${fil.name.toLowerCase().replace(/[^a-z0-9.]+/g, '-')}`;
    const { error } = await sb.storage.from('offentlig').upload(sti, fil, { contentType: fil.type });
    if (error) return toast(error.message, 'feil');
    const { data } = sb.storage.from('offentlig').getPublicUrl(sti);
    setD({ ...d, eksempler: d.eksempler.map((e, k) => (k === i ? { ...e, bilde: data.publicUrl } : e)) });
  };

  return (
    <div className="pb-24">
      <Sidetopp tittel="Innhold" tekst="Tekstene på forsiden, spørsmål og svar, og eksemplene du viser frem." />
      <div className="space-y-5">
        <Kort tittel="Tekster">
          <div className="grid gap-4 lg:grid-cols-2">
            {TEKSTFELT.map((f) => (
              <div key={f.k} className={f.lang ? 'lg:col-span-2' : ''}>
                <label className="label">{f.navn}</label>
                {f.lang ? (
                  <textarea className="field min-h-[80px]" value={d.tekster[f.k]} onChange={(e) => setD({ ...d, tekster: { ...d.tekster, [f.k]: e.target.value } })} />
                ) : (
                  <input className="field" value={d.tekster[f.k]} onChange={(e) => setD({ ...d, tekster: { ...d.tekster, [f.k]: e.target.value } })} />
                )}
              </div>
            ))}
          </div>
        </Kort>

        <Kort tittel="Spørsmål og svar" handling={<button className="btn-ghost btn-sm" onClick={() => setD({ ...d, faq: [...d.faq, { sporsmal: 'Nytt spørsmål?', svar: '' }] })}>+ Nytt spørsmål</button>}>
          <Reorder.Group axis="y" values={d.faq} onReorder={(faq) => setD({ ...d, faq })} className="space-y-3">
            {d.faq.map((f, i) => (
              <Reorder.Item key={`${i}-${f.sporsmal.slice(0, 12)}`} value={f} className="cursor-grab rounded-2xl bg-white/60 p-4 active:cursor-grabbing">
                <input className="field font-semibold" value={f.sporsmal} onChange={(e) => setD({ ...d, faq: d.faq.map((x, k) => (k === i ? { ...x, sporsmal: e.target.value } : x)) })} aria-label="Spørsmål" />
                <textarea className="field mt-2 min-h-[70px]" value={f.svar} onChange={(e) => setD({ ...d, faq: d.faq.map((x, k) => (k === i ? { ...x, svar: e.target.value } : x)) })} aria-label="Svar" />
                <button className="mt-2 text-xs font-semibold text-red-600" onClick={() => setD({ ...d, faq: d.faq.filter((_, k) => k !== i) })}>Slett</button>
              </Reorder.Item>
            ))}
          </Reorder.Group>
        </Kort>

        <Kort tittel="Eksempler på forsiden" handling={<button className="btn-ghost btn-sm" onClick={() => setD({ ...d, eksempler: [...d.eksempler, { navn: 'Ny kunde', bransje: '', url: '', bilde: '', tema: 'fjord' }] })}>+ Nytt eksempel</button>}>
          <p className="mb-3 text-sm text-ink-500">Legg inn ekte kundesider med lenke og skjermbilde når du har dem. Uten bilde vises en tegnet nettside i temaet du velger.</p>
          <div className="grid gap-3 lg:grid-cols-3">
            {d.eksempler.map((e, i) => {
              const sett = (x: Partial<Eksempel>) => setD({ ...d, eksempler: d.eksempler.map((y, k) => (k === i ? { ...y, ...x } : y)) });
              return (
                <div key={i} className="space-y-2 rounded-2xl bg-white/60 p-4">
                  {e.bilde && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={e.bilde} alt="" className="aspect-video w-full rounded-xl object-cover" />
                  )}
                  <input className="field" placeholder="Navn" value={e.navn} onChange={(x) => sett({ navn: x.target.value })} />
                  <input className="field" placeholder="Bransje" value={e.bransje} onChange={(x) => sett({ bransje: x.target.value })} />
                  <input className="field" placeholder="https://kundeside.no" value={e.url} onChange={(x) => sett({ url: x.target.value })} />
                  <select className="field" value={e.tema} onChange={(x) => sett({ tema: x.target.value })}>
                    {TEMAER.map((t) => <option key={t.id} value={t.id}>{t.navn}</option>)}
                  </select>
                  <div className="flex items-center justify-between">
                    <label className="cursor-pointer text-xs font-semibold text-gran-700">
                      {e.bilde ? 'Bytt bilde' : 'Last opp skjermbilde'}
                      <input type="file" accept="image/*" className="hidden" onChange={(x) => x.target.files?.[0] && lastOppBilde(i, x.target.files[0])} />
                    </label>
                    <button className="text-xs font-semibold text-red-600" onClick={() => setD({ ...d, eksempler: d.eksempler.filter((_, k) => k !== i) })}>Slett</button>
                  </div>
                </div>
              );
            })}
          </div>
        </Kort>
      </div>
      <LagreLinje endret={endret} lagrer={lagrer} onLagre={lagre} onAngre={() => setD(structuredClone(original))} />
    </div>
  );
}
