'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAdmin } from './AdminProvider';
import { STANDARD_MALER, type Mal } from '@/lib/maler';

/** E-postmalene: standard fra koden, overstyrt av det som er lagret. */
export function useMaler() {
  const { sb } = useAdmin();
  const [maler, setMaler] = useState<Mal[]>(STANDARD_MALER);
  const [endret, setEndret] = useState<Set<string>>(new Set());
  const hent = useCallback(async () => {
    const { data } = await sb.from('email_templates').select('*');
    const lagret: Record<string, Mal> = {};
    for (const m of (data as Mal[] | null) ?? []) lagret[m.key] = m;
    const alle = STANDARD_MALER.map((m) => ({ ...m, ...(lagret[m.key] ?? {}) }));
    for (const [k, m] of Object.entries(lagret)) if (!alle.find((x) => x.key === k)) alle.push(m);
    setMaler(alle.sort((a, b) => a.sort - b.sort));
    setEndret(new Set(Object.keys(lagret)));
  }, [sb]);
  useEffect(() => {
    hent();
  }, [hent]);
  return { maler, endret, hentPaNytt: hent };
}
