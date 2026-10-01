'use client';

import { useEffect, useState } from 'react';
import { useAdmin } from '@/components/admin/AdminProvider';
import { useInnstillinger } from '@/components/admin/useInnstillinger';
import { Kort, LagreLinje, Sidetopp } from '@/components/admin/ui';
import type { AiOppsett, Bedrift } from '@/lib/innhold';

const BEDRIFTFELT: { k: keyof Bedrift; navn: string; hint?: string }[] = [
  { k: 'navn', navn: 'Navnet på tjenesten', hint: 'Vises i menyen, e-poster og vilkår' },
  { k: 'eier', navn: 'Eier / selger', hint: 'Står i vilkårene og nederst på siden' },
  { k: 'epost', navn: 'E-post kundene kan svare til', hint: 'Brukes som svar-adresse på alle e-poster' },
  { k: 'telefon', navn: 'Telefon' },
  { k: 'sted', navn: 'Sted' },
  { k: 'orgnr', navn: 'Organisasjonsnummer', hint: 'Tomt til du har registrert foretak' },
  { k: 'vippsNummer', navn: 'Vipps-nummer', hint: 'Mobilnummeret ditt, eller Vipps-nummeret hvis du har bedriftsavtale. Vises til kundene' },
  { k: 'vippsNavn', navn: 'Navn i Vipps', hint: 'Navnet kundene ser når de betaler, så de vet at det er riktig' },
  { k: 'varselEpost', navn: 'Varsel om nye bestillinger til', hint: 'Kommaseparert. Tomt = alle admins' },
];

type Admin = { email: string; navn: string };
type Oppsett = Record<string, boolean | string>;

export default function Innstillinger() {
  const { lagreInnstilling, toast, sb, api, epost } = useAdmin();
  const { inn, hentPaNytt } = useInnstillinger();
  const [b, setB] = useState<Bedrift | null>(null);
  const [ai, setAi] = useState<AiOppsett | null>(null);
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [nyAdmin, setNyAdmin] = useState('');
  const [oppsett, setOppsett] = useState<Oppsett | null>(null);
  const [lagrer, setLagrer] = useState(false);

  useEffect(() => {
    if (inn) {
      setB({ ...inn.bedrift });
      setAi({ ...inn.ai });
    }
  }, [inn]);
  const hentAdmins = async () => {
    const { data } = await sb.from('admins').select('email,navn').order('created_at');
    setAdmins((data as Admin[]) ?? []);
  };
  useEffect(() => {
    hentAdmins();
    api<Oppsett>('/api/admin/oppsett').then(setOppsett).catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!b || !ai || !inn) return <p className="text-ink-500">Laster …</p>;
  const endret = JSON.stringify(b) !== JSON.stringify(inn.bedrift) || JSON.stringify(ai) !== JSON.stringify(inn.ai);

  const lagre = async () => {
    setLagrer(true);
    try {
      await lagreInnstilling('bedrift', b);
      await lagreInnstilling('ai', ai);
      toast('Innstillingene er lagret');
      await hentPaNytt();
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Feil', 'feil');
    } finally {
      setLagrer(false);
    }
  };

  const leggTil = async () => {
    const e = nyAdmin.trim().toLowerCase();
    if (!e.includes('@')) return;
    const { error } = await sb.from('admins').insert({ email: e });
    if (error) return toast(error.message, 'feil');
    setNyAdmin('');
    toast(`${e} er admin. De lager konto på /admin med «Første gang?».`);
    hentAdmins();
  };

  const STATUS: [string, string, string][] = [
    ['supabase', 'Supabase (service role)', 'SUPABASE_SERVICE_ROLE_KEY'],
    ['resend', 'E-post (Resend)', 'RESEND_API_KEY'],
    ['openai', 'OpenAI', 'OPENAI_API_KEY'],
    ['vercel', 'Vercel-token (valgfritt)', 'VERCEL_TOKEN'],
  ];

  return (
    <div className="pb-24">
      <Sidetopp tittel="Innstillinger" />
      <div className="grid gap-5 xl:grid-cols-2">
        <Kort tittel="Om deg og tjenesten">
          <div className="grid gap-4 sm:grid-cols-2">
            {BEDRIFTFELT.map((f) => (
              <div key={f.k}>
                <label className="label">{f.navn}</label>
                <input className="field" value={b[f.k]} onChange={(e) => setB({ ...b, [f.k]: e.target.value })} />
                {f.hint && <p className="hint">{f.hint}</p>}
              </div>
            ))}
          </div>
        </Kort>

        <div className="space-y-5">
          <Kort tittel="AI-analyse (OpenAI)">
            <label className="label">Modell</label>
            <input className="field" value={ai.modell} onChange={(e) => setAi({ ...ai, modell: e.target.value })} list="modeller" />
            <datalist id="modeller">
              <option value="gpt-5.4-mini" />
              <option value="gpt-5.4" />
              <option value="gpt-6-luna" />
              <option value="gpt-6.1-sol" />
            </datalist>
            <p className="hint">Modellnavnet slik OpenAI skriver det. En billig modell holder fint; bildene sendes i lav oppløsning.</p>
            <label className="label mt-4">Faste instrukser (legges i alle prompter)</label>
            <textarea className="field min-h-[110px]" value={ai.ekstraInstruks} onChange={(e) => setAi({ ...ai, ekstraInstruks: e.target.value })} placeholder="f.eks. Bruk alltid norsk bokmål. Legg «Laget av Nettsnekker» i bunnteksten." />
          </Kort>

          <Kort tittel="Hvem er admin">
            <ul className="space-y-1.5">
              {admins.map((a) => (
                <li key={a.email} className="flex items-center justify-between rounded-xl bg-white/60 px-3 py-2 text-sm">
                  <span>{a.email}{a.email === epost && <span className="ml-2 text-ink-400">(deg)</span>}</span>
                  {a.email !== epost && (
                    <button className="text-xs font-semibold text-red-600" onClick={async () => { if (confirm(`Fjerne ${a.email}?`)) { await sb.from('admins').delete().eq('email', a.email); hentAdmins(); } }}>Fjern</button>
                  )}
                </li>
              ))}
            </ul>
            <div className="mt-3 flex gap-2">
              <input className="field" type="email" placeholder="ny@admin.no" value={nyAdmin} onChange={(e) => setNyAdmin(e.target.value)} />
              <button className="btn-primary shrink-0" onClick={leggTil}>Legg til</button>
            </div>
          </Kort>

          <Kort tittel="Oppsett i Vercel">
            {oppsett ? (
              <ul className="space-y-1.5 text-sm">
                {STATUS.map(([k, n, v]) => (
                  <li key={k} className="flex items-center justify-between gap-3 rounded-xl bg-white/60 px-3 py-2">
                    <span>{n} <code className="ml-1 text-xs text-ink-400">{v}</code></span>
                    <span className={oppsett[k] ? 'font-semibold text-gran-700' : 'text-red-600'}>{oppsett[k] ? '✓ Lagt inn' : 'Mangler'}</span>
                  </li>
                ))}
                <li className="px-3 pt-2 text-ink-500">Avsender: {String(oppsett.avsender || 'ikke satt (EPOST_AVSENDER)')}</li>
              </ul>
            ) : (
              <p className="text-ink-500">Sjekker …</p>
            )}
          </Kort>
        </div>
      </div>
      <LagreLinje endret={endret} lagrer={lagrer} onLagre={lagre} onAngre={() => { setB({ ...inn.bedrift }); setAi({ ...inn.ai }); }} />
    </div>
  );
}
