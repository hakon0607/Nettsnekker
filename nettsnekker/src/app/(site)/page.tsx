import Link from 'next/link';
import { Hero } from '@/components/Hero';
import { Prosess } from '@/components/Prosess';
import { Pakke } from '@/components/Pakke';
import { Kalkulator } from '@/components/Kalkulator';
import { AdminSeksjon } from '@/components/AdminSeksjon';
import { Eksempler } from '@/components/Eksempler';
import { Faq } from '@/components/Faq';
import { hentInnstillinger } from '@/lib/settings';

export const revalidate = 60;

export default async function Forside() {
  const inn = await hentInnstillinger();
  const { tekster: t, priser: p } = inn;
  return (
    <>
      <Hero t={t} gebyr={p.gebyr} />
      <Prosess tittel={t.prosessTittel} gebyr={p.gebyr} leveringstid={p.leveringstid} />
      <Pakke p={p} />
      <Kalkulator p={p} />
      <AdminSeksjon tittel={t.adminTittel} tekst={t.adminTekst} pris={p.admin} />
      <Eksempler liste={inn.eksempler} />
      <Faq liste={inn.faq} />
      <section className="wrap py-16">
        <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-gran-700 via-gran-800 to-ink-900 px-6 py-14 text-white sm:px-12">
          <div className="drop -right-6 -top-6 h-40 w-40 opacity-40" />
          <h2 className="max-w-xl text-balance text-4xl text-white sm:text-5xl">{t.ctaTittel}</h2>
          <p className="mt-4 max-w-lg text-lg text-white/75">{t.ctaTekst}</p>
          <Link href="/bestill" className="btn-resin mt-8 px-6 py-3.5 text-[15px]" data-mag>
            {t.heroKnapp}
          </Link>
        </div>
      </section>
    </>
  );
}
