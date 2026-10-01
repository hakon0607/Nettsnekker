'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { Session, SupabaseClient } from '@supabase/supabase-js';
import { getBrowserClient } from '@/lib/supabase/client';

type Toast = { id: number; tekst: string; type: 'ok' | 'feil' };

type Ctx = {
  sb: SupabaseClient;
  session: Session;
  epost: string;
  /** Kaller et admin-API med innloggingen */
  api: <T = Record<string, unknown>>(sti: string, body?: unknown, metode?: string) => Promise<T>;
  /** Leser og lagrer innstillinger (tabellen settings) */
  lesInnstilling: <T>(key: string) => Promise<T | null>;
  lagreInnstilling: (key: string, value: unknown) => Promise<void>;
  toast: (tekst: string, type?: 'ok' | 'feil') => void;
  loggUt: () => Promise<void>;
};

const AdminCtx = createContext<Ctx | null>(null);

export function useAdmin() {
  const c = useContext(AdminCtx);
  if (!c) throw new Error('useAdmin må brukes inne i AdminProvider');
  return c;
}

export function AdminProvider({ children, logginn }: { children: (ctx: Ctx) => ReactNode; logginn: (sb: SupabaseClient | null, feil: string) => ReactNode }) {
  const sb = getBrowserClient() as SupabaseClient | null;
  const [session, setSession] = useState<Session | null>(null);
  const [klar, setKlar] = useState(false);
  const [erAdmin, setErAdmin] = useState<boolean | null>(null);
  const [feil, setFeil] = useState('');
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    if (!sb) {
      setKlar(true);
      return;
    }
    sb.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setKlar(true);
    });
    const { data: sub } = sb.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, [sb]);

  // Sjekk at brukeren faktisk er admin
  useEffect(() => {
    if (!session) {
      setErAdmin(null);
      return;
    }
    fetch('/api/admin/meg', { headers: { Authorization: `Bearer ${session.access_token}` } })
      .then((r) => r.json())
      .then((j) => {
        setErAdmin(!!j.admin);
        if (!j.admin) setFeil(j.error || `${j.epost ?? 'Denne brukeren'} er ikke lagt inn som admin. Se OPPSETT.md.`);
      })
      .catch(() => setErAdmin(false));
  }, [session]);

  const toast = useCallback((tekst: string, type: 'ok' | 'feil' = 'ok') => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, tekst, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), type === 'feil' ? 6000 : 3200);
  }, []);

  const ctx = useMemo<Ctx | null>(() => {
    if (!sb || !session) return null;
    return {
      sb,
      session,
      epost: session.user.email ?? '',
      api: async (sti, body, metode) => {
        const r = await fetch(sti, {
          method: metode ?? (body === undefined ? 'GET' : 'POST'),
          headers: { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
          body: body === undefined ? undefined : JSON.stringify(body),
        });
        const j = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error((j as { error?: string; feil?: string }).error || (j as { feil?: string }).feil || `Feil ${r.status}`);
        return j;
      },
      lesInnstilling: async (key) => {
        const { data } = await sb.from('settings').select('value').eq('key', key).maybeSingle();
        return (data?.value as never) ?? null;
      },
      lagreInnstilling: async (key, value) => {
        const { error } = await sb.from('settings').upsert({ key, value, updated_at: new Date().toISOString() });
        if (error) throw new Error(error.message);
      },
      toast,
      loggUt: async () => {
        await sb.auth.signOut();
      },
    };
  }, [sb, session, toast]);

  if (!klar) return <div className="grid min-h-screen place-items-center text-ink-500">Laster …</div>;

  return (
    <>
      {ctx && erAdmin ? (
        <AdminCtx.Provider value={ctx}>{children(ctx)}</AdminCtx.Provider>
      ) : session && erAdmin === null ? (
        <div className="grid min-h-screen place-items-center text-ink-500">Sjekker tilgang …</div>
      ) : (
        logginn(sb, session && erAdmin === false ? feil : '')
      )}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex flex-col items-end gap-2" aria-live="polite">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 16, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className={`pointer-events-auto max-w-sm rounded-2xl px-4 py-3 text-sm font-medium shadow-lift ${t.type === 'ok' ? 'bg-ink-900 text-white' : 'bg-red-600 text-white'}`}
            >
              {t.tekst}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </>
  );
}
