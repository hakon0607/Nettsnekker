'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

/** Viser hvordan kunden betaler med Vipps, med kopier-knapper. */
export function VippsBoks({ belop, nummer, navn, melding, tittel }: { belop: string; nummer: string; navn: string; melding: string; tittel: string }) {
  const [kopiert, setKopiert] = useState('');
  const kopier = async (tekst: string, hva: string) => {
    try {
      await navigator.clipboard.writeText(tekst);
      setKopiert(hva);
      setTimeout(() => setKopiert(''), 1800);
    } catch {
      /* ikke støttet */
    }
  };
  const rader = [
    { k: 'Beløp', v: belop, kopi: belop.replace(/[^\d]/g, '') },
    { k: 'Vipps til', v: nummer ? `${nummer}${navn ? ` (${navn})` : ''}` : 'Nummeret kommer på e-post', kopi: nummer.replace(/\s/g, '') },
    { k: 'Melding', v: melding, kopi: melding },
  ];
  return (
    <motion.div
      initial={{ opacity: 0, y: 14, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 200, damping: 22, delay: 0.2 }}
      className="overflow-hidden rounded-[24px] text-white shadow-lift"
      style={{ background: 'linear-gradient(150deg, #FF6A39 0%, #F04E23 55%, #D63A12 100%)' }}
    >
      <div className="p-5 sm:p-6">
        <p className="font-display text-xl font-bold">{tittel}</p>
        <p className="mt-1 text-sm text-white/85">Skriv bestillingsnummeret i meldingen, så vet vi hvilken bestilling betalingen gjelder.</p>
        <dl className="mt-4 space-y-2">
          {rader.map((r) => (
            <div key={r.k} className="flex items-center justify-between gap-3 rounded-2xl bg-white/15 px-4 py-3 backdrop-blur">
              <div>
                <dt className="text-xs text-white/75">{r.k}</dt>
                <dd className="price font-display text-lg font-bold">{r.v}</dd>
              </div>
              {r.kopi && (
                <button type="button" onClick={() => kopier(r.kopi, r.k)} className="shrink-0 rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-[#D63A12] transition hover:bg-white">
                  {kopiert === r.k ? 'Kopiert' : 'Kopier'}
                </button>
              )}
            </div>
          ))}
        </dl>
      </div>
    </motion.div>
  );
}
