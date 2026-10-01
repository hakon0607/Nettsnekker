'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import type { Faq as FaqT } from '@/lib/innhold';

export function Faq({ liste }: { liste: FaqT }) {
  const [apen, setApen] = useState<number | null>(0);
  return (
    <section id="sporsmal" className="wrap scroll-mt-28 py-20">
      <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
        <h2 className="max-w-sm text-balance text-4xl sm:text-5xl">Det folk lurer på</h2>
        <div className="space-y-3">
          {liste.map((f, i) => {
            const er = apen === i;
            return (
              <div key={f.sporsmal} className="glass rounded-[22px]">
                <button
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left font-semibold text-ink-900"
                  onClick={() => setApen(er ? null : i)}
                  aria-expanded={er}
                >
                  {f.sporsmal}
                  <motion.span animate={{ rotate: er ? 45 : 0 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }} className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/70 text-lg text-gran-700">
                    +
                  </motion.span>
                </button>
                <AnimatePresence initial={false}>
                  {er && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 32 }}
                      className="overflow-hidden"
                    >
                      <p className="px-5 pb-5 leading-relaxed text-ink-600">{f.svar}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
