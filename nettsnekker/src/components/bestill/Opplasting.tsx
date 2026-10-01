'use client';

import { useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { getBrowserClient } from '@/lib/supabase/client';
import type { Fil } from '@/lib/ordre';

const AKSEPT: Record<Fil['kategori'], string> = {
  logo: 'image/*,.svg,.pdf',
  bilder: 'image/*',
  dokumenter: '.pdf,.doc,.docx,.txt,.md,.odt,.csv,.zip',
};

const TITTEL: Record<Fil['kategori'], { navn: string; tekst: string }> = {
  logo: { navn: 'Logo', tekst: 'PNG, SVG eller PDF. Gjerne med gjennomsiktig bakgrunn.' },
  bilder: { navn: 'Bilder', tekst: 'Av lokalet, produktene, teamet eller arbeidet deres.' },
  dokumenter: { navn: 'Tekster og dokumenter', tekst: 'Prislister, menyer, tekst om bedriften.' },
};

function storrelse(b: number) {
  return b > 1024 * 1024 ? `${(b / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} kB`;
}

export function Opplasting({
  kategori,
  filer,
  setFiler,
  utkastId,
}: {
  kategori: Fil['kategori'];
  filer: Fil[];
  setFiler: (f: (gamle: Fil[]) => Fil[]) => void;
  utkastId: string;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [dra, setDra] = useState(false);
  const [laster, setLaster] = useState<string[]>([]);
  const [feil, setFeil] = useState('');
  const mine = filer.filter((f) => f.kategori === kategori);

  const lastOpp = async (liste: FileList | null) => {
    if (!liste?.length) return;
    setFeil('');
    const sb = getBrowserClient();
    if (!sb) {
      setFeil('Opplasting er ikke satt opp ennå. Send filene på e-post etter bestillingen.');
      return;
    }
    const valgte = Array.from(liste).slice(0, kategori === 'logo' ? 3 : 15);
    setLaster(valgte.map((f) => f.name));
    try {
      const r = await fetch('/api/opplasting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          utkastId,
          filer: valgte.map((f) => ({ navn: f.name, type: f.type, storrelse: f.size, kategori })),
        }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Opplastingen feilet');
      const nye: Fil[] = [];
      for (let i = 0; i < valgte.length; i++) {
        const f = valgte[i];
        const { path, token } = j.filer[i];
        const { error } = await sb.storage.from('bestillinger').uploadToSignedUrl(path, token, f, { contentType: f.type || undefined });
        if (error) throw new Error(`${f.name}: ${error.message}`);
        nye.push({ path, navn: f.name, type: f.type || 'application/octet-stream', storrelse: f.size, kategori });
        setLaster((l) => l.filter((x) => x !== f.name));
      }
      setFiler((gamle) => [...gamle, ...nye]);
    } catch (e) {
      setFeil(e instanceof Error ? e.message : 'Opplastingen feilet');
    } finally {
      setLaster([]);
      if (input.current) input.current.value = '';
    }
  };

  return (
    <div>
      <p className="font-semibold">{TITTEL[kategori].navn}</p>
      <p className="mb-2 text-sm text-ink-500">{TITTEL[kategori].tekst}</p>
      <button
        type="button"
        onClick={() => input.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDra(true);
        }}
        onDragLeave={() => setDra(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDra(false);
          lastOpp(e.dataTransfer.files);
        }}
        className={`flex w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed px-4 py-6 text-center transition-all duration-300 ${
          dra ? 'scale-[1.01] border-gran-500 bg-gran-50/80' : 'border-ink-200 bg-white/40 hover:border-gran-300 hover:bg-white/60'
        }`}
      >
        <motion.svg
          viewBox="0 0 24 24"
          className="h-7 w-7 text-gran-600"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          animate={dra ? { y: [-2, 2, -2] } : { y: 0 }}
          transition={{ repeat: dra ? Infinity : 0, duration: 0.8 }}
          aria-hidden
        >
          <path d="M12 16V4M7 9l5-5 5 5M5 20h14" />
        </motion.svg>
        <span className="mt-2 text-sm font-semibold text-ink-800">Velg filer eller dra dem hit</span>
        <span className="text-xs text-ink-500">Maks 15 MB per fil</span>
      </button>
      <input ref={input} type="file" className="hidden" multiple={kategori !== 'logo'} accept={AKSEPT[kategori]} onChange={(e) => lastOpp(e.target.files)} />

      {feil && (
        <p className="mt-2 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {feil}
        </p>
      )}
      <ul className="mt-2 space-y-1.5">
        <AnimatePresence initial={false}>
          {laster.map((n) => (
            <motion.li key={`l-${n}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2 rounded-xl bg-white/60 px-3 py-2 text-sm text-ink-600">
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-gran-500 border-t-transparent" />
              Laster opp {n} …
            </motion.li>
          ))}
          {mine.map((f) => (
            <motion.li
              key={f.path}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 8 }}
              className="flex items-center justify-between gap-2 rounded-xl bg-white/70 px-3 py-2 text-sm"
            >
              <span className="flex min-w-0 items-center gap-2">
                <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-gran-600" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
                  <path d="M5 12.5l4.5 4.5L19 7.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="truncate">{f.navn}</span>
                <span className="shrink-0 text-xs text-ink-400">{storrelse(f.storrelse)}</span>
              </span>
              <button type="button" className="shrink-0 text-xs font-semibold text-ink-500 hover:text-red-600" onClick={() => setFiler((g) => g.filter((x) => x.path !== f.path))}>
                Fjern
              </button>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    </div>
  );
}
