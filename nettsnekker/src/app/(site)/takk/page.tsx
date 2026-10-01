import type { Metadata } from 'next';
import Link from 'next/link';
import { Feiring } from '@/components/Feiring';

export const metadata: Metadata = { title: 'Takk for betalingen', robots: { index: false } };

export default function Takk() {
  return (
    <section className="wrap max-w-2xl pb-10 pt-32 sm:pt-40">
      <Feiring />
      <div className="glass rounded-[32px] p-6 sm:p-10">
        <div className="grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-b from-harpiks-300 to-harpiks-500 text-3xl shadow-lift">✓</div>
        <h1 className="mt-6 text-balance text-4xl sm:text-5xl">Takk! Nettsiden er godkjent.</h1>
        <p className="mt-4 text-lg leading-relaxed text-ink-600">
          Vi har fått betalingen. Nå kobler vi på domenet og gjør de siste detaljene. Du får en e-post når alt er live.
        </p>
        <Link href="/" className="btn-ghost mt-8">Til forsiden</Link>
      </div>
    </section>
  );
}
