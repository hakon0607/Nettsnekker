'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Valgkort } from './felles';
import { domeneTotal, kr, type Priser, type Valg } from '@/lib/pricing';
import { tilSlug } from '@/lib/domene';

type Treff = { domene: string; ledig: boolean; prisNok?: number; fornyelseNok?: number; premium?: boolean };

export function DomeneSteg({
  d,
  setD,
  p,
  bedriftNavn,
}: {
  d: Valg['domene'];
  setD: (d: Valg['domene']) => void;
  p: Priser;
  bedriftNavn: string;
}) {
  const [sok, setSok] = useState(d.navn ? d.navn.split('.')[0] : tilSlug(bedriftNavn));
  const [treff, setTreff] = useState<Treff[]>([]);
  const [laster, setLaster] = useState(false);
  const [feil, setFeil] = useState('');
  const [merknad, setMerknad] = useState('');

  const sokNa = async () => {
    if (sok.trim().length < 2) return;
    setLaster(true);
    setFeil('');
    setMerknad('');
    try {
      const r = await fetch('/api/domene', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sok }) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Søket feilet');
      setTreff(j.treff ?? []);
      setMerknad(j.merknad ?? '');
    } catch (e) {
      setFeil(e instanceof Error ? e.message : 'Søket feilet');
      setTreff([]);
    } finally {
      setLaster(false);
    }
  };

  const ledige = treff.filter((t) => t.ledig);
  const opptatt = treff.filter((t) => !t.ledig);

  return (
    <div className="space-y-3">
      <Valgkort
        på={d.valg === 'nytt'}
        onClick={() => setD({ ...d, valg: 'nytt' })}
        tittel="Jeg vil ha et nytt domene"
        tekst="Søk opp navnet du ønsker. Vi registrerer det for deg når nettsiden er godkjent."
      />
      <AnimatePresence initial={false}>
        {d.valg === 'nytt' && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="rounded-2xl bg-white/45 p-4">
              <form
                className="flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  sokNa();
                }}
              >
                <input
                  className="field"
                  value={sok}
                  onChange={(e) => setSok(e.target.value)}
                  placeholder="f.eks. klippogkroll"
                  aria-label="Ønsket domenenavn"
                  autoComplete="off"
                />
                <button className="btn-primary shrink-0" disabled={laster}>
                  {laster ? 'Søker …' : 'Søk'}
                </button>
              </form>
              <p className="hint">
                Vi sjekker {p.domene.endelser.map((e) => `.${e}`).join(', ')}. Norske .no-domener kan vi dessverre ikke registrere, men har du et allerede,
                velger du «Jeg har allerede et domene».
              </p>

              {feil && (
                <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
                  {feil}
                </p>
              )}
              {merknad && <p className="mt-3 text-sm text-harpiks-600">{merknad}</p>}

              {ledige.length > 0 && (
                <ul className="mt-4 space-y-2">
                  {ledige.map((t, i) => {
                    const valgt = d.navn === t.domene;
                    return (
                      <motion.li key={t.domene} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                        <button
                          type="button"
                          onClick={() => setD({ ...d, valg: 'nytt', navn: t.domene, prisNok: t.prisNok, fornyelseNok: t.fornyelseNok })}
                          aria-pressed={valgt}
                          className={`flex w-full items-center justify-between gap-3 rounded-xl px-4 py-3 text-left transition ${
                            valgt ? 'bg-gran-600 text-white shadow-lift' : 'bg-white/75 hover:bg-white'
                          }`}
                        >
                          <span className="font-semibold">
                            {t.domene}
                            {t.premium && <span className="ml-2 text-xs font-normal opacity-75">premium</span>}
                          </span>
                          <span className={`price text-sm ${valgt ? 'text-white' : 'text-ink-600'}`}>
                            {kr(t.prisNok ?? 0)}/år
                            {t.fornyelseNok && t.fornyelseNok !== t.prisNok ? `, deretter ${kr(t.fornyelseNok)}` : ''}
                          </span>
                        </button>
                      </motion.li>
                    );
                  })}
                </ul>
              )}
              {opptatt.length > 0 && (
                <p className="mt-3 text-xs text-ink-500">Opptatt: {opptatt.map((t) => t.domene).join(', ')}</p>
              )}
              {treff.length > 0 && !ledige.length && <p className="mt-3 text-sm text-ink-600">Alle var opptatt. Prøv en variant, for eksempel med bindestrek eller stedsnavn.</p>}

              {d.navn && d.prisNok && (
                <div className="mt-5 rounded-xl bg-white/75 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <label htmlFor="aar" className="font-semibold">
                      Hvor mange år?
                    </label>
                    <span className="price font-semibold">{d.aar} år</span>
                  </div>
                  <input
                    id="aar"
                    type="range"
                    min={1}
                    max={p.domene.maksAar}
                    value={d.aar}
                    onChange={(e) => setD({ ...d, aar: Number(e.target.value) })}
                    className="mt-3 w-full accent-gran-600"
                  />
                  <p className="mt-2 text-sm text-ink-600">
                    {d.navn} i {d.aar} år: <strong className="price text-ink-900">{kr(domeneTotal(d.prisNok, d.fornyelseNok ?? d.prisNok, d.aar))}</strong>
                  </p>
                </div>
              )}
              {feil && (
                <div className="mt-4">
                  <label className="label" htmlFor="manuelt">
                    Skriv domenet du ønsker, så sjekker vi det for deg
                  </label>
                  <input
                    id="manuelt"
                    className="field"
                    placeholder="f.eks. klippogkroll.com"
                    value={d.navn}
                    onChange={(e) => setD({ ...d, navn: e.target.value.trim().toLowerCase(), prisNok: undefined })}
                  />
                  <p className="hint">Prisen på domenet legges til ved godkjenning.</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Valgkort
        på={d.valg === 'eget'}
        onClick={() => setD({ valg: 'eget', navn: '', aar: 1 })}
        tittel="Jeg har allerede et domene"
        tekst="Vi kobler nettsiden til domenet ditt. Det koster ingenting ekstra."
      />
      {d.valg === 'eget' && (
        <input
          className="field"
          placeholder="f.eks. minbedrift.no"
          value={d.navn}
          onChange={(e) => setD({ ...d, navn: e.target.value.trim().toLowerCase() })}
          aria-label="Domenet du har"
        />
      )}

      <Valgkort
        på={d.valg === 'ingen'}
        onClick={() => setD({ valg: 'ingen', navn: '', aar: 1 })}
        tittel="Ikke nå"
        tekst="Nettsiden får en gratis .vercel.app-adresse. Du kan legge til domene senere."
      />
    </div>
  );
}
