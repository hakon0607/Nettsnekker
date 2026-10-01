import { NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * Sjekker om den innloggede er admin. Står e-posten i ADMIN_EMAILS i Vercel,
 * legges den automatisk inn i admins-tabellen første gang (enkel oppstart).
 */
export async function GET(request: Request) {
  const service = getServiceClient();
  if (!service) return NextResponse.json({ admin: false, error: 'SUPABASE_SERVICE_ROLE_KEY mangler i Vercel.' }, { status: 500 });
  const token = (request.headers.get('authorization') || '').replace(/^Bearer /, '');
  const { data } = await service.auth.getUser(token);
  const epost = data?.user?.email?.toLowerCase();
  if (!epost) return NextResponse.json({ admin: false }, { status: 401 });

  const { data: rad } = await service.from('admins').select('email').ilike('email', epost).maybeSingle();
  if (rad) return NextResponse.json({ admin: true, epost });

  const fraMiljo = (process.env.ADMIN_EMAILS || '').split(',').map((e) => e.trim().toLowerCase()).filter(Boolean);
  if (fraMiljo.includes(epost)) {
    await service.from('admins').insert({ email: epost });
    return NextResponse.json({ admin: true, epost });
  }
  return NextResponse.json({ admin: false, epost });
}
