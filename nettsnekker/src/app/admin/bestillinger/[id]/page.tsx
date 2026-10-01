'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAdmin } from '@/components/admin/AdminProvider';
import { useInnstillinger } from '@/components/admin/useInnstillinger';
import { Kort, StatusMerke, Tom, dato } from '@/components/admin/ui';
import { EpostHistorikk, EpostSender } from '@/components/admin/EpostSender';
import { STATUSER, type Ordre, type Status } from '@/lib/ordre';
import { kr, type PrisLinje } from '@/lib/pricing';

type Hendelse = { id: string; hva: string; detalj: string; created_at: string };
const FANER = [
  { id: 'fremdrift', navn: 'Fremdrift' },
  { id: 'bestilling', navn: 'Bestillingen' },
  { id: 'prompt', navn: 'Prompt til Claude' },
  { id: 'epost', navn: 'E-post' },
  { id: 'pris', navn: 'Pris og betaling' },
  { id: 'logg', navn: 'Notater og logg' },
] as const;
type Fane = (typeof FANER)[number]['id'];

/** Når en mal sendes, flyttes bestillingen automatisk til riktig status */
const MAL_TIL_STATUS: Record<string, Status> = {
  arbeid_startet: 'under_arbeid',
  utkast_klart: 'utkast_sendt',
  nytt_utkast: 'utkast_sendt',
  nettside_live: 'live',
};

export default function OrdreSide() {
  const { id } = useParams<{ id: string }>();
  const { sb, api, toast } = useAdmin();
  const { inn } = useInnstillinger();
  const router = useRouter();
  const [o, setO] = useState<Ordre | null>(null);
  const [fane, setFane] = useState<Fane>('fremdrift');
  const [startMal, setStartMal] = useState<string | undefined>();
  const [ikkeFunnet, setIkkeFunnet] = useState(false);

  const hent = useCallback(async () => {
    const { data } = await sb.from('orders').select('*').eq('id', id).maybeSingle();
    if (!data) setIkkeFunnet(true);
    setO(data as Ordre);
  }, [sb, id]);

  useEffect(() => {
    hent();
    const k = sb.channel(`ordre-${id}`).on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${id}` }, (p) => setO(p.new as Ordre)).subscribe();
    return () => {
      sb.removeChannel(k);
    };
  }, [sb, id, hent]);

  const oppdater = async (felt: Partial<Ordre>, melding?: string) => {
    if (!o) return;
    const { data, error } = await sb.from('orders').update({ ...felt, updated_at: new Date().toISOString() }).eq('id', o.id).select('*').single();
    if (error) {
      toast(error.message, 'feil');
      return;
    }
    setO(data as Ordre);
    if (felt.status && felt.status !== o.status) {
      await sb.from('order_events').insert({ order_id: o.id, hva: `Status: ${STATUSER.find((s) => s.id === felt.status)?.navn}` });
    }
    if (melding) toast(melding);
  };

  const handling = async (h: string, melding: string) => {
    if (!o) return;
    try {
      await api('/api/admin/handling', { orderId: o.id, handling: h });
      toast(melding);
      hent();
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Feil', 'feil');
    }
  };

  const sendMal = (mal: string) => {
    setStartMal(mal);
    setFane('epost');
  };

  if (ikkeFunnet) return <Tom tekst="Fant ikke bestillingen." handling={<Link href="/admin/bestillinger" className="btn-ghost">Tilbake</Link>} />;
  if (!o || !inn) return <p className="text-ink-500">Laster …</p>;

  return (
    <div className="space-y-5">
      <div>
        <Link href="/admin/bestillinger" className="text-sm font-semibold text-ink-500 hover:text-gran-700">
          ← Bestillinger
        </Link>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-3xl sm:text-4xl">{o.bedrift_navn}</h1>
            <p className="mt-1 text-ink-600">
              {o.ordrenr} · {o.kunde_navn} · <a href={`mailto:${o.kunde_epost}`} className="text-gran-700 hover:underline">{o.kunde_epost}</a>
              {o.kunde_telefon && (
                <>
                  {' '}· <a href={`tel:${o.kunde_telefon.replace(/\s/g, '')}`} className="text-gran-700 hover:underline">{o.kunde_telefon}</a>
                </>
              )}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <StatusMerke status={o.status} />
            <span className="price font-display text-2xl font-bold text-gran-700">{kr(o.total)}</span>
          </div>
        </div>
      </div>

      {/* faner */}
      <div className="no-scrollbar -mx-1 flex gap-1 overflow-x-auto px-1">
        {FANER.map((f) => (
          <button key={f.id} onClick={() => setFane(f.id)} className={`relative shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${fane === f.id ? 'text-white' : 'text-ink-600 hover:bg-white/60'}`}>
            {fane === f.id && <motion.span layoutId="ordre-fane" className="absolute inset-0 rounded-full bg-ink-900" transition={{ type: 'spring', stiffness: 400, damping: 34 }} />}
            <span className="relative z-10">{f.navn}</span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={fane} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }} className="space-y-5">
          {fane === 'fremdrift' && <Fremdrift o={o} oppdater={oppdater} handling={handling} sendMal={sendMal} gaTil={setFane} inkluderteRunder={inn.priser.inkluderteEndringsrunder} />}
          {fane === 'bestilling' && <BestillingDetaljer o={o} oppdater={oppdater} />}
          {fane === 'prompt' && <Prompt o={o} hent={hent} />}
          {fane === 'epost' && (
            <>
              <EpostSender
                ordre={o}
                inn={inn}
                startMal={startMal}
                onSendt={(mal) => {
                  const ny = MAL_TIL_STATUS[mal];
                  if (ny && ny !== o.status && !(mal === 'arbeid_startet' && o.status !== 'ny')) oppdater({ status: ny });
                }}
              />
              <EpostHistorikk ordreId={o.id} />
            </>
          )}
          {fane === 'pris' && <PrisOgBetaling o={o} oppdater={oppdater} handling={handling} />}
          {fane === 'logg' && <Logg o={o} oppdater={oppdater} slettet={() => router.push('/admin/bestillinger')} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/* ------------------------------------------------------------------ */

type Oppdater = (felt: Partial<Ordre>, melding?: string) => Promise<void>;

function Fremdrift({ o, oppdater, handling, sendMal, gaTil, inkluderteRunder }: { o: Ordre; oppdater: Oppdater; handling: (h: string, m: string) => Promise<void>; sendMal: (m: string) => void; gaTil: (f: Fane) => void; inkluderteRunder: number }) {
  const [utkast, setUtkast] = useState(o.utkast_url);
  const [repo, setRepo] = useState(o.github_repo);
  const [live, setLive] = useState(o.live_url || (o.domene ? `https://${o.domene}` : ''));
  const { api, toast } = useAdmin();
  const [lagerLenke, setLagerLenke] = useState(false);
  const runder = inkluderteRunder + Number(o.tillegg?.endringsrunde ?? 0);
  const steg = STATUSER.filter((s) => s.id !== 'avbrutt');
  const indeks = steg.findIndex((s) => s.id === o.status);

  const lagLenke = async () => {
    setLagerLenke(true);
    try {
      await api('/api/admin/betalingslenke', { orderId: o.id, type: 'rest' });
      toast('Betalingslenken er laget');
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Feil', 'feil');
    } finally {
      setLagerLenke(false);
    }
  };

  return (
    <>
      <Kort tittel="Fremdrift">
        <ol className="no-scrollbar flex gap-1 overflow-x-auto pb-1">
          {steg.map((s, i) => {
            const ferdig = i < indeks;
            const na = i === indeks;
            return (
              <li key={s.id} className="min-w-[96px] flex-1">
                <button
                  className={`w-full rounded-2xl px-3 py-3 text-left transition ${na ? 'bg-white shadow-lift' : 'bg-white/40 hover:bg-white/70'}`}
                  onClick={() => s.id !== o.status && confirm(`Sette status til «${s.navn}»?`) && oppdater({ status: s.id }, `Status: ${s.navn}`)}
                  title={s.forklaring}
                >
                  <span className="block h-1.5 rounded-full" style={{ background: ferdig || na ? s.farge : '#CFD8D5' }} />
                  <span className={`mt-2 block text-xs font-semibold ${na ? 'text-ink-900' : 'text-ink-500'}`}>{s.navn}</span>
                </button>
              </li>
            );
          })}
        </ol>
        <p className="mt-3 text-sm text-ink-600">{STATUSER.find((s) => s.id === o.status)?.forklaring}</p>
      </Kort>

      <Kort tittel="Neste steg">
        {o.status === 'venter_gebyr' && (
          <div className="space-y-3">
            <p className="text-ink-600">Kunden har ikke fullført betalingen av bestillingsgebyret. Bestillinger som ikke betales kan du avbryte etter noen dager.</p>
            <div className="flex flex-wrap gap-2">
              <button className="btn-primary" onClick={() => confirm('Markere gebyret som betalt og sende bekreftelse til kunden?') && handling('gebyr_betalt', 'Gebyret er markert som betalt')}>
                Marker gebyret som betalt
              </button>
              <button className="btn-ghost" onClick={() => oppdater({ status: 'avbrutt' }, 'Bestillingen er avbrutt')}>
                Avbryt bestillingen
              </button>
            </div>
          </div>
        )}

        {o.status === 'ny' && (
          <div className="space-y-3">
            <p className="text-ink-600">Les gjennom bestillingen, lag prompten og lim den inn i Claude.</p>
            <div className="flex flex-wrap gap-2">
              <button className="btn-primary" onClick={() => gaTil('prompt')}>
                {o.claude_prompt ? 'Se prompten' : 'Lag prompten'}
              </button>
              <button className="btn-ghost" onClick={() => oppdater({ status: 'under_arbeid' }, 'Status: snekres')}>
                Start arbeidet
              </button>
              <button className="btn-ghost" onClick={() => sendMal('arbeid_startet')}>
                Si fra til kunden at du har startet
              </button>
            </div>
          </div>
        )}

        {['ny', 'under_arbeid', 'endringer', 'utkast_sendt'].includes(o.status) && (
          <div className={`space-y-4 ${o.status === 'ny' ? 'mt-6 border-t border-white/60 pt-6' : ''}`}>
            {o.status === 'endringer' && (
              <p className="rounded-xl bg-harpiks-100 px-3 py-2 text-sm">
                Kunden har brukt {o.endringsrunder_brukt} av {runder} endringsrunder. Gjør endringene og send nytt utkast.
              </p>
            )}
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor="utkast">Lenke til utkastet (.vercel.app)</label>
                <input id="utkast" className="field" placeholder="https://kundenavn.vercel.app" value={utkast} onChange={(e) => setUtkast(e.target.value)} onBlur={() => utkast !== o.utkast_url && oppdater({ utkast_url: utkast.trim() }, 'Utkast-lenken er lagret')} />
              </div>
              <div>
                <label className="label" htmlFor="repo">GitHub-repo</label>
                <input id="repo" className="field" placeholder="https://github.com/…" value={repo} onChange={(e) => setRepo(e.target.value)} onBlur={() => repo !== o.github_repo && oppdater({ github_repo: repo.trim() }, 'Repo er lagret')} />
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {o.rest_lenke ? (
                <span className="rounded-full bg-gran-50 px-3 py-2 text-sm font-semibold text-gran-700">✓ Betalingslenke for {kr(o.rest)} er klar</span>
              ) : (
                <button className="btn-ghost" onClick={lagLenke} disabled={lagerLenke}>
                  {lagerLenke ? 'Lager …' : `1. Lag betalingslenke (${kr(o.rest)})`}
                </button>
              )}
              <button className="btn-primary" onClick={() => sendMal(o.endringsrunder_brukt > 0 ? 'nytt_utkast' : 'utkast_klart')} disabled={!utkast}>
                {o.rest_lenke ? '' : '2. '}Send utkastet til kunden
              </button>
            </div>
            {o.status === 'utkast_sendt' && (
              <div className="flex flex-wrap gap-2 border-t border-white/60 pt-4">
                <button className="btn-ghost" onClick={() => oppdater({ status: 'endringer', endringsrunder_brukt: o.endringsrunder_brukt + 1 }, `Endringsrunde ${o.endringsrunder_brukt + 1} registrert`)}>
                  Kunden vil ha endringer
                </button>
                <button className="btn-ghost" onClick={() => sendMal('betalingspaminnelse')}>
                  Send påminnelse
                </button>
                <button className="btn-ghost" onClick={() => confirm('Har kunden betalt på annen måte? Dette markerer resten som betalt og sender kvittering.') && handling('rest_betalt', 'Resten er markert som betalt')}>
                  Marker betalt manuelt
                </button>
              </div>
            )}
          </div>
        )}

        {o.status === 'godkjent' && (
          <div className="space-y-4">
            <ul className="list-disc space-y-1 pl-5 text-sm text-ink-700">
              {o.domene_valg === 'nytt' && o.domene && (
                <li>
                  Kjøp <strong>{o.domene}</strong> for {o.domene_aar} år i Vercel (Domains → Buy) og legg det til i prosjektet.
                </li>
              )}
              {o.domene_valg === 'eget' && <li>Be kunden peke {o.domene} til Vercel (A-post 76.76.21.21 eller CNAME cname.vercel-dns.com).</li>}
              {o.admin_valgt && <li>Legg kunden inn i <code>site_admins</code> i kundedatabasen, og send invitasjon fra Supabase (Authentication → Invite user).</li>}
              <li>Sjekk at kontaktskjemaet sender e-post til riktig adresse.</li>
            </ul>
            <div>
              <label className="label" htmlFor="live">Live-adresse</label>
              <input id="live" className="field" value={live} onChange={(e) => setLive(e.target.value)} onBlur={() => live !== o.live_url && oppdater({ live_url: live.trim() }, 'Live-adressen er lagret')} />
            </div>
            <button className="btn-primary" onClick={() => sendMal('nettside_live')} disabled={!live}>
              Send «nettsiden er live»
            </button>
          </div>
        )}

        {o.status === 'live' && (
          <div className="space-y-3">
            <p className="text-ink-600">
              Nettsiden er live på{' '}
              <a href={o.live_url} target="_blank" rel="noreferrer" className="font-semibold text-gran-700 underline">
                {o.live_url}
              </a>
              . Hosting fornyes {dato(o.hosting_fornyes)}.
            </p>
            <button className="btn-primary" onClick={() => oppdater({ status: 'levert' }, 'Bestillingen er levert')}>
              Marker som levert
            </button>
          </div>
        )}

        {o.status === 'levert' && (
          <div className="space-y-3">
            <p className="text-ink-600">
              Ferdig! Hosting er betalt til <strong>{dato(o.hosting_fornyes)}</strong>
              {o.domene_fornyes ? `, domenet til ${dato(o.domene_fornyes)}` : ''}.
            </p>
            <button className="btn-ghost" onClick={() => sendMal('fornyelse')}>
              Send fornyelse
            </button>
          </div>
        )}

        {o.status === 'avbrutt' && (
          <button className="btn-ghost" onClick={() => oppdater({ status: o.gebyr_betalt ? 'ny' : 'venter_gebyr' }, 'Bestillingen er gjenåpnet')}>
            Gjenåpne bestillingen
          </button>
        )}
      </Kort>

      <div className="grid gap-5 lg:grid-cols-3">
        <Kort tittel="Betaling">
          <p className="flex justify-between text-sm">
            <span>Gebyr {kr(o.gebyr)}</span>
            <span className={o.gebyr_betalt ? 'font-semibold text-gran-700' : 'text-ink-400'}>{o.gebyr_betalt ? `Betalt ${dato(o.gebyr_betalt_at)}` : 'Ikke betalt'}</span>
          </p>
          <p className="mt-2 flex justify-between text-sm">
            <span>Rest {kr(o.rest)}</span>
            <span className={o.rest_betalt ? 'font-semibold text-gran-700' : 'text-ink-400'}>{o.rest_betalt ? `Betalt ${dato(o.rest_betalt_at)}` : 'Ikke betalt'}</span>
          </p>
        </Kort>
        <Kort tittel="Leveransen">
          <p className="text-sm text-ink-600">Admin: <strong className="text-ink-900">{o.admin_valgt ? 'Ja' : 'Nei'}</strong></p>
          <p className="text-sm text-ink-600">
            Domene: <strong className="text-ink-900">{o.domene_valg === 'ingen' ? 'Ikke nå' : `${o.domene} ${o.domene_valg === 'nytt' ? `(${o.domene_aar} år)` : '(eget)'}`}</strong>
          </p>
          <p className="text-sm text-ink-600">Endringsrunder: <strong className="text-ink-900">{o.endringsrunder_brukt} av {runder}</strong></p>
        </Kort>
        <Kort tittel="Lenker">
          <ul className="space-y-1 text-sm">
            {[
              ['Utkast', o.utkast_url],
              ['Live', o.live_url],
              ['GitHub', o.github_repo],
              ['Betaling', o.rest_lenke],
              ['Gammel side', o.eksisterende_side],
            ]
              .filter(([, v]) => v)
              .map(([k, v]) => (
                <li key={k} className="truncate">
                  <span className="text-ink-500">{k}: </span>
                  <a href={v} target="_blank" rel="noreferrer" className="text-gran-700 hover:underline">{v}</a>
                </li>
              ))}
          </ul>
        </Kort>
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ */

function Rad({ k, children }: { k: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1 border-t border-white/60 py-3 sm:grid-cols-[180px_1fr]">
      <dt className="text-sm text-ink-500">{k}</dt>
      <dd className="whitespace-pre-wrap text-ink-900">{children || <span className="text-ink-400">–</span>}</dd>
    </div>
  );
}

function BestillingDetaljer({ o, oppdater }: { o: Ordre; oppdater: Oppdater }) {
  const { sb } = useAdmin();
  const [lenker, setLenker] = useState<Record<string, string>>({});
  const [kunde, setKunde] = useState({ kunde_navn: o.kunde_navn, kunde_epost: o.kunde_epost, kunde_telefon: o.kunde_telefon, domene: o.domene });
  const f = o.tema?.farger ?? {};

  useEffect(() => {
    (async () => {
      const ut: Record<string, string> = {};
      for (const fil of o.filer ?? []) {
        const { data } = await sb.storage.from('bestillinger').createSignedUrl(fil.path, 3600);
        if (data?.signedUrl) ut[fil.path] = data.signedUrl;
      }
      setLenker(ut);
    })();
  }, [sb, o.filer]);

  const endret = JSON.stringify(kunde) !== JSON.stringify({ kunde_navn: o.kunde_navn, kunde_epost: o.kunde_epost, kunde_telefon: o.kunde_telefon, domene: o.domene });

  return (
    <>
      <Kort tittel="Kunden" handling={endret && <button className="btn-primary btn-sm" onClick={() => oppdater(kunde, 'Kundeinfo er lagret')}>Lagre</button>}>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {(
            [
              ['kunde_navn', 'Navn'],
              ['kunde_epost', 'E-post'],
              ['kunde_telefon', 'Telefon'],
              ['domene', 'Domene'],
            ] as const
          ).map(([k, n]) => (
            <div key={k}>
              <label className="label" htmlFor={k}>{n}</label>
              <input id={k} className="field" value={kunde[k]} onChange={(e) => setKunde({ ...kunde, [k]: e.target.value })} />
            </div>
          ))}
        </div>
      </Kort>

      <Kort tittel="Bedriften og ønskene">
        <dl>
          <Rad k="Bedrift">{o.bedrift_navn}{o.orgnr ? ` (org.nr. ${o.orgnr})` : ''}</Rad>
          <Rad k="Bransje">{o.bransje}</Rad>
          <Rad k="Beskrivelse">{o.beskrivelse}</Rad>
          <Rad k="Mål">{(o.mal ?? []).join(', ')}</Rad>
          <Rad k="Målgruppe">{o.malgruppe}</Rad>
          <Rad k="Tema">
            <span className="flex flex-wrap items-center gap-3">
              <span className="flex overflow-hidden rounded-lg">
                {[o.tema?.egenFarge || f.hoved, f.aksent, f.bg, f.flate, f.tekst].filter(Boolean).map((c, i) => (
                  <span key={i} className="h-7 w-7" style={{ background: c }} title={c} />
                ))}
              </span>
              {o.tema?.navn} · {o.tema?.stil}
              {o.tema?.egenFarge && <span className="font-mono text-sm">egen farge {o.tema.egenFarge}</span>}
            </span>
          </Rad>
          <Rad k="Inspirasjon">{o.inspirasjon}</Rad>
          <Rad k="Sider">{[...(o.sider ?? []), o.egne_sider].filter(Boolean).join(', ')}</Rad>
          <Rad k="Funksjoner">{(o.funksjoner ?? []).join(', ')}</Rad>
          <Rad k="Tillegg">
            {Object.entries(o.tillegg ?? {})
              .filter(([, v]) => v)
              .map(([k, v]) => (v > 1 ? `${k} × ${v}` : k))
              .join(', ')}
          </Rad>
          <Rad k="Andre ønsker">{o.onsker}</Rad>
          <Rad k="Adminside">{o.admin_valgt ? o.admin_onsker || 'Ja, uten spesifikke ønsker' : 'Nei'}</Rad>
          <Rad k="Gammel nettside">{o.eksisterende_side && <a href={o.eksisterende_side} target="_blank" rel="noreferrer" className="text-gran-700 underline">{o.eksisterende_side}</a>}</Rad>
          <Rad k="Kommentar">{o.kommentar}</Rad>
          <Rad k="Vilkår godtatt">{dato(o.vilkar_godtatt_at, true)}</Rad>
        </dl>
      </Kort>

      <Kort tittel={`Filer (${o.filer?.length ?? 0})`}>
        {!o.filer?.length ? (
          <Tom tekst="Kunden lastet ikke opp noen filer." />
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {o.filer.map((fil) => (
              <a key={fil.path} href={lenker[fil.path]} target="_blank" rel="noreferrer" className="group overflow-hidden rounded-2xl bg-white/60 transition hover:bg-white">
                {fil.type.startsWith('image/') && lenker[fil.path] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={lenker[fil.path]} alt={fil.navn} className="aspect-square w-full object-cover" />
                ) : (
                  <span className="grid aspect-square place-items-center text-3xl text-ink-400">📄</span>
                )}
                <span className="block truncate px-3 py-2 text-xs">
                  <span className="font-semibold text-gran-700">{fil.kategori}</span> · {fil.navn}
                </span>
              </a>
            ))}
          </div>
        )}
      </Kort>
    </>
  );
}

/* ------------------------------------------------------------------ */

function Prompt({ o, hent }: { o: Ordre; hent: () => Promise<void> }) {
  const { api, toast, sb } = useAdmin();
  const [tekst, setTekst] = useState(o.claude_prompt);
  const [laster, setLaster] = useState<'' | 'enkel' | 'ai'>('');
  const [visBrief, setVisBrief] = useState(false);

  useEffect(() => setTekst(o.claude_prompt), [o.claude_prompt]);

  const lag = async (medAi: boolean) => {
    if (tekst && tekst !== o.claude_prompt && !confirm('Du har endret prompten. Lage ny og miste endringene?')) return;
    setLaster(medAi ? 'ai' : 'enkel');
    try {
      const j = await api<{ prompt: string; advarsel?: string }>('/api/admin/prompt', { orderId: o.id, medAi });
      setTekst(j.prompt);
      if (j.advarsel) toast(j.advarsel, 'feil');
      else toast(medAi ? 'Prompten er laget med AI-analyse' : 'Prompten er laget');
      hent();
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Feil', 'feil');
    } finally {
      setLaster('');
    }
  };

  const kopier = async () => {
    await navigator.clipboard.writeText(tekst);
    toast('Prompten er kopiert. Lim den inn i Claude Code.');
  };

  const lastNed = () => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([tekst], { type: 'text/markdown' }));
    a.download = `${o.ordrenr}-prompt.md`;
    a.click();
  };

  const lagre = async () => {
    await sb.from('orders').update({ claude_prompt: tekst }).eq('id', o.id);
    toast('Prompten er lagret');
    hent();
  };

  return (
    <>
      <Kort
        tittel="Prompt til Claude"
        handling={
          <div className="flex flex-wrap gap-2">
            <button className="btn-ghost btn-sm" onClick={() => lag(false)} disabled={!!laster}>
              {laster === 'enkel' ? 'Lager …' : 'Lag uten AI'}
            </button>
            <button className="btn-primary btn-sm" onClick={() => lag(true)} disabled={!!laster}>
              {laster === 'ai' ? 'OpenAI analyserer … (opptil 1 min)' : 'Analyser med AI og lag prompt'}
            </button>
          </div>
        }
      >
        <p className="mb-3 text-sm text-ink-600">
          «Analyser med AI» lar OpenAI lese beskrivelsen, bildene, dokumentene og den gamle nettsiden, og skrive en innholdsplan med tekstforslag som legges inn i prompten.
          Lim prompten inn i Claude Code, så bygger Claude siden, pusher til GitHub og deployer til Vercel. Lenkene til filene varer i 7 dager.
        </p>
        {laster === 'ai' && (
          <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-white/60">
            <motion.div className="h-full w-1/3 rounded-full bg-gradient-to-r from-gran-400 to-harpiks-400" animate={{ x: ['-100%', '300%'] }} transition={{ repeat: Infinity, duration: 1.4, ease: 'easeInOut' }} />
          </div>
        )}
        {tekst ? (
          <>
            <textarea className="field min-h-[520px] font-mono text-[12.5px] leading-relaxed" value={tekst} onChange={(e) => setTekst(e.target.value)} aria-label="Prompt" />
            <div className="mt-3 flex flex-wrap gap-2">
              <button className="btn-primary" onClick={kopier}>Kopier prompten</button>
              <button className="btn-ghost" onClick={lastNed}>Last ned .md</button>
              {tekst !== o.claude_prompt && <button className="btn-resin" onClick={lagre}>Lagre endringene</button>}
              <span className="self-center text-xs text-ink-500">{tekst.length.toLocaleString('nb-NO')} tegn</span>
            </div>
          </>
        ) : (
          <Tom tekst="Ingen prompt ennå. Trykk på en av knappene over." />
        )}
      </Kort>
      {o.ai_brief && (
        <Kort tittel="AI-analysen" handling={<button className="text-sm font-semibold text-gran-700" onClick={() => setVisBrief((v) => !v)}>{visBrief ? 'Skjul' : 'Vis'}</button>}>
          {visBrief && <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-ink-700">{o.ai_brief}</pre>}
        </Kort>
      )}
    </>
  );
}

/* ------------------------------------------------------------------ */

function PrisOgBetaling({ o, oppdater, handling }: { o: Ordre; oppdater: Oppdater; handling: (h: string, m: string) => Promise<void> }) {
  const { api, toast } = useAdmin();
  const [linjer, setLinjer] = useState<PrisLinje[]>(o.pris_linjer ?? []);
  const [rabatt, setRabatt] = useState(o.rabatt ?? 0);
  const [nyNavn, setNyNavn] = useState('');
  const [nyBelop, setNyBelop] = useState('');
  const [ekstra, setEkstra] = useState({ belop: '', beskrivelse: `Hosting neste år – ${o.bedrift_navn}` });
  const [ekstraLenke, setEkstraLenke] = useState('');
  const [laster, setLaster] = useState(false);

  const sum = linjer.reduce((s, l) => s + Number(l.belop || 0), 0);
  const rest = Math.max(0, sum - rabatt);
  const total = rest + o.gebyr;
  const endret = JSON.stringify(linjer) !== JSON.stringify(o.pris_linjer) || rabatt !== (o.rabatt ?? 0);

  const lagre = async () => {
    if (o.rest_betalt && !confirm('Resten er allerede betalt. Endre prisen likevel?')) return;
    await oppdater({ pris_linjer: linjer, rabatt, rest, total, ...(o.rest_lenke ? { rest_lenke: '', rest_lenke_id: '' } : {}) }, o.rest_lenke ? 'Prisen er lagret. Lag ny betalingslenke.' : 'Prisen er lagret');
  };

  const lagLenke = async (type: 'rest' | 'fornyelse') => {
    setLaster(true);
    try {
      const j = await api<{ url: string }>('/api/admin/betalingslenke', type === 'rest' ? { orderId: o.id, type } : { orderId: o.id, type, belop: Number(ekstra.belop), beskrivelse: ekstra.beskrivelse });
      if (type === 'fornyelse') setEkstraLenke(j.url);
      toast('Betalingslenken er laget');
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Feil', 'feil');
    } finally {
      setLaster(false);
    }
  };

  return (
    <>
      <Kort tittel="Prislinjer" handling={endret && <button className="btn-resin btn-sm" onClick={lagre}>Lagre pris</button>}>
        <ul className="space-y-2">
          {linjer.map((l, i) => (
            <li key={i} className="flex items-center gap-2">
              <input className="field flex-1" value={l.navn} onChange={(e) => setLinjer(linjer.map((x, k) => (k === i ? { ...x, navn: e.target.value } : x)))} aria-label="Navn" />
              <input className="field w-32 text-right" type="number" value={l.belop} onChange={(e) => setLinjer(linjer.map((x, k) => (k === i ? { ...x, belop: Number(e.target.value) } : x)))} aria-label="Beløp" />
              <button className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-ink-400 hover:bg-red-50 hover:text-red-600" onClick={() => setLinjer(linjer.filter((_, k) => k !== i))} aria-label="Fjern linje">✕</button>
            </li>
          ))}
          <li className="flex items-center gap-2">
            <input className="field flex-1" placeholder="Ny linje, f.eks. Ekstra side" value={nyNavn} onChange={(e) => setNyNavn(e.target.value)} />
            <input className="field w-32 text-right" type="number" placeholder="kr" value={nyBelop} onChange={(e) => setNyBelop(e.target.value)} />
            <button
              className="btn-ghost btn-sm shrink-0"
              disabled={!nyNavn || !nyBelop}
              onClick={() => {
                setLinjer([...linjer, { navn: nyNavn, belop: Number(nyBelop) }]);
                setNyNavn('');
                setNyBelop('');
              }}
            >
              Legg til
            </button>
          </li>
        </ul>
        <div className="mt-4 space-y-2 rounded-2xl bg-white/55 p-4 text-sm">
          <p className="flex items-center justify-between gap-3">
            <span>Rabatt</span>
            <input className="field w-32 py-2 text-right" type="number" value={rabatt} onChange={(e) => setRabatt(Number(e.target.value) || 0)} aria-label="Rabatt" />
          </p>
          <p className="flex justify-between"><span>Bestillingsgebyr</span><span className="price">{kr(o.gebyr)}</span></p>
          <p className="flex justify-between"><span>Rest ved godkjenning</span><span className="price font-semibold">{kr(rest)}</span></p>
          <p className="flex justify-between border-t border-ink-200 pt-2 font-semibold"><span>Totalt</span><span className="price text-lg text-gran-700">{kr(total)}</span></p>
        </div>
      </Kort>

      <Kort tittel="Godkjenning og betaling">
        <div className="space-y-3 text-sm">
          <p className="flex justify-between"><span>Gebyr</span><span className={o.gebyr_betalt ? 'font-semibold text-gran-700' : 'text-ink-500'}>{o.gebyr_betalt ? `Betalt ${dato(o.gebyr_betalt_at, true)}` : 'Ikke betalt'}</span></p>
          <p className="flex justify-between"><span>Rest</span><span className={o.rest_betalt ? 'font-semibold text-gran-700' : 'text-ink-500'}>{o.rest_betalt ? `Betalt ${dato(o.rest_betalt_at, true)}` : 'Ikke betalt'}</span></p>
          {o.rest_lenke ? (
            <div className="flex flex-wrap items-center gap-2 rounded-2xl bg-white/60 p-3">
              <span className="min-w-0 flex-1 truncate font-mono text-xs">{o.rest_lenke}</span>
              <button className="btn-ghost btn-sm" onClick={() => navigator.clipboard.writeText(o.rest_lenke).then(() => toast('Kopiert'))}>Kopier</button>
              <a className="btn-ghost btn-sm" href={o.rest_lenke} target="_blank" rel="noreferrer">Åpne</a>
              {!o.rest_betalt && <button className="btn-ghost btn-sm" onClick={() => lagLenke('rest')} disabled={laster}>Lag ny</button>}
            </div>
          ) : (
            !o.rest_betalt && <button className="btn-primary" onClick={() => lagLenke('rest')} disabled={laster || endret}>{laster ? 'Lager …' : `Lag betalingslenke for ${kr(o.rest)}`}</button>
          )}
          {endret && <p className="text-harpiks-600">Lagre prisen før du lager betalingslenke.</p>}
          <div className="flex flex-wrap gap-2 pt-2">
            {!o.gebyr_betalt && <button className="btn-ghost btn-sm" onClick={() => confirm('Markere gebyret som betalt og sende bekreftelse?') && handling('gebyr_betalt', 'Gebyret er markert som betalt')}>Marker gebyr betalt</button>}
            {!o.rest_betalt && <button className="btn-ghost btn-sm" onClick={() => confirm('Markere resten som betalt og sende kvittering til kunden?') && handling('rest_betalt', 'Resten er markert som betalt')}>Marker rest betalt</button>}
            {o.gebyr_betalt && <button className="btn-ghost btn-sm" onClick={() => confirm('Sende bekreftelsen på nytt (til kunden og deg)?') && handling('send_bekreftelse_pa_nytt', 'Bekreftelsen er sendt på nytt')}>Send bekreftelse på nytt</button>}
          </div>
        </div>
      </Kort>

      <Kort tittel="Ekstra betaling (fornyelse eller tillegg)">
        <div className="grid gap-3 sm:grid-cols-[1fr_140px_auto] sm:items-end">
          <div>
            <label className="label" htmlFor="eb">Hva gjelder det?</label>
            <input id="eb" className="field" value={ekstra.beskrivelse} onChange={(e) => setEkstra({ ...ekstra, beskrivelse: e.target.value })} />
          </div>
          <div>
            <label className="label" htmlFor="ebel">Beløp</label>
            <input id="ebel" className="field" type="number" value={ekstra.belop} onChange={(e) => setEkstra({ ...ekstra, belop: e.target.value })} />
          </div>
          <button className="btn-primary" onClick={() => lagLenke('fornyelse')} disabled={laster || !ekstra.belop}>Lag lenke</button>
        </div>
        {ekstraLenke && (
          <div className="mt-3 flex flex-wrap items-center gap-2 rounded-2xl bg-white/60 p-3 text-sm">
            <span className="min-w-0 flex-1 truncate font-mono text-xs">{ekstraLenke}</span>
            <button className="btn-ghost btn-sm" onClick={() => navigator.clipboard.writeText(ekstraLenke).then(() => toast('Kopiert. Lim den inn i «Annen betalingslenke» når du sender e-post.'))}>Kopier</button>
          </div>
        )}
      </Kort>
    </>
  );
}

/* ------------------------------------------------------------------ */

function Logg({ o, oppdater, slettet }: { o: Ordre; oppdater: Oppdater; slettet: () => void }) {
  const { sb, toast } = useAdmin();
  const [notat, setNotat] = useState(o.notater);
  const [hendelser, setHendelser] = useState<Hendelse[]>([]);
  const [datoer, setDatoer] = useState({ hosting_fornyes: o.hosting_fornyes ?? '', domene_fornyes: o.domene_fornyes ?? '' });

  useEffect(() => {
    sb.from('order_events').select('*').eq('order_id', o.id).order('created_at', { ascending: false }).then(({ data }) => setHendelser((data as Hendelse[]) ?? []));
  }, [sb, o.id, o.updated_at]);

  const slett = async () => {
    if (!confirm(`Slette bestillingen til ${o.bedrift_navn} for godt? Dette kan ikke angres.`)) return;
    const paths = (o.filer ?? []).map((f) => f.path);
    if (paths.length) await sb.storage.from('bestillinger').remove(paths);
    const { error } = await sb.from('orders').delete().eq('id', o.id);
    if (error) return toast(error.message, 'feil');
    toast('Bestillingen er slettet');
    slettet();
  };

  return (
    <>
      <Kort tittel="Notater (bare for deg)">
        <textarea className="field min-h-[160px]" value={notat} onChange={(e) => setNotat(e.target.value)} onBlur={() => notat !== o.notater && oppdater({ notater: notat }, 'Notatet er lagret')} placeholder="Avtaler, telefonsamtaler, ting du må huske …" />
      </Kort>
      <Kort tittel="Fornyelser">
        <div className="grid gap-3 sm:grid-cols-2">
          {(
            [
              ['hosting_fornyes', 'Hosting betalt til'],
              ['domene_fornyes', 'Domene betalt til'],
            ] as const
          ).map(([k, n]) => (
            <div key={k}>
              <label className="label" htmlFor={k}>{n}</label>
              <input id={k} type="date" className="field" value={datoer[k]} onChange={(e) => setDatoer({ ...datoer, [k]: e.target.value })} onBlur={() => oppdater({ [k]: datoer[k] || null } as Partial<Ordre>, 'Datoen er lagret')} />
            </div>
          ))}
        </div>
      </Kort>
      <Kort tittel="Logg">
        {hendelser.length === 0 ? (
          <Tom tekst="Ingen hendelser ennå." />
        ) : (
          <ol className="relative space-y-3 border-l-2 border-white/80 pl-5">
            {hendelser.map((h) => (
              <li key={h.id} className="relative">
                <span className="absolute -left-[27px] top-1.5 h-3 w-3 rounded-full bg-gran-500 ring-4 ring-white/70" />
                <p className="font-semibold">{h.hva}</p>
                <p className="text-sm text-ink-500">
                  {dato(h.created_at, true)}
                  {h.detalj ? ` · ${h.detalj}` : ''}
                </p>
              </li>
            ))}
          </ol>
        )}
      </Kort>
      <Kort tittel="Faresone">
        <div className="flex flex-wrap gap-2">
          {o.status !== 'avbrutt' && <button className="btn-ghost" onClick={() => confirm('Avbryte bestillingen?') && oppdater({ status: 'avbrutt' }, 'Bestillingen er avbrutt')}>Avbryt bestillingen</button>}
          <button className="btn-danger" onClick={slett}>Slett for godt</button>
        </div>
      </Kort>
    </>
  );
}
