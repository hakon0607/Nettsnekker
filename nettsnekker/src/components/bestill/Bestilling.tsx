'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Felt, Piller, Seksjon, Valgkort } from './felles';
import { DomeneSteg } from './DomeneSteg';
import { Opplasting } from './Opplasting';
import { MiniSide } from '../MiniSide';
import { PrisPanel } from '../PrisPanel';
import { Belop } from '../Belop';
import { Bryter, Teller } from '../Teller';
import { UTKAST_NOKKEL } from '../Kalkulator';
import { kr, regnUt, type Priser } from '@/lib/pricing';
import { ADMIN_TIPS, BRANSJER, FUNKSJONER, MAL, SIDER, STILER, TEMAER } from '@/lib/valg';
import { TOMT_SKJEMA, gyldigEpost, tilValg, type Skjema } from '@/lib/skjema';

const STEG = [
  { id: 'bedrift', navn: 'Bedriften' },
  { id: 'utseende', navn: 'Utseende' },
  { id: 'innhold', navn: 'Innhold' },
  { id: 'admin', navn: 'Adminside' },
  { id: 'domene', navn: 'Domene' },
  { id: 'materiell', navn: 'Materiell' },
  { id: 'bekreft', navn: 'Bekreft' },
] as const;

function nyId() {
  try {
    return crypto.randomUUID();
  } catch {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
  }
}

export function Bestilling({ p, avbrutt }: { p: Priser; avbrutt: boolean }) {
  const [s, setS] = useState<Skjema>(TOMT_SKJEMA);
  const [steg, setSteg] = useState(0);
  const [retning, setRetning] = useState(1);
  const [lastet, setLastet] = useState(false);
  const [sender, setSender] = useState(false);
  const [feil, setFeil] = useState('');
  const [visFeil, setVisFeil] = useState(false);
  const [visPris, setVisPris] = useState(false);
  const toppRef = useRef<HTMLDivElement>(null);

  // Hent lagret utkast (og valg fra kalkulatoren på forsiden)
  useEffect(() => {
    let neste: Skjema = { ...TOMT_SKJEMA, utkastId: nyId() };
    try {
      const raa = localStorage.getItem(UTKAST_NOKKEL);
      if (raa) {
        const lagret = JSON.parse(raa);
        if (lagret.skjema) neste = { ...neste, ...lagret.skjema, utkastId: lagret.skjema.utkastId || neste.utkastId };
        if (typeof lagret.steg === 'number') setSteg(Math.min(lagret.steg, STEG.length - 1));
        const k = lagret.fraKalkulator;
        if (k) {
          neste = {
            ...neste,
            admin: !!k.admin,
            tillegg: k.tillegg ?? {},
            sider: SIDER.slice(0, Math.max(1, Math.min(SIDER.length, k.antallSider ?? 4))),
            domene: { valg: k.domene === false ? 'ingen' : 'nytt', navn: '', aar: k.domeneAar ?? 1 },
          };
        }
      }
    } catch {
      /* ignorer */
    }
    setS(neste);
    setLastet(true);
  }, []);

  // Lagre underveis, så ingenting forsvinner om fanen lukkes
  useEffect(() => {
    if (!lastet) return;
    try {
      localStorage.setItem(UTKAST_NOKKEL, JSON.stringify({ skjema: s, steg }));
    } catch {
      /* privat modus */
    }
  }, [s, steg, lastet]);

  const sett = <K extends keyof Skjema>(k: K, v: Skjema[K]) => setS((x) => ({ ...x, [k]: v }));
  const r = useMemo(() => regnUt(tilValg(s), p), [s, p]);
  const tema = TEMAER.find((t) => t.id === s.temaId) ?? TEMAER[0];
  const adminPå = s.admin || r.adminTvunget;

  const mangler = (i: number): string[] => {
    const m: string[] = [];
    if (i === 0) {
      if (!s.bedriftNavn.trim()) m.push('Navnet på bedriften');
      if (s.beskrivelse.trim().length < 10) m.push('Litt om hva bedriften gjør');
    }
    if (i === 4 && s.domene.valg !== 'ingen' && !s.domene.navn.trim()) m.push(s.domene.valg === 'nytt' ? 'Velg et domene, eller velg «Ikke nå»' : 'Skriv domenet ditt');
    if (i === 6) {
      if (!s.navn.trim()) m.push('Navnet ditt');
      if (!gyldigEpost(s.epost)) m.push('En gyldig e-post');
      if (!s.vilkar) m.push('At du godtar vilkårene');
    }
    return m;
  };

  const gaTil = (i: number) => {
    // Kan ikke hoppe forbi steg som mangler noe
    for (let k = 0; k < i; k++) {
      if (mangler(k).length) {
        setRetning(k > steg ? 1 : -1);
        setSteg(k);
        setVisFeil(true);
        return;
      }
    }
    setRetning(i > steg ? 1 : -1);
    setSteg(i);
    setVisFeil(false);
    toppRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const neste = () => {
    if (mangler(steg).length) {
      setVisFeil(true);
      return;
    }
    gaTil(Math.min(STEG.length - 1, steg + 1));
  };

  const send = async () => {
    if (mangler(6).length) {
      setVisFeil(true);
      return;
    }
    setSender(true);
    setFeil('');
    try {
      const res = await fetch('/api/bestilling', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...s, admin: adminPå }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || 'Noe gikk galt');
      window.location.href = j.url;
    } catch (e) {
      setFeil(e instanceof Error ? e.message : 'Noe gikk galt. Prøv igjen.');
      setSender(false);
    }
  };

  const feilNa = visFeil ? mangler(steg) : [];

  return (
    <div className="wrap pb-32 pt-28 sm:pt-32" ref={toppRef}>
      <div className="mb-8 max-w-2xl">
        <h1 className="text-balance text-4xl sm:text-5xl">Bestill nettside</h1>
        <p className="mt-3 text-lg text-ink-600">
          Sju korte steg. Du vippser {kr(p.gebyr)} når du har sendt bestillingen, og resten når du har godkjent utkastet.
        </p>
        {avbrutt && (
          <p className="mt-4 rounded-2xl bg-harpiks-100 px-4 py-3 text-sm text-ink-800" role="status">
            Alt du fylte ut er lagret, så du kan fortsette der du slapp.
          </p>
        )}
      </div>

      {/* stegvelger */}
      <nav aria-label="Steg i bestillingen" className="no-scrollbar -mx-4 mb-6 overflow-x-auto px-4">
        <ol className="flex min-w-max items-center gap-1.5">
          {STEG.map((x, i) => {
            const ferdig = i < steg;
            const na = i === steg;
            return (
              <li key={x.id} className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => gaTil(i)}
                  aria-current={na ? 'step' : undefined}
                  className={`flex items-center gap-2 rounded-full px-3.5 py-2 text-sm font-semibold transition-all duration-300 ${
                    na ? 'bg-ink-900 text-white shadow-lift' : ferdig ? 'bg-white/80 text-gran-700' : 'bg-white/45 text-ink-500 hover:bg-white/70'
                  }`}
                >
                  <span
                    className={`grid h-5 w-5 place-items-center rounded-full text-[11px] ${
                      na ? 'bg-white text-ink-900' : ferdig ? 'bg-gran-600 text-white' : 'bg-ink-200 text-ink-600'
                    }`}
                  >
                    {ferdig ? '✓' : i + 1}
                  </span>
                  {x.navn}
                </button>
                {i < STEG.length - 1 && <span className={`h-[2px] w-4 rounded-full ${i < steg ? 'bg-gran-400' : 'bg-ink-200'}`} aria-hidden />}
              </li>
            );
          })}
        </ol>
      </nav>

      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        {/* skjemaet */}
        <div className="glass relative overflow-hidden rounded-[30px] p-5 sm:p-8">
          <div className="absolute inset-x-0 top-0 h-1 bg-white/40" aria-hidden>
            <motion.div className="h-full bg-gradient-to-r from-gran-400 to-harpiks-400" animate={{ width: `${((steg + 1) / STEG.length) * 100}%` }} transition={{ type: 'spring', stiffness: 120, damping: 20 }} />
          </div>

          <AnimatePresence mode="wait" custom={retning} initial={false}>
            <motion.div
              key={steg}
              custom={retning}
              initial={{ opacity: 0, x: retning * 40, filter: 'blur(4px)' }}
              animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, x: retning * -40, filter: 'blur(4px)' }}
              transition={{ type: 'spring', stiffness: 260, damping: 28 }}
              className="space-y-7"
            >
              <h2 className="text-3xl">
                <span className="mr-2 text-ink-300">{steg + 1}.</span>
                {
                  [
                    'Fortell om bedriften',
                    'Hvordan skal den se ut?',
                    'Hva skal være på siden?',
                    'Vil du endre ting selv?',
                    'Domene',
                    'Logo, bilder og tekster',
                    'Kontaktinfo og bekreftelse',
                  ][steg]
                }
              </h2>

              {steg === 0 && (
                <>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Felt label="Navnet på bedriften *" id="bnavn">
                      <input id="bnavn" className="field" value={s.bedriftNavn} onChange={(e) => sett('bedriftNavn', e.target.value)} placeholder="f.eks. Klipp & Krøll" autoComplete="organization" />
                    </Felt>
                    <Felt label="Organisasjonsnummer" id="orgnr" hint="Valgfritt">
                      <input id="orgnr" className="field" inputMode="numeric" value={s.orgnr} onChange={(e) => sett('orgnr', e.target.value)} placeholder="9 siffer" />
                    </Felt>
                  </div>
                  <Seksjon tittel="Bransje">
                    <Piller valg={BRANSJER} valgt={[s.bransje]} enkel onChange={(v) => sett('bransje', v[0] ?? '')} />
                  </Seksjon>
                  <Felt label="Hva gjør bedriften? *" id="beskr" hint="Skriv med dine egne ord. Hva tilbyr dere, hvor holder dere til, og hva gjør dere annerledes enn andre?">
                    <textarea id="beskr" className="field min-h-[130px]" value={s.beskrivelse} onChange={(e) => sett('beskrivelse', e.target.value)} placeholder="Vi er en liten frisørsalong på Sandsli med tre frisører. Vi er kjent for …" />
                  </Felt>
                  <Seksjon tittel="Hva skal nettsiden hjelpe dere med?">
                    <Piller valg={MAL} valgt={s.mal} onChange={(v) => sett('mal', v)} />
                  </Seksjon>
                  <Felt label="Hvem er kundene deres?" id="malgr">
                    <input id="malgr" className="field" value={s.malgruppe} onChange={(e) => sett('malgruppe', e.target.value)} placeholder="f.eks. familier i nærområdet, bedrifter i Bergen" />
                  </Felt>
                </>
              )}

              {steg === 1 && (
                <>
                  <Seksjon tittel="Fargetema" tekst="Velg det som ligner mest. Vi tilpasser det til logoen din.">
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                      {TEMAER.map((t) => {
                        const på = s.temaId === t.id;
                        return (
                          <motion.button
                            key={t.id}
                            type="button"
                            whileTap={{ scale: 0.96 }}
                            onClick={() => sett('temaId', t.id)}
                            aria-pressed={på}
                            className={`rounded-2xl p-2 text-left transition-all duration-300 ${på ? 'bg-white shadow-lift ring-2 ring-gran-500' : 'bg-white/45 hover:bg-white/75'}`}
                          >
                            <span className="flex h-14 overflow-hidden rounded-xl" style={{ background: t.farger.bg }}>
                              <span className="flex-[3]" style={{ background: t.farger.hoved }} />
                              <span className="flex-[2]" style={{ background: t.farger.aksent }} />
                              <span className="flex-[2]" style={{ background: t.farger.flate }} />
                              <span className="flex-1" style={{ background: t.farger.tekst }} />
                            </span>
                            <span className="mt-2 block px-1 text-sm font-semibold">{t.navn}</span>
                            <span className="block px-1 text-xs text-ink-500">{t.stemning}</span>
                          </motion.button>
                        );
                      })}
                    </div>
                  </Seksjon>
                  <Seksjon tittel="Egen merkefarge" tekst="Har bedriften en fast farge? Den blir hovedfargen.">
                    <div className="flex flex-wrap items-center gap-3">
                      <Bryter på={!!s.egenFarge} onChange={(v) => sett('egenFarge', v ? tema.farger.hoved : '')} label="Bruk egen farge" />
                      {s.egenFarge && (
                        <>
                          <input type="color" value={s.egenFarge} onChange={(e) => sett('egenFarge', e.target.value)} className="h-11 w-14 cursor-pointer rounded-xl border-0 bg-transparent" aria-label="Velg farge" />
                          <input className="field w-32 font-mono" value={s.egenFarge} onChange={(e) => sett('egenFarge', e.target.value)} aria-label="Fargekode" />
                        </>
                      )}
                    </div>
                  </Seksjon>
                  <Seksjon tittel="Stil">
                    <div className="grid gap-2 sm:grid-cols-2">
                      {STILER.map((x) => (
                        <Valgkort key={x.id} på={s.stil === x.id} onClick={() => sett('stil', x.id)} tittel={x.navn} tekst={x.tekst} />
                      ))}
                    </div>
                  </Seksjon>
                  <Felt label="Nettsider du liker" id="insp" hint="Lim inn lenker og skriv gjerne hva du liker med dem.">
                    <textarea id="insp" className="field min-h-[80px]" value={s.inspirasjon} onChange={(e) => sett('inspirasjon', e.target.value)} />
                  </Felt>
                </>
              )}

              {steg === 2 && (
                <>
                  <Seksjon tittel="Sider" tekst={`${p.inkluderteSider} sider er inkludert. Hver ekstra side koster ${p.ekstraSide} kr.`}>
                    <Piller valg={SIDER} valgt={s.sider} onChange={(v) => sett('sider', v)} />
                    <input className="field mt-3" value={s.egneSider} onChange={(e) => sett('egneSider', e.target.value)} placeholder="Andre sider, skilt med komma" aria-label="Andre sider" />
                    <p className="hint">
                      Du har valgt {tilValg(s).sider.length} {tilValg(s).sider.length === 1 ? 'side' : 'sider'}
                      {r.ekstraSider > 0 ? `, ${r.ekstraSider} mer enn inkludert (+${kr(r.ekstraSider * p.ekstraSide)})` : ''}.
                    </p>
                  </Seksjon>
                  <Seksjon tittel="Funksjoner" tekst="Disse er med uten ekstra kostnad.">
                    <Piller valg={FUNKSJONER} valgt={s.funksjoner} onChange={(v) => sett('funksjoner', v)} />
                  </Seksjon>
                  <Seksjon tittel="Tillegg">
                    <div className="space-y-2">
                      {p.tillegg
                        .filter((t) => t.aktiv)
                        .map((t) => {
                          const antall = s.tillegg[t.id] ?? 0;
                          return (
                            <div key={t.id} className={`flex items-center justify-between gap-4 rounded-2xl p-4 transition ${antall ? 'bg-white/85 shadow-soft' : 'bg-white/45'}`}>
                              <div>
                                <p className="font-semibold">
                                  {t.navn} <span className="price ml-1 text-sm font-medium text-gran-700">+{kr(t.pris)}{t.type === 'antall' ? ' per stk' : ''}</span>
                                </p>
                                <p className="text-sm leading-relaxed text-ink-500">{t.beskrivelse}</p>
                                {t.kreverAdmin && <p className="mt-1 text-xs text-harpiks-600">Krever adminside</p>}
                              </div>
                              {t.type === 'antall' ? (
                                <Teller verdi={antall} maks={t.maks ?? 5} onChange={(v) => sett('tillegg', { ...s.tillegg, [t.id]: v })} navn={t.navn} />
                              ) : (
                                <Bryter på={!!antall} onChange={(v) => sett('tillegg', { ...s.tillegg, [t.id]: v ? 1 : 0 })} label={t.navn} />
                              )}
                            </div>
                          );
                        })}
                    </div>
                  </Seksjon>
                  <Felt label="Noe annet du vil ha med?" id="onsker">
                    <textarea id="onsker" className="field min-h-[100px]" value={s.onsker} onChange={(e) => sett('onsker', e.target.value)} placeholder="f.eks. en meny som PDF, lenke til Instagram, et kart over parkering …" />
                  </Felt>
                </>
              )}

              {steg === 3 && (
                <>
                  <div className={`rounded-2xl p-5 transition ${adminPå ? 'bg-white/85 shadow-lift' : 'bg-white/45'}`}>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-lg font-semibold">
                          Adminside (/admin) <span className="price ml-1 text-gran-700">+{kr(p.admin)}</span>
                        </p>
                        <p className="mt-1 max-w-lg text-sm leading-relaxed text-ink-600">
                          En egen innlogging på nettsiden din, der du endrer det du ønsker uten å kontakte oss. Fungerer på mobil.
                        </p>
                      </div>
                      <Bryter på={adminPå} onChange={(v) => !r.adminTvunget && sett('admin', v)} label="Adminside" />
                    </div>
                    {r.adminTvunget && <p className="mt-3 text-sm text-harpiks-600">Adminside er med fordi du har valgt et tillegg som trenger den.</p>}
                  </div>
                  <AnimatePresence initial={false}>
                    {adminPå && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        <Seksjon tittel="Hva vil du kunne gjøre i /admin?" tekst="Trykk på forslagene for å legge dem til, og skriv med egne ord hvis du vil ha noe mer.">
                          <div className="flex flex-wrap gap-2">
                            {ADMIN_TIPS.map((t) => {
                              const med = s.adminOnsker.includes(t.eksempel);
                              return (
                                <button
                                  key={t.tekst}
                                  type="button"
                                  className="pill"
                                  data-on={med}
                                  aria-pressed={med}
                                  onClick={() =>
                                    sett(
                                      'adminOnsker',
                                      med
                                        ? s.adminOnsker.split('\n').filter((l) => l.replace(/^- /, '') !== t.eksempel).join('\n')
                                        : `${s.adminOnsker.trim() ? `${s.adminOnsker.trim()}\n` : ''}- ${t.eksempel}`
                                    )
                                  }
                                >
                                  {med ? '✓ ' : '+ '}
                                  {t.tekst}
                                </button>
                              );
                            })}
                          </div>
                          <textarea
                            className="field mt-4 min-h-[150px]"
                            value={s.adminOnsker}
                            onChange={(e) => sett('adminOnsker', e.target.value)}
                            placeholder="- Jeg vil kunne endre åpningstidene selv&#10;- Legge ut ukens tilbud"
                            aria-label="Hva du vil kunne gjøre i /admin"
                          />
                          <div className="mt-3 rounded-2xl bg-harpiks-100/70 p-4 text-sm leading-relaxed text-ink-700">
                            <p className="font-semibold text-ink-900">Tips til hva du kan skrive</p>
                            <ul className="mt-1.5 list-disc space-y-1 pl-5">
                              <li>Tenk på hva du endrer oftest: priser, åpningstider, tilbud, bilder.</li>
                              <li>Skriv hvem som skal bruke den. Skal flere ansatte logge inn?</li>
                              <li>Vil du få beskjed på e-post når noen bestiller eller sender melding?</li>
                              <li>Er det noe som skal skjules automatisk, som et tilbud med sluttdato?</li>
                            </ul>
                          </div>
                        </Seksjon>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  {!adminPå && <p className="text-sm text-ink-500">Uten adminside sender du oss endringer på e-post. Du kan legge til adminside senere.</p>}
                </>
              )}

              {steg === 4 && <DomeneSteg d={s.domene} setD={(d) => sett('domene', d)} p={p} bedriftNavn={s.bedriftNavn} />}

              {steg === 5 && (
                <>
                  <p className="-mt-3 text-ink-600">Alt er valgfritt. Jo mer du sender, jo nærmere ferdig blir første utkast.</p>
                  <div className="grid gap-6">
                    {(['logo', 'bilder', 'dokumenter'] as const).map((k) => (
                      <Opplasting key={k} kategori={k} filer={s.filer} setFiler={(f) => setS((x) => ({ ...x, filer: f(x.filer) }))} utkastId={s.utkastId} />
                    ))}
                  </div>
                  <Felt label="Har dere en nettside eller Facebook-side i dag?" id="eks" hint="Vi henter tekster og informasjon derfra.">
                    <input id="eks" className="field" type="url" inputMode="url" value={s.eksisterendeSide} onChange={(e) => sett('eksisterendeSide', e.target.value)} placeholder="https://" />
                  </Felt>
                </>
              )}

              {steg === 6 && (
                <>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Felt label="Navnet ditt *" id="navn">
                      <input id="navn" className="field" value={s.navn} onChange={(e) => sett('navn', e.target.value)} autoComplete="name" />
                    </Felt>
                    <Felt label="Telefon" id="tlf">
                      <input id="tlf" className="field" type="tel" value={s.telefon} onChange={(e) => sett('telefon', e.target.value)} autoComplete="tel" />
                    </Felt>
                  </div>
                  <Felt label="E-post *" id="epost" hint="Hit sender vi kvittering og lenke til utkastet.">
                    <input id="epost" className="field" type="email" value={s.epost} onChange={(e) => sett('epost', e.target.value)} autoComplete="email" />
                  </Felt>
                  <Felt label="Kommentar" id="komm">
                    <textarea id="komm" className="field min-h-[80px]" value={s.kommentar} onChange={(e) => sett('kommentar', e.target.value)} />
                  </Felt>
                  <input className="hidden" tabIndex={-1} autoComplete="off" value={s.nettsted ?? ''} onChange={(e) => sett('nettsted', e.target.value)} aria-hidden />

                  <div className="rounded-2xl bg-white/55 p-5">
                    <p className="font-semibold">Oppsummering</p>
                    <dl className="mt-3 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-[140px_1fr]">
                      {[
                        ['Bedrift', s.bedriftNavn || '–', 0],
                        ['Tema', `${tema.navn}${s.egenFarge ? ` med ${s.egenFarge}` : ''} · ${STILER.find((x) => x.id === s.stil)?.navn ?? ''}`, 1],
                        ['Sider', tilValg(s).sider.join(', ') || '–', 2],
                        ['Tillegg', p.tillegg.filter((t) => s.tillegg[t.id]).map((t) => t.navn).join(', ') || 'Ingen', 2],
                        ['Adminside', adminPå ? 'Ja' : 'Nei', 3],
                        ['Domene', s.domene.valg === 'ingen' ? 'Ikke nå' : `${s.domene.navn}${s.domene.valg === 'nytt' ? ` (${s.domene.aar} år)` : ' (eget)'}`, 4],
                        ['Filer', s.filer.length ? `${s.filer.length} filer` : 'Ingen', 5],
                      ].map(([k, v, i]) => (
                        <div key={k as string} className="contents">
                          <dt className="text-ink-500">{k}</dt>
                          <dd className="flex justify-between gap-3 text-ink-900">
                            <span>{v}</span>
                            <button type="button" className="shrink-0 text-xs font-semibold text-gran-700 hover:underline" onClick={() => gaTil(i as number)}>
                              Endre
                            </button>
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </div>

                  <label className="flex cursor-pointer items-start gap-3 rounded-2xl bg-white/55 p-4">
                    <input type="checkbox" checked={s.vilkar} onChange={(e) => sett('vilkar', e.target.checked)} className="mt-1 h-5 w-5 accent-gran-600" />
                    <span className="text-sm leading-relaxed text-ink-700">
                      Jeg godtar{' '}
                      <Link href="/vilkar" target="_blank" className="font-semibold text-gran-700 underline">
                        vilkårene
                      </Link>{' '}
                      og forstår at bestillingsgebyret på {kr(p.gebyr)} vippses etter bestillingen, kommer i tillegg til prisen og ikke refunderes etter at arbeidet har startet. Resten,{' '}
                      <strong className="price">{kr(r.rest)}</strong>, vippser jeg først når jeg har godkjent utkastet.
                    </span>
                  </label>

                  {feil && (
                    <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
                      {feil}
                    </p>
                  )}
                </>
              )}

              {feilNa.length > 0 && (
                <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
                  Fyll inn: {feilNa.join(', ').toLowerCase()}.
                </motion.div>
              )}

              <div className="flex items-center justify-between gap-3 border-t border-white/60 pt-6">
                <button type="button" className="btn-ghost" onClick={() => gaTil(Math.max(0, steg - 1))} disabled={steg === 0}>
                  Tilbake
                </button>
                {steg < STEG.length - 1 ? (
                  <button type="button" className="btn-primary px-6" onClick={neste} data-mag>
                    Neste: {STEG[steg + 1].navn}
                  </button>
                ) : (
                  <button type="button" className="btn-resin px-6 py-3.5 text-[15px]" onClick={send} disabled={sender} data-mag>
                    {sender ? 'Sender …' : 'Send bestillingen'}
                  </button>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* forhåndsvisning og pris */}
        <aside className="hidden lg:block">
          <div className="sticky top-28 space-y-5">
            <div>
              <p className="mb-2 text-sm font-semibold text-ink-600">Forhåndsvisning</p>
              <MiniSide key={`${s.temaId}-${s.stil}`} tema={tema} navn={s.bedriftNavn} egenFarge={s.egenFarge} stil={s.stil} sider={tilValg(s).sider} forsinkelse={0} adresse={s.domene.valg !== 'ingen' && s.domene.navn ? s.domene.navn : undefined} />
            </div>
            <div className="glass rounded-[26px] p-5">
              <PrisPanel r={r} p={p} kompakt />
            </div>
          </div>
        </aside>
      </div>

      {/* prislinje nederst på mobil */}
      <div className="fixed inset-x-0 bottom-0 z-40 p-3 lg:hidden">
        <AnimatePresence>
          {visPris && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="glass mb-2 max-h-[60vh] overflow-y-auto rounded-[24px] p-5">
              <PrisPanel r={r} p={p} kompakt />
            </motion.div>
          )}
        </AnimatePresence>
        <div className="glass-nav flex items-center justify-between gap-3 rounded-full py-2 pl-5 pr-2">
          <button type="button" className="text-left" onClick={() => setVisPris((v) => !v)} aria-expanded={visPris}>
            <span className="block text-[11px] text-ink-500">Totalt · trykk for detaljer</span>
            <Belop verdi={r.total} className="font-display text-xl font-bold text-gran-700" />
          </button>
          {steg < STEG.length - 1 ? (
            <button type="button" className="btn-primary" onClick={neste}>
              Neste
            </button>
          ) : (
            <button type="button" className="btn-resin" onClick={send} disabled={sender}>
              {sender ? 'Sender …' : 'Send'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
