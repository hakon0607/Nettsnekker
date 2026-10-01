import Link from 'next/link';
import { Logo } from './Logo';
import type { Bedrift } from '@/lib/innhold';

export function Footer({ b }: { b: Bedrift }) {
  return (
    <footer className="mt-24 px-3 pb-6 sm:px-5">
      <div className="glass mx-auto max-w-6xl rounded-[28px] px-6 py-10 sm:px-10">
        <div className="grid gap-8 sm:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <Logo navn={b.navn} />
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-ink-600">
              Skreddersydde nettsider for små bedrifter. Du ser utkastet før du betaler resten.
            </p>
          </div>
          <div className="text-sm">
            <p className="mb-2 font-semibold text-ink-900">Kontakt</p>
            {b.epost && (
              <a href={`mailto:${b.epost}`} className="block text-ink-600 hover:text-gran-700">
                {b.epost}
              </a>
            )}
            {b.telefon && (
              <a href={`tel:${b.telefon.replace(/\s/g, '')}`} className="block text-ink-600 hover:text-gran-700">
                {b.telefon}
              </a>
            )}
            <p className="text-ink-600">{b.sted}</p>
          </div>
          <div className="text-sm">
            <p className="mb-2 font-semibold text-ink-900">Om kjøpet</p>
            <Link href="/vilkar" className="block text-ink-600 hover:text-gran-700">Vilkår</Link>
            <Link href="/personvern" className="block text-ink-600 hover:text-gran-700">Personvern</Link>
            <Link href="/bestill" className="block text-ink-600 hover:text-gran-700">Bestill nettside</Link>
          </div>
        </div>
        <p className="mt-10 text-xs text-ink-500">
          © {new Date().getFullYear()} {b.navn} · {b.eier}
          {b.orgnr ? ` · Org.nr. ${b.orgnr}` : ''}
        </p>
      </div>
    </footer>
  );
}
