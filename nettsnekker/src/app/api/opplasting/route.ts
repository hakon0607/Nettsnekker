import { NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const MAKS = 15 * 1024 * 1024;
const TILLATT = /^(image\/|application\/pdf|text\/|application\/msword|application\/vnd\.openxmlformats|application\/vnd\.oasis|application\/zip|application\/x-zip)/;

/**
 * Gir nettleseren signerte opplastingslenker, så filene går rett til
 * Supabase Storage uten å gå gjennom Vercel (som har grense på 4,5 MB).
 */
export async function POST(request: Request) {
  const service = getServiceClient();
  if (!service) return NextResponse.json({ error: 'Opplasting er ikke satt opp ennå.' }, { status: 503 });

  const body = (await request.json().catch(() => null)) as {
    utkastId?: string;
    filer?: { navn: string; type: string; storrelse: number; kategori: string }[];
  } | null;
  const utkastId = String(body?.utkastId ?? '').replace(/[^a-zA-Z0-9-]/g, '').slice(0, 64);
  if (utkastId.length < 8 || !Array.isArray(body?.filer)) {
    return NextResponse.json({ error: 'Ugyldig forespørsel.' }, { status: 400 });
  }
  if (body!.filer.length > 20) return NextResponse.json({ error: 'Maks 20 filer om gangen.' }, { status: 400 });

  const svar: { path: string; token: string; navn: string }[] = [];
  for (const f of body!.filer) {
    if (f.storrelse > MAKS) return NextResponse.json({ error: `${f.navn} er større enn 15 MB.` }, { status: 400 });
    if (f.type && !TILLATT.test(f.type)) {
      return NextResponse.json({ error: `${f.navn}: denne filtypen tar vi ikke imot.` }, { status: 400 });
    }
    const kategori = ['logo', 'bilder', 'dokumenter'].includes(f.kategori) ? f.kategori : 'dokumenter';
    const rent = f.navn.toLowerCase().replace(/[^a-z0-9._-]+/g, '-').slice(-80) || 'fil';
    const path = `utkast/${utkastId}/${kategori}/${Date.now().toString(36)}-${rent}`;
    const { data, error } = await service.storage.from('bestillinger').createSignedUploadUrl(path);
    if (error || !data) return NextResponse.json({ error: 'Kunne ikke klargjøre opplastingen.' }, { status: 500 });
    svar.push({ path, token: data.token, navn: f.navn });
  }
  return NextResponse.json({ filer: svar });
}
