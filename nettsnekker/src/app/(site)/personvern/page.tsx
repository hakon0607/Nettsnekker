import type { Metadata } from 'next';
import { hentInnstillinger } from '@/lib/settings';
import { fyllInn } from '@/lib/innhold';
import { markdownTilHtml } from '@/lib/markdown';

export const metadata: Metadata = { title: 'Personvern' };
export const revalidate = 60;

export default async function Personvern() {
  const { personvern, bedrift } = await hentInnstillinger();
  return (
    <section className="wrap max-w-3xl pb-10 pt-32 sm:pt-40">
      <div className="glass rounded-[32px] p-6 sm:p-10">
        <h1 className="text-4xl sm:text-5xl">Personvern</h1>
        <p className="mt-3 text-ink-500">Slik behandler {bedrift.navn} opplysningene dine.</p>
        <div className="prose-ns mt-6" dangerouslySetInnerHTML={{ __html: markdownTilHtml(fyllInn(personvern, bedrift)) }} />
      </div>
    </section>
  );
}
