'use client';

import type { ReactNode } from 'react';

export function Felt({ label, hint, children, id }: { label: string; hint?: string; children: ReactNode; id?: string }) {
  return (
    <div>
      <label className="label" htmlFor={id}>
        {label}
      </label>
      {children}
      {hint && <p className="hint">{hint}</p>}
    </div>
  );
}

export function Seksjon({ tittel, tekst, children }: { tittel: string; tekst?: string; children: ReactNode }) {
  return (
    <div>
      <h3 className="text-lg">{tittel}</h3>
      {tekst && <p className="mt-1 text-sm text-ink-500">{tekst}</p>}
      <div className="mt-3">{children}</div>
    </div>
  );
}

/** Rad med valgbare «piller» (flervalg eller enkeltvalg) */
export function Piller({
  valg,
  valgt,
  onChange,
  enkel = false,
}: {
  valg: string[];
  valgt: string[];
  onChange: (v: string[]) => void;
  enkel?: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {valg.map((v) => {
        const på = valgt.includes(v);
        return (
          <button
            key={v}
            type="button"
            className="pill"
            data-on={på}
            aria-pressed={på}
            onClick={() => onChange(enkel ? (på ? [] : [v]) : på ? valgt.filter((x) => x !== v) : [...valgt, v])}
          >
            {på && !enkel && (
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M5 12.5l4.5 4.5L19 7.5" />
              </svg>
            )}
            {v}
          </button>
        );
      })}
    </div>
  );
}

export function Valgkort({
  på,
  onClick,
  tittel,
  tekst,
  hoyre,
}: {
  på: boolean;
  onClick: () => void;
  tittel: string;
  tekst?: string;
  hoyre?: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={på}
      className={`flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition-all duration-300 ${
        på ? 'border-gran-400 bg-white/85 shadow-lift' : 'border-white/70 bg-white/45 hover:bg-white/70'
      }`}
    >
      <span
        className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 transition ${
          på ? 'border-gran-600 bg-gran-600' : 'border-ink-300'
        }`}
        aria-hidden
      >
        {på && <span className="h-2 w-2 rounded-full bg-white" />}
      </span>
      <span className="flex-1">
        <span className="block font-semibold text-ink-900">{tittel}</span>
        {tekst && <span className="mt-0.5 block text-sm leading-relaxed text-ink-500">{tekst}</span>}
      </span>
      {hoyre}
    </button>
  );
}
