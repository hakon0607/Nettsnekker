'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Belop } from './Belop';
import { kr, type Priser, type Prisresultat } from '@/lib/pricing';

/** Prisoversikt: hva du betaler nå, ved godkjenning og totalt. */
export function PrisPanel({ r, p, kompakt = false }: { r: Prisresultat; p: Priser; kompakt?: boolean }) {
  return (
    <div>
      <ul className="space-y-0.5">
        <AnimatePresence initial={false}>
          {r.linjer.map((l) => (
            <motion.li
              key={l.navn}
              layout
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 34 }}
              className="overflow-hidden"
            >
              <div className="flex items-start justify-between gap-4 py-2 text-sm">
                <span className="text-ink-700">
                  {l.navn}
                  {!kompakt && l.detalj && <span className="block text-xs text-ink-500">{l.detalj}</span>}
                </span>
                <span className="price shrink-0 font-semibold text-ink-900">{kr(l.belop)}</span>
              </div>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>

      <div className="mt-3 space-y-2 rounded-2xl bg-white/55 p-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-ink-700">Nå, når du bestiller</span>
          <span className="price font-semibold">{kr(r.gebyr)}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-ink-700">Når du har godkjent utkastet</span>
          <Belop verdi={r.rest} className="font-semibold" />
        </div>
        <div className="flex items-end justify-between border-t border-ink-200/70 pt-3">
          <span className="font-semibold text-ink-900">Totalt</span>
          <Belop verdi={r.total} className="font-display text-3xl font-bold text-gran-700" />
        </div>
      </div>
      {!kompakt && (
        <p className="mt-3 text-xs leading-relaxed text-ink-500">
          {p.hostingTekst.replace('{hosting}', p.hostingPerAar.toLocaleString('nb-NO'))} {p.mvaTekst}
        </p>
      )}
    </div>
  );
}
