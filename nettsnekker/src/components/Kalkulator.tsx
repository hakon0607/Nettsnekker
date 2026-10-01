'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PrisPanel } from './PrisPanel';
import { Bryter, Teller } from './Teller';
import { domenePrisNok, regnUt, type Priser, type Valg } from '@/lib/pricing';
import { SIDER } from '@/lib/valg';

export const UTKAST_NOKKEL = 'nettsnekker-utkast';

/** Priskalkulatoren på forsiden. Valgene følger med videre til bestillingen. */
export function Kalkulator({ p }: { p: Priser }) {
  const router = useRouter();
  const [antallSider, setAntallSider] = useState(4);
  const [admin, setAdmin] = useState(false);
  const [tillegg, setTillegg] = useState<Record<string, number>>({});
  const [domene, setDomene] = useState(true);
  const [aar, setAar] = useState(1);

  // Typisk .com-pris for et estimat. Ekte pris hentes i bestillingen.
  const typisk = domenePrisNok(11.25, p);
  const valg: Valg = useMemo(
    () => ({
      sider: Array.from({ length: antallSider }, (_, i) => SIDER[i] ?? `Side ${i + 1}`),
      admin,
      tillegg,
      domene: { valg: domene ? 'nytt' : 'ingen', navn: domene ? 'dittnavn.com' : '', aar, prisNok: typisk, fornyelseNok: typisk },
    }),
    [antallSider, admin, tillegg, domene, aar, typisk]
  );
  const r = regnUt(valg, p);

  const fortsett = () => {
    try {
      const gammelt = JSON.parse(localStorage.getItem(UTKAST_NOKKEL) || '{}');
      localStorage.setItem(
        UTKAST_NOKKEL,
        JSON.stringify({ ...gammelt, steg: 0, fraKalkulator: { admin: admin || r.adminTvunget, tillegg, domeneAar: aar, domene, antallSider } })
      );
    } catch {
      /* privat modus */
    }
    router.push('/bestill');
  };

  return (
    <section id="priser" className="wrap scroll-mt-28 py-20">
      <div className="grid gap-10 lg:grid-cols-[1fr_420px]">
        <div>
          <h2 className="max-w-xl text-balance text-4xl sm:text-5xl">Regn ut hva nettsiden koster</h2>
          <p className="mt-4 max-w-xl text-lg text-ink-600">
            Grunnpakken har inntil {p.inkluderteSider} sider, {p.inkluderteEndringsrunder} endringsrunder, kontaktskjema,
            søkemotoroptimalisering og hosting det første året. Legg til det du trenger.
          </p>

          <div className="mt-8 space-y-3">
            <div className="glass-soft flex items-center justify-between gap-4 rounded-2xl p-4">
              <div>
                <p className="font-semibold">Antall sider</p>
                <p className="text-sm text-ink-500">
                  {p.inkluderteSider} inkludert, deretter {p.ekstraSide} kr per side
                </p>
              </div>
              <Teller verdi={antallSider} min={1} maks={15} onChange={setAntallSider} navn="sider" />
            </div>

            <div className="glass-soft flex items-center justify-between gap-4 rounded-2xl p-4">
              <div>
                <p className="font-semibold">Adminside (/admin)</p>
                <p className="text-sm text-ink-500">Endre priser, produkter og tekster selv · {p.admin} kr</p>
              </div>
              <Bryter på={admin || r.adminTvunget} onChange={setAdmin} label="Adminside" />
            </div>

            {p.tillegg
              .filter((t) => t.aktiv)
              .map((t) => (
                <div key={t.id} className="glass-soft flex items-center justify-between gap-4 rounded-2xl p-4">
                  <div>
                    <p className="font-semibold">{t.navn}</p>
                    <p className="text-sm text-ink-500">
                      {t.beskrivelse} · {t.pris} kr{t.type === 'antall' ? ' per stk' : ''}
                    </p>
                  </div>
                  {t.type === 'antall' ? (
                    <Teller verdi={tillegg[t.id] ?? 0} maks={t.maks ?? 5} onChange={(v) => setTillegg((x) => ({ ...x, [t.id]: v }))} navn={t.navn} />
                  ) : (
                    <Bryter på={!!tillegg[t.id]} onChange={(v) => setTillegg((x) => ({ ...x, [t.id]: v ? 1 : 0 }))} label={t.navn} />
                  )}
                </div>
              ))}

            {p.domene.aktiv && (
              <div className="glass-soft rounded-2xl p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold">Eget domene</p>
                    <p className="text-sm text-ink-500">Et vanlig .com-domene koster ca. {typisk} kr per år. Du søker opp ditt i bestillingen.</p>
                  </div>
                  <Bryter på={domene} onChange={setDomene} label="Eget domene" />
                </div>
                {domene && (
                  <div className="mt-4 flex items-center gap-4">
                    <input
                      type="range"
                      min={1}
                      max={p.domene.maksAar}
                      value={aar}
                      onChange={(e) => setAar(Number(e.target.value))}
                      className="w-full accent-gran-600"
                      aria-label="Antall år med domene"
                    />
                    <span className="price w-14 shrink-0 text-right font-semibold">{aar} år</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="lg:sticky lg:top-28 lg:self-start">
          <div className="glass rounded-[28px] p-6">
            <h3 className="mb-3 text-xl">Din pris</h3>
            <PrisPanel r={r} p={p} />
            <button onClick={fortsett} className="btn-primary mt-5 w-full py-3.5 text-[15px]" data-mag>
              Bestill med disse valgene
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
