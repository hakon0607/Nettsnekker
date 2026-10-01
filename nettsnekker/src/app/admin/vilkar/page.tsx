'use client';

import { useEffect, useState } from 'react';
import { useAdmin } from '@/components/admin/AdminProvider';
import { useInnstillinger } from '@/components/admin/useInnstillinger';
import { Kort, LagreLinje, Sidetopp } from '@/components/admin/ui';
import { STANDARD_PERSONVERN, STANDARD_VILKAR, fyllInn } from '@/lib/innhold';
import { markdownTilHtml } from '@/lib/markdown';

export default function VilkarSide() {
  const { lagreInnstilling, toast } = useAdmin();
  const { inn, hentPaNytt } = useInnstillinger();
  const [hvilken, setHvilken] = useState<'vilkar' | 'personvern'>('vilkar');
  const [tekst, setTekst] = useState({ vilkar: '', personvern: '' });
  const [lagrer, setLagrer] = useState(false);

  useEffect(() => {
    if (inn) setTekst({ vilkar: inn.vilkar, personvern: inn.personvern });
  }, [inn]);
  if (!inn) return <p className="text-ink-500">Laster …</p>;

  const endret = tekst.vilkar !== inn.vilkar || tekst.personvern !== inn.personvern;
  const lagre = async () => {
    setLagrer(true);
    try {
      await lagreInnstilling('vilkar', tekst.vilkar);
      await lagreInnstilling('personvern', tekst.personvern);
      toast('Lagret');
      await hentPaNytt();
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Feil', 'feil');
    } finally {
      setLagrer(false);
    }
  };

  return (
    <div className="pb-24">
      <Sidetopp
        tittel="Vilkår og personvern"
        tekst={<>Skrives med <code>## Overskrift</code>, <code>- punkt</code> og <code>**fet**</code>. {'{eier}'}, {'{epost}'}, {'{sted}'} og {'{navn}'} fylles inn fra Innstillinger. Dette er et utgangspunkt, ikke juridisk rådgivning – få gjerne noen til å lese over.</>}
        handling={
          <div className="flex gap-1.5">
            <button className="pill" data-on={hvilken === 'vilkar'} onClick={() => setHvilken('vilkar')}>Vilkår</button>
            <button className="pill" data-on={hvilken === 'personvern'} onClick={() => setHvilken('personvern')}>Personvern</button>
          </div>
        }
      />
      <div className="grid gap-5 xl:grid-cols-2">
        <Kort tittel="Rediger" handling={<button className="text-sm font-semibold text-ink-500 hover:text-gran-700" onClick={() => confirm('Tilbakestille til standardteksten?') && setTekst({ ...tekst, [hvilken]: hvilken === 'vilkar' ? STANDARD_VILKAR : STANDARD_PERSONVERN })}>Tilbakestill</button>}>
          <textarea className="field min-h-[640px] font-mono text-[13px] leading-relaxed" value={tekst[hvilken]} onChange={(e) => setTekst({ ...tekst, [hvilken]: e.target.value })} aria-label="Tekst" />
        </Kort>
        <Kort tittel="Slik ser det ut">
          <div className="prose-ns max-h-[680px] overflow-y-auto pr-2" dangerouslySetInnerHTML={{ __html: markdownTilHtml(fyllInn(tekst[hvilken], inn.bedrift)) }} />
        </Kort>
      </div>
      <LagreLinje endret={endret} lagrer={lagrer} onLagre={lagre} onAngre={() => setTekst({ vilkar: inn.vilkar, personvern: inn.personvern })} />
    </div>
  );
}
