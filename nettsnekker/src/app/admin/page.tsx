'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAdmin } from '@/components/admin/AdminProvider';
import { Kort, Sidetopp, StatusMerke, Tom, siden } from '@/components/admin/ui';
import { STATUSER, type Ordre } from '@/lib/ordre';
import { kr } from '@/lib/pricing';

type Oppsett = Record<string, boolean | string>;
type Sendt = { id: string; order_id: string | null; til: string; emne: string; ok: boolean; created_at: string };

export default function Oversikt() {
  const { sb, api } = useAdmin();
  const [ordre, setOrdre] = useState<Ordre[]>([]);
  const [sendt, setSendt] = useState<Sendt[]>([]);
  const [oppsett, setOppsett] = useState<Oppsett | null>(null);
  const [laster, setLaster] = useState(true);
  const [vippsMangler, setVippsMangler] = useState(false);

  useEffect(() => {
    const hent = async () => {
      const [{ data: o }, { data: e }] = await Promise.all([
        sb.from('orders').select('*').order('created_at', { ascending: false }).limit(500),
        sb.from('sent_emails').select('id,order_id,til,emne,ok,created_at').order('created_at', { ascending: false }).limit(6),
      ]);
      setOrdre((o as Ordre[]) ?? []);
      setSendt((e as Sendt[]) ?? []);
      setLaster(false);
    };
    hent();
    api<Oppsett>('/api/admin/oppsett').then(setOppsett).catch(() => {});
    sb.from('settings').select('value').eq('key', 'bedrift').maybeSingle().then(({ data }) => setVippsMangler(!(data?.value as { vippsNummer?: string } | null)?.vippsNummer));
    const k = sb.channel('oversikt').on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, hent).subscribe();
    return () => {
      sb.removeChannel(k);
    };
  }, [sb, api]);

  const betalte = ordre.filter((o) => o.gebyr_betalt || o.status !== 'venter_gebyr');
  const inntekt = ordre.reduce((s, o) => s + (o.gebyr_betalt ? o.gebyr : 0) + (o.rest_betalt ? o.rest : 0), 0);
  const utestaende = ordre.filter((o) => !o.rest_betalt && ['ny', 'under_arbeid', 'utkast_sendt', 'endringer'].includes(o.status)).reduce((s, o) => s + o.rest, 0);
  const denneMnd = ordre.filter((o) => o.gebyr_betalt && new Date(o.created_at).getMonth() === new Date().getMonth() && new Date(o.created_at).getFullYear() === new Date().getFullYear()).length;

  // Ting som trenger deg
  const handlinger: { o: Ordre; tekst: string }[] = [];
  const nå = Date.now();
  for (const o of ordre) {
    if (o.status === 'venter_gebyr') handlinger.push({ o, tekst: `Se etter ${kr(o.gebyr)} på Vipps med meldingen ${o.ordrenr}` });
    if (o.status === 'utkast_sendt') handlinger.push({ o, tekst: `Venter på ${kr(o.rest)} på Vipps (${o.ordrenr})` });
    if (o.status === 'ny') handlinger.push({ o, tekst: o.claude_prompt ? 'Prompten er klar – start å snekre' : 'Ny bestilling – lag prompten' });
    if (o.status === 'utkast_sendt' && o.updated_at && nå - new Date(o.updated_at).getTime() > 5 * 864e5) handlinger.push({ o, tekst: 'Ingen svar på utkastet på 5 dager – send påminnelse' });
    if (o.status === 'endringer') handlinger.push({ o, tekst: 'Kunden vil ha endringer' });
    if (o.status === 'godkjent') handlinger.push({ o, tekst: 'Betalt – koble på domenet og send «live»-e-post' });
    if (o.hosting_fornyes && ['live', 'levert'].includes(o.status)) {
      const dager = (new Date(o.hosting_fornyes).getTime() - nå) / 864e5;
      if (dager < 30) handlinger.push({ o, tekst: `Hosting må fornyes ${dager < 0 ? 'nå (utløpt)' : `om ${Math.ceil(dager)} dager`}` });
    }
  }

  const mangler = oppsett
    ? [
        !oppsett.supabase && 'SUPABASE_SERVICE_ROLE_KEY',
        !oppsett.resend && 'RESEND_API_KEY',
        !oppsett.openai && 'OPENAI_API_KEY (valgfri)',
      ].filter(Boolean)
    : [];

  const tall = [
    { navn: 'Nye bestillinger', verdi: String(ordre.filter((o) => o.status === 'ny').length), lenke: '/admin/bestillinger?status=ny' },
    { navn: 'Under arbeid', verdi: String(ordre.filter((o) => ['under_arbeid', 'utkast_sendt', 'endringer'].includes(o.status)).length), lenke: '/admin/bestillinger?status=aktive' },
    { navn: 'Innbetalt totalt', verdi: kr(inntekt), lenke: '/admin/bestillinger' },
    { navn: 'Venter på godkjenning', verdi: kr(utestaende), lenke: '/admin/bestillinger?status=aktive' },
  ];

  return (
    <div className="space-y-6">
      <Sidetopp tittel="Oversikt" tekst={`${betalte.length} betalte bestillinger totalt, ${denneMnd} denne måneden.`} handling={<Link href="/admin/bestillinger" className="btn-primary">Alle bestillinger</Link>} />

      {mangler.length > 0 && (
        <div className="rounded-2xl bg-harpiks-100 px-5 py-4 text-sm text-ink-800">
          <strong>Oppsettet er ikke ferdig.</strong> Legg inn i Vercel → Settings → Environment Variables: {mangler.join(', ')}. Se OPPSETT.md.
        </div>
      )}
      {vippsMangler && (
        <Link href="/admin/innstillinger" className="block rounded-2xl bg-[#FFF1EC] px-5 py-4 text-sm text-ink-800">
          <strong>Vipps-nummeret mangler.</strong> Kundene vet ikke hvor de skal betale. Legg det inn under Innstillinger.
        </Link>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {tall.map((t, i) => (
          <motion.div key={t.navn} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Link href={t.lenke} className="glass block rounded-[22px] p-5 transition hover:-translate-y-0.5">
              <p className="text-sm text-ink-500">{t.navn}</p>
              <p className="price mt-1 font-display text-2xl font-bold sm:text-3xl">{laster ? '…' : t.verdi}</p>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* rørledningen */}
      <Kort tittel="Hvor bestillingene står">
        <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
          {STATUSER.filter((s) => s.id !== 'avbrutt').map((s) => {
            const n = ordre.filter((o) => o.status === s.id).length;
            return (
              <Link key={s.id} href={`/admin/bestillinger?status=${s.id}`} className="min-w-[120px] flex-1 rounded-2xl bg-white/55 p-3 transition hover:bg-white/85">
                <span className="block h-1 w-8 rounded-full" style={{ background: s.farge }} />
                <span className="mt-2 block text-xs text-ink-500">{s.navn}</span>
                <span className="price block font-display text-2xl font-bold">{n}</span>
              </Link>
            );
          })}
        </div>
      </Kort>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <Kort tittel="Trenger deg">
          {handlinger.length === 0 ? (
            <Tom tekst={laster ? 'Laster …' : 'Ingenting som haster. Godt jobbet!'} />
          ) : (
            <ul className="space-y-2">
              {handlinger.slice(0, 12).map(({ o, tekst }, i) => (
                <li key={`${o.id}-${i}`}>
                  <Link href={`/admin/bestillinger/${o.id}`} className="flex items-center justify-between gap-3 rounded-2xl bg-white/55 px-4 py-3 transition hover:bg-white/90">
                    <span className="min-w-0">
                      <span className="block truncate font-semibold">{o.bedrift_navn}</span>
                      <span className="block text-sm text-ink-500">{tekst}</span>
                    </span>
                    <StatusMerke status={o.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Kort>

        <Kort tittel="Sist sendte e-poster" handling={<Link href="/admin/epost" className="text-sm font-semibold text-gran-700">Se alle</Link>}>
          {sendt.length === 0 ? (
            <Tom tekst="Ingen e-poster sendt ennå." />
          ) : (
            <ul className="space-y-2">
              {sendt.map((e) => (
                <li key={e.id} className="rounded-2xl bg-white/55 px-4 py-3 text-sm">
                  <p className="flex items-center gap-2 font-semibold">
                    <span className={`h-2 w-2 shrink-0 rounded-full ${e.ok ? 'bg-gran-500' : 'bg-red-500'}`} />
                    <span className="truncate">{e.emne}</span>
                  </p>
                  <p className="text-ink-500">
                    {e.til} · {siden(e.created_at)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Kort>
      </div>
    </div>
  );
}
