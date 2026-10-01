'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { useEffect, useState, type ReactNode } from 'react';
import { AdminProvider, useAdmin } from './AdminProvider';
import { Logginn } from './Logginn';
import { Logo } from '../Logo';
import { GlassBackdrop } from '../glass/GlassFx';

const MENY = [
  { href: '/admin', navn: 'Oversikt', ikon: 'M4 13h6V4H4v9zm0 7h6v-5H4v5zm10 0h6v-9h-6v9zm0-16v5h6V4h-6z' },
  { href: '/admin/bestillinger', navn: 'Bestillinger', ikon: 'M4 6h16M4 12h16M4 18h10' },
  { href: '/admin/epost', navn: 'E-post', ikon: 'M4 6h16v12H4zM4 7l8 6 8-6' },
  { href: '/admin/priser', navn: 'Priser', ikon: 'M12 3v18M17 7.5c0-1.9-2.2-3-5-3s-5 1.1-5 3 2 2.6 5 3.2 5 1.6 5 3.5-2.2 3.3-5 3.3-5-1.4-5-3.3' },
  { href: '/admin/innhold', navn: 'Innhold', ikon: 'M5 4h14v16H5zM8 8h8M8 12h8M8 16h5' },
  { href: '/admin/vilkar', navn: 'Vilkår', ikon: 'M7 3h7l5 5v13H7zM14 3v5h5' },
  { href: '/admin/innstillinger', navn: 'Innstillinger', ikon: 'M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.6 1.6 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.6 1.6 0 00-2.7 1.1V21a2 2 0 11-4 0v-.1a1.6 1.6 0 00-2.7-1.1l-.1.1a2 2 0 11-2.8-2.8l.1-.1A1.6 1.6 0 004.6 15H3a2 2 0 110-4h.1a1.6 1.6 0 001.1-2.7l-.1-.1a2 2 0 112.8-2.8l.1.1A1.6 1.6 0 009 4.6V3a2 2 0 114 0v.1a1.6 1.6 0 002.7 1.1l.1-.1a2 2 0 112.8 2.8l-.1.1A1.6 1.6 0 0019.4 9H21a2 2 0 110 4h-.1a1.6 1.6 0 00-1.5 2z' },
];

function Ikon({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] shrink-0" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={d} />
    </svg>
  );
}

export function AdminShell({ children }: { children: ReactNode }) {
  const sti = usePathname();
  const [nye, setNye] = useState(0);

  if (sti === '/admin/nytt-passord') return <>{children}</>;

  return (
    <>
      <GlassBackdrop />
      <AdminProvider logginn={(sb, feil) => <Logginn sb={sb} feil={feil} />}>
        {(ctx) => (
          <>
            <TellNye setNye={setNye} />
            <div className="min-h-screen lg:grid lg:grid-cols-[250px_1fr]">
              {/* sidemeny */}
              <aside className="hidden p-4 lg:block">
                <div className="glass sticky top-4 flex h-[calc(100vh-2rem)] flex-col rounded-[26px] p-4">
                  <Link href="/admin" className="px-2 py-1">
                    <Logo />
                  </Link>
                  <nav className="mt-6 flex-1 space-y-1" aria-label="Admin">
                    {MENY.map((m) => {
                      const aktiv = m.href === '/admin' ? sti === '/admin' : sti.startsWith(m.href);
                      return (
                        <Link
                          key={m.href}
                          href={m.href}
                          className={`relative flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition ${aktiv ? 'text-white' : 'text-ink-700 hover:bg-white/60'}`}
                        >
                          {aktiv && (
                            <motion.span layoutId="admin-meny" className="absolute inset-0 rounded-2xl bg-gradient-to-b from-gran-500 to-gran-700 shadow-lift" transition={{ type: 'spring', stiffness: 400, damping: 32 }} />
                          )}
                          <span className="relative z-10 flex flex-1 items-center gap-3">
                            <Ikon d={m.ikon} />
                            {m.navn}
                            {m.href === '/admin/bestillinger' && nye > 0 && (
                              <span className="ml-auto rounded-full bg-harpiks-400 px-2 py-0.5 text-[11px] font-bold text-ink-900">{nye}</span>
                            )}
                          </span>
                        </Link>
                      );
                    })}
                  </nav>
                  <div className="border-t border-white/60 pt-3 text-xs text-ink-500">
                    <p className="truncate px-2">{ctx.epost}</p>
                    <div className="mt-2 flex gap-2">
                      <Link href="/" target="_blank" className="btn-ghost btn-sm flex-1">
                        Se siden
                      </Link>
                      <button className="btn-ghost btn-sm flex-1" onClick={ctx.loggUt}>
                        Logg ut
                      </button>
                    </div>
                  </div>
                </div>
              </aside>

              {/* topp på mobil */}
              <div className="flex items-center justify-between p-3 lg:hidden">
                <Logo />
                <details className="relative">
                  <summary className="btn-ghost btn-sm list-none">Mer</summary>
                  <div className="glass absolute right-0 z-50 mt-2 w-52 rounded-2xl p-2">
                    {MENY.slice(5).map((m) => (
                      <Link key={m.href} href={m.href} className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm hover:bg-white/70">
                        <Ikon d={m.ikon} />
                        {m.navn}
                      </Link>
                    ))}
                    <Link href="/" target="_blank" className="block rounded-xl px-3 py-2.5 text-sm hover:bg-white/70">Se nettsiden</Link>
                    <button className="block w-full rounded-xl px-3 py-2.5 text-left text-sm hover:bg-white/70" onClick={ctx.loggUt}>Logg ut</button>
                  </div>
                </details>
              </div>

              <main className="min-w-0 px-3 pb-28 pt-2 sm:px-6 lg:py-6">{children}</main>
            </div>

            {/* bunnmeny på mobil */}
            <nav className="glass-nav fixed inset-x-2 bottom-2 z-40 flex justify-between rounded-[22px] p-1.5 lg:hidden" aria-label="Admin">
              {MENY.slice(0, 5).map((m) => {
                const aktiv = m.href === '/admin' ? sti === '/admin' : sti.startsWith(m.href);
                return (
                  <Link key={m.href} href={m.href} className={`relative flex flex-1 flex-col items-center gap-0.5 rounded-2xl py-2 text-[10.5px] font-medium ${aktiv ? 'bg-gran-600 text-white' : 'text-ink-600'}`}>
                    <Ikon d={m.ikon} />
                    {m.navn}
                    {m.href === '/admin/bestillinger' && nye > 0 && <span className="absolute right-3 top-1 h-2 w-2 rounded-full bg-harpiks-400" />}
                  </Link>
                );
              })}
            </nav>
          </>
        )}
      </AdminProvider>
    </>
  );
}

/** Teller nye bestillinger og oppdaterer i sanntid */
function TellNye({ setNye }: { setNye: (n: number) => void }) {
  const { sb } = useAdmin();
  useEffect(() => {
    const tell = async () => {
      const { count } = await sb.from('orders').select('id', { count: 'exact', head: true }).eq('status', 'ny');
      setNye(count ?? 0);
    };
    tell();
    const kanal = sb.channel('nye-ordre').on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, tell).subscribe();
    return () => {
      sb.removeChannel(kanal);
    };
  }, [sb, setNye]);
  return null;
}
