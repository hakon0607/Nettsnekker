'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Logo } from './Logo';

const LENKER = [
  { href: '/#slik', tekst: 'Slik foregår det' },
  { href: '/#priser', tekst: 'Priser' },
  { href: '/#admin', tekst: 'Adminside' },
  { href: '/#sporsmal', tekst: 'Spørsmål' },
];

export function Nav({ navn }: { navn: string }) {
  const [apen, setApen] = useState(false);
  const [rullet, setRullet] = useState(false);
  const sti = usePathname();

  useEffect(() => {
    const f = () => setRullet(window.scrollY > 12);
    f();
    window.addEventListener('scroll', f, { passive: true });
    return () => window.removeEventListener('scroll', f);
  }, []);
  useEffect(() => setApen(false), [sti]);

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-5">
      <nav
        className={`glass-nav mx-auto flex max-w-6xl items-center justify-between rounded-full py-2 pl-4 pr-2 transition-all ${
          rullet ? 'shadow-lift' : ''
        }`}
        aria-label="Hovedmeny"
      >
        <Link href="/" aria-label={`${navn} – forsiden`}>
          <Logo navn={navn} />
        </Link>
        <div className="hidden items-center gap-1 md:flex">
          {LENKER.map((l) => (
            <Link key={l.href} href={l.href} className="rounded-full px-3.5 py-2 text-sm font-medium text-ink-700 transition hover:bg-white/70 hover:text-ink-900">
              {l.tekst}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Link href="/bestill" className="btn-primary btn-sm" data-mag>
            Bestill nettside
          </Link>
          <button
            className="grid h-10 w-10 place-items-center rounded-full bg-white/60 md:hidden"
            onClick={() => setApen((v) => !v)}
            aria-expanded={apen}
            aria-label="Meny"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              {apen ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </div>
      </nav>
      <AnimatePresence>
        {apen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            className="glass mx-auto mt-2 max-w-6xl rounded-3xl p-2 md:hidden"
          >
            {LENKER.map((l) => (
              <Link key={l.href} href={l.href} className="block rounded-2xl px-4 py-3 font-medium text-ink-800 hover:bg-white/70">
                {l.tekst}
              </Link>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
