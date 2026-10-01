'use client';

/** Pluss/minus-teller */
export function Teller({ verdi, min = 0, maks = 10, onChange, navn }: { verdi: number; min?: number; maks?: number; onChange: (v: number) => void; navn: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-white/70 p-1 shadow-sm">
      <button type="button" className="grid h-8 w-8 place-items-center rounded-full text-lg text-ink-700 transition hover:bg-white disabled:opacity-30" onClick={() => onChange(Math.max(min, verdi - 1))} disabled={verdi <= min} aria-label={`Færre ${navn}`}>
        −
      </button>
      <span className="price w-7 text-center font-semibold" aria-live="polite">{verdi}</span>
      <button type="button" className="grid h-8 w-8 place-items-center rounded-full text-lg text-ink-700 transition hover:bg-white disabled:opacity-30" onClick={() => onChange(Math.min(maks, verdi + 1))} disabled={verdi >= maks} aria-label={`Flere ${navn}`}>
        +
      </button>
    </span>
  );
}

/** Av/på-bryter */
export function Bryter({ på, onChange, label }: { på: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={på}
      aria-label={label}
      onClick={() => onChange(!på)}
      className={`relative h-8 w-14 shrink-0 rounded-full transition-colors duration-300 ${på ? 'bg-gran-600' : 'bg-ink-200'}`}
      style={{ boxShadow: 'inset 0 1px 3px rgba(0,0,0,.18)' }}
    >
      <span
        className="absolute top-1 h-6 w-6 rounded-full bg-white shadow-md"
        style={{ left: på ? 28 : 4, transition: 'left .45s cubic-bezier(.34,1.56,.64,1)' }}
      />
    </button>
  );
}
