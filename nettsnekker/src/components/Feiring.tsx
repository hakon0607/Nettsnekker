'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

/** Høvelspon og glassdråper som drysser ned én gang. */
export function Feiring() {
  const [biter, setBiter] = useState<{ x: number; r: number; d: number; f: string; w: number }[]>([]);
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const farger = ['#F2B33D', '#FAC968', '#43A284', '#73C2A6', '#A9C8FF'];
    setBiter(Array.from({ length: 34 }, (_, i) => ({ x: Math.random() * 100, r: Math.random() * 540 - 270, d: Math.random() * 0.6, f: farger[i % farger.length], w: 6 + Math.random() * 14 })));
  }, []);
  return (
    <div className="pointer-events-none fixed inset-0 z-[60] overflow-hidden" aria-hidden>
      {biter.map((b, i) => (
        <motion.span
          key={i}
          className="absolute top-0 block rounded-full"
          style={{ left: `${b.x}%`, width: b.w, height: 4, background: b.f }}
          initial={{ y: -20, rotate: 0, opacity: 1 }}
          animate={{ y: '105vh', rotate: b.r, opacity: [1, 1, 0] }}
          transition={{ duration: 2.4 + b.d * 2, delay: b.d, ease: [0.3, 0.7, 0.4, 1] }}
        />
      ))}
    </div>
  );
}
