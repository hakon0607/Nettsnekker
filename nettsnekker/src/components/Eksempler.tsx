'use client';

import { MiniSide } from './MiniSide';
import { Tilt } from './glass/Tilt';
import { TEMAER } from '@/lib/valg';
import type { Eksempel } from '@/lib/innhold';

export function Eksempler({ liste }: { liste: Eksempel[] }) {
  if (!liste.length) return null;
  return (
    <section className="wrap py-20">
      <h2 className="max-w-xl text-balance text-4xl sm:text-5xl">Ulike bedrifter, ulike nettsider</h2>
      <p className="mt-4 max-w-xl text-lg text-ink-600">Hver side lages fra bunnen av, med farger og stil som passer bransjen.</p>
      <div className="mt-10 grid gap-6 md:grid-cols-3">
        {liste.map((e) => {
          const tema = TEMAER.find((t) => t.id === e.tema) ?? TEMAER[0];
          const innhold = (
            <Tilt className="h-full" max={6}>
              {e.bilde ? (
                <div className="glass overflow-hidden rounded-[22px] p-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={e.bilde} alt={`Nettsiden til ${e.navn}`} className="aspect-[4/3] w-full rounded-[16px] object-cover" loading="lazy" />
                </div>
              ) : (
                <MiniSide tema={tema} navn={e.navn} bygg={false} />
              )}
              <div className="mt-3 flex items-baseline justify-between px-1">
                <p className="font-display text-lg font-semibold">{e.navn}</p>
                <p className="text-sm text-ink-500">{e.bransje}</p>
              </div>
            </Tilt>
          );
          return e.url ? (
            <a key={e.navn} href={e.url} target="_blank" rel="noreferrer">
              {innhold}
            </a>
          ) : (
            <div key={e.navn}>{innhold}</div>
          );
        })}
      </div>
    </section>
  );
}
