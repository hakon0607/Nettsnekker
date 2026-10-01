'use client';

import { motion } from 'framer-motion';
import type { Tema } from '@/lib/valg';

/**
 * En liten nettside i et nettleservindu som «snekres» sammen bit for bit.
 * Brukes i toppen av forsiden og som live forhåndsvisning i bestillingen.
 */
export function MiniSide({
  tema,
  navn,
  egenFarge,
  stil = 'minimal',
  sider = ['Forside', 'Om oss', 'Tjenester', 'Kontakt'],
  bygg = true,
  forsinkelse = 0,
  className = '',
  adresse,
}: {
  tema: Tema;
  navn: string;
  egenFarge?: string;
  stil?: string;
  sider?: string[];
  /** Spill av byggeanimasjonen */
  bygg?: boolean;
  forsinkelse?: number;
  className?: string;
  /** Domenet som vises i adressefeltet */
  adresse?: string;
}) {
  const f = tema.farger;
  const hoved = egenFarge || f.hoved;
  const rund = stil === 'leken' ? 22 : stil === 'robust' || stil === 'teknisk' ? 6 : stil === 'eksklusiv' ? 2 : 14;
  const serif = stil === 'eksklusiv';
  const menyer = sider.filter((s) => s !== 'Forside').slice(0, 4);
  const domene = (navn || 'dinbedrift').toLowerCase().replace(/æ/g, 'ae').replace(/ø/g, 'o').replace(/å/g, 'a').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '') || 'dinbedrift';

  const blokk = (i: number) =>
    bygg
      ? {
          initial: { opacity: 0, y: 26, rotate: i % 2 ? 1.5 : -1.5, scale: 0.96 },
          animate: { opacity: 1, y: 0, rotate: 0, scale: 1 },
          transition: { type: 'spring' as const, stiffness: 260, damping: 20, delay: forsinkelse + 0.25 + i * 0.22 },
        }
      : {};

  const overgang = 'background-color .6s cubic-bezier(.22,1,.36,1), color .6s, border-color .6s';

  return (
    <div className={`glass glass-lens overflow-hidden rounded-[22px] p-2 ${className}`}>
      {/* nettleserlinje */}
      <div className="flex items-center gap-2 px-2 pb-2 pt-1">
        <span className="flex gap-1.5">
          <i className="block h-2.5 w-2.5 rounded-full bg-[#FF6159]/80" />
          <i className="block h-2.5 w-2.5 rounded-full bg-[#FFBD2E]/80" />
          <i className="block h-2.5 w-2.5 rounded-full bg-[#28C941]/80" />
        </span>
        <span className="ml-1 flex-1 truncate rounded-full bg-white/70 px-3 py-1 text-[11px] text-ink-500">
          {adresse || `${domene}.com`}
        </span>
      </div>

      <div
        className="relative overflow-hidden rounded-[16px]"
        style={{ background: f.bg, color: f.tekst, transition: overgang, minHeight: 300 }}
      >
        {/* meny */}
        <motion.div
          {...blokk(0)}
          className="flex items-center justify-between px-4 py-3"
          style={{ borderBottom: `1px solid ${f.tekst}14`, transition: overgang }}
        >
          <span className="flex items-center gap-2">
            <span className="grid h-6 w-6 place-items-center text-[11px] font-bold text-white" style={{ background: hoved, borderRadius: rund / 2, transition: overgang }}>
              {(navn || 'D').trim().charAt(0).toUpperCase()}
            </span>
            <span className={`text-[13px] font-bold ${serif ? 'font-serif' : ''}`}>{navn || 'Din bedrift'}</span>
          </span>
          <span className="hidden gap-3 text-[10.5px] opacity-70 sm:flex">
            {menyer.map((m) => (
              <span key={m}>{m}</span>
            ))}
          </span>
        </motion.div>

        {/* hovedfelt */}
        <motion.div {...blokk(1)} className="grid grid-cols-5 gap-3 px-4 pb-3 pt-5">
          <div className="col-span-3">
            <div className={`text-[19px] font-bold leading-tight ${serif ? 'font-serif' : ''}`}>
              Velkommen til {navn || 'oss'}
            </div>
            <div className="mt-2 space-y-1.5">
              <i className="block h-1.5 w-[92%] rounded-full" style={{ background: `${f.tekst}22` }} />
              <i className="block h-1.5 w-[70%] rounded-full" style={{ background: `${f.tekst}22` }} />
            </div>
            <div className="mt-3 flex gap-2">
              <span className="px-3 py-1.5 text-[10.5px] font-semibold text-white" style={{ background: hoved, borderRadius: rund, transition: overgang }}>
                Bestill time
              </span>
              <span className="px-3 py-1.5 text-[10.5px] font-semibold" style={{ border: `1px solid ${hoved}`, color: hoved, borderRadius: rund, transition: overgang }}>
                Ring oss
              </span>
            </div>
          </div>
          <div
            className="col-span-2 h-[92px]"
            style={{
              borderRadius: rund,
              background: `linear-gradient(140deg, ${hoved}, ${f.aksent})`,
              transition: overgang,
            }}
          />
        </motion.div>

        {/* kort */}
        <div className="grid grid-cols-3 gap-2.5 px-4 pb-4">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              {...blokk(2 + i)}
              className="p-2.5"
              style={{ background: f.flate, borderRadius: rund, border: `1px solid ${f.tekst}10`, transition: overgang }}
            >
              <i className="mb-2 block h-5 w-5" style={{ background: i === 1 ? f.aksent : hoved, borderRadius: rund / 2, opacity: 0.9, transition: overgang }} />
              <i className="mb-1 block h-1.5 w-[80%] rounded-full" style={{ background: `${f.tekst}30` }} />
              <i className="block h-1.5 w-[55%] rounded-full" style={{ background: `${f.tekst}18` }} />
            </motion.div>
          ))}
        </div>

        {/* bunn */}
        <motion.div
          {...blokk(5)}
          className="flex items-center justify-between px-4 py-3 text-[10px]"
          style={{ background: tema.mork ? f.flate : f.tekst, color: tema.mork ? f.tekst : f.bg, transition: overgang }}
        >
          <span>© {navn || 'Din bedrift'}</span>
          <span className="opacity-70">Åpent 9–17</span>
        </motion.div>
      </div>
    </div>
  );
}
