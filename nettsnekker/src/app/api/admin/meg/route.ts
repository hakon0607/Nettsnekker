import { NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/** Finner ut om nøkkelen faktisk er service_role (vanlig feil: anon-nøkkelen limt inn to ganger). */
function nokkelType(): string {
  const k = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  if (k.startsWith('sb_secret_')) return 'service_role';
  if (k.startsWith('sb_publishable_')) return 'anon';
  try {
    const payload = JSON.parse(Buffer.from(k.split('.')[1] ?? '', 'base64url').toString());
    return String(payload.role ?? 'ukjent');
  } catch {
    return 'ukjent';
  }
}

/**
 * Sjekker om den innloggede er admin. Står e-posten i ADMIN_EMAILS i Vercel,
 * legges den automatisk inn i admins-tabellen første gang (enkel oppstart).
 */
export async function GET(request: Request) {
  const service = getServiceClient();
  if (!service) return NextResponse.json({ admin: false, error: 'SUPABASE_SERVICE_ROLE_KEY mangler i Vercel.' }, { status: 500 });

  const type = nokkelType();
  if (type === 'anon') {
    return NextResponse.json({
      admin: false,
      error: 'SUPABASE_SERVICE_ROLE_KEY i Vercel er anon-nøkkelen. Bytt den ut med service_role-nøkkelen (Supabase → Project Settings → API) og deploy på nytt.',
    });
  }

  const token = (request.headers.get('authorization') || '').replace(/^Bearer /, '');
  const { data } = await service.auth.getUser(token);
  const epost = data?.user?.email?.trim().toLowerCase();
  if (!epost) return NextResponse.json({ admin: false, error: 'Innloggingen er utløpt. Logg inn på nytt.' }, { status: 401 });

  const { data: rader, error } = await service.from('admins').select('email');
  if (error) {
    return NextResponse.json({
      admin: false,
      error: `Fant ikke tabellen admins (${error.message}). Har du kjørt schema.sql i samme Supabase-prosjekt som Vercel bruker?`,
    });
  }
  const finnes = (rader as { email: string }[] | null)?.some((r) => r.email.trim().toLowerCase() === epost);
  if (finnes) return NextResponse.json({ admin: true, epost });

  const fraMiljo = (process.env.ADMIN_EMAILS || '').split(',').map((e) => e.trim().toLowerCase()).filter(Boolean);
  if (fraMiljo.includes(epost)) {
    await service.from('admins').insert({ email: epost });
    return NextResponse.json({ admin: true, epost });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  return NextResponse.json({
    admin: false,
    epost,
    error: `${epost} står ikke i admins-tabellen i Supabase-prosjektet ${url.replace('https://', '').split('.')[0]}. Tabellen har ${rader?.length ?? 0} admin(s). Sjekk at du kjørte SQL-en i dette prosjektet.`,
  });
}
