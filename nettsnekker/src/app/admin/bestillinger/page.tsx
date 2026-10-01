'use client';

import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAdmin } from '@/components/admin/AdminProvider';
import { Sidetopp, StatusMerke, Tom, dato } from '@/components/admin/ui';
import { STATUSER, type Ordre } from '@/lib/ordre';
import { kr } from '@/lib/pricing';

const FILTRE = [
  { id: 'alle', navn: 'Alle' },
  { id: 'aktive', navn: 'Aktive' },
  ...STATUSER.map((s) => ({ id: s.id, navn: s.navn })),
];
const AKTIVE = ['ny', 'under_arbeid', 'utkast_sendt', 'endringer', 'godkjent'];

function Liste() {
  const { sb } = useAdmin();
  const params = useSearchParams();
  const router = useRouter();
  const [ordre, setOrdre] = useState<Ordre[]>([]);
  const [laster, setLaster] = useState(true);
  const [sok, setSok] = useState('');
  const filter = params.get('status') ?? 'aktive';

  useEffect(() => {
    const hent = async () => {
      const { data } = await sb.from('orders').select('*').order('created_at', { ascending: false }).limit(1000);
      setOrdre((data as Ordre[]) ?? []);
      setLaster(false);
    };
    hent();
    const k = sb.channel('liste').on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, hent).subscribe();
    return () => {
      sb.removeChannel(k);
    };
  }, [sb]);

  const synlige = useMemo(() => {
    const q = sok.trim().toLowerCase();
    return ordre.filter((o) => {
      if (filter === 'aktive' && !AKTIVE.includes(o.status)) return false;
      if (filter !== 'alle' && filter !== 'aktive' && o.status !== filter) return false;
      if (!q) return true;
      return [o.ordrenr, o.bedrift_navn, o.kunde_navn, o.kunde_epost, o.domene, o.kunde_telefon].some((x) => (x ?? '').toLowerCase().includes(q));
    });
  }, [ordre, filter, sok]);

  const antall = (id: string) => (id === 'alle' ? ordre.length : id === 'aktive' ? ordre.filter((o) => AKTIVE.includes(o.status)).length : ordre.filter((o) => o.status === id).length);

  return (
    <div>
      <Sidetopp tittel="Bestillinger" tekst="Klikk på en bestilling for å se alt, lage prompt, sende e-post og ta betalt." />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <input className="field sm:max-w-xs" placeholder="Søk navn, e-post, ordrenr, domene …" value={sok} onChange={(e) => setSok(e.target.value)} aria-label="Søk" />
        <div className="no-scrollbar flex gap-1.5 overflow-x-auto">
          {FILTRE.map((f) => (
            <button key={f.id} className="pill shrink-0" data-on={filter === f.id} onClick={() => router.replace(`/admin/bestillinger?status=${f.id}`)}>
              {f.navn}
              <span className="text-[11px] opacity-70">{antall(f.id)}</span>
            </button>
          ))}
        </div>
      </div>

      {laster ? (
        <p className="text-ink-500">Laster …</p>
      ) : synlige.length === 0 ? (
        <Tom tekst={ordre.length ? 'Ingen bestillinger passer filteret.' : 'Ingen bestillinger ennå. De dukker opp her så fort noen bestiller.'} />
      ) : (
        <div className="glass overflow-hidden rounded-[24px]">
          <table className="w-full text-sm">
            <thead className="hidden bg-white/40 text-left text-xs text-ink-500 md:table-header-group">
              <tr>
                <th className="px-5 py-3 font-semibold">Bestilling</th>
                <th className="px-3 py-3 font-semibold">Kunde</th>
                <th className="px-3 py-3 font-semibold">Status</th>
                <th className="px-3 py-3 font-semibold">Betalt</th>
                <th className="px-5 py-3 text-right font-semibold">Total</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence initial={false}>
                {synlige.map((o) => (
                  <motion.tr
                    key={o.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="cursor-pointer border-t border-white/60 transition hover:bg-white/60"
                    onClick={() => router.push(`/admin/bestillinger/${o.id}`)}
                  >
                    <td className="px-5 py-3.5">
                      <Link href={`/admin/bestillinger/${o.id}`} className="font-semibold text-ink-900" onClick={(e) => e.stopPropagation()}>
                        {o.bedrift_navn}
                      </Link>
                      <span className="block text-xs text-ink-500">
                        {o.ordrenr} · {dato(o.created_at)}
                      </span>
                      <span className="mt-1 block md:hidden">
                        <StatusMerke status={o.status} liten /> <span className="price ml-2 font-semibold">{kr(o.total)}</span>
                      </span>
                    </td>
                    <td className="hidden px-3 py-3.5 md:table-cell">
                      {o.kunde_navn}
                      <span className="block text-xs text-ink-500">{o.kunde_epost}</span>
                    </td>
                    <td className="hidden px-3 py-3.5 md:table-cell">
                      <StatusMerke status={o.status} />
                    </td>
                    <td className="hidden px-3 py-3.5 text-xs md:table-cell">
                      <span className={o.gebyr_betalt ? 'text-gran-700' : 'text-ink-400'}>{o.gebyr_betalt ? '✓' : '○'} Gebyr</span>
                      <span className={`ml-2 ${o.rest_betalt ? 'text-gran-700' : 'text-ink-400'}`}>{o.rest_betalt ? '✓' : '○'} Rest</span>
                    </td>
                    <td className="price hidden px-5 py-3.5 text-right font-semibold md:table-cell">{kr(o.total)}</td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function Bestillinger() {
  return (
    <Suspense fallback={<p className="text-ink-500">Laster …</p>}>
      <Liste />
    </Suspense>
  );
}
