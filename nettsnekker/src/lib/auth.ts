import { NextResponse } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getServiceClient } from './supabase/server';

type Svar =
  | { feil: NextResponse; service?: undefined; epost?: undefined }
  | { feil?: undefined; service: SupabaseClient; epost: string };

/** Sjekker at den som kaller API-et er innlogget admin (Bearer-token fra Supabase). */
export async function krevAdmin(request: Request): Promise<Svar> {
  const service = getServiceClient();
  if (!service) {
    return { feil: NextResponse.json({ error: 'Serveren mangler SUPABASE_SERVICE_ROLE_KEY.' }, { status: 500 }) };
  }
  const auth = request.headers.get('authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (!token) return { feil: NextResponse.json({ error: 'Du må være logget inn.' }, { status: 401 }) };

  const { data, error } = await service.auth.getUser(token);
  const epost = data?.user?.email?.toLowerCase() ?? '';
  if (error || !epost) {
    return { feil: NextResponse.json({ error: 'Innloggingen er utløpt. Logg inn på nytt.' }, { status: 401 }) };
  }
  if (!(await erAdmin(service, epost))) {
    return { feil: NextResponse.json({ error: 'Denne brukeren er ikke admin.' }, { status: 403 }) };
  }
  return { service, epost };
}

export async function erAdmin(service: SupabaseClient, epost: string): Promise<boolean> {
  const fraMiljo = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  if (fraMiljo.includes(epost.toLowerCase())) return true;
  const { data } = await service.from('admins').select('email').ilike('email', epost).maybeSingle();
  return !!data;
}
