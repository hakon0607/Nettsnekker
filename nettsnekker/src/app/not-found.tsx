import Link from 'next/link';
import { GlassBackdrop } from '@/components/glass/GlassFx';

export default function IkkeFunnet() {
  return (
    <div className="grid min-h-screen place-items-center p-4">
      <GlassBackdrop />
      <div className="glass max-w-md rounded-[28px] p-8 text-center">
        <p className="font-display text-6xl font-bold text-gran-700">404</p>
        <h1 className="mt-3 text-2xl">Denne siden finnes ikke</h1>
        <p className="mt-2 text-ink-600">Kanskje lenken er feil, eller siden er flyttet.</p>
        <Link href="/" className="btn-primary mt-6">Til forsiden</Link>
      </div>
    </div>
  );
}
