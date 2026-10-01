import type { Metadata } from 'next';
import { hentInnstillinger } from '@/lib/settings';
import { fyllInn } from '@/lib/innhold';
import { markdownTilHtml } from '@/lib/markdown';

export const metadata: Metadata = { title: 'Vilkår' };
export const revalidate = 60;

export default async function Vilkar() {
  const { vilkar, bedrift } = await hentInnstillinger();
  return (
    <section className="wrap max-w-3xl pb-10 pt-32 sm:pt-40">
      <div className="glass rounded-[32px] p-6 sm:p-10">
        <h1 className="text-4xl sm:text-5xl">Vilkår</h1>
        <p className="mt-3 text-ink-500">Gjelder alle bestillinger hos {bedrift.navn}.</p>
        <div className="prose-ns mt-6" dangerouslySetInnerHTML={{ __html: markdownTilHtml(fyllInn(vilkar, bedrift)) }} />
      </div>
    </section>
  );
}
