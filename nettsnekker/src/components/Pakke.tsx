import type { Priser } from '@/lib/pricing';
import { Reveal } from './Reveal';

export function Pakke({ p }: { p: Priser }) {
  const punkter = [
    { t: `Inntil ${p.inkluderteSider} sider`, d: 'Forside, om oss, tjenester, kontakt eller det du trenger.' },
    { t: 'Design etter ditt valg', d: 'Fargetema, egen merkefarge og en stil som passer bransjen.' },
    { t: `${p.inkluderteEndringsrunder} endringsrunder`, d: 'Si fra hva du vil endre etter at du har sett utkastet.' },
    { t: 'Kontaktskjema', d: 'Henvendelser rett i innboksen din.' },
    { t: 'Synlig på Google', d: 'Titler, beskrivelser, kart over siden og riktig oppsett for søkemotorer.' },
    { t: 'Rask på mobil', d: 'Laget for telefonen først, og testet på store skjermer.' },
    { t: 'Hosting første år', d: 'Siden ligger på Vercel, som er rask og sikker.' },
    { t: 'Du eier innholdet', d: 'Tekster og bilder er dine.' },
  ];
  return (
    <section className="wrap py-20">
      <div className="glass rounded-[32px] p-6 sm:p-10">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <h2 className="max-w-md text-balance text-4xl sm:text-5xl">Dette får du i grunnpakken</h2>
          <p className="font-display text-5xl font-bold text-gran-700">
            <span className="price">{p.grunnpakke.toLocaleString('nb-NO')}</span>
            <span className="ml-1 text-xl font-semibold text-ink-500">kr</span>
          </p>
        </div>
        <ul className="mt-10 grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-4">
          {punkter.map((x, i) => (
            <Reveal as="li" key={x.t} delay={i * 0.04}>
              <svg viewBox="0 0 24 24" className="mb-2 h-6 w-6 text-gran-600" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M5 12.5l4.5 4.5L19 7.5" />
              </svg>
              <p className="font-semibold text-ink-900">{x.t}</p>
              <p className="mt-1 text-sm leading-relaxed text-ink-600">{x.d}</p>
            </Reveal>
          ))}
        </ul>
        <p className="mt-8 text-sm text-ink-500">+ bestillingsgebyr {p.gebyr} kr. {p.mvaTekst}</p>
      </div>
    </section>
  );
}
