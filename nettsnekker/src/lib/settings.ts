import { getServiceClient } from './supabase/server';
import { slaSammen, type Innstillinger } from './innstillinger-felles';

export type { Innstillinger } from './innstillinger-felles';

/** Leser alle innstillinger. Faller tilbake til standardverdier hvis noe mangler. */
export async function hentInnstillinger(): Promise<Innstillinger> {
  const s = getServiceClient();
  const rader: Record<string, unknown> = {};
  if (s) {
    const { data } = await s.from('settings').select('key,value');
    for (const r of (data as { key: string; value: unknown }[] | null) ?? []) rader[r.key] = r.value;
  }
  return slaSammen(rader);
}

export function sideUrl(): string {
  const u = process.env.NEXT_PUBLIC_SITE_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
  return u.replace(/\/$/, '');
}
