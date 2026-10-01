'use client';

import type { ReactNode } from 'react';
import { statusInfo } from '@/lib/ordre';

export function Kort({ children, className = '', tittel, handling }: { children: ReactNode; className?: string; tittel?: ReactNode; handling?: ReactNode }) {
  return (
    <section className={`glass rounded-[24px] p-5 sm:p-6 ${className}`}>
      {(tittel || handling) && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          {tittel && <h2 className="text-lg">{tittel}</h2>}
          {handling}
        </div>
      )}
      {children}
    </section>
  );
}

export function Sidetopp({ tittel, tekst, handling }: { tittel: string; tekst?: ReactNode; handling?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-3xl sm:text-4xl">{tittel}</h1>
        {tekst && <p className="mt-1.5 max-w-2xl text-ink-600">{tekst}</p>}
      </div>
      {handling}
    </div>
  );
}

export function StatusMerke({ status, liten = false }: { status: string; liten?: boolean }) {
  const s = statusInfo(status);
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full font-semibold ${liten ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs'}`} style={{ background: `${s.farge}22`, color: s.farge === '#AAB7B3' ? '#61716C' : s.farge }}>
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: s.farge }} />
      {s.navn}
    </span>
  );
}

export function Tom({ tekst, handling }: { tekst: string; handling?: ReactNode }) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-ink-200 p-8 text-center text-ink-500">
      <p>{tekst}</p>
      {handling && <div className="mt-4">{handling}</div>}
    </div>
  );
}

export function dato(d: string | null | undefined, medTid = false) {
  if (!d) return '–';
  return new Date(d).toLocaleString('nb-NO', medTid ? { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' } : { day: 'numeric', month: 'short', year: 'numeric' });
}

export function siden(d: string) {
  const s = (Date.now() - new Date(d).getTime()) / 1000;
  if (s < 60) return 'nå nettopp';
  if (s < 3600) return `${Math.floor(s / 60)} min siden`;
  if (s < 86400) return `${Math.floor(s / 3600)} t siden`;
  const dager = Math.floor(s / 86400);
  return dager === 1 ? 'i går' : `${dager} dager siden`;
}

/** Lagre-linje som dukker opp nederst når noe er endret */
export function LagreLinje({ endret, lagrer, onLagre, onAngre }: { endret: boolean; lagrer: boolean; onLagre: () => void; onAngre?: () => void }) {
  if (!endret) return null;
  return (
    <div className="fixed inset-x-3 bottom-24 z-50 mx-auto flex max-w-xl items-center justify-between gap-3 rounded-full bg-ink-900 py-2 pl-5 pr-2 text-white shadow-lift lg:bottom-6">
      <span className="text-sm">Du har endringer som ikke er lagret</span>
      <span className="flex gap-2">
        {onAngre && (
          <button className="rounded-full px-3 py-2 text-sm text-white/70 hover:text-white" onClick={onAngre}>
            Angre
          </button>
        )}
        <button className="btn-resin btn-sm" onClick={onLagre} disabled={lagrer}>
          {lagrer ? 'Lagrer …' : 'Lagre'}
        </button>
      </span>
    </div>
  );
}
