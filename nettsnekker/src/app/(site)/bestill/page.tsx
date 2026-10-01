import type { Metadata } from 'next';
import { Bestilling } from '@/components/bestill/Bestilling';
import { hentInnstillinger } from '@/lib/settings';

export const metadata: Metadata = { title: 'Bestill nettside', description: 'Bestill en skreddersydd nettside. Se pris mens du velger.' };
export const dynamic = 'force-dynamic';

export default async function BestillSide({ searchParams }: { searchParams: { avbrutt?: string } }) {
  const { priser } = await hentInnstillinger();
  return <Bestilling p={priser} avbrutt={searchParams.avbrutt === '1'} />;
}
