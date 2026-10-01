'use client';

import { animate } from 'framer-motion';
import { useEffect, useRef } from 'react';

/** Beløp som ruller til ny verdi når det endres. */
export function Belop({ verdi, className = '' }: { verdi: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const forrige = useRef(verdi);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fra = forrige.current;
    forrige.current = verdi;
    if (fra === verdi) {
      el.textContent = `${Math.round(verdi).toLocaleString('nb-NO')} kr`;
      return;
    }
    const c = animate(fra, verdi, {
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => (el.textContent = `${Math.round(v).toLocaleString('nb-NO')} kr`),
    });
    return () => c.stop();
  }, [verdi]);
  return (
    <span ref={ref} className={`price ${className}`}>
      {Math.round(verdi).toLocaleString('nb-NO')} kr
    </span>
  );
}
