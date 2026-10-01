'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { ADMIN_TIPS } from '@/lib/valg';

const RADER = [
  { navn: 'Herreklipp', verdi: '450 kr' },
  { navn: 'Dameklipp', verdi: '690 kr' },
  { navn: 'Farge', verdi: 'fra 990 kr' },
];

export function AdminSeksjon({ tittel, tekst, pris }: { tittel: string; tekst: string; pris: number }) {
  const [rad, setRad] = useState(0);
  const [verdi, setVerdi] = useState(RADER[0].verdi);

  // Liten demo: en pris som endres av «eieren»
  useEffect(() => {
    const priser = ['450 kr', '490 kr', '520 kr'];
    let k = 0;
    const id = setInterval(() => {
      k = (k + 1) % priser.length;
      setRad(0);
      setVerdi(priser[k]);
    }, 2400);
    return () => clearInterval(id);
  }, []);

  return (
    <section id="admin" className="wrap scroll-mt-28 py-20">
      <div className="grid items-center gap-10 lg:grid-cols-2">
        <div>
          <h2 className="max-w-lg text-balance text-4xl sm:text-5xl">{tittel}</h2>
          <p className="mt-4 max-w-lg text-lg leading-relaxed text-ink-600">{tekst}</p>
          <p className="mt-6 text-sm font-semibold text-ink-800">Dette kan du for eksempel be om:</p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {ADMIN_TIPS.slice(0, 9).map((t, i) => (
              <motion.li
                key={t.tekst}
                className="pill cursor-default"
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ type: 'spring', stiffness: 300, damping: 18, delay: i * 0.04 }}
              >
                {t.tekst}
              </motion.li>
            ))}
          </ul>
          <p className="mt-6 text-ink-600">
            Adminsiden koster <strong className="text-ink-900">{pris} kr</strong> ekstra og velges i bestillingen.
          </p>
          <Link href="/bestill" className="btn-primary mt-6">
            Bestill med adminside
          </Link>
        </div>

        {/* illustrasjon av et adminpanel */}
        <motion.div
          className="glass rounded-[28px] p-3"
          initial={{ opacity: 0, y: 30, rotate: -1.5 }}
          whileInView={{ opacity: 1, y: 0, rotate: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ type: 'spring', stiffness: 120, damping: 18 }}
          aria-hidden
        >
          <div className="grid grid-cols-[120px_1fr] overflow-hidden rounded-[20px] bg-white/70">
            <div className="space-y-1 bg-ink-900 p-3 text-[12px] text-white/70">
              <p className="mb-3 font-display text-sm font-bold text-white">/admin</p>
              {['Oversikt', 'Priser', 'Produkter', 'Bestillinger', 'Bilder', 'Tekster'].map((m) => (
                <p key={m} className={`rounded-lg px-2 py-1.5 ${m === 'Priser' ? 'bg-white/15 text-white' : ''}`}>
                  {m}
                </p>
              ))}
            </div>
            <div className="p-5">
              <p className="font-display text-lg font-bold">Priser</p>
              <div className="mt-4 space-y-2">
                {RADER.map((r, i) => (
                  <div key={r.navn} className="flex items-center justify-between rounded-xl bg-white px-3 py-2.5 text-sm shadow-sm">
                    <span>{r.navn}</span>
                    <motion.span
                      key={i === rad ? verdi : r.verdi}
                      initial={i === rad ? { backgroundColor: '#FFE2A3' } : false}
                      animate={{ backgroundColor: 'rgba(255,226,163,0)' }}
                      transition={{ duration: 1.4 }}
                      className="price rounded-md px-2 py-0.5 font-semibold"
                    >
                      {i === rad ? verdi : r.verdi}
                    </motion.span>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-center gap-2">
                <span className="rounded-full bg-gran-600 px-4 py-2 text-xs font-semibold text-white">Lagre</span>
                <motion.span
                  key={verdi}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-xs font-medium text-gran-700"
                >
                  Lagret. Nettsiden er oppdatert.
                </motion.span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
