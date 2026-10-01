'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import { kr } from '@/lib/pricing';

export function Prosess({ tittel, gebyr, leveringstid }: { tittel: string; gebyr: number; leveringstid: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 75%', 'end 55%'] });
  const lengde = useTransform(scrollYProgress, [0, 1], [0, 1]);

  const steg = [
    {
      tittel: 'Du bestiller',
      tekst: 'Beskriv bedriften, velg farger, sider og hva du vil kunne endre selv. Last opp logo og bilder hvis du har.',
      merke: `Du betaler ${kr(gebyr)}`,
    },
    {
      tittel: 'Vi snekrer',
      tekst: `Vi bygger nettsiden og sender deg en lenke til utkastet, vanligvis innen ${leveringstid}.`,
      merke: 'Utkast på e-post',
    },
    {
      tittel: 'Du godkjenner',
      tekst: 'Se utkastet på mobil og PC. Vil du endre noe, svarer du på e-posten. Er du fornøyd, godkjenner du og betaler resten.',
      merke: 'Du betaler resten',
    },
    {
      tittel: 'Nettsiden er live',
      tekst: 'Vi kobler på domenet ditt og sender deg innloggingen til /admin hvis du har valgt det.',
      merke: 'Ditt eget domene',
    },
  ];

  return (
    <section id="slik" className="wrap scroll-mt-28 py-20">
      <h2 className="max-w-xl text-balance text-4xl sm:text-5xl">{tittel}</h2>
      <div ref={ref} className="relative mt-14">
        {/* planken som vokser når man ruller */}
        <div className="absolute left-[19px] top-2 h-[calc(100%-1rem)] w-[3px] rounded-full bg-white/70 sm:left-[23px]" aria-hidden>
          <motion.div
            className="h-full w-full origin-top rounded-full bg-gradient-to-b from-gran-400 via-gran-600 to-harpiks-400"
            style={{ scaleY: lengde }}
          />
        </div>
        <ol className="space-y-6">
          {steg.map((s, i) => (
            <motion.li
              key={s.tittel}
              className="relative grid grid-cols-[40px_1fr] gap-4 sm:grid-cols-[48px_1fr] sm:gap-6"
              initial={{ opacity: 0, x: -16 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ type: 'spring', stiffness: 200, damping: 24, delay: 0.05 }}
            >
              <span className="relative z-10 grid h-10 w-10 place-items-center rounded-full bg-gradient-to-b from-gran-500 to-gran-700 font-display text-lg font-bold text-white shadow-lift ring-4 ring-white/70 sm:h-12 sm:w-12">
                {i + 1}
              </span>
              <div className="glass rounded-[24px] p-5 sm:p-7">
                <div className="flex flex-wrap items-baseline justify-between gap-3">
                  <h3 className="text-2xl">{s.tittel}</h3>
                  <span className="rounded-full bg-harpiks-100 px-3 py-1 text-xs font-semibold text-harpiks-600">{s.merke}</span>
                </div>
                <p className="mt-2 max-w-2xl leading-relaxed text-ink-600">{s.tekst}</p>
              </div>
            </motion.li>
          ))}
        </ol>
      </div>
    </section>
  );
}
