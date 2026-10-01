'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { MiniSide } from './MiniSide';
import { TEMAER } from '@/lib/valg';
import type { Tekster } from '@/lib/innhold';

const DEMO = [
  { navn: 'Klipp & Krøll', tema: 'rosa', stil: 'leken' },
  { navn: 'Bygg & Bolig Vest', tema: 'kobber', stil: 'robust' },
  { navn: 'Kafé Bryggen', tema: 'gran', stil: 'naturlig' },
  { navn: 'Studio Nord', tema: 'nordlys', stil: 'teknisk' },
  { navn: 'Fjordlys Advokat', tema: 'kontor', stil: 'eksklusiv' },
];

export function Hero({ t, gebyr }: { t: Tekster; gebyr: number }) {
  const [i, setI] = useState(0);
  const [valgtTema, setValgtTema] = useState<string | null>(null);
  const [runde, setRunde] = useState(0);

  // Bytter eksempel helt til besøkeren velger farge selv
  useEffect(() => {
    if (valgtTema) return;
    const id = setInterval(() => {
      setI((v) => (v + 1) % DEMO.length);
      setRunde((r) => r + 1);
    }, 5200);
    return () => clearInterval(id);
  }, [valgtTema]);

  const demo = DEMO[i];
  const tema = TEMAER.find((x) => x.id === (valgtTema ?? demo.tema)) ?? TEMAER[0];

  const ord = t.heroTittel.split(' ');

  return (
    <section className="wrap relative pb-16 pt-32 sm:pt-40">
      <div className="drop right-[4%] top-[12%] hidden h-24 w-24 lg:block" />

      <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_1fr]">
        <div>
          <h1 className="text-balance text-[2.6rem] leading-[1.02] sm:text-[3.6rem] lg:text-[4.1rem]" aria-label={t.heroTittel}>
            {ord.map((w, k) => (
              <span key={k} aria-hidden className="inline-block overflow-hidden pb-[0.08em] align-bottom">
                <motion.span
                  className="inline-block"
                  initial={{ y: '110%' }}
                  animate={{ y: 0 }}
                  transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.05 + k * 0.05 }}
                >
                  {w}
                  {k < ord.length - 1 ? ' ' : ''}
                </motion.span>
              </span>
            ))}
          </h1>
          <motion.div
            className="shaving mt-6 w-40"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0.6 }}
          />
          <motion.p
            className="mt-6 max-w-[34rem] text-pretty text-lg leading-relaxed text-ink-600"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.7 }}
          >
            {t.heroTekst}
          </motion.p>
          <motion.div
            className="mt-8 flex flex-wrap items-center gap-3"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.65, duration: 0.7 }}
          >
            <Link href="/bestill" className="btn-primary px-6 py-3.5 text-[15px]" data-mag>
              {t.heroKnapp}
            </Link>
            <Link href="#priser" className="btn-ghost px-6 py-3.5 text-[15px]">
              Regn ut prisen
            </Link>
          </motion.div>
          <motion.p
            className="mt-5 text-sm text-ink-500"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
          >
            Du vippser {gebyr} kr når du bestiller. Resten først når du har sett og godkjent utkastet.
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30, rotate: 2 }}
          animate={{ opacity: 1, y: 0, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 120, damping: 18, delay: 0.2 }}
        >
          <MiniSide key={runde} tema={tema} navn={demo.navn} stil={demo.stil} forsinkelse={0.1} />
          <div className="mt-4 flex flex-wrap items-center gap-2" role="group" aria-label="Prøv et fargetema">
            <span className="mr-1 text-sm text-ink-600">Prøv en farge:</span>
            {TEMAER.slice(0, 7).map((x) => (
              <button
                key={x.id}
                onClick={() => setValgtTema(x.id)}
                aria-pressed={tema.id === x.id}
                aria-label={x.navn}
                title={x.navn}
                className="relative h-8 w-8 rounded-full transition-transform duration-300 hover:scale-110"
                style={{
                  background: `conic-gradient(${x.farger.hoved} 0 50%, ${x.farger.aksent} 50% 75%, ${x.farger.bg} 75%)`,
                  boxShadow: tema.id === x.id ? '0 0 0 3px #fff, 0 0 0 5px #1F6F5C' : 'inset 0 0 0 1px rgba(0,0,0,.08), 0 4px 10px -4px rgba(0,0,0,.3)',
                }}
              />
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
