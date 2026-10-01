'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAdmin } from './AdminProvider';
import { slaSammen, type Innstillinger } from '@/lib/innstillinger-felles';

/** Alle innstillinger i admin, med standardverdier der ingenting er lagret. */
export function useInnstillinger() {
  const { sb } = useAdmin();
  const [inn, setInn] = useState<Innstillinger | null>(null);
  const [lagret, setLagret] = useState<Record<string, unknown>>({});
  const hent = useCallback(async () => {
    const { data } = await sb.from('settings').select('key,value');
    const rader: Record<string, unknown> = {};
    for (const r of (data as { key: string; value: unknown }[] | null) ?? []) rader[r.key] = r.value;
    setLagret(rader);
    setInn(slaSammen(rader));
  }, [sb]);
  useEffect(() => {
    hent();
  }, [hent]);
  return { inn, lagret, hentPaNytt: hent };
}
